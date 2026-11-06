import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("~/lib/market-runtime", () => ({
  openMarket: vi.fn(async () => ({
    initial: { status: "refreshing" },
    settled: Promise.resolve({ status: "ready" }),
  })),
}));
import { POST } from "../src/app/api/market/route";
test("anonymous production request streams results; bounded invalid inputs never reach storage", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv(
    "TIKR_MARKET_GATEWAY_KEY",
    "synthetic-test-key-000000000000000000",
  );
  const fetch = vi.fn(async () => Response.json({ result: null }));
  vi.stubGlobal("fetch", fetch);
  const request = (body: string, origin = "https://tikr.example") =>
    new Request("https://tikr.example/api/market", {
      method: "POST",
      headers: {
        host: "tikr.example",
        origin,
        "content-type": "application/json",
        "x-vercel-forwarded-for": "192.0.2.1",
      },
      body,
    });
  const valid = JSON.stringify({
    portfolios: [{ id: "guest", holdings: [{ symbol: "SPY", weight: "100" }] }],
    amount: "1000",
    range: "1Y",
  });
  try {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"ready"');
    fetch.mockClear();
    expect((await POST(request(valid, "https://evil.example"))).status).toBe(
      403,
    );
    expect((await POST(request("x".repeat(12001)))).status).toBe(413);
    expect((await POST(request(valid.replace("SPY", "UNKNOWN")))).status).toBe(
      400,
    );
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
