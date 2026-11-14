import test from "node:test";
import assert from "node:assert/strict";
import { createOnDemandBacktests } from "../src/lib/market-cache.ts";
import { preset } from "../src/lib/backtest.ts";
const symbols = ["NVDA", "AMD", "ASML", "TSM", "SPY"];
const sessions = [];
for (
  let at = Date.parse("2021-11-01");
  at <= Date.parse("2026-11-12");
  at += 86400000
) {
  const d = new Date(at);
  if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
    sessions.push(d.toISOString().slice(0, 10));
}
const calendar = {
  from: sessions[0],
  through: sessions.at(-1),
  sessions,
  complete: true,
  finalityVerified: true,
  provenance: "synthetic weekday calendar; not exchange evidence",
};
const holdings = symbols
  .slice(0, 4)
  .map((symbol) => ({ symbol, weight: "25" }));
function fixture() {
  let calls = 0;
  const cache = createOnDemandBacktests({
    supportedSymbols: symbols,
    historyStart: calendar.from,
    calendar: () => calendar,
    clock: () => new Date("2026-11-13T14:00:00Z"),
    load: async (q) => {
      calls++;
      return {
        feed: "sip",
        asset: {
          symbol: q.symbol,
          firstAvailable: calendar.from,
          from: q.from,
          through: q.through,
          complete: true,
          inceptionVerified: true,
          pricesComplete: true,
          actionsComplete: true,
          accessComplete: true,
          priceBasis: "raw",
          provenance: "synthetic USD per traded share, not provider evidence",
          prices: Object.fromEntries(
            sessions
              .filter((d) => d >= q.from && d <= q.through)
              .map((d) => [
                d,
                q.symbol === "NVDA" && d >= "2024-06-10" ? "50" : "100",
              ]),
          ),
          actions: [
            ...(q.symbol === "NVDA"
              ? [
                  {
                    id: "split",
                    type: "split",
                    date: "2024-06-10",
                    numerator: "2",
                    denominator: "1",
                  },
                ]
              : []),
            ...(["ASML", "TSM"].includes(q.symbol)
              ? [
                  {
                    id: "div",
                    type: "dividend",
                    date: "2026-10-27",
                    paymentDate: "2026-11-04",
                    amount: "0.1",
                    basis: "postSplit",
                  },
                ]
              : []),
          ].filter((a) => a.date >= q.from && a.date <= q.through),
        },
      };
    },
  });
  return { cache, calls: () => calls };
}
for (const [range, start, ending] of [
  ["1W", "2026-11-05", "1000"],
  ["1Y", "2025-11-12", "1000.5"],
  ["5Y", "2021-11-12", "1000.5"],
])
  test(`synthetic full AI ${range}: full holdings, no shortening, independent split/cash oracle`, async () => {
    const f = fixture();
    const request = {
      portfolios: [{ id: "ai", holdings }],
      amount: "1000",
      ...preset(calendar, range),
      end: "latest",
    };
    const ready = await f.cache.open(request).settled;
    assert.equal(ready.status, "ready");
    assert.equal(ready.result.actual.start, start);
    assert.equal(ready.result.actual.end, "2026-11-12");
    assert.equal(ready.result.portfolios[0].ending, ending);
    assert.equal(ready.result.benchmark.ending, "1000");
    assert.equal(f.calls(), 5);
    const again = await f.cache.open(request).settled;
    assert.equal(again.status, "ready");
    assert.equal(f.calls(), 5);
    assert.deepEqual(
      ready.result.portfolios[0].points.map((p) => p.date),
      ready.result.benchmark.points.map((p) => p.date),
    );
  });
