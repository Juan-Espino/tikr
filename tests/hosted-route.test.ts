import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("~/lib/market-runtime", () => ({
  openMarket: vi.fn(async () => ({
    initial: { status: "refreshing" },
    settled: Promise.resolve({ status: "ready" }),
  })),
}));
import { POST } from "../src/app/api/market/route";
import { openMarket } from "~/lib/market-runtime";
import { marketErrorMessage } from "../src/lib/market-errors";

test("safe admission errors preserve Retry-After and never leak upstream text", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv(
    "TIKR_MARKET_GATEWAY_KEY",
    "synthetic-route-only-0000000000000000",
  );
  const retryAt = Date.now() + 60000;
  const request = () =>
    new Request("https://tikr.example/api/market", {
      method: "POST",
      headers: {
        host: "tikr.example",
        origin: "https://tikr.example",
        "content-type": "application/json",
        "x-vercel-forwarded-for": "192.0.2.1",
      },
      body: JSON.stringify({
        portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
        amount: "100",
        range: "1Y",
        retry: true,
      }),
    });
  try {
    for (const code of [
      "BROWSING_RATE_LIMIT",
      "SHARED_BUDGET_EXHAUSTED",
      "upstream-private-canary",
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response("private canary", {
              status: 503,
              headers: {
                "X-Tikr-Code": code,
                "X-Tikr-Retry-At": String(retryAt),
              },
            }),
        ),
      );
      const response = await POST(request());
      expect(response.status).toBe(code === "BROWSING_RATE_LIMIT" ? 429 : 503);
      expect(response.headers.get("Retry-After")).toBeTruthy();
      const text = await response.text();
      expect(text).not.toContain("canary");
      expect(text).not.toContain("reference");
      expect(response.headers.get("X-Tikr-Trace")).toBeNull();
      expect(text).toContain(
        code === "upstream-private-canary" ? "STORAGE_UNAVAILABLE" : code,
      );
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ result: null })),
    );
    vi.mocked(openMarket).mockResolvedValueOnce({
      initial: {
        status: "refreshing",
        dataQuality: "reviewed",
        evidenceExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      settled: Promise.resolve({
        status: "blocked",
        code: "REFRESH_COOLDOWN",
        retryAt,
        issues: [{ symbol: "SPY", code: "REFRESH_COOLDOWN" }],
        dataQuality: "reviewed",
        evidenceExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(await response.json()).toMatchObject({
      code: "REFRESH_COOLDOWN",
      retryAt,
      issues: [{ symbol: "SPY", code: "REFRESH_COOLDOWN" }],
    });
    expect(marketErrorMessage("SHARED_BUDGET_EXHAUSTED")).toBe(
      "We couldn't load market history right now. Please try again later.",
    );
    expect(marketErrorMessage("REFRESH_GUARDED")).toContain("earlier refresh");
    expect(marketErrorMessage("REFRESH_GUARDED", "active")).toContain(
      "being refreshed",
    );
    expect(marketErrorMessage("REFRESH_GUARDED", "abandoned")).toContain(
      "interrupted",
    );
    expect(marketErrorMessage("MISSING_PRICE")).not.toBe(
      marketErrorMessage("STORAGE_UNAVAILABLE"),
    );
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
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
    expect(
      (await POST(request(valid.replace("SPY", "../UNKNOWN")))).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    vi.mocked(openMarket).mockRejectedValueOnce(Error("INVALID_INPUT"));
    expect((await POST(request(valid.replace("SPY", "UNKNOWN")))).status).toBe(
      400,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('"op":"leave"'),
      }),
    );
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
