import { RateLimiter } from "@convex-dev/rate-limiter";
import type { ComponentApi } from "@convex-dev/rate-limiter/_generated/component.js";
import { componentsGeneric } from "convex/server";

// Generated bindings are refreshed only during a separately authorized deploy.
const components = componentsGeneric() as unknown as {
  rateLimiter: ComponentApi;
};
export const limiter = new RateLimiter(components.rateLimiter);
// Retained only for already-scheduled legacy visitor expiry callbacks.

// In-flight work bounds resource use independently of request rates.
export function hostedConcurrency() {
  const raw = process.env.TIKR_BROWSE_CONCURRENCY;
  if (raw === undefined) return 4;
  const value = Number(raw);
  if (
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 16
  )
    throw Error("INVALID_ADMISSION_CONFIG");
  return value;
}
