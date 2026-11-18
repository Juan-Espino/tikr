import {
  createClient,
  type AuthFunctions,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { APIError, createAuthMiddleware } from "better-auth/api";

async function assertAuthTarget(ctx: MutationCtx, userId: string) {
  await assertAccountActive(ctx, userId);
  const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "_id", value: userId }],
  });
  if (!user) throw new ConvexError("SIGN_IN_REQUIRED");
}
const authFunctions: AuthFunctions = internal.auth;
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    session: {
      onCreate: async (ctx, doc) => assertAuthTarget(ctx, doc.userId),
      onUpdate: async (ctx, doc) => assertAuthTarget(ctx, doc.userId),
    },
    account: {
      onCreate: async (ctx, doc) => assertAuthTarget(ctx, doc.userId),
      onUpdate: async (ctx, doc) => assertAuthTarget(ctx, doc.userId),
    },
    user: { onUpdate: async (ctx, doc) => assertAccountActive(ctx, doc._id) },
  },
});
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
export async function assertAccountActive(
  ctx: QueryCtx | MutationCtx,
  userId: string,
) {
  if (
    await ctx.db
      .query("accountDeletions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
  )
    throw new ConvexError("ACCOUNT_DELETING");
}

export function createAuth(ctx: GenericCtx<DataModel>) {
  const siteURL = process.env.SITE_URL;
  if (!siteURL || new URL(siteURL).origin !== siteURL)
    throw new Error("Auth SITE_URL must be an exact app origin");
  if (
    !process.env.BETTER_AUTH_SECRET ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  )
    throw new Error("Google authentication is not configured");
  return betterAuth({
    baseURL: siteURL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [siteURL],
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (["/link-social", "/unlink-account"].includes(ctx.path))
          throw new APIError("FORBIDDEN", {
            message: "Account linking is not supported",
          });
        const origin = ctx.headers?.get("origin");
        if (origin && origin !== siteURL)
          throw new APIError("FORBIDDEN", { message: "Untrusted auth origin" });
      }),
    },
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectURI: `${siteURL}/api/auth/callback/google`,
        scope: ["openid", "profile", "email"],
        disableDefaultScope: true,
        prompt: "select_account",
      },
    },
    logger: { disabled: true },
    plugins: [convex({ authConfig })],
  });
}

export const currentAccount = query({
  args: {},
  returns: v.union(v.null(), v.object({ name: v.string(), email: v.string() })),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    return user ? { name: user.name, email: user.email } : null;
  },
});

// Explicit, server-verified confirmation. No victim ID or email is accepted.
export const beginDeletion = mutation({
  args: { sessionFence: v.string(), token: v.string() },
  returns: v.union(v.literal("accepted"), v.literal("reauth_required")),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (!user || !identity) throw new ConvexError("SIGN_IN_REQUIRED");
    if (identity.sessionId !== args.sessionFence)
      throw new ConvexError("SESSION_CHANGED");
    if (!/^[0-9a-f-]{36}$/.test(args.token))
      throw new ConvexError("INVALID_REQUEST");
    const prior = await ctx.db
      .query("accountDeletions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (prior) {
      if (prior.token !== args.token) throw new ConvexError("ACCOUNT_DELETING");
      await ctx.scheduler.runAfter(0, internal.auth.cleanDeletion, {
        id: prior._id,
      });
      return "accepted" as const;
    }
    if (
      (await ctx.db
        .query("accountDeletions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .unique()) ||
      (await ctx.db
        .query("deletionCompletions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .unique())
    )
      throw new ConvexError("INVALID_REQUEST");
    const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "session",
      where: [
        { field: "_id", value: args.sessionFence },
        { field: "userId", value: user._id },
      ],
    });
    // Same createdAt freshness rule used by Better Auth deleteUser, narrowed to five minutes.
    if (!session || Number(session.expiresAt) <= Date.now())
      throw new ConvexError("SIGN_IN_REQUIRED");
    if (Date.now() - Number(session.createdAt) >= 300_000)
      return "reauth_required" as const;
    const id = await ctx.db.insert("accountDeletions", {
      userId: user._id,
      ownerId: identity.tokenIdentifier,
      token: args.token,
      startedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.auth.cleanDeletion, { id });
    return "accepted" as const;
  },
});
// A random client capability discloses only operational progress, never identity/data.
// Absence is not a success receipt: the client must separately verify its old session is gone.
export const deletionPending = query({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { token }) =>
    !!(await ctx.db
      .query("accountDeletions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique()),
});
export const cleanDeletion = internalMutation({
  args: { id: v.id("accountDeletions") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const job = await ctx.db.get(id);
    if (!job) return null;
    // Each transaction drains at most 50 records from ONE indexed owner range.
    for (const table of [
      "portfolios",
      "discoveryRequests",
      "discoveryUsage",
    ] as const) {
      const rows =
        table === "portfolios"
          ? await ctx.db
              .query("portfolios")
              .withIndex("by_ownerId_and_clientId", (q) =>
                q.eq("ownerId", job.ownerId),
              )
              .take(50)
          : table === "discoveryRequests"
            ? await ctx.db
                .query("discoveryRequests")
                .withIndex("by_ownerId_and_requestId", (q) =>
                  q.eq("ownerId", job.ownerId),
                )
                .take(50)
            : await ctx.db
                .query("discoveryUsage")
                .withIndex("by_ownerId_and_day", (q) =>
                  q.eq("ownerId", job.ownerId),
                )
                .take(50);
      if (rows.length) {
        for (const row of rows) await ctx.db.delete(row._id);
        await ctx.scheduler.runAfter(0, internal.auth.cleanDeletion, { id });
        return null;
      }
    }
    // Keep the user until links and sessions have drained: OAuth resolves the old
    // identity and the transactional triggers refuse reissue while it is deleting.
    for (const model of ["session", "account", "twoFactor"] as const) {
      const result = await ctx.runMutation(
        components.betterAuth.adapter.deleteMany,
        {
          input: { model, where: [{ field: "userId", value: job.userId }] },
          paginationOpts: { numItems: 50, cursor: null },
        },
      );
      if (result.count) {
        await ctx.scheduler.runAfter(0, internal.auth.cleanDeletion, { id });
        return null;
      }
    }
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: { model: "user", where: [{ field: "_id", value: job.userId }] },
    });
    // Same parent mutation commits auth removal and removal of operational state.
    await ctx.db.delete(id);
    const completion = await ctx.db.insert("deletionCompletions", {
      token: job.token,
      expiresAt: Date.now() + 600_000,
    });
    await ctx.scheduler.runAfter(600_000, internal.auth.retireCompletion, {
      id: completion,
    });
    return null;
  },
});
export const retireCompletion = internalMutation({
  args: { id: v.id("deletionCompletions") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});
export const deletionProgress = query({
  args: { token: v.string() },
  returns: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("unknown"),
  ),
  handler: async (ctx, { token }) => {
    if (
      await ctx.db
        .query("accountDeletions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique()
    )
      return "pending";
    const done = await ctx.db
      .query("deletionCompletions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    return done && done.expiresAt > Date.now() ? "completed" : "unknown";
  },
});
export const resumeDeletion = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const job = await ctx.db
      .query("accountDeletions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (job)
      await ctx.scheduler.runAfter(0, internal.auth.cleanDeletion, {
        id: job._id,
      });
    return null;
  },
});
