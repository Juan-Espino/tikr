import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getDocumentSize, v } from "convex/values";
import {
  MARKET_BUDGET as B,
  FREE_ALLOWANCE as F,
  storageCharge,
} from "../src/lib/market-budget";
const dependency = v.object({ key: v.string(), revision: v.string() });
const entry = v.object({
  key: v.string(),
  payload: v.string(),
  revision: v.string(),
  dependencies: v.array(dependency),
});
const validKey = (key: string) => {
  if (!/^[A-Za-z0-9:._-]{1,160}$/.test(key)) throw new Error("INVALID_KEY");
};
export async function budget(ctx: MutationCtx, bytes: number, now: number) {
  const row = await ctx.db
    .query("marketBudget")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .unique();
  if (!row || row.reviewedThrough < now)
    throw new Error("TEAM_BUDGET_UNVERIFIED");
  const month = new Date(now).toISOString().slice(0, 7);
  const io = (row.month === month ? row.io : 0) + bytes + 8192;
  const calls = (row.month === month ? row.calls : 0) + 1;
  if (
    io > B.monthlyIoBytes ||
    calls > B.monthlyCalls ||
    io + row.otherIo > F.monthlyIoBytes * 0.75 ||
    calls + row.otherCalls > F.monthlyCalls * 0.75
  )
    return null;
  await ctx.db.patch(row._id, { month, io, calls });
  return { ...row, month, io, calls };
}
// Operator-only: team dashboard evidence must be reassessed each month. Does not deploy anything.
export const configure = internalMutation({
  args: {
    otherStorage: v.number(),
    otherIo: v.number(),
    otherCalls: v.number(),
    reviewedThrough: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (
      Object.values(args).some((n) => !Number.isSafeInteger(n) || n < 0) ||
      args.reviewedThrough < now ||
      args.reviewedThrough > now + 32 * 86400000 ||
      args.otherStorage + B.storageBytes > F.storageBytes * 0.75 ||
      args.otherIo + B.monthlyIoBytes > F.monthlyIoBytes * 0.75 ||
      args.otherCalls + B.monthlyCalls > F.monthlyCalls * 0.75
    )
      throw new Error("TEAM_BUDGET_INVALID");
    const row = await ctx.db
      .query("marketBudget")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (row) await ctx.db.patch(row._id, args);
    else
      await ctx.db.insert("marketBudget", {
        key: "global",
        month: new Date(now).toISOString().slice(0, 7),
        io: 0,
        calls: 0,
        storage: 0,
        entries: 0,
        ...args,
      });
    return null;
  },
});
// Mutations intentionally account for bounded reads; these are not reactive queries.
export const read = internalMutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    if (keys.length > 80 || new Set(keys).size !== keys.length)
      throw new Error("READ_LIMIT");
    keys.forEach(validKey);
    const admission = await budget(ctx, keys.length * 1024, Date.now());
    if (!admission || admission.io > B.monthlyIoBytes - 10_000_000)
      return { status: "budget" as const, rows: [] };
    const rows = await Promise.all(
      keys.map((key) =>
        ctx.db
          .query("marketEntries")
          .withIndex("by_key", (q) => q.eq("key", key))
          .unique(),
      ),
    );
    // Charge actual returned documents; failed admission returns no payload.
    const bytes = rows.reduce(
      (s, row) => s + (row ? getDocumentSize(row) * 2 : 1024),
      0,
    );
    if (!(await budget(ctx, bytes, Date.now())))
      return { status: "budget" as const, rows: [] };
    return {
      status: "ok" as const,
      chargedIo: bytes + keys.length * 1024 + 16384,
      rows: rows
        .filter((r) => r !== null)
        .map(({ key, payload, revision, dependencies, checkedAt }) => ({
          key,
          payload,
          revision,
          dependencies,
          checkedAt,
        })),
    };
  },
});
export const acquire = internalMutation({
  args: {
    key: v.string(),
    token: v.string(),
    cycle: v.string(),
    retry: v.boolean(),
  },
  handler: async (ctx, args) => {
    validKey(args.key);
    if (
      !/^[a-f0-9-]{36}$/.test(args.token) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(args.cycle)
    )
      throw new Error("INVALID_LEASE");
    const now = Date.now();
    if (!(await budget(ctx, 8192, now))) return { status: "budget" as const };
    const row = await ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (row && row.expires > now)
      return { status: "busy" as const, chargedIo: 32768 };
    const attempts = row?.cycle === args.cycle ? row.attempts : 0;
    if (
      attempts >= (args.retry ? 2 : 1) ||
      (attempts > 0 && now - row!.attemptedAt < 60000)
    )
      return { status: "daily" as const, chargedIo: 32768 };
    const value = {
      key: args.key,
      token: args.token,
      cycle: args.cycle,
      attempts: attempts + 1,
      attemptedAt: now,
      expires: now + 60000,
    };
    if (row) await ctx.db.replace(row._id, value);
    else {
      const rows = await ctx.db.query("marketLeases").take(67);
      if (rows.length >= 66)
        return { status: "limit" as const, chargedIo: 32768 };
      await ctx.db.insert("marketLeases", value);
    }
    return { status: "acquired" as const, chargedIo: 32768 };
  },
});
export const write = internalMutation({
  args: { leaseKey: v.string(), token: v.string(), entries: v.array(entry) },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (
      !args.entries.length ||
      args.entries.length > 80 ||
      new Set(args.entries.map((e) => e.key)).size !== args.entries.length
    )
      throw new Error("WRITE_LIMIT");
    const lease = await ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", args.leaseKey))
      .unique();
    if (!lease || lease.token !== args.token || lease.expires <= now)
      throw new Error("LEASE_LOST");
    let delta = 0,
      added = 0,
      io = 0;
    const writes = [];
    for (const value of args.entries) {
      validKey(value.key);
      if (
        !/^[a-f0-9]{64}$/.test(value.revision) ||
        value.dependencies.length > 51 ||
        getDocumentSize(value) > B.maxDocumentBytes
      )
        throw new Error("DOCUMENT_LIMIT");
      for (const d of value.dependencies) {
        const staged = args.entries.find((e) => e.key === d.key);
        const existing =
          staged ??
          (await ctx.db
            .query("marketEntries")
            .withIndex("by_key", (q) => q.eq("key", d.key))
            .unique());
        if (!existing || existing.revision !== d.revision)
          throw new Error("REVISION_CHANGED");
        io += existing === staged ? 0 : getDocumentSize(existing) * 2;
      }
      const old = await ctx.db
        .query("marketEntries")
        .withIndex("by_key", (q) => q.eq("key", value.key))
        .unique();
      const data = { ...value, checkedAt: now, cost: 0 };
      data.cost = storageCharge(getDocumentSize(data));
      delta += data.cost - (old?.cost ?? 0);
      added += old ? 0 : 1;
      io += getDocumentSize(data) * 4 + (old ? getDocumentSize(old) * 2 : 1024);
      writes.push({ old, data });
    }
    const b = await budget(ctx, io, now);
    if (!b) return { status: "budget" as const };
    if (
      b.storage + delta > B.storageBytes - 6_000_000 ||
      b.entries + added > B.maxEntries ||
      b.storage + delta + b.otherStorage > F.storageBytes * 0.75
    )
      return { status: "storage" as const, chargedIo: io + 8192 };
    for (const { old, data } of writes) {
      if (old) await ctx.db.replace(old._id, data);
      else await ctx.db.insert("marketEntries", data);
    }
    await ctx.db.patch(b._id, {
      storage: b.storage + delta,
      entries: b.entries + added,
    });
    await ctx.db.patch(lease._id, { expires: 0 });
    return { status: "ok" as const, chargedIo: io + 8192 };
  },
});
export const release = internalMutation({
  args: { key: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const b = await budget(ctx, 8192, Date.now());
    if (!b) return null;
    const row = await ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (row?.token === args.token) await ctx.db.patch(row._id, { expires: 0 });
    return null;
  },
});
