import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdmittedTransport,
  fetchPersonalCalendar,
  createPersonalLoader,
  provisionalAsset,
} from "../src/lib/alpaca/personal-loader.ts";
import { backtest } from "../src/lib/backtest.ts";
import { MarketFailure } from "../src/lib/market-errors.ts";
const days = ["2024-11-01", "2024-11-04", "2024-11-05"];
const now = new Date("2024-11-06T14:00:00Z");
const ok = (body) => new Response(JSON.stringify(body));
const candidate = () => ({
  symbols: ["SPY"],
  start: days[0],
  end: days[2],
  prices: {
    SPY: Object.fromEntries(days.map((d, i) => [d, String([100, 99, 110][i])])),
  },
  actions: [],
  evidence: { barsTraversal: "complete", actionsTraversal: "complete" },
});
const calendar = {
  from: days[0],
  through: days[2],
  sessions: days,
  complete: true,
  finalityVerified: true,
  provenance: "synthetic",
};
const config = (transport) => ({
  keyId: "synthetic-key",
  secret: "synthetic-secret",
  transport,
  retries: 0,
});
test("calendar uses fixed data-only endpoint and next-day New York cutoff", async () => {
  const c = await fetchPersonalCalendar(
    config(async (url, init) => {
      assert.equal(new URL(url).origin, "https://paper-api.alpaca.markets");
      assert.equal(new URL(url).pathname, "/v2/calendar");
      assert.equal(init.redirect, "error");
      assert.equal(init.cache, "no-store");
      return ok(days.map((date) => ({ date })));
    }),
    days[0],
    days[2],
    new Date("2024-11-06T13:59:00Z"),
  );
  assert.deepEqual(c.sessions, days.slice(0, 2));
});
test("live synthetic bars and payment-date dividend reach the unchanged engine", async () => {
  let calls = 0;
  const load = createPersonalLoader(
    config(async (url, init) => {
      calls++;
      assert.equal(init.headers["APCA-API-SECRET-KEY"], "synthetic-secret");
      const u = new URL(url);
      assert.equal(u.origin, "https://data.alpaca.markets");
      if (u.pathname.endsWith("bars")) {
        assert.equal(u.searchParams.get("feed"), "sip");
        assert.equal(u.searchParams.get("adjustment"), "raw");
        return ok({
          bars: {
            SPY: days.map((d, i) => ({
              t: `${d}T05:00:00Z`,
              c: [100, 99, 110][i],
            })),
          },
          next_page_token: null,
        });
      }
      assert.equal(u.searchParams.get("data_quality"), "all");
      return ok({
        corporate_actions: {
          cash_dividends: [
            {
              id: "div",
              symbol: "SPY",
              process_date: days[1],
              ex_date: days[1],
              payable_date: days[2],
              rate: 1,
              special: false,
              foreign: false,
            },
          ],
        },
        next_page_token: null,
      });
    }),
    calendar,
  );
  const { asset } = await load({
    symbol: "SPY",
    from: days[0],
    through: days[2],
    recheckFrom: days[0],
    signal: new AbortController().signal,
  });
  const result = backtest({
    calendar,
    assets: [asset],
    portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
    amount: "100",
    start: days[0],
    end: days[2],
  });
  assert.equal(result.portfolios[0].ending, "111");
  assert.match(asset.provenance, /provisional/);
  assert.equal(calls, 2);
});
test("missing leading and interior history fail rather than shorten", () => {
  for (const d of days) {
    const c = candidate();
    delete c.prices.SPY[d];
    assert.throws(() => provisionalAsset(c, calendar, "SPY"), /MISSING_PRICE/);
  }
});
test("process-date replies may include a validated dividend with an earlier ex-date", () => {
  const c = candidate();
  c.actions = [
    {
      id: "earlier-entitlement",
      symbol: "SPY",
      date: "2024-10-18",
      paymentDate: days[1],
      kind: "cash_dividends",
      amount: "1",
      issues: ["dividend unit basis unverified"],
    },
  ];
  assert.deepEqual(provisionalAsset(c, calendar, "SPY").actions, []);
  c.actions[0].issues.push("unsupported dividend terms");
  assert.deepEqual(provisionalAsset(c, calendar, "SPY").actions, []);
});
test("unsupported, incomplete and ambiguous same-day split/dividend events fail", () => {
  for (const action of [
    { id: "x", symbol: "SPY", date: days[1], kind: "spin_offs", issues: [] },
    {
      id: "x",
      symbol: "SPY",
      date: days[1],
      kind: "cash_dividends",
      issues: [],
      amount: "1",
    },
  ]) {
    const c = candidate();
    c.actions = [action];
    assert.throws(
      () => provisionalAsset(c, calendar, "SPY"),
      /UNSUPPORTED_ACTION/,
    );
  }
  const c = candidate();
  c.actions = [
    {
      id: "s",
      symbol: "SPY",
      date: days[1],
      kind: "forward_splits",
      numerator: "2",
      denominator: "1",
      issues: [],
    },
    {
      id: "d",
      symbol: "SPY",
      date: days[1],
      kind: "cash_dividends",
      amount: "1",
      paymentDate: days[2],
      issues: ["dividend unit basis unverified"],
    },
  ];
  assert.throws(
    () => provisionalAsset(c, calendar, "SPY"),
    /UNSUPPORTED_ACTION/,
  );
});
test("received missing history invalidates old scope instead of permitting stale fallback", async () => {
  const load = createPersonalLoader(
    config(async (url) =>
      ok(
        url.includes("/bars")
          ? { bars: { SPY: [] }, next_page_token: null }
          : { corporate_actions: {}, next_page_token: null },
      ),
    ),
    calendar,
  );
  await assert.rejects(
    load({
      symbol: "SPY",
      from: days[0],
      through: days[2],
      previous: provisionalAsset(candidate(), calendar, "SPY"),
      signal: new AbortController().signal,
    }),
    (e) => e.code === "EVIDENCE_CHANGED",
  );
});
test("malformed received actions revoke old evidence while transport failures remain retryable", async () => {
  const previous = provisionalAsset(candidate(), calendar, "SPY");
  const request = {
    symbol: "SPY",
    from: days[0],
    through: days[2],
    previous,
    signal: new AbortController().signal,
  };
  const bars = {
    bars: { SPY: days.map((d) => ({ t: `${d}T05:00:00Z`, c: 100 })) },
    next_page_token: null,
  };
  const malformed = createPersonalLoader(
    config(async (url) =>
      ok(
        url.includes("/bars")
          ? bars
          : {
              corporate_actions: {
                cash_dividends: [
                  {
                    symbol: "SPY",
                    process_date: days[1],
                    ex_date: days[1],
                    payable_date: days[2],
                    rate: 1,
                  },
                ],
              },
              next_page_token: null,
            },
      ),
    ),
    calendar,
  );
  await assert.rejects(
    malformed(request),
    (e) => e.code === "EVIDENCE_CHANGED",
  );
  const unavailable = createPersonalLoader(
    config(async () => new Response("", { status: 503 })),
    calendar,
  );
  await assert.rejects(unavailable(request), (e) => e.code === "UPSTREAM");
});
test("calendar rejects malformed, unsorted, oversized and unauthorized replies without leaking bodies", async () => {
  for (const body of [
    [{ date: days[1] }, { date: days[0] }],
    [{ date: "2024-02-31" }],
    Array(1301).fill({ date: days[0] }),
    { secret: "canary" },
  ])
    await assert.rejects(
      fetchPersonalCalendar(
        config(async () => ok(body)),
        days[0],
        days[2],
        now,
      ),
      (e) => e.code === "MALFORMED" && !e.message.includes("canary"),
    );
  await assert.rejects(
    fetchPersonalCalendar(
      config(async () => new Response("private canary", { status: 403 })),
      days[0],
      days[2],
      now,
    ),
    (e) => e.code === "UPSTREAM" && !e.message.includes("canary"),
  );
});

test("provider admission happens before transport and failed admission makes no request", async () => {
  const events = [];
  const transport = createAdmittedTransport(
    async () => {
      events.push("reserve");
    },
    async () => {
      events.push("request");
      throw new Error("synthetic upstream");
    },
  );
  await assert.rejects(transport("https://data.alpaca.markets"));
  assert.deepEqual(events, ["reserve", "request"]);
  const denied = createAdmittedTransport(
    async () => {
      throw new Error("CACHE_BUDGET");
    },
    async () => assert.fail("network after denial"),
  );
  await assert.rejects(
    denied("https://data.alpaca.markets"),
    /SHARED_BUDGET_EXHAUSTED/,
  );
});

test("calendar and asset admission refusals preserve budget errors without provider access or false correction", async () => {
  for (const code of ["SHARED_BUDGET_EXHAUSTED", "TEAM_BUDGET_UNVERIFIED"]) {
    let requests = 0;
    const transport = createAdmittedTransport(
      async () => {
        throw new MarketFailure(code);
      },
      async () => {
        requests++;
        assert.fail("provider request after refusal");
      },
    );
    await assert.rejects(
      fetchPersonalCalendar(config(transport), days[0], days[2], now),
      (error) => error.code === code,
    );
    const loader = createPersonalLoader(config(transport), calendar);
    await assert.rejects(
      loader({
        symbol: "SPY",
        from: days[0],
        through: days[2],
        recheckFrom: days[0],
        previous: provisionalAsset(candidate(), calendar, "SPY"),
        signal: new AbortController().signal,
      }),
      (error) => error.code === code,
    );
    assert.equal(requests, 0);
  }
});

test("calendar times out even when transport or body ignores abort", async () => {
  // Keep a timer alive: AbortSignal.timeout alone is unref'ed by Node.
  const keeper = setTimeout(() => {}, 1000);
  try {
    for (const transport of [
      async () => new Promise(() => {}),
      async () =>
        new Response(
          new ReadableStream({
            pull() {
              return new Promise(() => {});
            },
          }),
        ),
    ])
      await assert.rejects(
        fetchPersonalCalendar(
          { ...config(transport), timeoutMs: 5 },
          days[0],
          days[2],
          now,
        ),
        (e) => e.code === "TIMEOUT",
      );
  } finally {
    clearTimeout(keeper);
  }
});

test("ordinary split due bills preserve ex-date shares and payment-close reinvestment", async () => {
  for (const redemption of [days[1], days[2]]) {
    const load = createPersonalLoader(
      config(async (url) =>
        ok(
          url.includes("/bars")
            ? {
                bars: {
                  SPY: days.map((d, i) => ({
                    t: `${d}T05:00:00Z`,
                    c: [100, 10, 12][i],
                  })),
                },
                next_page_token: null,
              }
            : {
                corporate_actions: {
                  forward_splits: [
                    {
                      id: "split",
                      symbol: "SPY",
                      process_date: days[1],
                      ex_date: days[1],
                      due_bill_redemption_date: redemption,
                      new_rate: 10,
                      old_rate: 1,
                    },
                  ],
                  cash_dividends: [
                    {
                      id: "div",
                      symbol: "SPY",
                      process_date: days[2],
                      ex_date: days[2],
                      payable_date: days[2],
                      rate: 1,
                      special: false,
                      foreign: false,
                    },
                  ],
                },
                next_page_token: null,
              },
        ),
      ),
      calendar,
    );
    const { asset } = await load({
      symbol: "SPY",
      from: days[0],
      through: days[2],
      signal: new AbortController().signal,
    });
    const r = backtest({
      calendar,
      assets: [asset],
      portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
      amount: "100",
      start: days[0],
      end: days[2],
    });
    // One original share becomes ten; ten dollars due at payment close: 10*12+10.
    assert.equal(r.portfolios[0].ending, "130");
    assert.equal(r.portfolios[0].points[1].value, "100");
  }
});

test("cash merger acquirer-only records are excluded; acquiree events remain unsupported", async () => {
  for (const acquired of ["OTHER", "SPY"]) {
    const load = createPersonalLoader(
      config(async (url) =>
        ok(
          url.includes("/bars")
            ? {
                bars: {
                  SPY: days.map((d) => ({ t: `${d}T05:00:00Z`, c: 100 })),
                },
                next_page_token: null,
              }
            : {
                corporate_actions: {
                  cash_mergers: [
                    {
                      id: "merger",
                      acquiree_symbol: acquired,
                      acquirer_symbol: acquired === "SPY" ? "OTHER" : "SPY",
                      effective_date: days[1],
                      process_date: days[1],
                      rate: 100,
                    },
                  ],
                },
                next_page_token: null,
              },
        ),
      ),
      calendar,
    );
    const run = load({
      symbol: "SPY",
      from: days[0],
      through: days[2],
      signal: new AbortController().signal,
    });
    if (acquired === "SPY") await assert.rejects(run, /UNSUPPORTED_ACTION/);
    else assert.deepEqual((await run).asset.actions, []);
  }
});

test("split redemption before ex-date, invalid dates and symbol changes fail", async () => {
  for (const terms of [
    { due_bill_redemption_date: days[0] },
    { due_bill_redemption_date: "2024-02-31" },
    { new_symbol: "OTHER" },
  ]) {
    const load = createPersonalLoader(
      config(async (url) =>
        ok(
          url.includes("/bars")
            ? {
                bars: {
                  SPY: days.map((d) => ({ t: `${d}T05:00:00Z`, c: 100 })),
                },
                next_page_token: null,
              }
            : {
                corporate_actions: {
                  forward_splits: [
                    {
                      id: "split",
                      symbol: "SPY",
                      process_date: days[1],
                      ex_date: days[1],
                      new_rate: 10,
                      old_rate: 1,
                      ...terms,
                    },
                  ],
                },
                next_page_token: null,
              },
        ),
      ),
      calendar,
    );
    await assert.rejects(
      load({
        symbol: "SPY",
        from: days[0],
        through: days[2],
        signal: new AbortController().signal,
      }),
    );
  }
});

test("period coverage is explicit without fabricated inception; BA/RTX old events do not block a short period", () => {
  for (const symbol of ["BA", "RTX"]) {
    const c = candidate();
    c.symbols = [symbol];
    c.prices = { [symbol]: c.prices.SPY };
    c.actions = [
      {
        id: "old",
        symbol,
        date: "2020-04-03",
        kind: "spin_offs",
        issues: ["unsupported action"],
      },
    ];
    const a = provisionalAsset(c, calendar, symbol);
    assert.equal(a.inceptionVerified, false);
    assert.equal(a.periodCoverageVerified, true);
    assert.deepEqual(a.actions, []);
    c.actions[0].date = days[1];
    assert.throws(
      () => provisionalAsset(c, calendar, symbol),
      /UNSUPPORTED_ACTION/,
    );
    c.actions = [];
    delete c.prices[symbol][days[0]];
    assert.throws(() => provisionalAsset(c, calendar, symbol), /MISSING_PRICE/);
  }
});

test("an older expansion gap does not revoke an intact narrow scope; an overlapping gap does", async () => {
  for (const missing of [days[0], days[1], "revised"]) {
    const load = createPersonalLoader(
      config(async (url) =>
        new URL(url).pathname.endsWith("bars")
          ? ok({
              bars: {
                SPY: days
                  .filter(
                    (d) => d !== (missing === "revised" ? days[0] : missing),
                  )
                  .map((d) => ({
                    t: `${d}T05:00:00Z`,
                    c: missing === "revised" && d === days[1] ? 101 : 100,
                  })),
              },
              next_page_token: null,
            })
          : ok({ corporate_actions: {}, next_page_token: null }),
      ),
      calendar,
    );
    const previous = {
      ...provisionalAsset(candidate(), calendar, "SPY"),
      from: days[1],
      firstAvailable: days[1],
      prices: { [days[1]]: "100", [days[2]]: "100" },
    };
    await assert.rejects(
      () =>
        load({
          symbol: "SPY",
          from: days[0],
          through: days[2],
          recheckFrom: days[0],
          previous,
          signal: new AbortController().signal,
        }),
      (e) =>
        missing === days[0]
          ? e.message === "MISSING_PRICE"
          : e.code === "EVIDENCE_CHANGED" && e.limitation === "MISSING_PRICE",
    );
  }
});

test("stock merger acquirer-only response preserves existing history; acquiree and malformed terms still fail", async () => {
  for (const role of ["acquirer", "acquiree", "malformed"]) {
    const load = createPersonalLoader(
      config(async (url) =>
        ok(
          url.includes("/bars")
            ? {
                bars: {
                  SPY: days.map((d, i) => ({
                    t: `${d}T05:00:00Z`,
                    c: [100, 99, 110][i],
                  })),
                },
                next_page_token: null,
              }
            : {
                corporate_actions: {
                  stock_mergers: [
                    {
                      id: "stock-merger",
                      acquiree_symbol: role === "acquiree" ? "SPY" : "OTHER",
                      acquirer_symbol: role === "acquiree" ? "OTHER" : "SPY",
                      acquiree_rate: 1,
                      acquirer_rate: role === "malformed" ? null : 0.1955,
                      effective_date: days[1],
                      process_date: days[1],
                      payable_date: days[1],
                    },
                  ],
                },
                next_page_token: null,
              },
        ),
      ),
      calendar,
    );
    const request = {
      symbol: "SPY",
      from: days[0],
      through: days[2],
      recheckFrom: days[0],
      previous: provisionalAsset(candidate(), calendar, "SPY"),
      signal: new AbortController().signal,
    };
    if (role === "acquirer")
      assert.deepEqual((await load(request)).asset.actions, []);
    else
      await assert.rejects(
        () => load(request),
        (e) => e.code === "EVIDENCE_CHANGED",
      );
  }
});

test("acquiree-only cash mergers without an acquirer do not turn an older expansion gap into a correction", async () => {
  const oldDays = ["2023-05-01", ...days];
  const full = { ...calendar, from: oldDays[0], sessions: oldDays };
  const load = createPersonalLoader(
    config(async (url) =>
      ok(
        url.includes("/bars")
          ? {
              bars: {
                SPY: days.map((d, i) => ({
                  t: `${d}T05:00:00Z`,
                  c: [100, 99, 110][i],
                })),
              },
              next_page_token: null,
            }
          : {
              corporate_actions: {
                cash_mergers: [
                  {
                    id: "legacy-cash-acquiree",
                    acquiree_symbol: "SPY",
                    effective_date: oldDays[0],
                    process_date: oldDays[0],
                    payable_date: oldDays[0],
                    rate: 21.927943,
                  },
                ],
              },
              next_page_token: null,
            },
      ),
    ),
    full,
  );
  const previous = provisionalAsset(candidate(), calendar, "SPY");
  await assert.rejects(
    () =>
      load({
        symbol: "SPY",
        from: oldDays[0],
        through: days[2],
        previous,
        signal: new AbortController().signal,
      }),
    (e) => e.message === "MISSING_PRICE" && e.code !== "EVIDENCE_CHANGED",
  );
  const withinOld = {
    ...previous,
    from: oldDays[0],
    firstAvailable: oldDays[0],
    prices: { [oldDays[0]]: "100", ...previous.prices },
  };
  await assert.rejects(
    () =>
      load({
        symbol: "SPY",
        from: oldDays[0],
        through: days[2],
        previous: withinOld,
        signal: new AbortController().signal,
      }),
    (e) => e.code === "EVIDENCE_CHANGED",
  );
});

test("action rejection logs bounded reason and trace without event payloads", async () => {
  const { withMarketTrace } = await import("../src/lib/market-trace.ts");
  const c = candidate();
  c.actions = [
    {
      id: "private-provider-id",
      symbol: "SPY",
      date: days[1],
      kind: "cash_dividends",
      amount: "987.65",
      paymentDate: days[2],
      issues: ["unsupported dividend terms", "private-provider-text"],
    },
  ];
  const logs = [];
  const original = console.error;
  console.error = (line) => logs.push(JSON.parse(line));
  try {
    assert.throws(
      () => withMarketTrace(() => provisionalAsset(c, calendar, "SPY")),
      /UNSUPPORTED_ACTION/,
    );
  } finally {
    console.error = original;
  }
  assert.equal(logs.length, 1);
  assert.equal(logs[0].reason, "unverified_dividend_terms");
  assert.match(logs[0].trace, /^[a-f0-9-]{36}$/);
  assert.equal(logs[0].symbol, "SPY");
  assert.doesNotMatch(JSON.stringify(logs), /987.65|private-provider/);
});

test("foreign and special USD distributions retain payment-date cash semantics", async () => {
  const dividendDays = [...days, "2024-11-06"];
  const dividendCalendar = {
    ...calendar,
    through: dividendDays.at(-1),
    sessions: dividendDays,
  };
  for (const symbol of ["TSM", "ASML"]) {
    const load = createPersonalLoader(
      config(async (url) =>
        ok(
          url.includes("/bars")
            ? {
                bars: {
                  [symbol]: dividendDays.map((d, i) => ({
                    t: `${d}T05:00:00Z`,
                    c: [100, 99, 110, 220][i],
                  })),
                },
                next_page_token: null,
              }
            : {
                corporate_actions: {
                  cash_dividends: [
                    {
                      id: "synthetic-foreign-usd",
                      symbol,
                      process_date: days[1],
                      ex_date: days[1],
                      payable_date: days[2],
                      rate: 1,
                      foreign: true,
                      special: true,
                      currency: "USD",
                      sub_type: "return_of_capital",
                    },
                  ],
                },
                next_page_token: null,
              },
        ),
      ),
      dividendCalendar,
    );
    const { asset } = await load({
      symbol,
      from: days[0],
      through: dividendDays.at(-1),
      signal: new AbortController().signal,
    });
    const result = backtest({
      calendar: dividendCalendar,
      assets: [asset, { ...asset, symbol: "SPY", actions: [] }],
      portfolios: [{ id: "p", holdings: [{ symbol, weight: "100" }] }],
      amount: "100",
      start: days[0],
      end: dividendDays.at(-1),
    });
    // Independent oracle: one share, $1 receivable after ex-date; payment close
    // buys 1/110 additional shares. Payment value is $111; the next $220 close must produce $222,
    // rather than $221 from leaving the dividend as cash.
    assert.equal(result.portfolios[0].ending, "222");
    assert.equal(result.portfolios[0].points[1].value, "100");
  }
});

test("all Alpaca foreign dividend rates use reported USD cash regardless of metadata", async () => {
  const dates = [...days, "2024-11-06"];
  const cal = { ...calendar, through: dates.at(-1), sessions: dates };
  for (const symbol of ["TSM", "ASML", "SONY", "BABA"]) {
    for (const currency of [undefined, "USD", "TWD", "EUR"]) {
      const load = createPersonalLoader(
        config(async (url) =>
          ok(
            url.includes("/bars")
              ? {
                  bars: {
                    [symbol]: dates.map((d, i) => ({
                      t: `${d}T05:00:00Z`,
                      c: [100, 99, 110, 220][i],
                    })),
                  },
                  next_page_token: null,
                }
              : {
                  corporate_actions: {
                    cash_dividends: [
                      {
                        id: "synthetic-provider-cash",
                        symbol,
                        process_date: days[1],
                        ex_date: days[1],
                        payable_date: days[2],
                        rate: 0.79,
                        foreign: true,
                        special: false,
                        ...(currency ? { currency } : {}),
                      },
                    ],
                  },
                  next_page_token: null,
                },
          ),
        ),
        cal,
      );
      const { asset } = await load({
        symbol,
        from: dates[0],
        through: dates.at(-1),
        signal: new AbortController().signal,
      });
      assert.equal(asset.actions[0].amount, "0.79");
      const result = backtest({
        calendar: cal,
        assets: [asset, { ...asset, symbol: "SPY", actions: [] }],
        portfolios: [{ id: "p", holdings: [{ symbol, weight: "100" }] }],
        amount: "100",
        start: dates[0],
        end: dates.at(-1),
      });
      // One share + $0.79 reported cash. No 21% gross-up, extra tax,
      // FX conversion or ADR ratio. Payment buys .79/110 shares; at220 =>221.58.
      assert.equal(result.portfolios[0].ending, "221.58");
      assert.equal(result.portfolios[0].points[1].value, "99.79");
    }
  }
});
