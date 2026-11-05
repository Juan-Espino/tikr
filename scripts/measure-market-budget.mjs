import { getDocumentSize } from "convex/values";
import { assetRecords } from "../src/lib/durable-market.ts";
import { chunks } from "../src/lib/market-storage.ts";
import { capacityModel, storageCharge } from "../src/lib/market-budget.ts";
import { backtest } from "../src/lib/backtest.ts";
import { performance } from "node:perf_hooks";
const days = [];
for (let ms = Date.parse("2020-01-01"); days.length < 1300; ms += 86400000) {
  const d = new Date(ms);
  if (d.getUTCDay() > 0 && d.getUTCDay() < 6)
    days.push(d.toISOString().slice(0, 10));
}
const symbols = ["SPY", "MSFT", "NVDA", "AAPL", "AMZN", "SCHD"];
const calendar = {
  complete: true,
  finalityVerified: true,
  provenance: "synthetic sizing calendar, not an exchange calendar",
  from: days[0],
  through: days.at(-1),
  sessions: days,
};
const results = [];
for (const stress of [false, true]) {
  const assets = symbols.map((symbol, index) => ({
    symbol,
    firstAvailable: days[0],
    from: days[0],
    through: days.at(-1),
    complete: true,
    inceptionVerified: true,
    pricesComplete: true,
    actionsComplete: true,
    accessComplete: true,
    priceBasis: "raw",
    provenance: "synthetic capacity inputs, not market observations",
    prices: Object.fromEntries(
      days.map((d, i) => [
        d,
        stress
          ? `123456789012345678.${String(i * 97 + index * 739).padStart(18, "0")}`
          : (100 + index * 2 + (i % 500) * 0.01).toFixed(2),
      ]),
    ),
    actions: Array.from({ length: stress ? 40 : 20 }, (_, i) => ({
      id: `synthetic-${i}`.padEnd(stress ? 128 : 36, "x"),
      type: "dividend",
      date: days[10 + i * (stress ? 30 : 60)],
      paymentDate: days[20 + i * (stress ? 30 : 60)],
      amount: stress ? "1.123456789012345678" : "1.12",
      basis: "postSplit",
    })),
  }));
  const records = assetRecords(assets[0]);
  const sizes = records.map((r) =>
    getDocumentSize({ ...r, checkedAt: 0, cost: 0 }),
  );
  const sourceBytes = sizes.reduce((a, b) => a + b, 0),
    sourceChargedBytes = sizes.reduce((a, b) => a + storageCharge(b), 0),
    headBytes = sizes.at(-1);
  const started = performance.now();
  const result = backtest({
    calendar,
    assets,
    portfolios: [0, 1, 2].map((i) => ({
      id: `portfolio-${i}`,
      holdings: [
        { symbol: symbols[i * 2], weight: "50" },
        { symbol: symbols[i * 2 + 1], weight: "50" },
      ],
    })),
    start: days[0],
    end: days.at(-1),
    amount: "10000",
  });
  const calculationMs = Math.round(performance.now() - started);
  const saved = {
    identity: "a".repeat(64),
    cycle: "2026-11-04",
    calendar: "b".repeat(64),
    validUntil: 1794000000000,
    view: {
      status: "ready",
      result,
      asOf: days.at(-1),
      dataCheckedAt: "2026-11-04T14:00:00Z",
      dataRevisions: Object.fromEntries(
        symbols.map((s) => [s, "c".repeat(64)]),
      ),
    },
  };
  const resultRows = chunks("result:slot0", saved);
  const resultSizes = resultRows.map((r) =>
    getDocumentSize({ ...r, checkedAt: 0, cost: 0 }),
  );
  const chartBytes = resultSizes.reduce((a, b) => a + b, 0),
    resultChargedBytes = resultSizes.reduce((a, b) => a + storageCharge(b), 0);
  const scenarios = [1, 5, 20].map((users) => ({
    users,
    opensPerDay: 10,
    ...capacityModel({
      assets: 6,
      sessions: 1300,
      users,
      opensPerDay: 10,
      chartBytes,
      sourceBytes,
      headBytes,
      cacheHitsPercent: 70,
      sourceChargedBytes,
      resultChargedBytes,
    }),
  }));
  results.push({
    sample: stress
      ? "long-decimal-distribution-stress"
      : "representative-synthetic",
    sessions: 1300,
    assets: 6,
    sourceDocuments: records.length,
    sourceBytes,
    headBytes,
    maxDocumentBytes: Math.max(...sizes),
    sourceChargedBytes,
    uncompressedResultBytes: Buffer.byteLength(JSON.stringify(saved)),
    compressedResultBytes: chartBytes,
    resultChargedBytes,
    mainCalculationMs: calculationMs,
    scenarios,
  });
}
console.log(
  JSON.stringify(
    {
      scope:
        "Actual Convex-value and engine-result sizing; conservative traffic forecast, NOT deployed billing measurements",
      convexActionGbHours: 0,
      nextComputeNote:
        "Engine executes in Next.js. Timing above is local single-run wall time, not a Vercel cost bound.",
      results,
    },
    null,
    2,
  ),
);
if (results.some((r) => !r.scenarios[0].fits)) process.exitCode = 1;
