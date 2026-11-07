// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { diagnose, providerCredentials } from "../src/lib/market-diagnostics";
import { enterHosted } from "../src/lib/market-hosted";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
test("credentials fail closed; legacy works and canonical takes precedence", () => {
  expect(() => providerCredentials({})).toThrow("PROVIDER_NOT_CONFIGURED");
  const legacy = {
    APCA_API_KEY: "synthetic-old",
    APCA_API_SECRET: "synthetic-secret",
  };
  expect(providerCredentials(legacy).keyId).toBe("synthetic-old");
  expect(
    providerCredentials({ ...legacy, ALPACA_API_KEY_ID: "synthetic-new" })
      .keyId,
  ).toBe("synthetic-new");
  expect(() =>
    providerCredentials({ ...legacy, ALPACA_API_KEY_ID: "" }),
  ).toThrow("PROVIDER_NOT_CONFIGURED");
});
test("missing trusted visitor and malformed gateway config make no outgoing requests", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(
    enterHosted(new Request("https://tikr.example")),
  ).rejects.toThrow("VISITOR_REQUIRED");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://wrong.example");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-test-only-00000000000000");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(
    enterHosted(
      new Request("https://tikr.example", {
        headers: { "x-vercel-forwarded-for": "192.0.2.1" },
      }),
    ),
  ).rejects.toThrow("HOSTED_CONFIG");
  expect(fetch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    JSON.stringify({
      event: "market_failure",
      stage: "config",
      code: "HOSTED_CONFIG",
    }),
  );
});
test("diagnostics emit only exact allowlisted codes, never exception content", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  diagnose("calendar", new Error("UPSTREAM secret-canary 192.0.2.1"));
  diagnose("stream", new Error("TIMEOUT"));
  expect(log.mock.calls).toEqual([
    [
      JSON.stringify({
        event: "market_failure",
        stage: "calendar",
        code: "UNKNOWN_FAILURE",
      }),
    ],
    [
      JSON.stringify({
        event: "market_failure",
        stage: "stream",
        code: "TIMEOUT",
      }),
    ],
  ]);
});

test("hosted runtime missing credentials fails before calendar or provider transport", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_HOSTED_DATA_ENABLED", "explicit");
  vi.stubEnv("TIKR_MARKET_MODE", "personal-provisional");
  for (const name of [
    "ALPACA_API_KEY_ID",
    "ALPACA_API_SECRET_KEY",
    "APCA_API_KEY",
    "APCA_API_SECRET",
  ])
    vi.stubEnv(name, undefined);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { openMarket } = await import("../src/lib/market-runtime");
  await expect(
    openMarket({
      portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
      amount: "100",
      range: "1W",
    }),
  ).rejects.toThrow("PROVIDER_NOT_CONFIGURED");
  expect(fetch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    JSON.stringify({
      event: "market_failure",
      stage: "config",
      code: "PROVIDER_NOT_CONFIGURED",
    }),
  );
});
