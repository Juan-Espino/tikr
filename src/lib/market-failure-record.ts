// Shared bounded diagnostic vocabulary; no exception text or financial payloads.
export const refreshStages = [
  "cache",
  "guard",
  "source",
  "validation",
  "storage-read",
  "storage-write",
] as const;
export const refreshCodes = [
  "CACHE_CONTENT_UNAVAILABLE",
  "AUTH",
  "FORBIDDEN",
  "RATE_LIMIT",
  "UPSTREAM",
  "TIMEOUT",
  "ABORTED",
  "PAGINATION",
  "MALFORMED",
  "LIMIT",
  "MISSING_PRICE",
  "UNSUPPORTED_ACTION",
  "EVIDENCE_CHANGED",
  "UNVERIFIED_DATA",
  "STORAGE_UNAVAILABLE",
  "STORAGE_CAPACITY",
  "SHARED_BUDGET_EXHAUSTED",
  "LEASE_LOST",
  "REVISION_CHANGED",
  "UNKNOWN_FAILURE",
] as const;
export type RefreshFailure = {
  trace: string;
  at: number;
  stage: (typeof refreshStages)[number];
  code: (typeof refreshCodes)[number];
};
export function validRefreshFailure(value: unknown): value is RefreshFailure {
  if (!value || typeof value !== "object") return false;
  const v = value as RefreshFailure;
  return (
    Object.keys(v).length === 4 &&
    /^[a-f0-9-]{36}$/.test(v.trace) &&
    Number.isSafeInteger(v.at) &&
    v.at > 0 &&
    refreshStages.includes(v.stage) &&
    refreshCodes.includes(v.code)
  );
}
