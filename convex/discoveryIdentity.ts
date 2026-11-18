import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { authComponent, assertAccountActive } from "./auth";
import { components } from "./_generated/api";

export async function discoveryIdentity(
  ctx: QueryCtx | MutationCtx,
  sessionFence: string,
) {
  const user = await authComponent.safeGetAuthUser(ctx);
  const identity = await ctx.auth.getUserIdentity();
  if (!user || !identity) throw new ConvexError("SIGN_IN_REQUIRED");
  await assertAccountActive(ctx, user._id);
  if (identity.sessionId !== sessionFence)
    throw new ConvexError("SESSION_CHANGED");
  const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "session",
    where: [
      { field: "_id", value: String(identity.sessionId) },
      { field: "userId", value: user._id },
    ],
  });
  if (!session || Number(session.expiresAt) <= Date.now())
    throw new ConvexError("SIGN_IN_REQUIRED");
  return identity.tokenIdentifier;
}
