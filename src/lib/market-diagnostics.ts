import "server-only";
import { AlpacaError } from "./alpaca/adapter.ts";

const codes = new Set([
  "BROWSING_RATE_LIMIT",
  "REFRESH_COOLDOWN",
  "SHARED_BUDGET_EXHAUSTED",
  "TEAM_BUDGET_UNVERIFIED",
  "REFRESH_FAILED",
  "REFRESH_BUSY_OR_LIMITED",
  "CALENDAR_UNAVAILABLE",
  "EVIDENCE_CHANGED",
  "EVIDENCE_EXPIRED",
  "EVIDENCE_REVOKED",
  "MISSING_PRICE",
  "UNSUPPORTED_ACTION",
  "UNVERIFIED_DATA",
  "REVISION_CHANGED",
  "HISTORY_LIMIT",
  "ORIGIN_REJECTED",
  "VISITOR_REQUIRED",
  "HOSTED_CONFIG",
  "PERSONAL_DATA_DISABLED",
  "PROVIDER_NOT_CONFIGURED",
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_UNAVAILABLE",
  "STORAGE_CAPACITY",
  "STORAGE_RESPONSE_LIMIT",
  "REFRESH_GUARDED",
  "CALENDAR_BUSY",
  "CACHE_BUDGET",
  "TIMEOUT",
  "UPSTREAM",
  "LIMIT",
  "MALFORMED",
  "CONFIG",
  "AUTH",
  "FORBIDDEN",
  "RATE_LIMIT",
  "ABORTED",
  "PAGINATION",
  "BLOCKED",
  "DATA_UNAVAILABLE",
  "DATA_NOT_VERIFIED",
  "UNKNOWN_FAILURE",
]);
export type MarketStage =
  "origin" | "admission" | "config" | "calendar" | "runtime" | "stream";
// Never serialize an exception or caller-supplied fields, even on unknown failures.
export function diagnose(stage: MarketStage, error: unknown) {
  const candidate =
    error instanceof AlpacaError
      ? error.code
      : error instanceof Error
        ? error.message
        : error;
  const code =
    typeof candidate === "string" && codes.has(candidate)
      ? candidate
      : "UNKNOWN_FAILURE";
  console.error(JSON.stringify({ event: "market_failure", stage, code }));
}
export function providerCredentials(
  env: Record<string, string | undefined> = process.env,
) {
  const keyId = env.ALPACA_API_KEY_ID ?? env.APCA_API_KEY;
  const secret = env.ALPACA_API_SECRET_KEY ?? env.APCA_API_SECRET;
  if (!keyId || !secret || /\s/.test(keyId) || /\s/.test(secret))
    throw Error("PROVIDER_NOT_CONFIGURED");
  return { keyId, secret };
}
