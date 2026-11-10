import { internalMutation } from "./_generated/server";
import { makeFunctionReference } from "convex/server";
import type { MutationCtx } from "./_generated/server";
import {
  limiter,
  browsingLimits,
  MAX_VISITORS,
  VISITOR_TTL,
} from "./market-limits";
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
};
export const control = internalMutation({
  args: {
    op: v.union(
      v.literal("enter"),
      v.literal("leave"),
      v.literal("provider"),
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
      a.symbols.length > 6 ||
      a.symbols.some(
        (s) => !["AAPL", "MSFT", "NVDA", "SCHD", "AMZN", "SPY"].includes(s),
      )
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
      !["revoke", "finish", "leave"].includes(a.op) &&
      !(await budget(ctx, a.op === "provider" ? 2 * 1024 * 1024 : 131072, now))
    )
      return { code: "SHARED_BUDGET_EXHAUSTED" };
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
      if (s.revoked.includes(a.scope)) return { code: "EVIDENCE_REVOKED" };
      if (a.op === "enter") {
        if (!a.visitor) throw Error("INVALID_CONTROL");
        const limits = browsingLimits();
        await expire(ctx, s, now);
        for (const [t, expires] of Object.entries(s.active))
          if (expires <= now) delete s.active[t];
        let retryAt: number | undefined;
        if (Object.keys(s.active).length >= limits.concurrency)
          retryAt = Math.min(...Object.values(s.active));
        if (
          !s.visitors![a.visitor] &&
          Object.keys(s.visitors!).length >= MAX_VISITORS
        )
          retryAt = Math.max(
            retryAt ?? 0,
            Math.min(...Object.values(s.visitors!)),
          );
        if (retryAt) return { code: "BROWSING_RATE_LIMIT", retryAt };
        if (!s.visitors![a.visitor]) {
          s.visitors![a.visitor] = now + VISITOR_TTL;
          await ctx.scheduler.runAfter(
            VISITOR_TTL,
            makeFunctionReference<"mutation">("hosted:expireVisitors"),
            {},
          );
        }
        const config = (rate: number) => ({
          kind: "token bucket" as const,
          rate,
          capacity: rate,
          period: 60000,
        });
        const global = await limiter.limit(ctx, "browse-global", {
          config: config(limits.global),
        });
        const visitor = global.ok
          ? await limiter.limit(ctx, "browse-visitor", {
              key: a.visitor,
              config: config(limits.visitor),
            })
          : global;
        if (!visitor.ok) {
          await save(ctx, row?._id, s);
          return {
            code: "BROWSING_RATE_LIMIT",
            retryAt:
              now + Math.max(1, Math.ceil(visitor.retryAfter ?? 60000)) + 1,
          };
        }
        s.active[a.token] = now + 120000;
      }
      if (
        a.op === "check" &&
        a.symbols.some((symbol) => s.guards[`${a.scope}:${symbol}`])
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
