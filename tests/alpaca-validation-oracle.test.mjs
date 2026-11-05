import test from "node:test";
import assert from "node:assert/strict";
import {
  holdingOracle,
  exact,
  closeEnough,
  fraction,
} from "../scripts/lib/alpaca-oracle.mjs";
const dividend = {
  symbol: "SPY",
  kind: "cash_dividends",
  date: "2024-01-03",
  paymentDate: "2024-01-04",
  amount: "2",
};
const sessions = ["2024-01-02", "2024-01-03", "2024-01-04"];
test("independent exact oracle reproduces prewritten payment-date expectations", () => {
  const o = holdingOracle(
    "SPY",
    { "2024-01-02": "100", "2024-01-03": "101", "2024-01-04": "110" },
    sessions,
    "100",
    [dividend],
  );
  assert.deepEqual(
    o.points.map((p) => exact(p.value)),
    ["100/1", "103/1", "112/1"],
  );
  assert.equal(exact(o.shares), "56/55");
  assert.equal(exact(o.totalReturn), "3/25");
  assert.equal(exact(o.drawdown), "0/1");
});
test("oracle retains unpaid entitlement and excludes ex-date entry", () => {
  const prices = { "2024-01-02": "100", "2024-01-03": "101" };
  const unpaid = holdingOracle("SPY", prices, sessions.slice(0, 2), "100", [
    dividend,
  ]);
  assert.equal(exact(unpaid.ending), "103/1");
  assert.equal(exact(unpaid.points.at(-1).receivable), "2/1");
  const entry = holdingOracle(
    "SPY",
    { "2024-01-03": "101", "2024-01-04": "110" },
    sessions.slice(1),
    "101",
    [dividend],
  );
  assert.equal(exact(entry.ending), "110/1");
});
test("oracle split and signed drawdown expectations are independent of engine", () => {
  const o = holdingOracle(
    "AAA",
    { "2024-01-02": "100", "2024-01-03": "60", "2024-01-04": "45" },
    sessions,
    "100",
    [
      {
        symbol: "AAA",
        kind: "forward_splits",
        date: "2024-01-03",
        numerator: "2",
        denominator: "1",
      },
    ],
  );
  assert.deepEqual(
    o.points.map((p) => exact(p.value)),
    ["100/1", "120/1", "90/1"],
  );
  assert.equal(exact(o.drawdown), "-1/4");
  assert.equal(closeEnough("90", fraction(90n)), true);
  assert.equal(closeEnough("90.0001", fraction(90n)), false);
});

test("oracle uses the next supplied session for a non-session payment", () => {
  const days = ["2024-01-04", "2024-01-05", "2024-01-08"];
  const result = holdingOracle(
    "SPY",
    { "2024-01-04": "100", "2024-01-05": "101", "2024-01-08": "110" },
    days,
    "100",
    [
      {
        symbol: "SPY",
        kind: "cash_dividends",
        date: "2024-01-05",
        paymentDate: "2024-01-06",
        amount: "2",
      },
    ],
  );
  assert.deepEqual(
    result.points.map((p) => exact(p.value)),
    ["100/1", "103/1", "112/1"],
  );
});
test("oracle independently handles a split and post-split dividend on the same date", () => {
  const result = holdingOracle(
    "AAA",
    { "2024-01-02": "100", "2024-01-03": "50", "2024-01-04": "55" },
    sessions,
    "100",
    [
      {
        symbol: "AAA",
        kind: "forward_splits",
        date: "2024-01-03",
        numerator: "2",
        denominator: "1",
      },
      {
        symbol: "AAA",
        kind: "cash_dividends",
        date: "2024-01-03",
        paymentDate: "2024-01-04",
        amount: "1",
      },
    ],
  );
  assert.deepEqual(
    result.points.map((p) => exact(p.value)),
    ["100/1", "102/1", "112/1"],
  );
  assert.equal(exact(result.shares), "112/55");
});
test("oracle forward and reverse splits preserve value for neutral prices", () => {
  const result = holdingOracle(
    "AAA",
    { "2024-01-02": "100", "2024-01-03": "50", "2024-01-04": "200" },
    sessions,
    "150",
    [
      {
        symbol: "AAA",
        kind: "forward_splits",
        date: "2024-01-03",
        numerator: "2",
        denominator: "1",
      },
      {
        symbol: "AAA",
        kind: "reverse_splits",
        date: "2024-01-04",
        numerator: "1",
        denominator: "4",
      },
    ],
  );
  assert.deepEqual(
    result.points.map((p) => exact(p.value)),
    ["150/1", "150/1", "150/1"],
  );
  assert.equal(exact(result.shares), "3/4");
});
