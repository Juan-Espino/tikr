import "server-only";
export type CatalogMode =
  "sample" | "personal" | "hosted" | "activation-required";
// Presence only: never return environment values or credentials to callers.
export function catalogMode(
  env: Record<string, string | undefined> = process.env,
): CatalogMode {
  if (env.TIKR_MARKET_HOSTED_ORIGIN !== undefined)
    return env.TIKR_HOSTED_DATA_ENABLED === "explicit"
      ? "hosted"
      : "activation-required";
  if (env.TIKR_PERSONAL_DATA_ENABLED === "explicit") return "personal";
  const configured = [
    "TIKR_MARKET_MODE",
    "TIKR_MARKET_EVIDENCE_FILE",
    "TIKR_MARKET_EVIDENCE_SHA256",
    "TIKR_PERSONAL_DATA_ENABLED",
    "TIKR_HOSTED_DATA_ENABLED",
    "TIKR_CONVEX_URL",
    "TIKR_CONVEX_ADMIN_KEY",
    "TIKR_CONVEX_SITE_URL",
    "TIKR_MARKET_GATEWAY_KEY",
    "ALPACA_API_KEY_ID",
    "ALPACA_API_SECRET_KEY",
    "APCA_API_KEY",
    "APCA_API_SECRET",
  ];
  return configured.some((key) => env[key] !== undefined)
    ? "activation-required"
    : "sample";
}
