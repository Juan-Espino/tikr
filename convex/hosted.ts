import { catalogShard, validateShard } from "../src/lib/asset-catalog";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { limiter, hostedConcurrency } from "./market_limits";
import { v } from "convex/values";
import { budget } from "./market";

// One bounded control document serializes all hosts. Guards and revocations never expire.
type State = {
  day: string;
  opens: number;
  buckets: Record<string, number>;
  active: Record<string, number>;
  visitors?: Record<string, number>;
  revoked: string[];
  guards: Record<string, string>;
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
      v.literal("finish"),
      v.literal("revoke"),
    ),
    scope: v.string(),
    token: v.string(),
    symbols: v.array(v.string()),
    bucket: v.optional(v.number()), // Legacy argument accepted during rollout; never used for identity.
    visitor: v.optional(v.string()),
    receivedBytes: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
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

    if (a.op === "revoke") {
      if (!s.revoked.includes(a.scope)) {
        if (s.revoked.length >= 16) throw Error("REVOCATION_LIMIT");
        s.revoked.push(a.scope);
      }
    } else if (a.op === "leave") delete s.active[a.token];
    else if (a.op === "finish") {
      for (const symbol of a.symbols) {
        const k = `${a.scope}:${symbol}`;
        if (s.guards[k] === a.token) delete s.guards[k];
      }
    } else {
      // Historical rejected scopes must not disappear when a source window or
      // policy changes. Conservatively block until an approved reconciliation.
      if (
        s.revoked.includes(a.scope) ||
        (s.revoked.length && ["check", "begin"].includes(a.op))
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
          Object.keys(s.guards).some((key) => key.endsWith(`:${symbol}`)),
        )
      )
        return { code: "REFRESH_GUARDED" };
      if (a.op === "begin")
        for (const symbol of a.symbols) {
          const k = `${a.scope}:${symbol}`;
          if (s.guards[k]) return { code: "REFRESH_GUARDED" };
          if (Object.keys(s.guards).length >= 96) throw Error("GUARD_LIMIT");
          s.guards[k] = a.token;
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
