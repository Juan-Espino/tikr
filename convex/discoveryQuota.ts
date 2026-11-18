import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { discoveryIdentity } from "./discoveryIdentity";
import { usageValidator } from "./discoveryFields";
import {
  DISCOVERY,
  discoveryDay,
  type DiscoveryUsage,
} from "../src/lib/ai-discovery";

async function allowance(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
): Promise<DiscoveryUsage> {
  const now = Date.now(),
    { day, resetAt } = discoveryDay(now);
  const row = await ctx.db
    .query("discoveryUsage")
    .withIndex("by_ownerId_and_day", (q) =>
      q.eq("ownerId", ownerId).eq("day", day),
    )
    .unique();
  const pending = row?.pendingId && (row.leaseUntil ?? 0) > now ? 1 : 0;
  return {
    limit: DISCOVERY.dailyLimit,
    remaining: Math.max(
      0,
      DISCOVERY.dailyLimit - (row?.completed ?? 0) - pending,
    ),
    resetAt,
  };
}
export const usage = query({
  args: { sessionFence: v.string() },
  returns: usageValidator,
  handler: async (ctx, { sessionFence }) =>
    allowance(ctx, await discoveryIdentity(ctx, sessionFence)),
});
const reservation = v.union(
  v.object({ kind: v.literal("reserved"), receipt: v.id("discoveryRequests") }),
  v.object({
    kind: v.union(
      v.literal("busy"),
      v.literal("limit"),
      v.literal("duplicate"),
    ),
  }),
);
export const reserve = internalMutation({
  args: {
    sessionFence: v.string(),
    requestId: v.string(),
    promptHash: v.string(),
  },
  returns: reservation,
  handler: async (ctx, args) => {
    const ownerId = await discoveryIdentity(ctx, args.sessionFence);
    const now = Date.now(),
      { day } = discoveryDay(now);
    // Date-prefixed IDs cannot be replayed after their receipts are retired.
    if (
      !new RegExp(
        `^${day}:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      ).test(args.requestId) ||
      !/^[a-f0-9]{64}$/.test(args.promptHash)
    )
      throw new ConvexError("INVALID_REQUEST");
    const previous = await ctx.db
      .query("discoveryRequests")
      .withIndex("by_ownerId_and_requestId", (q) =>
        q.eq("ownerId", ownerId).eq("requestId", args.requestId),
      )
      .unique();
    if (previous) {
      if (previous.promptHash !== args.promptHash)
        throw new ConvexError("REQUEST_CONFLICT");
      return { kind: "duplicate" as const };
    }
    let row = await ctx.db
      .query("discoveryUsage")
      .withIndex("by_ownerId_and_day", (q) =>
        q.eq("ownerId", ownerId).eq("day", day),
      )
      .unique();
    if (row?.pendingId && (row.leaseUntil ?? 0) > now)
      return { kind: "busy" as const };
    if (row?.pendingId) await ctx.db.patch(row.pendingId, { status: "failed" });
    if ((row?.completed ?? 0) >= DISCOVERY.dailyLimit)
      return { kind: "limit" as const };
    if (!row) {
      const id = await ctx.db.insert("discoveryUsage", {
        ownerId,
        day,
        completed: 0,
      });
      row = (await ctx.db.get(id))!;
    }
    const receipt = await ctx.db.insert("discoveryRequests", {
      ownerId,
      requestId: args.requestId,
      promptHash: args.promptHash,
      day,
      status: "pending",
      leaseUntil: now + DISCOVERY.leaseMs,
      expiresAt: now + DISCOVERY.receiptMs,
    });
    await ctx.db.patch(row._id, {
      pendingId: receipt,
      leaseUntil: now + DISCOVERY.leaseMs,
    });
    await ctx.scheduler.runAfter(
      DISCOVERY.receiptMs,
      internal.discoveryQuota.retire,
      { receipt, usageId: row._id },
    );
    return { kind: "reserved" as const, receipt };
  },
});
export const finish = internalMutation({
  args: {
    receipt: v.id("discoveryRequests"),
    success: v.boolean(),
    sessionFence: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receipt);
    if (!receipt || receipt.status !== "pending") return false;
    if (
      await ctx.db
        .query("accountDeletions")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", receipt.ownerId))
        .unique()
    )
      return false;
    if (
      args.success &&
      (await discoveryIdentity(ctx, args.sessionFence)) !== receipt.ownerId
    )
      throw new ConvexError("SESSION_CHANGED");
    const row = await ctx.db
      .query("discoveryUsage")
      .withIndex("by_ownerId_and_day", (q) =>
        q.eq("ownerId", receipt.ownerId).eq("day", receipt.day),
      )
      .unique();
    const current = row?.pendingId === receipt._id;
    const accepted = !!(
      args.success &&
      current &&
      receipt.leaseUntil > Date.now()
    );
    await ctx.db.patch(receipt._id, {
      status: accepted ? "completed" : "failed",
    });
    if (row && current)
      await ctx.db.patch(row._id, {
        completed: row.completed + (accepted ? 1 : 0),
        pendingId: undefined,
        leaseUntil: undefined,
      });
    return accepted;
  },
});
export const retire = internalMutation({
  args: { receipt: v.id("discoveryRequests"), usageId: v.id("discoveryUsage") },
  returns: v.null(),
  handler: async (ctx, { receipt, usageId }) => {
    const request = await ctx.db.get(receipt);
    if (request && request.expiresAt <= Date.now())
      await ctx.db.delete(receipt);
    const usage = await ctx.db.get(usageId);
    if (usage && usage.day < discoveryDay(Date.now() - 86_400_000).day)
      await ctx.db.delete(usageId);
    return null;
  },
});
