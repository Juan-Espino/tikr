import { ConvexError, v } from "convex/values";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { authComponent, assertAccountActive } from "./auth";
import { definition } from "./portfolioFields";
import schema from "./schema";
import {
  allocation,
  validAmount,
  equalWeights,
  basisPoints,
} from "../src/lib/demo";
import { validTicker } from "../src/lib/asset-catalog";
import type { Infer } from "convex/values";
import { components } from "./_generated/api";

async function owner(ctx: QueryCtx | MutationCtx, sessionFence?: string) {
  // Better Auth validates both the JWT identity and the live component session.
  const user = await authComponent.safeGetAuthUser(ctx);
  const identity = await ctx.auth.getUserIdentity();
  if (!user || !identity) throw new ConvexError("SIGN_IN_REQUIRED");
  await assertAccountActive(ctx, user._id);
  if (sessionFence !== undefined && sessionFence !== identity.sessionId)
    throw new ConvexError("SESSION_CHANGED");
  const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "session",
    where: [
      { field: "_id", value: String(identity.sessionId) },
      { field: "userId", value: user._id },
    ],
  });
  if (!session) throw new ConvexError("SIGN_IN_REQUIRED");
  return identity.tokenIdentifier;
}
function identifier(id: string) {
  // Saved IDs must also fit the shared market request contract and avoid its benchmark ID.
  if (id === "SPY" || !/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    throw new ConvexError("INVALID_ID");
}
function validate(input: Infer<typeof definition>) {
  if (
    !input.name.trim() ||
    input.name.length > 80 ||
    /[\u0000-\u001f\u007f]/.test(input.name)
  )
    throw new ConvexError("INVALID_NAME");
  if (
    input.holdings.length > 6 ||
    input.holdings.some(
      (h) => !validTicker(h.ticker) || h.weight.length > 12,
    ) ||
    !allocation(input.holdings).valid ||
    input.amount.length > 16 ||
    !validAmount(input.amount)
  )
    throw new ConvexError("INVALID_FINANCIAL_DATA");
  if (input.rangeChoice === "default" && input.range !== "1W")
    throw new ConvexError("INVALID_RANGE_CHOICE");
  if (
    !input.manual &&
    input.holdings.some(
      (holding, index) =>
        basisPoints(holding.weight) !==
        basisPoints(
          equalWeights(input.holdings.map((h) => h.ticker))[index]!.weight,
        ),
    )
  )
    throw new ConvexError("INVALID_EQUAL_WEIGHTS");
  return { ...input, name: input.name.trim() };
}
async function find(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  clientId: string,
) {
  identifier(clientId);
  return ctx.db
    .query("portfolios")
    .withIndex("by_ownerId_and_clientId", (q) =>
      q.eq("ownerId", ownerId).eq("clientId", clientId),
    )
    .unique();
}
async function uniqueName(
  ctx: MutationCtx,
  ownerId: string,
  name: string,
  except?: string,
) {
  const existing = await ctx.db
    .query("portfolios")
    .withIndex("by_ownerId_and_deleted_and_normalizedName", (q) =>
      q
        .eq("ownerId", ownerId)
        .eq("deleted", false)
        .eq("normalizedName", name.toLowerCase()),
    )
    .unique();
  if (existing && existing.clientId !== except)
    throw new ConvexError("NAME_CONFLICT");
}
export const list = query({
  // A per-session client nonce separates reactive client cache entries across accounts.
  // It grants no authority; the owner always comes from the verified session.
  args: { paginationOpts: paginationOptsValidator, sessionKey: v.string() },
  returns: paginationResultValidator(
    schema.doc("portfolios").extend({ sessionAccountId: v.string() }),
  ),
  handler: async (ctx, args) => {
    if (args.sessionKey.length > 128) throw new ConvexError("INVALID_ID");
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return { page: [], isDone: true, continueCursor: "" };
    const ownerId = await owner(ctx);
    if (
      !Number.isSafeInteger(args.paginationOpts.numItems) ||
      args.paginationOpts.numItems > 100 ||
      args.paginationOpts.numItems < 1
    )
      throw new ConvexError("INVALID_PAGE");
    const result = await ctx.db
      .query("portfolios")
      .withIndex("by_ownerId_and_deleted", (q) =>
        q.eq("ownerId", ownerId).eq("deleted", false),
      )
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((row) => ({ ...row, sessionAccountId: user._id })),
    };
  },
});
export const get = query({
  args: { clientId: v.string() },
  returns: schema.doc("portfolios"),
  handler: async (ctx, args) => {
    const row = await find(ctx, await owner(ctx), args.clientId);
    if (!row || row.deleted) throw new ConvexError("PORTFOLIO_UNAVAILABLE");
    return row;
  },
});
export const create = mutation({
  args: {
    clientId: v.string(),
    definition,
    sessionFence: v.string(),
  },
  returns: schema.doc("portfolios"),
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx, args.sessionFence);
    identifier(args.clientId);
    const value = validate(args.definition);
    const prior = await find(ctx, ownerId, args.clientId);
    if (prior) {
      if (
        prior.deleted ||
        JSON.stringify(prior.definition) !== JSON.stringify(value)
      )
        throw new ConvexError("REVISION_CONFLICT");
      return prior;
    }
    await uniqueName(ctx, ownerId, value.name);
    const now = Date.now();
    const id = await ctx.db.insert("portfolios", {
      ownerId,
      clientId: args.clientId,
      definition: value,
      normalizedName: value.name.toLowerCase(),
      revision: 1,
      created: now,
      updated: now,
      deleted: false,
    });
    return (await ctx.db.get("portfolios", id))!;
  },
});
export const update = mutation({
  args: {
    clientId: v.string(),
    revision: v.number(),
    definition,
    sessionFence: v.string(),
  },
  returns: schema.doc("portfolios"),
  handler: async (ctx, args) => {
    const ownerId = await owner(ctx, args.sessionFence);
    const row = await find(ctx, ownerId, args.clientId);
    if (!row || row.deleted) throw new ConvexError("PORTFOLIO_UNAVAILABLE");
    if (row.revision !== args.revision)
      throw new ConvexError("REVISION_CONFLICT");
    const value = validate(args.definition);
    await uniqueName(ctx, ownerId, value.name, row.clientId);
    await ctx.db.patch("portfolios", row._id, {
      definition: value,
      normalizedName: value.name.toLowerCase(),
      revision: row.revision + 1,
      updated: Date.now(),
    });
    return (await ctx.db.get("portfolios", row._id))!;
  },
});
export const remove = mutation({
  args: {
    clientId: v.string(),
    revision: v.number(),
    sessionFence: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await find(
      ctx,
      await owner(ctx, args.sessionFence),
      args.clientId,
    );
    if (!row) throw new ConvexError("PORTFOLIO_UNAVAILABLE");
    if (row.deleted) return null;
    if (row.revision !== args.revision)
      throw new ConvexError("REVISION_CONFLICT");
    await ctx.db.patch("portfolios", row._id, {
      deleted: true,
      // Keep only the identity/revision receipt needed to fence late writes.
      // The deleted definition's user data is removed.
      definition: {
        name: "",
        holdings: [],
        manual: false,
        pinned: false,
        amount: "",
        range: "1W",
        rangeChoice: "default",
      },
      normalizedName: "",
      revision: row.revision + 1,
      updated: Date.now(),
    });
    return null;
  },
});
