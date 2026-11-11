// @vitest-environment node
import { test, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("~/lib/catalog-server", () => ({
  availableCatalog: vi.fn(async () => [
    { ticker: "NEW", name: "New Company", exchange: "NASDAQ" },
  ]),
}));
vi.mock("~/lib/market-hosted", () => ({
  hosted: () => false,
  enterHosted: vi.fn(),
  validMarketOrigin: (r: Request) =>
    r.headers.get("origin") === "http://localhost",
}));
import { POST } from "../src/app/api/assets/route";
import { availableCatalog } from "~/lib/catalog-server";
import { MarketFailure } from "../src/lib/market-errors";
const request = (q: string, body?: string) =>
  new Request(`http://localhost/api/assets?q=${encodeURIComponent(q)}`, {
    method: "POST",
    headers: { origin: "http://localhost" },
    ...(body ? { body } : {}),
  });
test("asset route bounds inputs, labels demo, preserves safe rate/budget errors and returns live catalog names", async () => {
  try {
    expect(
      (
        await POST(
          new Request("http://localhost/api/assets", { method: "POST" }),
        )
      ).status,
    ).toBe(403);
    expect((await POST(request("x".repeat(101)))).status).toBe(400);
    expect((await POST(request("NEW", "x"))).status).toBe(400);
    expect(await (await POST(request(""))).json()).toEqual([]);
    vi.stubEnv("TIKR_PERSONAL_DATA_ENABLED", "");
    const demo = await POST(request("Apple"));
    expect(demo.headers.get("X-Tikr-Catalog")).toBe("sample");
    expect((await demo.json())[0].ticker).toBe("AAPL");
    vi.stubEnv("TIKR_PERSONAL_DATA_ENABLED", "explicit");
    expect((await (await POST(request("New Company"))).json())[0].ticker).toBe(
      "NEW",
    );
    vi.mocked(availableCatalog).mockRejectedValueOnce(
      new MarketFailure("BROWSING_RATE_LIMIT", Date.now() + 60000),
    );
    const denied = await POST(request("NEW"));
    expect(denied.status).toBe(429);
    expect(Number(denied.headers.get("Retry-After"))).toBeGreaterThan(0);
    vi.mocked(availableCatalog).mockRejectedValueOnce(
      new MarketFailure("SHARED_BUDGET_EXHAUSTED"),
    );
    expect((await POST(request("NEW"))).status).toBe(503);
  } finally {
    vi.unstubAllEnvs();
  }
});
