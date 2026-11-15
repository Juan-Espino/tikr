// @vitest-environment node
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../convex/**/*.ts");
test("actual hosted loader/coordinator/stream: Sunday, coalescing, rejected cache retry, restart and holiday", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-15T15:00Z"));
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 30 * 86400000,
  });
  for (const [k, v] of Object.entries({
    NODE_ENV: "production",
    TIKR_HOSTED_DATA_ENABLED: "explicit",
    TIKR_MARKET_MODE: "personal-provisional",
    TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
    TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
    TIKR_MARKET_GATEWAY_KEY: "synthetic-calendar-only-000000000000",
    ALPACA_API_KEY_ID: "synthetic",
    ALPACA_API_SECRET_KEY: "synthetic",
  }))
    vi.stubEnv(k, v);
  let calendars = 0,
    bars = 0,
    malformed = true;
  let dates = ["2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13"];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname === "synthetic.convex.site")
        return t.fetch(url.pathname, init);
      if (url.pathname === "/v2/assets")
        return Response.json(
          ["AAA", "BBB", "SPY"].map((symbol) => ({
            symbol,
            name: symbol,
            exchange: "NASDAQ",
            status: "active",
            class: "us_equity",
            tradable: true,
          })),
        );
      if (url.pathname === "/v2/calendar") {
        calendars++;
        return malformed
          ? new Response("[truncated")
          : Response.json(dates.map((date) => ({ date })));
      }
      if (url.pathname === "/v2/stocks/bars") {
        bars++;
        return Response.json({
          bars: Object.fromEntries(
            url.searchParams
              .get("symbols")!
              .split(",")
              .map((s) => [
                s,
                dates
                  .map((d, i) => ({ t: d + "T05:00:00Z", c: 100 + i }))
                  .filter(
                    (b) =>
                      b.t.slice(0, 10) >=
                        url.searchParams.get("start")!.slice(0, 10) &&
                      b.t.slice(0, 10) <=
                        url.searchParams.get("end")!.slice(0, 10),
                  ),
              ]),
          ),
          next_page_token: null,
        });
      }
      if (url.pathname === "/v1/corporate-actions")
        return Response.json({ corporate_actions: {}, next_page_token: null });
      throw Error("Unexpected fixture destination");
    }),
  );
  const input = {
    portfolios: [
      { id: "a", holdings: [{ symbol: "AAA", weight: "100" }] },
      { id: "b", holdings: [{ symbol: "BBB", weight: "100" }] },
    ],
    range: "1W",
    amount: "1000",
  };
  try {
    vi.resetModules();
    const { POST } = await import("../src/app/api/market/route");
    const request = () =>
      new Request("https://tikr.example/api/market", {
        method: "POST",
        headers: {
          host: "tikr.example",
          origin: "https://tikr.example",
          "content-type": "application/json",
          "x-vercel-forwarded-for": "192.0.2.1",
        },
        body: JSON.stringify(input),
      });
    const bad = await POST(request());
    expect(bad.status).toBe(503);
    expect(bars).toBe(0);
    malformed = false;
    const responses = await Promise.all([POST(request()), POST(request())]);
    for (const response of responses) {
      expect(response.status).toBe(200);
      const lines = (await response.text())
        .trim()
        .split("\n")
        .map((s) => JSON.parse(s));
      expect(lines[0].status).toMatch(/refreshing|ready/);
      expect(lines.at(-1)).toMatchObject({
        status: "ready",
        period: { end: "2026-11-13" },
      });
      expect(lines.at(-1).series).toHaveLength(3);
    }
    expect(calendars).toBe(2); // rejected promise cleared; overlapping calls coalesced
    await (await POST(request())).text();
    expect(calendars).toBe(2);
    vi.resetModules();
    const restarted = await import("../src/app/api/market/route");
    expect(await (await restarted.POST(request())).text()).toContain(
      '"status":"ready"',
    );
    expect(calendars).toBe(3);
    // Synthetic Friday closure, followed by a holiday weekend. No hand-coded production calendar.
    dates = [...dates, "2026-11-23", "2026-11-24", "2026-11-25"];
    vi.setSystemTime(new Date("2026-11-29T15:00Z"));
    const holiday = await restarted.POST(request());
    const final = JSON.parse((await holiday.text()).trim().split("\n").at(-1)!);
    expect(final).toMatchObject({
      status: "ready",
      period: { end: "2026-11-25" },
    });
    expect(calendars).toBe(4);
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  }
});
