// Public, bounded failure vocabulary. Never forward upstream exception text.
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
  constructor(code: MarketFailureCode, retryAt?: number) {
    super(code);
    this.code = code;
    this.retryAt = retryAt;
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
export function marketErrorMessage(code?: string) {
  switch (code) {
    case "BROWSING_RATE_LIMIT":
      return "Browsing is temporarily rate limited. Please wait before opening more results.";
    case "REFRESH_BUSY":
      return "Other data requests are still running. Please retry when they finish.";
    case "REFRESH_COOLDOWN":
      return "Market history refresh is cooling down. Please wait before retrying.";
    case "SHARED_BUDGET_EXHAUSTED":
    case "CACHE_BUDGET":
      return "The shared market-data budget is exhausted. More browsing or retries cannot refresh it.";
    case "TEAM_BUDGET_UNVERIFIED":
      return "Market data is paused until the shared budget review is renewed.";
    case "STORAGE_CAPACITY":
      return "Market-data storage capacity is exhausted. Operator review is needed.";
    case "SHORT_HISTORY":
      return "Confirmed history does not cover the requested period. Choose a shorter period.";
    case "UNSUPPORTED_ACTION":
      return "A corporate action in this period cannot be modeled safely. Choose a period after the event.";
    case "SOURCE_LIMIT":
      return "The source response exceeded a bounded processing limit. Try a shorter period; no partial result is shown.";
    case "DAILY_LIMIT":
      return "The history refresh attempt limit for this cycle has been reached. Retry after the next eligible cycle.";
    case "SOURCE_FAILURE":
    case "REFRESH_FAILED":
      return "The history source could not complete this request. The underlying cause is unknown; retry later.";
    case "UNVERIFIED_DATA":
      return "Required history or action coverage could not be established. The underlying cause is unknown.";
    case "INSUFFICIENT_COVERAGE":
      return "At least two shared completed sessions with complete coverage are required.";
    case "MISSING_PRICE":
      return "Required market history is missing. A missing bar does not establish a listing date. No estimated returns are substituted.";
    default:
      return undefined;
  }
}
