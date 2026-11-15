import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const authComponent = createClient<DataModel>(components.betterAuth);

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
