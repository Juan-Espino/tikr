// Public, bounded failure vocabulary. Never forward upstream exception text.
import type { RefreshFailure } from "./market-failure-record.ts";
export const marketFailureCodes = [
  "CATALOG_NOT_ENABLED",
  "CATALOG_PROVIDER",
  "CATALOG_INVALID",
  "CATALOG_LIMIT",
  "CATALOG_UNAVAILABLE",
  "BROWSING_RATE_LIMIT",
  "REFRESH_COOLDOWN",
  "REFRESH_BUSY",
  "SHARED_BUDGET_EXHAUSTED",
  "TEAM_BUDGET_UNVERIFIED",
  "REFRESH_GUARDED",
  "EVIDENCE_REVOKED",
  "MISSING_PRICE",
  "SHORT_HISTORY",
  "UNSUPPORTED_ACTION",
  "SOURCE_FAILURE",
  "SOURCE_LIMIT",
  "UNVERIFIED_DATA",
  "INSUFFICIENT_COVERAGE",
  "DATA_UNAVAILABLE",
  "STORAGE_UNAVAILABLE",
  "STORAGE_CAPACITY",
] as const;
export type MarketFailureCode = (typeof marketFailureCodes)[number];
export class MarketFailure extends Error {
  readonly code: MarketFailureCode;
  readonly retryAt?: number;
  readonly originalFailure?: RefreshFailure;
  readonly guardState?: "active" | "abandoned";
  constructor(
    code: MarketFailureCode,
    retryAt?: number,
    originalFailure?: RefreshFailure,
    guardState?: "active" | "abandoned",
  ) {
    super(code);
    this.code = code;
    this.retryAt = retryAt;
    this.originalFailure = originalFailure;
    this.guardState = guardState;
  }
}
export function marketFailure(error: unknown): MarketFailure | undefined {
  if (error instanceof MarketFailure) return error;
  if (
    error instanceof Error &&
    "limitation" in error &&
    marketFailureCodes.includes(error.limitation as MarketFailureCode)
  )
    return new MarketFailure(error.limitation as MarketFailureCode);
  if (error instanceof Error && "code" in error && error.code === "LIMIT")
    return new MarketFailure("SOURCE_LIMIT");
  if (
    error instanceof Error &&
    "code" in error &&
    [
      "AUTH",
      "FORBIDDEN",
      "RATE_LIMIT",
      "UPSTREAM",
      "TIMEOUT",
      "ABORTED",
      "MALFORMED",
      "PAGINATION",
      "CONFIG",
      "BLOCKED",
    ].includes(String(error.code))
  )
    return new MarketFailure("SOURCE_FAILURE");
  if (error instanceof Error && error.message === "CACHE_BUDGET")
    return new MarketFailure("SHARED_BUDGET_EXHAUSTED");
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "MISSING_PRICE"
  )
    return new MarketFailure("MISSING_PRICE");
  if (
    error instanceof Error &&
    marketFailureCodes.includes(error.message as MarketFailureCode)
  )
    return new MarketFailure(error.message as MarketFailureCode);
  return undefined;
}
export function marketErrorMessage(
  code?: string,
  guardState?: "active" | "abandoned",
) {
  if (code === "REFRESH_GUARDED" && guardState === "active")
    return "Market history is being refreshed. Please wait before retrying.";
  if (code === "REFRESH_GUARDED" && guardState === "abandoned")
    return "A previous history refresh was interrupted. History is being recovered.";
  switch (code) {
    case "REFRESH_GUARDED":
      return "Market history is unavailable while an earlier refresh is reviewed. Please try again later.";
    case "EVIDENCE_REVOKED":
    case "SHARED_BUDGET_EXHAUSTED":
    case "CACHE_BUDGET":
    case "TEAM_BUDGET_UNVERIFIED":
    case "STORAGE_CAPACITY":
    case "STORAGE_UNAVAILABLE":
    case "DATA_UNAVAILABLE":
    case "UNVERIFIED_DATA":
      return "We couldn't load market history right now. Please try again later.";
    case "BROWSING_RATE_LIMIT":
    case "REFRESH_BUSY":
    case "REFRESH_COOLDOWN":
    case "DAILY_LIMIT":
      return "Market history is temporarily unavailable. Please try again shortly.";
    case "SHORT_HISTORY":
      return "Confirmed history does not cover the requested period. Choose a shorter period.";
    case "UNSUPPORTED_ACTION":
      return "Corporate-action details for this period could not be validated. This portfolio has not been calculated.";
    case "SOURCE_LIMIT":
    case "SOURCE_FAILURE":
    case "REFRESH_FAILED":
      return "We couldn't load market history right now. Please try again later.";
    case "INSUFFICIENT_COVERAGE":
      return "At least two shared completed sessions with complete coverage are required.";
    case "MISSING_PRICE":
      return "Required market history is missing. A missing bar does not establish a listing date. No estimated returns are substituted.";
    default:
      return undefined;
  }
}
