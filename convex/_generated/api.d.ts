/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as discovery from "../discovery.js";
import type * as discoveryCatalog from "../discoveryCatalog.js";
import type * as discoveryFields from "../discoveryFields.js";
import type * as discoveryIdentity from "../discoveryIdentity.js";
import type * as discoveryQuota from "../discoveryQuota.js";
import type * as hosted from "../hosted.js";
import type * as http from "../http.js";
import type * as market from "../market.js";
import type * as market_limits from "../market_limits.js";
import type * as portfolioFields from "../portfolioFields.js";
import type * as portfolios from "../portfolios.js";
import type * as tasks from "../tasks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  discovery: typeof discovery;
  discoveryCatalog: typeof discoveryCatalog;
  discoveryFields: typeof discoveryFields;
  discoveryIdentity: typeof discoveryIdentity;
  discoveryQuota: typeof discoveryQuota;
  hosted: typeof hosted;
  http: typeof http;
  market: typeof market;
  market_limits: typeof market_limits;
  portfolioFields: typeof portfolioFields;
  portfolios: typeof portfolios;
  tasks: typeof tasks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
