import { RateLimiter } from "@convex-dev/rate-limiter";
import type { ComponentApi } from "@convex-dev/rate-limiter/_generated/component.js";
import { componentsGeneric } from "convex/server";

// Generated bindings are refreshed only during a separately authorized deploy.
const components = componentsGeneric() as unknown as {
  rateLimiter: ComponentApi;
};
export const limiter = new RateLimiter(components.rateLimiter);
// Compatibility for already-scheduled visitor expiry callbacks only.
// No rate, concurrency, daily-attempt or monthly-usage policy is enforced.
