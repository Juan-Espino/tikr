import {
  supersededMarketScope,
  PERSONAL_SOURCE_POLICY,
  REVIEWED_V5_SCOPE,
} from "../src/lib/market-policy";
import { catalogShard, validateShard } from "../src/lib/asset-catalog";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { limiter, hostedConcurrency } from "./market_limits";
import { v } from "convex/values";
import { budget } from "./market";

// One bounded control document serializes all hosts. Revocations never expire.
export type State = {
  day: string;
  opens: number;
  buckets: Record<string, number>;
  active: Record<string, number>;
  visitors?: Record<string, number>;
  revoked: string[];
  guards: Record<string, string>;
  observations?: Record<
    string,
    { token: string; leaseToken: string; expires: number }
  >;
  providerReservations?: Record<string, { month: string; units: number }>;
};
export const control = internalMutation({
  args: {
    op: v.union(
      v.literal("enter"),
      v.literal("leave"),
      v.literal("provider"),
      v.literal("providerFinish"),
      v.literal("check"),
      v.literal("begin"),
      v.literal("recover"),
      v.literal("finish"),
      v.literal("revoke"),
    ),
    scope: v.string(),
    policy: v.optional(v.literal(PERSONAL_SOURCE_POLICY)),
    policyScope: v.optional(v.string()),
    token: v.string(),
    symbols: v.array(v.string()),
    bucket: v.optional(v.number()), // Legacy argument accepted during rollout; never used for identity.
    visitor: v.optional(v.string()),
    leaseToken: v.optional(v.string()),
    receivedBytes: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.array(v.string()),
    v.object({ code: v.string(), retryAt: v.optional(v.number()) }),
  ),
  handler: async (ctx, a) => {
    if (
      !/^[a-f0-9]{64}$/.test(a.scope) ||
      !/^[a-f0-9-]{36}$/.test(a.token) ||
      (a.visitor !== undefined && !/^[a-f0-9]{64}$/.test(a.visitor)) ||
      a.symbols.length > 19 ||
      a.symbols.some((s) => !/^[A-Z][A-Z0-9.-]{0,15}$/.test(s))
    )
      throw Error("INVALID_CONTROL");
    // Only the authenticated server gateway can call this internal mutation.
    // Zero scopes belong to admission/provider accounting, never asset checks.
    const current = a.policyScope ?? a.scope;
    if (
      a.policyScope !== undefined &&
      (!/^[a-f0-9]{64}$/.test(a.policyScope) ||
        (a.scope !== current &&
          !(
            a.scope === "0".repeat(64) &&
            ["enter", "leave", "provider", "providerFinish"].includes(a.op)
          )))
    )
      throw Error("INVALID_CONTROL");
    const superseded = (scope: string) =>
      supersededMarketScope(scope, current, a.policy);
    const now = Date.now();
    const row = await ctx.db
      .query("marketHosted")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    const day = new Date(now).toISOString().slice(0, 10);
    const s: State = row
      ? (JSON.parse(row.payload) as State)
      : { day, opens: 0, buckets: {}, active: {}, revoked: [], guards: {} };
    // Release and revocation must remain possible after quota exhaustion.
    if (
      !["revoke", "finish", "leave", "providerFinish"].includes(a.op) &&
      !(await budget(
        ctx,
        a.op === "provider"
          ? 2 * 1024 * 1024
          : 131072 + (a.op === "begin" ? a.symbols.length * 120000 : 0),
        now,
      ))
    )
      return { code: "SHARED_BUDGET_EXHAUSTED" };
    if (a.op === "providerFinish") {
      if (!Number.isSafeInteger(a.receivedBytes) || a.receivedBytes! < 0)
        throw Error("INVALID_CONTROL");
      const reservation = s.providerReservations?.[a.token];
      if (!reservation) throw Error("INVALID_CONTROL");
      const ledger = await ctx.db
        .query("marketBudget")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .unique();
      // Refund only this newly recorded reservation. Historical conservative
      // charges, failed streams, attempts and guards are never reset/reclassified.
      if (
        ledger &&
        ledger.month === reservation.month &&
        a.receivedBytes! <= reservation.units
      )
        await ctx.db.patch(ledger._id, {
          io: Math.max(0, ledger.io - (reservation.units - a.receivedBytes!)),
        });
      delete s.providerReservations![a.token];
      await save(ctx, row?._id, s);
      return null;
    }
    if (a.op === "provider") {
      s.providerReservations ??= {};
      const month = new Date(now).toISOString().slice(0, 7);
      for (const [token, reservation] of Object.entries(s.providerReservations))
        if (reservation.month !== month) delete s.providerReservations[token];
      if (
        Object.keys(s.providerReservations).length >= 96 ||
        s.providerReservations[a.token]
      )
        throw Error("CONTROL_LIMIT");
      s.providerReservations[a.token] = { month, units: 2 * 1024 * 1024 };
    }
    if (a.op === "begin") {
      for (const symbol of a.symbols) {
        const catalog = await ctx.db
          .query("marketEntries")
          .withIndex("by_key", (q) =>
            q.eq("key", `catalog:${catalogShard(symbol)}`),
          )
          .unique();
        if (
          !catalog ||
          catalog.checkedAt > now ||
          now - catalog.checkedAt > 7 * 86400000 ||
          !validateShard(
            JSON.parse(catalog.payload),
            catalogShard(symbol),
          ).some((a) => a.ticker === symbol)
        )
          throw Error("INVALID_CONTROL");
      }
    }

    if (a.op === "recover") {
      if (s.revoked.some((scope) => !superseded(scope)))
        return { code: "EVIDENCE_REVOKED" };
      return a.symbols.filter((symbol) => {
        const key = `${a.scope}:${symbol}`;
        const observation = s.observations?.[key];
        return (
          observation &&
          observation.token === s.guards[key] &&
          observation.expires <= now
        );
      });
    }
    if (a.op === "revoke") {
      if (!s.revoked.includes(a.scope)) {
        if (s.revoked.length >= 16) throw Error("REVOCATION_LIMIT");
        s.revoked.push(a.scope);
      }
    } else if (a.op === "leave") delete s.active[a.token];
    else if (a.op === "finish") {
      for (const symbol of a.symbols) {
        const k = `${a.scope}:${symbol}`;
        // Legacy finish cannot settle a guard. Successful publication settles it atomically.
        const observation = s.observations?.[k];
        if (
          observation?.token === a.token &&
          observation.leaseToken === a.leaseToken
        ) {
          // Failure/end-of-observation retains the blocker for validated replacement.
          observation.expires = Math.min(observation.expires, now);
        }
      }
    } else {
      // Historical rejected scopes must not disappear when a source window or
      // policy changes. Conservatively block until an approved reconciliation.
      if (
        s.revoked.includes(a.scope) ||
        s.revoked.some((scope) => !superseded(scope))
      )
        return { code: "EVIDENCE_REVOKED" };
      if (a.op === "enter") {
        // Keep the shared in-flight resource bound; browsing has no request quota.
        for (const [t, expires] of Object.entries(s.active))
          if (expires <= now) delete s.active[t];
        if (Object.keys(s.active).length >= hostedConcurrency())
          return {
            code: "REFRESH_BUSY",
            retryAt: Math.min(...Object.values(s.active)),
          };
        s.active[a.token] = now + 120000;
      }
      if (
        a.op === "check" &&
        a.symbols.some((symbol) =>
          Object.keys(s.guards).some(
            (key) =>
              key.endsWith(`:${symbol}`) && !superseded(key.split(":")[0]!),
          ),
        )
      )
        return { code: "REFRESH_GUARDED" };
      if (a.op === "begin")
        for (const symbol of a.symbols) {
          const k = `${a.scope}:${symbol}`;
          const lease = await ctx.db
            .query("marketLeases")
            .withIndex("by_key", (q) => q.eq("key", `asset:${symbol}`))
            .unique();
          if (
            a.leaseToken !== undefined &&
            (!lease || lease.token !== a.leaseToken || lease.expires <= now)
          )
            throw Error("LEASE_LOST");
          const observation = s.observations?.[k];
          if (
            Object.keys(s.guards).some(
              (key) =>
                key.endsWith(`:${symbol}`) &&
                !superseded(key.split(":")[0]!) &&
                !(
                  key === k &&
                  a.leaseToken !== undefined &&
                  observation !== undefined &&
                  observation.token === s.guards[k] &&
                  observation.expires <= now
                ),
            )
          )
            return { code: "REFRESH_GUARDED" };
          if (!s.guards[k] && Object.keys(s.guards).length >= 96)
            throw Error("GUARD_LIMIT");
          s.guards[k] = a.token;
          if (!a.leaseToken || !lease) continue;
          s.observations ??= {};
          s.observations[k] = {
            token: a.token,
            leaseToken: a.leaseToken,
            expires: lease.expires,
          };
        }
    }
    await save(ctx, row?._id, s);
    return null;
  },
});

async function expire(ctx: MutationCtx, state: State, now: number) {
  state.visitors ??= {};
  for (const [key, until] of Object.entries(state.visitors)) {
    if (until > now) continue;
    // Only ephemeral anonymous limiter state expires. Never touch ledger/guards/revocations.
    await limiter.reset(ctx, "browse-visitor", { key });
    delete state.visitors[key];
  }
}
async function save(
  ctx: MutationCtx,
  id: import("./_generated/dataModel").Id<"marketHosted"> | undefined,
  state: State,
) {
  const payload = JSON.stringify(state);
  if (payload.length > 64000) throw Error("CONTROL_LIMIT");
  if (id) await ctx.db.patch(id, { payload });
  else await ctx.db.insert("marketHosted", { key: "global", payload });
}
export const expireVisitors = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("marketHosted")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (row) {
      const state = JSON.parse(row.payload) as State;
      await expire(ctx, state, Date.now());
      await save(ctx, row._id, state);
    }
    return null;
  },
});

// Operator-only CAS conversion: never exposed by the HTTP gateway. Approval must
// establish old hosts are drained. A token alone is not proof of abandonment.
export const reconcileLegacy = internalMutation({
  args: {
    scope: v.string(),
    symbol: v.string(),
    token: v.string(),
    expectedHead: v.union(v.string(), v.null()),
    expectedLeaseToken: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    const now = Date.now();
    if (
      a.scope !== REVIEWED_V5_SCOPE ||
      !/^[A-Z][A-Z0-9.-]{0,15}$/.test(a.symbol)
    )
      throw Error("INVALID_CONTROL");
    if (!(await budget(ctx, 262144, now)))
      throw Error("SHARED_BUDGET_EXHAUSTED");
    const row = await ctx.db
      .query("marketHosted")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (!row) throw Error("INVALID_CONTROL");
    const state = JSON.parse(row.payload) as State;
    const key = `${a.scope}:${a.symbol}`;
    const lease = await ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", `asset:${a.symbol}`))
      .unique();
    const head = await ctx.db
      .query("marketEntries")
      .withIndex("by_key", (q) => q.eq("key", `asset:${a.symbol}`))
      .unique();
    if (
      state.guards[key] !== a.token ||
      state.observations?.[key] ||
      (lease && lease.expires > now) ||
      (lease?.token ?? null) !== a.expectedLeaseToken ||
      (head?.revision ?? null) !== a.expectedHead
    )
      throw Error("RECONCILIATION_CHANGED");
    state.observations ??= {};
    state.observations[key] = {
      token: a.token,
      leaseToken: lease?.token ?? a.token,
      expires: now,
    };
    await save(ctx, row._id, state);
    return null;
  },
});
