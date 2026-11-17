// @vitest-environment node
import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
test("hosted guard deadline starts no control RPC after expiry and no source work", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-17T15:00:00Z"));
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    TIKR_HOSTED_DATA_ENABLED: "explicit",
    TIKR_MARKET_MODE: "personal-provisional",
    TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
    TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
    TIKR_MARKET_GATEWAY_KEY: "synthetic-deadline-test-00000000000",
    ALPACA_API_KEY_ID: "synthetic",
    ALPACA_API_SECRET_KEY: "synthetic",
  }))
    vi.stubEnv(key, value);
  const checks: number[] = [];
  const start = performance.now();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input, init) => {
      const input = JSON.parse(String(init?.body));
      expect(input.name).toBe("control");
      expect(input.args.op).toBe("check");
      checks.push(performance.now() - start);
      return new Response(null, {
        status: 503,
        headers: {
          "X-Tikr-Code": "REFRESH_GUARDED",
          "X-Tikr-Guard-State": "active",
        },
      });
    }),
  );
  try {
    const { openMarket } = await import("../src/lib/market-runtime");
    const result = openMarket({
      portfolios: [
        { id: "deadline", holdings: [{ symbol: "SPY", weight: "100" }] },
      ],
      amount: "1000",
      range: "YTD",
    }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(45001);
    const failure = await result;
    expect(failure).toMatchObject({ code: "REFRESH_TIMEOUT" });
    expect(checks.length).toBeGreaterThan(1);
    expect(checks.length).toBeLessThan(30);
    expect(checks.every((at) => at < 45000)).toBe(true);
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
