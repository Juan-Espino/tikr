// @vitest-environment node
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../convex/**/*.ts");

test("instrumented six-asset fresh and cached hosted operations (synthetic, not platform billing)", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-10T14:00:00Z"));
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  for (const [name, value] of Object.entries({
    NODE_ENV: "production",
    TIKR_HOSTED_DATA_ENABLED: "explicit",
    TIKR_MARKET_MODE: "personal-provisional",
    TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
    TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
    TIKR_MARKET_GATEWAY_KEY: "synthetic-operations-only-0000000000",
    ALPACA_API_KEY_ID: "synthetic",
    ALPACA_API_SECRET_KEY: "synthetic",
  }))
    vi.stubEnv(name, value);
  const symbols = ["NVDA", "MSFT", "AAPL", "AMZN", "SCHD"];
  const days: string[] = [];
  for (let ms = Date.parse("2026-11-09"); days.length < 1280; ms -= 86400000) {
    const date = new Date(ms);
    if (date.getUTCDay() > 0 && date.getUTCDay() < 6)
      days.unshift(date.toISOString().slice(0, 10));
  }
  type Metrics = {
    operations: Record<string, number>;
    requestBytes: number;
    responseBytes: number;
    providerCalls: number;
    providerResponseBytes: number;
  };
  const empty = (): Metrics => ({
    operations: {},
    requestBytes: 0,
    responseBytes: 0,
    providerCalls: 0,
    providerResponseBytes: 0,
  });
  let metrics = empty();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.hostname === "synthetic.convex.site") {
        const body = String(init?.body);
        const operation = JSON.parse(body);
        const name: string =
          operation.name === "control"
            ? `control:${operation.args.op}`
            : operation.name;
        metrics.operations[name] = (metrics.operations[name] ?? 0) + 1;
        metrics.requestBytes += Buffer.byteLength(body);
        const response = await t.fetch(url.pathname, init);
        metrics.responseBytes += (
          await response.clone().arrayBuffer()
        ).byteLength;
        return response;
      }
      let value: unknown;
      if (url.pathname === "/v2/assets")
        value = ["SPY", "AAPL", "MSFT", "AMZN", "SCHD", "NVDA"].map(
          (symbol) => ({
            symbol,
            name: symbol,
            exchange: "NASDAQ",
            status: "active",
            class: "us_equity",
            tradable: true,
          }),
        );
      else if (url.pathname === "/v2/calendar")
        value = days.map((date) => ({ date }));
      else if (url.pathname === "/v2/stocks/bars") {
        const selected = url.searchParams.get("symbols")!.split(",");
        selected.forEach((symbol) =>
          expect([...symbols, "SPY"]).toContain(symbol),
        );
        value = {
          bars: Object.fromEntries(
            selected.map((symbol) => [
              symbol,
              days.map((date, i) => ({
                t: `${date}T05:00:00Z`,
                c: 100 + (i % 500) / 100,
              })),
            ]),
          ),
          next_page_token: null,
        };
      } else if (url.pathname === "/v1/corporate-actions")
        value = { corporate_actions: {}, next_page_token: null };
      else throw Error("Unexpected synthetic destination");
      metrics.providerCalls++;
      const response = Response.json(value);
      metrics.providerResponseBytes += (
        await response.clone().arrayBuffer()
      ).byteLength;
      return response;
    }),
  );
  const requestBody: import("../src/lib/market-contract").MarketRequest = {
    portfolios: [
      {
        id: "six-asset",
        holdings: symbols.map((symbol) => ({ symbol, weight: "20" })),
      },
    ],
    amount: "10000",
    range: "5Y",
  };
  const open = async () => {
    vi.resetModules(); // A cold Next host must consult shared storage every time.
    const { POST } = await import("../src/app/api/market/route");
    const before = (await t.run((ctx) =>
      ctx.db.query("marketBudget").first(),
    ))!;
    const response = await POST(
      new Request("https://tikr.example/api/market", {
        method: "POST",
        headers: {
          host: "tikr.example",
          origin: "https://tikr.example",
          "content-type": "application/json",
          "x-vercel-forwarded-for": "192.0.2.1",
        },
        body: JSON.stringify(requestBody),
      }),
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    const final = JSON.parse(text.trim().split("\n").at(-1)!);
    expect(final.status).toBe("ready");
    if (final.history?.length) requestBody.history = final.history;
    expect(final.series[0].points.length).toBe(1280);
    const after = (await t.run((ctx) => ctx.db.query("marketBudget").first()))!;
    return {
      ...metrics,
      applicationResponseBytes: Buffer.byteLength(text),
      admissionCalls: after.calls - before.calls,
      admissionIoBytes: after.io - before.io,
    };
  };
  try {
    const fresh = await open();
    expect(fresh.providerCalls).toBe(4);
    metrics = empty();
    const cached = await open();
    expect(cached.providerCalls).toBe(1); // calendar refetched after host restart
    expect(cached.operations["control:check"]).toBeGreaterThanOrEqual(2);
    expect(cached.admissionIoBytes).toBeGreaterThan(0);
    expect(cached.admissionIoBytes).toBeLessThan(fresh.admissionIoBytes);
    console.log(
      "SYNTHETIC_MARKET_OPERATIONS " +
        JSON.stringify({ sessions: 1280, assets: 6, fresh, cached }),
    );
    for (let i = 0; i < 12; i++) {
      metrics = empty();
      expect((await open()).providerCalls).toBe(1);
    }
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  }
}, 30000);
