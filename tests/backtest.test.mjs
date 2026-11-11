import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { backtest, preset, display, percent } from "../src/lib/backtest.ts";
const oracle = JSON.parse(
  readFileSync(
    new URL("./fixtures/backtest-oracles.json", import.meta.url),
    "utf8",
  ),
);
// Exact, independent rational comparator: |actual - oracle| <= 10^-30.
function fraction(s) {
  const [n, d] = s.split("/");
  if (d) return [BigInt(n), BigInt(d)];
  const neg = n.startsWith("-"),
    raw = neg ? n.slice(1) : n,
    [whole, frac = ""] = raw.split(".");
  return [(neg ? -1n : 1n) * BigInt(whole + frac), 10n ** BigInt(frac.length)];
}
function near(actual, expected) {
  const [a, b] = fraction(actual),
    [c, d] = fraction(expected);
  const diff = a * d - c * b;
  assert.ok(
    (diff < 0n ? -diff : diff) * 10n ** 30n <= b * d,
    `${actual} != ${expected}`,
  );
}
const days = ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"];
function calendar(
  sessions = days,
  from = sessions[0],
  through = sessions.at(-1),
) {
  return {
    complete: true,
    finalityVerified: true,
    provenance: "fixture",
    from,
    through,
    sessions,
  };
}
function asset(symbol, prices, actions = [], opts = {}) {
  return {
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
    provenance: "fixture",
    prices: Object.fromEntries(
      days.map((d, i) => [d, prices[i]]).filter(([, v]) => v !== undefined),
    ),
    actions,
    ...opts,
  };
}
const dividend = (date, paymentDate, amount) => ({
  id: `div-${date}-${paymentDate}-${amount}`,
  type: "dividend",
  date,
  paymentDate,
  amount,
  basis: "postSplit",
});
const split = (date, numerator, denominator) => ({
  id: `split-${date}-${numerator}-${denominator}`,
  type: "split",
  date,
  numerator,
  denominator,
});
function run(a, options = {}) {
  const spy = asset("SPY", ["100", "100", "100", "100"]);
  return backtest({
    calendar: calendar(),
    assets: [a, spy],
    portfolios: [{ id: "p", holdings: [{ symbol: a.symbol, weight: "100" }] }],
    start: days[0],
    end: days[3],
    amount: "100",
    ...options,
  });
}
const vals = (result) => result.portfolios[0].points.map((p) => p.value);
function expectValues(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((v, i) => near(v, expected[i]));
}
function throwsCode(fn, code) {
  assert.throws(fn, (e) => e.code === code);
}

test("independent drifting-weight and benchmark oracle; scaling, order and self comparison", () => {
  const a = asset("A", ["100", "200", "100", "100"]),
    b = asset("B", ["100", "100", "200", "200"]),
    spy = asset("SPY", ["100", "110", "120", "120"]);
  const common = {
    calendar: calendar(),
    assets: [a, b, spy],
    portfolios: [
      {
        id: "p",
        holdings: [
          { symbol: "A", weight: "50" },
          { symbol: "B", weight: "50" },
        ],
      },
      { id: "self", holdings: [{ symbol: "SPY", weight: "100" }] },
    ],
    start: days[0],
    end: days[2],
    amount: "1000",
  };
  const r = backtest(common);
  expectValues(vals(r), oracle.baseline.values);
  expectValues(
    r.benchmark.points.map((x) => x.value),
    oracle.baseline.benchmark,
  );
  near(r.portfolios[0].totalReturn, oracle.baseline.return);
  near(r.portfolios[0].benchmarkDifference, oracle.baseline.difference);
  near(r.portfolios[1].benchmarkDifference, "0");
  const reverse = structuredClone(common);
  reverse.portfolios[0].holdings.reverse();
  assert.deepEqual(backtest(reverse), r);
  const doubled = structuredClone(common);
  doubled.amount = "2000";
  expectValues(vals(backtest(doubled)), ["2000", "3000", "3000"]);
  assert.notEqual(r.portfolios[0].ending, oracle.baseline.rebalancedWrong);
  assert.deepEqual(backtest(common), r);
});
test("payment-date policy, unpaid entitlement, ex-date entry and non-session settlement", () => {
  const a = asset(
    "A",
    ["100", "101", "110", "110"],
    [dividend(days[1], days[2], "2")],
  );
  const r = run(a, { end: days[2] });
  expectValues(vals(r), oracle.dividend.values);
  near(r.portfolios[0].shares.A, "56/55");
  assert.ok(Math.abs(Number(r.portfolios[0].ending) - 11330 / 101) > 0.1);
  assert.notEqual(r.portfolios[0].ending, oracle.dividend.doubleCreditWrong);
  const unpaid = run(
    asset(
      "A",
      ["100", "101", "110", "110"],
      [dividend(days[1], "2024-01-06", "2")],
    ),
    { end: days[1] },
  );
  expectValues(vals(unpaid), ["100", "103"]);
  near(unpaid.portfolios[0].points[1].receivable, "2");
  const entered = run(a, { start: days[1], end: days[2], amount: "101" });
  expectValues(vals(entered), ["101", "110"]);
  near(entered.portfolios[0].shares.A, "1");
  const ds = ["2024-01-04", "2024-01-05", "2024-01-08"];
  const c = calendar(ds, "2024-01-04", "2024-01-08");
  const a2 = asset("A", [], [dividend(ds[1], "2024-01-06", "2")], {
    from: ds[0],
    through: ds[2],
    firstAvailable: ds[0],
    prices: { [ds[0]]: "100", [ds[1]]: "101", [ds[2]]: "110" },
  });
  const sp = asset("SPY", [], [], {
    from: ds[0],
    through: ds[2],
    firstAvailable: ds[0],
    prices: { [ds[0]]: "100", [ds[1]]: "100", [ds[2]]: "100" },
  });
  expectValues(
    vals(
      backtest({
        calendar: c,
        assets: [a2, sp],
        portfolios: [{ id: "p", holdings: [{ symbol: "A", weight: "100" }] }],
        start: ds[0],
        end: ds[2],
        amount: "100",
      }),
    ),
    ["100", "103", "112"],
  );
});
test("forward and reverse split preserve fractional holding value", () => {
  const a = asset(
    "A",
    ["100", "50", "200", "200"],
    [split(days[1], "2", "1"), split(days[2], "1", "4")],
  );
  const r = run(a, { end: days[2], amount: "150" });
  expectValues(vals(r), ["150", "150", "150"]);
  near(r.portfolios[0].shares.A, "3/4");
});
test("normalized split before ex entitlement; settlement cannot earn same-day entitlement", () => {
  const a = asset(
    "A",
    ["100", "50", "55", "55"],
    [dividend(days[1], days[2], "1"), split(days[1], "2", "1")],
  );
  const r = run(a, { end: days[2] });
  expectValues(vals(r), oracle.combined.values);
  near(r.portfolios[0].shares.A, oracle.combined.sharesEnd);
  const b = asset(
    "A",
    ["100", "100", "100", "100"],
    [dividend(days[1], days[2], "10"), dividend(days[2], days[3], "10")],
  );
  const x = run(b);
  expectValues(vals(x), ["100", "110", "120", "120"]);
  near(x.portfolios[0].shares.A, "6/5");
  const swapped = structuredClone(a);
  swapped.actions.reverse();
  assert.deepEqual(run(swapped, { end: days[2] }), r);
});
test("overlapping and coincident receivables settle once; missing settlement price fails", () => {
  const a = asset(
    "A",
    ["100", "100", "100", "100"],
    [dividend(days[1], days[3], "2"), dividend(days[2], days[3], "3")],
  );
  const r = run(a);
  expectValues(vals(r), ["100", "102", "105", "105"]);
  near(r.portfolios[0].shares.A, "21/20");
  delete a.prices[days[3]];
  throwsCode(() => run(a), "MISSING_PRICE");
});
test("younger listing cannot hide an older holding or benchmark gap before the shared start", () => {
  const older = asset("A", ["100", "100", "100", "100"]);
  const younger = asset("B", [undefined, "100", "100", "100"], [], {
    firstAvailable: days[1],
  });
  const spy = asset("SPY", ["100", "100", "100", "100"]);
  const input = {
    calendar: calendar(),
    assets: [older, younger, spy],
    portfolios: [
      { id: "older", holdings: [{ symbol: "A", weight: "100" }] },
      { id: "younger", holdings: [{ symbol: "B", weight: "100" }] },
    ],
    start: days[0],
    end: days[3],
    amount: "100",
  };
  throwsCode(() => backtest(input), "SHORT_HISTORY");
  for (const symbol of ["A", "SPY"]) {
    const missing = structuredClone(input);
    delete missing.assets.find((item) => item.symbol === symbol).prices[
      days[0]
    ];
    assert.throws(
      () => backtest(missing),
      (error) =>
        error.code === "SHORT_HISTORY",
    );
  }
});

test("requires at least two common completed sessions, without silently adjusting for listing", () => {
  const a = asset("A", ["100", "100", "100", "100"]);
  assert.throws(
    () => run(a, { start: days[3], end: days[3] }),
    (error) =>
      error.code === "INSUFFICIENT_COVERAGE" &&
      error.message.includes("at least two completed trading sessions"),
  );
  a.firstAvailable = days[3];
  throwsCode(() => run(a), "SHORT_HISTORY");
  a.firstAvailable = "2024-01-10";
  throwsCode(() => run(a), "SHORT_HISTORY");
  a.firstAvailable = days[0];
  const result = run(a, { end: days[1] });
  assert.equal(result.portfolios[0].points.length, 2);
  assert.equal(result.benchmark.points.length, 2);
  assert.equal(result.actual.start, days[0]);
  assert.equal(result.actual.end, days[1]);
});

test("confirmed younger history blocks the whole requested period; a shorter period may succeed", () => {
  const a = asset("A", ["100", "100", "100", "100"], [], {
    firstAvailable: days[1],
  });
  throwsCode(() => run(a), "SHORT_HISTORY");
  const r = run(a, { start: days[1] });
  assert.equal(r.actual.start, days[1]);
  assert.equal(r.benchmark.points[0].date, days[1]);
  assert.equal(r.shortened, false);
  delete a.prices[days[2]];
  throwsCode(() => run(a, { start: days[1] }), "MISSING_PRICE");
  a.firstAvailable = "2024-01-10";
  throwsCode(() => run(a), "SHORT_HISTORY");
});
test("unknown completeness, unsupported and ambiguous actions fail closed", () => {
  const a = asset("A", ["100", "100", "100", "100"]);
  for (const field of [
    "complete",
    "inceptionVerified",
    "pricesComplete",
    "actionsComplete",
    "accessComplete",
  ]) {
    const b = structuredClone(a);
    b[field] = false;
    throwsCode(() => run(b), "UNVERIFIED_DATA");
  }
  for (const field of ["complete", "finalityVerified"]) {
    const c = calendar();
    c[field] = false;
    throwsCode(() => run(a, { calendar: c }), "UNVERIFIED_DATA");
  }
  const bad = structuredClone(a);
  bad.actions = [
    {
      id: "unsupported",
      type: "unsupported",
      date: days[1],
      description: "spin-off",
    },
  ];
  assert.throws(
    () => run(bad),
    (e) => e.code === "UNSUPPORTED_ACTION" && e.message.includes("A"),
  );
  bad.actions = [
    {
      id: "ambiguous",
      type: "dividend",
      date: days[1],
      paymentDate: days[2],
      amount: "2",
    },
  ];
  throwsCode(() => run(bad), "UNVERIFIED_DATA");
  const duplicate = structuredClone(a);
  duplicate.actions = [
    dividend(days[1], days[2], "2"),
    dividend(days[1], days[2], "2"),
  ];
  throwsCode(() => run(duplicate), "UNVERIFIED_DATA");
  const missing = structuredClone(a);
  delete missing.prices[days[2]];
  throwsCode(() => run(missing), "MISSING_PRICE");
  const short = structuredClone(a);
  short.through = days[2];
  throwsCode(() => run(short), "INSUFFICIENT_COVERAGE");
});
test("drawdown and ties-to-even including neighbors and negative values", () => {
  const r = run(asset("A", ["100", "120", "90", "110"]));
  near(r.portfolios[0].drawdown, oracle.drawdown.drawdown);
  near(r.portfolios[0].totalReturn, oracle.drawdown.return);
  for (const [v, out] of Object.entries(oracle.ties))
    assert.equal(display(v), out);
  for (const [v, out] of [
    ["12.3449", "12.34"],
    ["12.3451", "12.35"],
    ["-12.3449", "-12.34"],
    ["-12.3451", "-12.35"],
    ["-12.355", "-12.36"],
  ])
    assert.equal(display(v), out);
  assert.equal(percent("0.12345"), "12.34");
  assert.notEqual(display("12.345"), "12.35");
});
test("verified session boundaries and presets including leap, month-end, holiday, half-day and DST", () => {
  const c = calendar(
    [
      "2024-02-29",
      "2024-03-08",
      "2024-03-11",
      "2024-05-24",
      "2024-05-28",
      "2024-11-29",
    ],
    "2023-01-01",
    "2024-11-30",
  );
  assert.deepEqual(preset(c, "1M"), { start: "2024-10-29", end: "2024-11-29" });
  assert.deepEqual(preset(c, "YTD"), {
    start: "2024-01-01",
    end: "2024-11-29",
  });
  assert.equal(preset(c, "Max").start, "2023-01-01");
  const leap = calendar(["2024-02-29"], "2019-01-01", "2024-02-29");
  assert.equal(preset(leap, "1Y").start, "2023-02-28");
  assert.equal(preset(leap, "5Y").start, "2019-02-28");
  const month = calendar(["2024-03-29"], "2024-01-01", "2024-03-29");
  assert.equal(preset(month, "1M").start, "2024-02-29");
  assert.equal(preset(month, "1W").start, "2024-03-22");
  const cs = [
    "2024-03-08",
    "2024-03-11",
    "2024-05-24",
    "2024-05-28",
    "2024-11-29",
  ];
  const cal = calendar(cs, "2024-03-08", "2024-11-29");
  const opts = {
    firstAvailable: cs[0],
    from: cal.from,
    through: cal.through,
    prices: Object.fromEntries(cs.map((d) => [d, "100"])),
  };
  const input = {
    calendar: cal,
    assets: [asset("A", [], [], opts), asset("SPY", [], [], opts)],
    portfolios: [{ id: "p", holdings: [{ symbol: "A", weight: "100" }] }],
    start: "2024-05-25",
    end: "2024-11-29",
    amount: "100",
  };
  const r = backtest(input);
  assert.equal(r.actual.start, "2024-05-28");
  assert.equal(r.actual.end, "2024-11-29");
  assert.equal(r.portfolios[0].points[0].value, "100");
  const bad = structuredClone(input);
  bad.start = "2024-03-09";
  bad.end = "2024-03-10";
  throwsCode(() => backtest(bad), "INSUFFICIENT_COVERAGE");
});

test("a fresh period purchases at its first close rather than cropping an older run", () => {
  const a = asset("A", ["100", "200", "100", "100"]),
    b = asset("B", ["100", "100", "200", "200"]),
    spy = asset("SPY", ["100", "100", "100", "100"]);
  const input = {
    calendar: calendar(),
    assets: [a, b, spy],
    portfolios: [
      {
        id: "p",
        holdings: [
          { symbol: "A", weight: "50" },
          { symbol: "B", weight: "50" },
        ],
      },
    ],
    start: days[0],
    end: days[2],
    amount: "1000",
  };
  const full = backtest(input);
  const fresh = backtest({ ...input, start: days[1] });
  expectValues(vals(full), ["1000", "1500", "1500"]);
  expectValues(vals(fresh), ["1000", "1250"]);
});
test("New York holiday, shortened session and DST fixtures use supplied completed sessions", () => {
  for (const [sessions, from, through, start, end, expected] of [
    [
      ["2024-03-08", "2024-03-11", "2024-03-12"],
      "2024-03-08",
      "2024-03-12",
      "2024-03-09",
      "2024-03-12",
      ["2024-03-11", "2024-03-12"],
    ],
    [
      ["2024-05-24", "2024-05-28", "2024-05-29"],
      "2024-05-24",
      "2024-05-29",
      "2024-05-25",
      "2024-05-29",
      ["2024-05-28", "2024-05-29"],
    ],
    [
      ["2024-11-27", "2024-11-29", "2024-12-02"],
      "2024-11-27",
      "2024-12-02",
      "2024-11-28",
      "2024-12-01",
      ["2024-11-29"],
    ],
    [
      ["2024-11-27", "2024-11-29", "2024-12-02"],
      "2024-11-27",
      "2024-12-02",
      "2024-11-28",
      "2024-12-02",
      ["2024-11-29", "2024-12-02"],
    ],
  ]) {
    const opts = {
      firstAvailable: from,
      from,
      through,
      prices: Object.fromEntries(sessions.map((d) => [d, "100"])),
    };
    const input = {
      calendar: calendar(sessions, from, through),
      assets: [asset("A", [], [], opts), asset("SPY", [], [], opts)],
      portfolios: [{ id: "p", holdings: [{ symbol: "A", weight: "100" }] }],
      start,
      end,
      amount: "100",
    };
    if (expected.length < 2) {
      throwsCode(() => backtest(input), "INSUFFICIENT_COVERAGE");
      continue;
    }
    const r = backtest(input);
    assert.deepEqual(
      r.portfolios[0].points.map((p) => p.date),
      expected,
    );
  }
});

test("decimal context stays within the fixture error budget through repeated reinvestment", () => {
  const sessions = Array.from({ length: 300 }, (_, i) => {
    const d = new Date(Date.UTC(2020, 0, 1 + i));
    return d.toISOString().slice(0, 10);
  });
  const prices = Object.fromEntries(sessions.map((d) => [d, "3"]));
  const events = sessions.slice(1).map((d) => dividend(d, d, "1"));
  const opts = {
    firstAvailable: sessions[0],
    from: sessions[0],
    through: sessions.at(-1),
    prices,
  };
  const result = backtest({
    calendar: calendar(sessions, sessions[0], sessions.at(-1)),
    assets: [asset("A", [], events, opts), asset("SPY", [], [], opts)],
    portfolios: [{ id: "p", holdings: [{ symbol: "A", weight: "100" }] }],
    start: sessions[0],
    end: sessions.at(-1),
    amount: "3",
  });
  // Independently derived 3 × (4/3)^299; compare exactly with BigInt, relative tolerance 10^-32.
  const [actualN, actualD] = fraction(result.portfolios[0].ending),
    expectedN = 3n * 4n ** 299n,
    expectedD = 3n ** 299n;
  const difference = actualN * expectedD - expectedN * actualD;
  assert.ok(
    (difference < 0n ? -difference : difference) * 10n ** 32n <=
      expectedN * actualD,
  );
});

test("shared younger comparison blocks the requested period; invalid inputs fail", () => {
  const a = asset("A", ["100", "200", "100", "100"]);
  const b = asset("B", [undefined, "100", "100", "100"], [], {
    firstAvailable: days[1],
  });
  const spy = asset("SPY", ["100", "100", "100", "100"]);
  const input = {
    calendar: calendar(),
    assets: [a, b, spy],
    portfolios: [
      { id: "a", holdings: [{ symbol: "A", weight: "100" }] },
      { id: "b", holdings: [{ symbol: "B", weight: "100" }] },
    ],
    start: days[0],
    end: days[3],
    amount: "100",
  };
  throwsCode(() => backtest(input), "SHORT_HISTORY");
  const r = backtest({ ...input, start: days[1] });
  assert.equal(r.actual.start, days[1]);
  assert.deepEqual(r.shortenedBy, []);
  for (const series of [...r.portfolios, r.benchmark])
    assert.equal(series.points[0].date, days[1]);
  for (const weight of ["0", "99.99", "100.01", "1e2"]) {
    const bad = structuredClone(input);
    bad.portfolios[0].holdings[0].weight = weight;
    throwsCode(() => backtest(bad), "INVALID_INPUT");
  }
  const adjusted = structuredClone(input);
  adjusted.assets[0].priceBasis = "adjusted";
  throwsCode(() => backtest(adjusted), "UNVERIFIED_DATA");
  const order = structuredClone(input);
  order.calendar.sessions.reverse();
  throwsCode(() => backtest(order), "INVALID_INPUT");
  const noSpy = structuredClone(input);
  noSpy.assets.pop();
  throwsCode(() => backtest(noSpy), "INVALID_INPUT");
});


test("a selected short period ignores older unsupported actions and older price gaps", () => {
  const a = asset("A", [undefined, "100", "110", "120"], [{ id: "old", type: "unsupported", date: days[0], description: "synthetic old event" }]);
  const r = run(a, { start: days[1] });
  assert.equal(r.portfolios[0].ending, "120");
  assert.equal(r.actual.start, days[1]);
  throwsCode(() => run(a), "UNSUPPORTED_ACTION");
  a.actions = [];
  throwsCode(() => run(a), "MISSING_PRICE");
});
