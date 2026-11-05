import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdmittedTransport,
  fetchPersonalCalendar,
  createPersonalLoader,
  provisionalAsset,
} from "../src/lib/alpaca/personal-loader.ts";
import { backtest } from "../src/lib/backtest.ts";
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
  assert.throws(
    () => provisionalAsset(c, calendar, "SPY"),
    /UNSUPPORTED_ACTION/,
  );
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
  await assert.rejects(denied("https://data.alpaca.markets"), /CACHE_BUDGET/);
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
