import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { budget } from "./market";

// One bounded control document serializes all hosts. Guards and revocations never expire.
type State = {
  day: string;
  opens: number;
  buckets: Record<string, number>;
  active: Record<string, number>;
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
    bucket: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    if (
      !/^[a-f0-9]{64}$/.test(a.scope) ||
      !/^[a-f0-9-]{36}$/.test(a.token) ||
      !Number.isInteger(a.bucket) ||
      a.bucket < 0 ||
      a.bucket >= 128 ||
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
      !(await budget(ctx, a.op === "provider" ? 2 * 1024 * 1024 : 32768, now))
    )
      throw Error("CACHE_BUDGET");
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
      if (s.revoked.includes(a.scope)) throw Error("EVIDENCE_REVOKED");
      if (a.op === "enter") {
        if (s.day !== day) {
          s.day = day;
          s.opens = 0;
          s.buckets = {};
        }
        for (const [t, expires] of Object.entries(s.active))
          if (expires <= now) delete s.active[t];
        if (
          s.opens >= 100 ||
          (s.buckets[a.bucket] ?? 0) >= 10 ||
          Object.keys(s.active).length >= 4
        )
          throw Error("VISITOR_LIMIT");
        s.opens++;
        s.buckets[a.bucket] = (s.buckets[a.bucket] ?? 0) + 1;
        s.active[a.token] = now + 120000;
      }
      if (
        a.op === "check" &&
        a.symbols.some((symbol) => s.guards[`${a.scope}:${symbol}`])
      )
        throw Error("REFRESH_GUARDED");
      if (a.op === "begin")
        for (const symbol of a.symbols) {
          const k = `${a.scope}:${symbol}`;
          if (s.guards[k]) throw Error("REFRESH_GUARDED");
          if (Object.keys(s.guards).length >= 96) throw Error("GUARD_LIMIT");
          s.guards[k] = a.token;
        }
    }
    const payload = JSON.stringify(s);
    if (payload.length > 20000) throw Error("CONTROL_LIMIT");
    if (row) await ctx.db.patch(row._id, { payload });
    else await ctx.db.insert("marketHosted", { key: "global", payload });
    return null;
  },
});
