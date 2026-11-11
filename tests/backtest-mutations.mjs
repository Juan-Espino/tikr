import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const original = readFileSync(
  new URL("../src/lib/backtest.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const suite = readFileSync(
  new URL("./backtest.test.mjs", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const cases = [
  [
    "ex-date reinvestment",
    "payment-date policy",
    "paymentDate: a.paymentDate,",
    "paymentDate: day,",
  ],
  [
    "double credit",
    "payment-date policy",
    "value: mul(h.shares, decimal(a.amount))",
    "value: mul(mul(h.shares, decimal(a.amount)), rat(2))",
  ],
  [
    "daily rebalancing",
    "independent drifting-weight",
    "const dd = sub(div(total, peak), one);",
    `for (const h of holdings) { const weight = p.holdings.find(x => x.symbol === h.asset.symbol)!.weight; h.shares = div(div(mul(total, decimal(weight)), rat(100)), prices.get(h.asset.symbol)!.get(day)!); }
const dd = sub(div(total, peak), one);`,
  ],
  [
    "missing price substitution",
    "confirmed younger history",
    `if (price === undefined)
        return fail("MISSING_PRICE", \`\${a.symbol}: missing close on \${s}\`);`,
    `if (price === undefined) { map.set(s, decimal("1")); continue; }`,
  ],
  [
    "half-up tie rounding",
    "drawdown and ties",
    "toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)",
    "toDecimalPlaces(2, Decimal.ROUND_HALF_UP)",
  ],
];
const id = randomUUID();
const sourceUrl = new URL(`../src/lib/mutant-${id}.ts`, import.meta.url),
  testUrl = new URL(`./mutant-${id}.test.mjs`, import.meta.url);
try {
  writeFileSync(
    testUrl,
    suite.replace("../src/lib/backtest.ts", `../src/lib/mutant-${id}.ts`),
  );
  for (const [name, pattern, from, to] of cases) {
    assert.ok(original.includes(from), `Mutation target missing: ${name}`);
    writeFileSync(sourceUrl, original.replace(from, to));
    const r = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--test",
        `--test-name-pattern=${pattern}`,
        testUrl.pathname.replace(/^\/(\w:)/, "$1"),
      ],
      { encoding: "utf8" },
    );
    assert.equal(
      r.status,
      1,
      `${name}: mutant did not fail: ${r.stdout} ${r.stderr}`,
    );
    assert.match(
      r.stdout + r.stderr,
      /AssertionError/,
      `${name}: failed for a reason other than assertion: ${r.stdout} ${r.stderr}`,
    );
    console.log(`Killed: ${name}`);
  }
} finally {
  for (const path of [sourceUrl, testUrl]) {
    try {
      unlinkSync(path);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
}
