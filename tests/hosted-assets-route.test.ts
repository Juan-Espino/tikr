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
import { GET, POST } from "../src/app/api/assets/route";
import { availableCatalog } from "~/lib/catalog-server";
import { catalogMode } from "../src/lib/catalog-mode";
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
    vi.stubEnv("TIKR_PERSONAL_DATA_ENABLED", undefined);
    const demo = await POST(request("Apple"));
    expect(demo.headers.get("X-Tikr-Catalog")).toBe("sample");
    expect((await demo.json())[0].ticker).toBe("AAPL");
    expect(await GET().json()).toEqual({ mode: "sample" });
    const missing = await POST(request("Palantir"));
    expect(missing.headers.get("X-Tikr-Catalog")).toBe("sample");
    expect(await missing.json()).toEqual([]);
    expect(await (await POST(request("PLTR"))).json()).toEqual([]);
    vi.stubEnv("ALPACA_API_KEY_ID", "synthetic");
    expect(await GET().json()).toEqual({ mode: "activation-required" });
    const disabled = await POST(request("PLTR"));
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toEqual({ code: "CATALOG_NOT_ENABLED" });
    expect(availableCatalog).not.toHaveBeenCalled();
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
    vi.mocked(availableCatalog).mockResolvedValue([
      {
        ticker: "PLTR",
        name: "Palantir Technologies Inc.",
        exchange: "NASDAQ",
      },
    ]);
    for (const q of ["p", "pa", "pala", "palantir", "PLTR"]) {
      const response = await POST(request(q));
      expect(response.headers.get("X-Tikr-Catalog")).toBe("personal");
      expect(await response.json()).toEqual([
        {
          ticker: "PLTR",
          name: "Palantir Technologies Inc.",
          exchange: "NASDAQ",
        },
      ]);
    }
  } finally {
    vi.unstubAllEnvs();
  }
});

test("mode detection inspects presence without enabling upstream work", () => {
  expect(catalogMode({})).toBe("sample");
  for (const name of [
    "ALPACA_API_KEY_ID",
    "APCA_API_SECRET",
    "TIKR_CONVEX_URL",
    "TIKR_CONVEX_ADMIN_KEY",
    "TIKR_PERSONAL_DATA_ENABLED",
  ]) {
    expect(catalogMode({ [name]: "" })).toBe("activation-required");
    expect(catalogMode({ [name]: "synthetic" })).toBe("activation-required");
  }
  expect(catalogMode({ TIKR_PERSONAL_DATA_ENABLED: "explicit" })).toBe(
    "personal",
  );
  expect(
    catalogMode({
      TIKR_MARKET_HOSTED_ORIGIN: "",
      TIKR_PERSONAL_DATA_ENABLED: "explicit",
    }),
  ).toBe("activation-required");
  expect(
    catalogMode({
      TIKR_MARKET_HOSTED_ORIGIN: "synthetic",
      TIKR_HOSTED_DATA_ENABLED: "explicit",
    }),
  ).toBe("hosted");
});
