// Public, bounded failure vocabulary. Never forward upstream exception text.
export const marketFailureCodes = [
  "CATALOG_NOT_ENABLED",
  "CATALOG_PROVIDER",
  "CATALOG_INVALID",
  "CATALOG_LIMIT",
  "CATALOG_UNAVAILABLE",
  "BROWSING_RATE_LIMIT",
  "REFRESH_COOLDOWN",
  "SHARED_BUDGET_EXHAUSTED",
  "TEAM_BUDGET_UNVERIFIED",
  "REFRESH_GUARDED",
  "EVIDENCE_REVOKED",
  "MISSING_PRICE",
  "DATA_UNAVAILABLE",
  "STORAGE_UNAVAILABLE",
  "STORAGE_CAPACITY",
] as const;
export type MarketFailureCode = (typeof marketFailureCodes)[number];
export class MarketFailure extends Error {
  readonly code: MarketFailureCode;
  readonly retryAt?: number;
  constructor(code: MarketFailureCode, retryAt?: number) {
    super(code);
    this.code = code;
    this.retryAt = retryAt;
  }
}
export function marketFailure(error: unknown): MarketFailure | undefined {
  if (error instanceof MarketFailure) return error;
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
export function marketErrorMessage(code?: string) {
  switch (code) {
    case "BROWSING_RATE_LIMIT":
      return "Browsing is temporarily rate limited. Please wait before opening more results.";
    case "REFRESH_COOLDOWN":
      return "Market history refresh is cooling down. Please wait before retrying.";
    case "SHARED_BUDGET_EXHAUSTED":
    case "CACHE_BUDGET":
      return "The shared market-data budget is exhausted. More browsing or retries cannot refresh it.";
    case "TEAM_BUDGET_UNVERIFIED":
      return "Market data is paused until the shared budget review is renewed.";
    case "STORAGE_CAPACITY":
      return "Market-data storage capacity is exhausted. Operator review is needed.";
    case "MISSING_PRICE":
      return "Required market history is missing. No estimated returns are substituted.";
    default:
      return undefined;
  }
}
