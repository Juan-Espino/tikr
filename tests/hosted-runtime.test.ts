// @vitest-environment node
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/market-admission.ts", () => ({
  localAdmission: () => {
    throw Error("Hosted runtime used local admission");
  },
}));
const modules = import.meta.glob("../convex/**/*.ts");

test("complete hosted runtime shares calendar and results across cold hosts and refreshes at the next cycle", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-06T14:00:00Z"));
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 3 * 86400000,
  });
  for (const [name, value] of Object.entries({
    NODE_ENV: "production",
    TIKR_HOSTED_DATA_ENABLED: "explicit",
    TIKR_MARKET_MODE: "personal-provisional",
    TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
    TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
    TIKR_MARKET_GATEWAY_KEY: "synthetic-test-only-00000000000000",
    ALPACA_API_KEY_ID: "synthetic",
    ALPACA_API_SECRET_KEY: "synthetic",
  }))
    vi.stubEnv(name, value);
  let catalogUnavailable = false;
  let calendarCalls = 0,
    barCalls = 0;
  let holdResultRead = false,
    scope = "";
  let notifyRead!: () => void, releaseRead!: () => void;
  const readStarted = new Promise<void>((resolve) => {
    notifyRead = resolve;
  });
  const readReleased = new Promise<void>((resolve) => {
    releaseRead = resolve;
  });
  let days = ["2026-11-04", "2026-11-05"];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/v2/assets" && catalogUnavailable)
        throw Error("Synthetic catalog outage");
      if (url.pathname === "/v2/assets")
        return Response.json(
          ["NEW", "SPY", "AAPL", "MSFT", "AMZN", "SCHD", "NVDA"].map(
            (symbol) => ({
              symbol,
              name: symbol,
              exchange: "NASDAQ",
              status: "active",
              class: "us_equity",
              tradable: true,
            }),
          ),
        );

      if (url.hostname === "synthetic.convex.site") {
        const operation = JSON.parse(String(init?.body));
        if (
          operation.name === "control" &&
          operation.args.op === "check" &&
          operation.args.symbols.length
        )
          scope = operation.args.scope;
        const response = await t.fetch(url.pathname, init);
        if (
          holdResultRead &&
          operation.name === "read" &&
          operation.args.keys.some((k: string) => k.startsWith("result:"))
        ) {
          holdResultRead = false;
          notifyRead();
          await readReleased;
        }
        return response;
      }
      if (url.pathname === "/v2/calendar") {
        calendarCalls++;
        return Response.json(days.map((date) => ({ date })));
      }
      if (url.pathname === "/v2/stocks/bars") {
        barCalls++;
        return Response.json({
          bars: {
            [url.searchParams.get("symbols")!]: days.map((date, i) => ({
              t: date + "T05:00:00Z",
              c: 100 + i,
            })),
          },
          next_page_token: null,
        });
      }
      if (url.pathname === "/v1/corporate-actions")
        return Response.json({ corporate_actions: {}, next_page_token: null });
      throw Error("Unexpected network destination");
    }),
  );
  const request = {
    portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
    amount: "100",
    range: "1W" as const,
  };
  const openHost = async () => {
    vi.resetModules();
    const { openMarket } = await import("../src/lib/market-runtime");
    return (await openMarket(request)).settled;
  };
  try {
    const first = await openHost();
    expect(first.status).toBe("ready");
    expect(first.series?.[0]?.ending).toBe("101.00");
    const second = await openHost();
    expect(second.series).toEqual(first.series);
    expect(calendarCalls).toBe(1);
    expect(barCalls).toBe(1);
    // More distinct calculations than result slots: collisions only skip persistence.
    for (let i = 101; i <= 117; i++) {
      request.amount = String(i);
      expect((await openHost()).status).toBe("ready");
    }
    request.amount = "100";
    expect(barCalls).toBe(1);
    days = [...days, "2026-11-06"];
    vi.setSystemTime(new Date("2026-11-07T14:00:00Z"));
    const next = await openHost();
    expect(next.status).toBe("ready");
    expect(next.period?.end).toBe("2026-11-06");
    expect(calendarCalls).toBe(2);
    expect(barCalls).toBe(2);
    const originalHoldings = request.portfolios[0]!.holdings;
    request.portfolios[0]!.holdings = [{ symbol: "NEW", weight: "100" }];
    const expanded = await openHost();
    expect(expanded.status).toBe("ready");
    expect(expanded.series?.[0]?.ending).toBe("102.00");
    request.portfolios[0]!.holdings = [{ symbol: "NOTLISTED", weight: "100" }];
    await expect(openHost()).rejects.toThrow("INVALID_INPUT");
    request.portfolios[0]!.holdings = originalHoldings;
    catalogUnavailable = true;
    vi.setSystemTime(Date.now() + 61000);
    await t.run(async (ctx) => {
      for (const row of await ctx.db.query("marketEntries").collect())
        if (row.key.startsWith("catalog:"))
          await ctx.db.patch(row._id, { checkedAt: 0 });
    });
    expect((await openHost()).status).toBe("ready");
    catalogUnavailable = false;
    await t.run(async (ctx) => {
      for (const row of await ctx.db.query("marketEntries").collect())
        if (row.key.startsWith("catalog:"))
          await ctx.db.patch(row._id, { checkedAt: Date.now() });
    });
    holdResultRead = true;
    const inFlight = openHost();
    await readStarted;
    expect(scope).toMatch(/^[a-f0-9]{64}$/);
    await t.mutation(makeFunctionReference<"mutation">("hosted:control"), {
      op: "revoke",
      scope,
      token: crypto.randomUUID(),
      symbols: [],
      bucket: 0,
    });
    releaseRead();
    await expect(inFlight).rejects.toThrow("EVIDENCE_REVOKED");
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  }
});
