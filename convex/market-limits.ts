import { RateLimiter } from "@convex-dev/rate-limiter";
import type { ComponentApi } from "@convex-dev/rate-limiter/_generated/component.js";
import { componentsGeneric } from "convex/server";

// Generated bindings are refreshed only during a separately authorized deploy.
const components = componentsGeneric() as unknown as {
  rateLimiter: ComponentApi;
};
export const limiter = new RateLimiter(components.rateLimiter);
export function browsingLimits() {
  const setting = (name: string, fallback: number, max: number) => {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > max
    )
      throw Error("INVALID_ADMISSION_CONFIG");
    return value;
  };
  return {
    visitor: setting("TIKR_BROWSE_PER_MINUTE", 60, 600),
    global: setting("TIKR_BROWSE_GLOBAL_PER_MINUTE", 240, 2400),
    concurrency: setting("TIKR_BROWSE_CONCURRENCY", 4, 16),
  };
}
export const VISITOR_TTL = 10 * 60000;
export const MAX_VISITORS = 256;
