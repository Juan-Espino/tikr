// Explicit local API acceptance only. Never reads credentials or changes portfolio definitions.
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
if (!process.argv.includes("--live"))
  throw Error("Use --live to authorize admitted development requests.");
const origin = new URL(
  process.env.TIKR_ACCEPTANCE_URL ?? "http://127.0.0.1:5001",
);
if (!["127.0.0.1", "localhost"].includes(origin.hostname))
  throw Error("Loopback only");
const folder = await mkdtemp(join(tmpdir(), "tikr-market-matrix-"));
const results = [],
  ranges = ["1W", "1M", "YTD", "1Y", "5Y"];
const symbols = ["SPY", "SCHD", "PLTR", "RTX", "BA", "MSFT", "AAPL", "NVDA"];
const ledgerFile = join(
  process.env.LOCALAPPDATA,
  "Tikr",
  "market-admission",
  "ledger.json",
);
const before = JSON.parse(await readFile(ledgerFile, "utf8"));
let calls = 0;
async function query(portfolios, range, amount = "10000") {
  if (++calls > 100) throw Error("Acceptance request bound exceeded");
  const started = Date.now();
  const response = await fetch(new URL("/api/market", origin), {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin.origin },
    body: JSON.stringify({ portfolios, range, amount }),
    signal: AbortSignal.timeout(60000),
  });
  const lines = (await response.text()).trim().split("\n").map(JSON.parse);
  const final = lines.at(-1);
  return { http: response.status, ms: Date.now() - started, final };
}
function validate(view, portfolios, amount) {
  assert.equal(
    view.status,
    "ready",
    JSON.stringify({ code: view.code, issues: view.issues }),
  );
  assert.equal(view.dataQuality, "personal-provisional");
  assert.ok(view.asOf && view.dataCheckedAt && view.evidenceExpiresAt);
  assert.equal(view.series.length, portfolios.length + 1);
  const benchmark = view.series.find((s) => s.id === "SPY");
  assert.ok(benchmark && benchmark.points.length >= 2);
  const dates = benchmark.points.map((p) => p.date);
  assert.equal(dates[0], view.period.start);
  assert.equal(dates.at(-1), view.period.end);
  for (const series of view.series) {
    assert.deepEqual(
      series.points.map((p) => p.date),
      dates,
    );
    assert.equal(series.points[0].value, Number(amount));
    assert.ok(
      series.points.every((p) => Number.isFinite(p.value) && p.value > 0),
    );
    assert.ok(
      Math.abs(Number(series.ending) - series.points.at(-1).value) <= 0.00501,
    );
    assert.ok(
      Math.abs(
        Number(series.totalReturn) -
          (series.points.at(-1).value / Number(amount) - 1) * 100,
      ) <= 0.00501,
    );
    if (series.id !== "SPY")
      assert.ok(
        Math.abs(
          Number(series.difference) -
            (Number(series.totalReturn) - Number(benchmark.totalReturn)),
        ) <= 0.01501,
      );
  }
  if (
    portfolios.length === 1 &&
    portfolios[0].holdings.length === 1 &&
    portfolios[0].holdings[0].symbol === "SPY"
  ) {
    assert.deepEqual(view.series[0].points, benchmark.points);
    assert.equal(view.series[0].totalReturn, benchmark.totalReturn);
  }
}
async function check(name, work) {
  try {
    const evidence = await work();
    results.push({ name, pass: true, ...evidence });
    console.log(JSON.stringify({ name, pass: true, ...evidence }));
  } catch (error) {
    results.push({
      name,
      pass: false,
      error: String(error.message).slice(0, 1200),
    });
    console.log(
      JSON.stringify({
        name,
        pass: false,
        error: String(error.message).slice(0, 1200),
      }),
    );
  }
  await writeFile(
    join(folder, "results.json"),
    JSON.stringify({ results, calls }, null, 2),
  );
}
const one = (symbol) => [
  { id: `single-${symbol}`, holdings: [{ symbol, weight: "100" }] },
];
// Load each widest window once, then exercise all narrower calculations from that evidence.
for (const symbol of symbols)
  await check(`${symbol} cold-or-expanding 5Y`, async () => {
    const { http, ms, final } = await query(one(symbol), "5Y");
    assert.equal(http, 200);
    validate(final, one(symbol), "10000");
    return {
      http,
      ms,
      points: final.series[0].points.length,
      period: final.period,
    };
  });
for (const symbol of symbols)
  for (const range of ranges)
    await check(`${symbol} ${range}`, async () => {
      const { http, ms, final } = await query(one(symbol), range);
      assert.equal(http, 200);
      validate(final, one(symbol), "10000");
      return {
        http,
        ms,
        points: final.series[0].points.length,
        period: final.period,
      };
    });
const portfolios = [
  {
    id: "war",
    holdings: [
      { symbol: "PLTR", weight: "33.33" },
      { symbol: "RTX", weight: "33.33" },
      { symbol: "BA", weight: "33.34" },
    ],
  },
  {
    id: "income",
    holdings: [
      { symbol: "SCHD", weight: "50" },
      { symbol: "SPY", weight: "50" },
    ],
  },
  {
    id: "tech",
    holdings: [
      { symbol: "MSFT", weight: "60" },
      { symbol: "AAPL", weight: "40" },
    ],
  },
  {
    id: "six",
    holdings: ["SPY", "SCHD", "PLTR", "RTX", "BA", "NVDA"].map((symbol, i) => ({
      symbol,
      weight: i < 2 ? "16.66" : "16.67",
    })),
  },
];
for (const p of portfolios)
  for (const range of ranges)
    await check(`${p.id} ${range}`, async () => {
      const { http, ms, final } = await query([p], range, "25000");
      assert.equal(http, 200);
      validate(final, [p], "25000");
      return { http, ms, points: final.series[0].points.length };
    });
for (const count of [2, 3])
  for (const range of ranges)
    await check(`${count} portfolio comparison ${range}`, async () => {
      const selected = portfolios.slice(0, count);
      const { http, ms, final } = await query(selected, range, "7500");
      assert.equal(http, 200);
      validate(final, selected, "7500");
      return { http, ms, series: final.series.length };
    });
for (const range of ["1Y", "1W", "1M", "YTD", "5Y"])
  await check(`younger IBIT ${range}`, async () => {
    const { http, ms, final } = await query(one("IBIT"), range);
    if (range !== "5Y") {
      assert.equal(http, 200);
      validate(final, one("IBIT"), "10000");
      return { http, ms, status: final.status };
    }
    assert.equal(final.status, "blocked");
    assert.ok(["MISSING_PRICE", "SHORT_HISTORY"].includes(final.code));
    assert.ok(
      final.issues?.some(
        (i) =>
          i.symbol === "IBIT" &&
          ["MISSING_PRICE", "SHORT_HISTORY"].includes(i.code),
      ),
    );
    return {
      http,
      ms,
      status: final.status,
      code: final.code,
      issues: final.issues,
    };
  });
await check("SPY unaffected by younger-history failure", async () => {
  const { http, ms, final } = await query(one("SPY"), "1W");
  assert.equal(http, 200);
  validate(final, one("SPY"), "10000");
  return { http, ms };
});
await check(
  "repeated younger-history error remains ticker-specific",
  async () => {
    const { http, ms, final } = await query(one("IBIT"), "5Y");
    assert.equal(final.status, "blocked");
    assert.equal(final.code, "MISSING_PRICE");
    return { http, ms, code: final.code };
  },
);
await check(
  "shorter younger-history result survives failed expansion",
  async () => {
    const { http, ms, final } = await query(one("IBIT"), "1Y");
    assert.equal(http, 200);
    validate(final, one("IBIT"), "10000");
    return { http, ms };
  },
);
await check("concurrent overlapping warm portfolios", async () => {
  const batch = await Promise.all(portfolios.map((p) => query([p], "1Y")));
  batch.forEach((r, i) => {
    assert.equal(r.http, 200);
    validate(r.final, [portfolios[i]], "10000");
  });
  return { requests: batch.length, maxMs: Math.max(...batch.map((r) => r.ms)) };
});
const after = JSON.parse(await readFile(ledgerFile, "utf8"));
const summary = {
  folder,
  calls,
  passed: results.filter((r) => r.pass).length,
  failed: results.filter((r) => !r.pass),
  ledgerBefore: before,
  ledgerAfter: after,
  deltaCalls: after.calls - before.calls,
  deltaIo: after.io - before.io,
};
await writeFile(join(folder, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
if (summary.failed.length) process.exitCode = 1;
