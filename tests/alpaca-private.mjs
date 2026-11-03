import { fetchCandidates } from "../src/lib/alpaca/adapter.ts";

const {
  ALPACA_KEY_ID,
  ALPACA_SECRET_KEY,
  ALPACA_PRIVATE_VALIDATION,
  ALPACA_SYMBOLS,
  ALPACA_START,
  ALPACA_END,
  ALPACA_FEED,
} = process.env;
if (
  ALPACA_PRIVATE_VALIDATION !== "explicit" ||
  !ALPACA_KEY_ID ||
  !ALPACA_SECRET_KEY ||
  !ALPACA_SYMBOLS ||
  !ALPACA_START ||
  !ALPACA_END ||
  !["sip", "iex"].includes(ALPACA_FEED)
) {
  console.error(
    "Blocked: explicitly configure private validation, credentials, symbols, dates, and feed in this process environment.",
  );
  process.exit(1);
}
try {
  const result = await fetchCandidates(
    { keyId: ALPACA_KEY_ID, secret: ALPACA_SECRET_KEY },
    {
      symbols: ALPACA_SYMBOLS.split(","),
      start: ALPACA_START,
      end: ALPACA_END,
      feed: ALPACA_FEED,
    },
  );
  console.log(
    JSON.stringify({
      symbols: result.symbols,
      barCounts: Object.fromEntries(
        result.symbols.map((s) => [s, Object.keys(result.prices[s]).length]),
      ),
      actionCount: result.actions.length,
      evidence: result.evidence,
    }),
  );
} catch (e) {
  console.error(
    `Private validation failed: ${typeof e?.code === "string" ? e.code : "UNKNOWN"}`,
  );
  process.exitCode = 1;
}
