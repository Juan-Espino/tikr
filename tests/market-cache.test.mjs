import test from "node:test";
import assert from "node:assert/strict";
import {
  createOnDemandBacktests,
  eligibleSessions,
} from "../src/lib/market-cache.ts";
const sessions = [
  "2024-11-01",
  "2024-11-04",
  "2024-11-05",
  "2024-11-06",
  "2024-11-07",
  "2024-11-08",
];
const request = {
  portfolios: [{ id: "one", holdings: [{ symbol: "AAA", weight: "100" }] }],
  amount: "1000",
  start: sessions[0],
  end: "latest",
};
const calendar = {
  complete: true,
  finalityVerified: true,
  provenance: "synthetic verified fixture only",
  from: sessions[0],
  through: "2024-11-10",
  sessions,
};
function fixture(options = {}) {
  let now = new Date("2024-11-05T14:00:00Z"),
    broken = false,
    price = "110",
    calendarBroken = false;
  const calls = [];
  const load = async (q) => {
    calls.push(q);
    if (options.wait) await options.wait;
    if (broken) throw new Error("synthetic-private-secret must never escape");
    const prices = Object.fromEntries(
      sessions
        .filter((d) => d >= q.from && d <= q.through)
        .map((d, i) => [
          d,
          q.symbol === "SPY"
            ? String(100 + i)
            : i === 1
              ? price
              : String(100 + i * 10),
        ]),
    );
    const asset = {
      symbol: q.symbol,
      firstAvailable: sessions[0],
      from: q.from,
      through: q.through,
      complete: true,
      inceptionVerified: true,
      pricesComplete: true,
      actionsComplete: true,
      accessComplete: true,
      priceBasis: "raw",
      provenance: "synthetic",
      prices,
      actions: [],
    };
    if (options.transform) options.transform(asset, q);
    return {
      feed: "sip",
      asset,
      ...(options.pending ? { pendingSession: q.through } : {}),
    };
  };
  const cache = createOnDemandBacktests({
    supportedSymbols: ["AAA", "SPY"],
    historyStart: sessions[0],
    calendar: () => ({ ...calendar, finalityVerified: !calendarBroken }),
    load,
    clock: () => new Date(now),
    ...options.config,
  });
  return {
    cache,
    calls,
    advance: (date) => {
      now = new Date(date);
    },
    fail: () => {
      broken = true;
    },
    recover: () => {
      broken = false;
    },
    correct: (value) => {
      price = value;
    },
    failCalendar: () => {
      calendarBroken = true;
    },
  };
}

test("New York next-calendar-day 09:00 cutoff handles weekends, half-days and DST", () => {
  assert.deepEqual(
    eligibleSessions(sessions, new Date("2024-11-05T13:59:59Z")),
    ["2024-11-01"],
  );
  assert.deepEqual(
    eligibleSessions(sessions, new Date("2024-11-05T14:00:00Z")),
    ["2024-11-01", "2024-11-04"],
  );
  assert.deepEqual(
    eligibleSessions(["2024-11-01"], new Date("2024-11-02T12:59:59Z")),
    [],
  );
  assert.deepEqual(
    eligibleSessions(["2024-11-01"], new Date("2024-11-02T13:00:00Z")),
    ["2024-11-01"],
  );
  assert.deepEqual(
    eligibleSessions(
      ["2024-03-08", "2024-03-11"],
      new Date("2024-03-12T13:00:00Z"),
    ),
    ["2024-03-08", "2024-03-11"],
  );
  assert.deepEqual(
    eligibleSessions(["2024-11-29"], new Date("2024-11-30T14:00:00Z")),
    ["2024-11-29"],
  );
});

test("cold open loads once per asset, then fresh opens reuse exact verified results", async () => {
  const f = fixture();
  const open = f.cache.open(request);
  assert.equal(open.initial.status, "refreshing");
  assert.equal(open.initial.result, undefined);
  const ready = await open.settled;
  assert.equal(ready.status, "ready");
  assert.equal(ready.asOf, "2024-11-04");
  assert.equal(ready.result.portfolios[0].ending, "1100");
  assert.equal(ready.result.benchmark.ending, "1010");
  assert.equal(ready.result.portfolios[0].benchmarkDifference, "0.09");
  assert.deepEqual(f.calls.map((c) => c.symbol).sort(), ["AAA", "SPY"]);
  assert.equal(f.cache.open(request).initial.status, "ready");
  assert.equal(f.calls.length, 2);
  ready.result.portfolios[0].ending = "tampered";
  assert.equal(
    f.cache.open(request).initial.result.portfolios[0].ending,
    "1100",
  );
});

test("concurrent portfolios share in-flight assets and SPY but retain separate calculations", async () => {
  let release;
  const wait = new Promise((r) => {
    release = r;
  });
  const f = fixture({ wait });
  const first = f.cache.open(request),
    second = f.cache.open({ ...request, amount: "2000" });
  await Promise.resolve();
  assert.equal(f.calls.length, 2);
  release();
  const [a, b] = await Promise.all([first.settled, second.settled]);
  assert.equal(a.result.portfolios[0].ending, "1100");
  assert.equal(b.result.portfolios[0].ending, "2200");
  assert.equal(f.calls.length, 2);
});

test("next refresh cycle shows dated stale snapshot while work runs then recalculates", async () => {
  const f = fixture();
  await f.cache.open(request).settled;
  f.advance("2024-11-06T14:00:00Z");
  const next = f.cache.open(request);
  assert.equal(next.initial.status, "refreshing");
  assert.equal(next.initial.asOf, "2024-11-04");
  assert.equal(next.initial.result.portfolios[0].ending, "1100");
  const ready = await next.settled;
  assert.equal(ready.status, "ready");
  assert.equal(ready.asOf, "2024-11-05");
  assert.equal(ready.result.portfolios[0].ending, "1200");
  assert.equal(f.calls.length, 4);
});

test("failed refresh preserves only the last dated verified snapshot and sanitizes errors", async () => {
  const f = fixture();
  const old = await f.cache.open(request).settled;
  f.advance("2024-11-06T14:00:00Z");
  f.fail();
  const stale = await f.cache.open(request).settled;
  assert.equal(stale.status, "stale");
  assert.equal(stale.asOf, old.asOf);
  assert.equal(stale.code, "REFRESH_FAILED");
  assert(!JSON.stringify(stale).includes("synthetic-private-secret"));
  const before = f.calls.length;
  assert.equal((await f.cache.open(request).settled).status, "stale");
  assert.equal(f.calls.length, before + 2);
});

test("failure without a verified result stays blocked; one automatic attempt and bounded explicit retry", async () => {
  const f = fixture();
  f.fail();
  assert.equal((await f.cache.open(request).settled).status, "blocked");
  f.cache.open(request);
  assert.equal(f.calls.length, 2);
  f.cache.open(request, { retry: true });
  assert.equal(f.calls.length, 2);
  f.advance("2024-11-05T14:01:00Z");
  f.recover();
  assert.equal(
    (await f.cache.open(request, { retry: true }).settled).status,
    "ready",
  );
  assert.equal(f.calls.length, 4);
});

test("unverified action coverage, wrong feed, missing old price and unsupported actions never produce results", async () => {
  for (const transform of [
    (a) => {
      a.actionsComplete = false;
    },
    (a) => {
      delete a.prices["2024-11-01"];
    },
    (a) => {
      a.actions = [
        {
          id: "spin",
          type: "unsupported",
          date: "2024-11-04",
          description: "unsupported spin-off",
        },
      ];
    },
  ]) {
    const f = fixture({ transform });
    const result = await f.cache.open(request).settled;
    assert.equal(result.status, "blocked");
    assert.equal(result.result, undefined);
  }
  const f = fixture({
    config: { load: async () => ({ feed: "iex", asset: {} }) },
  });
  assert.equal((await f.cache.open(request).settled).code, "UNVERIFIED_DATA");
});

test("a known correction invalidates old calculations rather than serving known-wrong snapshots", async () => {
  let spyFails = false;
  const f = fixture({
    transform: (a) => {
      if (spyFails && a.symbol === "SPY") throw new Error("failure");
    },
  });
  const one = await f.cache.open(request).settled;
  const secondRequest = { ...request, amount: "2000" };
  await f.cache.open(secondRequest).settled;
  f.advance("2024-11-06T14:00:00Z");
  f.correct("105");
  spyFails = true;
  const blocked = await f.cache.open(request).settled;
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.result, undefined);
  assert.equal(f.cache.open(secondRequest).initial.result, undefined);
  assert.equal(one.result.portfolios[0].ending, "1100");
});

test("an action-only revision changes dependencies and recalculates without double credit", async () => {
  let revised = false;
  const f = fixture({
    transform: (a) => {
      if (revised && a.symbol === "AAA")
        a.actions = [
          {
            id: "div",
            type: "dividend",
            date: "2024-11-04",
            paymentDate: "2024-11-05",
            amount: "1",
            basis: "postSplit",
          },
        ];
    },
  });
  const old = await f.cache.open(request).settled;
  f.advance("2024-11-06T14:00:00Z");
  revised = true;
  const next = await f.cache.open(request).settled;
  assert.equal(next.status, "ready");
  assert.notEqual(next.dataRevisions.AAA, old.dataRevisions.AAA);
  assert.equal(next.result.portfolios[0].ending, "1210");
});

test("refresh includes a five-session price recheck boundary and keeps full action history in the contract", async () => {
  const f = fixture();
  f.advance("2024-11-09T14:00:00Z");
  await f.cache.open(request).settled;
  assert.equal(f.calls[0].from, "2024-11-01");
  assert.equal(f.calls[0].through, "2024-11-08");
  assert.equal(f.calls[0].recheckFrom, "2024-11-04");
});

test("calendar outage keeps an existing dated result but triggers no provider work", async () => {
  const f = fixture();
  await f.cache.open(request).settled;
  f.failCalendar();
  const v = f.cache.open(request).initial;
  assert.equal(v.status, "stale");
  assert.equal(v.code, "CALENDAR_UNAVAILABLE");
  assert.equal(f.calls.length, 2);
});

test("invalid weights, unsupported assets and uncovered ranges are rejected before loading", () => {
  const f = fixture();
  for (const bad of [
    { ...request, start: "2024-10-01" },
    {
      ...request,
      portfolios: [{ id: "x", holdings: [{ symbol: "AAA", weight: "99" }] }],
    },
    {
      ...request,
      portfolios: [
        { id: "x", holdings: [{ symbol: "UNKNOWN", weight: "100" }] },
      ],
    },
  ])
    assert.throws(() => f.cache.open(bad), /INVALID_INPUT/);
  assert.equal(f.calls.length, 0);
});

test("uncooperative loaders time out without leaking errors or hanging the refresh", async () => {
  const f = fixture({
    config: { timeoutMs: 10, load: () => new Promise(() => {}) },
  });
  const view = await f.cache.open(request).settled;
  assert.equal(view.status, "blocked");
  assert.equal(view.code, "REFRESH_TIMEOUT");
  assert.equal(view.originalFailure.code, "TIMEOUT");
  assert.equal(view.originalFailure.stage, "source");
  assert.match(view.originalFailure.trace, /^[a-f0-9-]{36}$/);
});

test("daily cycle rolls at New York 09:00 so an earlier open does not suppress the new session", async () => {
  const f = fixture();
  f.advance("2024-11-05T13:59:59Z");
  await f.cache.open(request).settled;
  f.advance("2024-11-05T14:00:00Z");
  const ready = await f.cache.open(request).settled;
  assert.equal(ready.status, "ready");
  assert.equal(ready.asOf, "2024-11-04");
  assert.equal(f.calls.length, 4);
});

test("a narrower period can use an already verified wider history without fetching again", async () => {
  const f = fixture({
    transform: (a) => {
      if (a.symbol === "AAA")
        a.actions = [
          {
            id: "later",
            type: "dividend",
            date: "2024-11-05",
            paymentDate: "2024-11-06",
            amount: "1",
            basis: "postSplit",
          },
        ];
    },
  });
  f.advance("2024-11-06T14:00:00Z");
  await f.cache.open(request).settled;
  const v = f.cache.open({ ...request, end: "2024-11-04" }).initial;
  assert.equal(v.status, "ready");
  assert.equal(v.asOf, "2024-11-04");
  assert.equal(v.result.portfolios[0].ending, "1100");
  assert.equal(f.calls.length, 2);
});

test("unchanged weekend refresh updates the verification date retained by a later failure", async () => {
  const f = fixture();
  f.advance("2024-11-09T14:00:00Z");
  await f.cache.open(request).settled;
  f.advance("2024-11-10T14:00:00Z");
  const checked = await f.cache.open(request).settled;
  assert.equal(checked.dataCheckedAt, "2024-11-10T14:00:00.000Z");
  f.advance("2024-11-11T14:00:00Z");
  f.fail();
  // Extend the supplied calendar coverage; existing fixture only covers through Nov 10,
  // which is the required previous calendar day here.
  const stale = await f.cache.open(request).settled;
  assert.equal(stale.status, "stale");
  assert.equal(stale.dataCheckedAt, checked.dataCheckedAt);
});

test("repeated failed retries report holdings without a daily quota", async () => {
  const f = fixture();
  f.fail();
  await f.cache.open(request).settled;
  f.advance("2024-11-05T14:01:00Z");
  await f.cache.open(request, { retry: true }).settled;
  f.advance("2024-11-05T14:02:00Z");
  const blocked = await f.cache.open(request, { retry: true }).settled;
  assert.equal(f.calls.length, 6);
  assert.equal(blocked.code, "REFRESH_FAILED");
  assert.deepEqual(blocked.issues.map((i) => i.symbol).sort(), ["AAA", "SPY"]);
});

test("a corrected interior calendar invalidates saved results before a bounded recheck", async () => {
  let now = new Date("2024-11-08T14:00:00Z"),
    days = ["2024-11-05", "2024-11-07"];
  const cache = createOnDemandBacktests({
    supportedSymbols: ["SPY"],
    historyStart: "2024-11-05",
    clock: () => now,
    calendar: () => ({ ...calendar, from: "2024-11-05", sessions: days }),
    load: async (q) => ({
      feed: "sip",
      asset: {
        symbol: "SPY",
        firstAvailable: "2024-11-05",
        from: q.from,
        through: q.through,
        complete: true,
        inceptionVerified: true,
        pricesComplete: true,
        actionsComplete: true,
        accessComplete: true,
        priceBasis: "raw",
        provenance: "synthetic",
        actions: [],
        prices: Object.fromEntries(days.map((d, i) => [d, String(100 + i)])),
      },
    }),
  });
  const input = {
    ...request,
    start: "2024-11-05",
    portfolios: [{ id: "s", holdings: [{ symbol: "SPY", weight: "100" }] }],
  };
  assert.equal(
    (await cache.open(input).settled).result.benchmark.points.length,
    2,
  );
  days = ["2024-11-05", "2024-11-06", "2024-11-07"];
  const invalidated = cache.open(input).initial;
  assert.notEqual(invalidated.status, "ready");
  assert.equal(invalidated.result, undefined);
  now = new Date("2024-11-08T14:01:00Z");
  const corrected = await cache.open(input, { retry: true }).settled;
  assert.equal(corrected.status, "ready");
  assert.equal(corrected.result.benchmark.points.length, 3);
});

test("cold and mixed coverage use an explicitly pending newest session only", async () => {
  for (const mixed of [false, true]) {
    const f = fixture({
      pending: !mixed,
      transform: (a) => {
        if (!mixed || a.symbol === "AAA") {
          a.through = "2024-11-04";
          delete a.prices["2024-11-05"];
        }
      },
      config: mixed
        ? {
            load: async (q) => ({
              feed: "sip",
              ...(q.symbol === "AAA" ? { pendingSession: q.through } : {}),
              asset: {
                symbol: q.symbol,
                firstAvailable: sessions[0],
                from: q.from,
                through: q.symbol === "AAA" ? "2024-11-04" : q.through,
                complete: true,
                inceptionVerified: true,
                pricesComplete: true,
                actionsComplete: true,
                accessComplete: true,
                priceBasis: "raw",
                provenance: "synthetic",
                actions: [],
                prices: Object.fromEntries(
                  sessions
                    .filter(
                      (d) =>
                        d <= (q.symbol === "AAA" ? "2024-11-04" : q.through),
                    )
                    .map((d) => [d, "100"]),
                ),
              },
            }),
          }
        : {},
    });
    f.advance("2024-11-06T14:00:00Z");
    const v = await f.cache.open(request).settled;
    assert.equal(v.status, "stale");
    assert.equal(v.code, "SESSION_PENDING");
    assert.equal(v.asOf, "2024-11-04");
    assert.equal(v.result.actual.end, "2024-11-04");
    assert.equal(v.result.portfolios[0].points.length, 2);
  }
});

test("pending newest coverage never excuses interior gaps, access failures or unknown actions", async () => {
  for (const defect of [
    (a) => {
      delete a.prices["2024-11-01"];
    },
    (a) => {
      a.accessComplete = false;
    },
    (a) => {
      a.actionsComplete = false;
    },
  ]) {
    const f = fixture({
      pending: true,
      transform: (a) => {
        a.through = "2024-11-04";
        delete a.prices["2024-11-05"];
        defect(a);
      },
    });
    f.advance("2024-11-06T14:00:00Z");
    const v = await f.cache.open(request).settled;
    assert.equal(v.status, "blocked");
    assert.equal(v.result, undefined);
  }
  const undeclared = fixture({
    transform: (a) => {
      a.through = "2024-11-04";
      delete a.prices["2024-11-05"];
    },
  });
  undeclared.advance("2024-11-06T14:00:00Z");
  assert.equal(
    (await undeclared.cache.open(request).settled).status,
    "blocked",
  );
});

test("a bounded explicit retry can advance an earlier verified endpoint once the newest session is ready", async () => {
  let pending = true;
  const f = fixture({
    config: {
      load: async (q) => ({
        feed: "sip",
        ...(pending ? { pendingSession: q.through } : {}),
        asset: {
          symbol: q.symbol,
          firstAvailable: sessions[0],
          from: q.from,
          through: pending ? "2024-11-04" : q.through,
          complete: true,
          inceptionVerified: true,
          pricesComplete: true,
          actionsComplete: true,
          accessComplete: true,
          priceBasis: "raw",
          provenance: "synthetic",
          actions: [],
          prices: Object.fromEntries(
            sessions
              .filter((d) => d <= (pending ? "2024-11-04" : q.through))
              .map((d) => [d, "100"]),
          ),
        },
      }),
    },
  });
  f.advance("2024-11-06T14:00:00Z");
  assert.equal((await f.cache.open(request).settled).asOf, "2024-11-04");
  pending = false;
  f.advance("2024-11-06T14:01:00Z");
  const ready = await f.cache.open(request, { retry: true }).settled;
  assert.equal(ready.status, "ready");
  assert.equal(ready.asOf, "2024-11-05");
});

test("observed calendar corrections invalidate all affected fallbacks while preserving unaffected older periods", async () => {
  let broken = false,
    days = ["2024-11-01", "2024-11-04", "2024-11-05", "2024-11-07"];
  const cache = createOnDemandBacktests({
    supportedSymbols: ["SPY"],
    historyStart: "2024-11-01",
    clock: () => new Date("2024-11-08T14:00:00Z"),
    calendar: () => ({
      ...calendar,
      finalityVerified: !broken,
      sessions: days,
    }),
    load: async (q) => ({
      feed: "sip",
      asset: {
        symbol: "SPY",
        firstAvailable: "2024-11-01",
        from: q.from,
        through: q.through,
        complete: true,
        inceptionVerified: true,
        pricesComplete: true,
        actionsComplete: true,
        accessComplete: true,
        priceBasis: "raw",
        provenance: "synthetic",
        actions: [],
        prices: Object.fromEntries(days.map((d, i) => [d, String(100 + i)])),
      },
    }),
  });
  const first = {
    ...request,
    portfolios: [{ id: "s", holdings: [{ symbol: "SPY", weight: "100" }] }],
  };
  const second = { ...first, amount: "2000" },
    earlier = { ...first, end: "2024-11-04" };
  assert.equal((await cache.open(first).settled).status, "ready");
  assert.equal((await cache.open(second).settled).status, "ready");
  assert.equal((await cache.open(earlier).settled).status, "ready");
  days = ["2024-11-01", "2024-11-04", "2024-11-05", "2024-11-06", "2024-11-07"];
  assert.equal(cache.open(first).initial.result, undefined);
  broken = true;
  const invalidated = cache.open(second).initial;
  assert.equal(invalidated.status, "blocked");
  assert.equal(invalidated.code, "CALENDAR_UNAVAILABLE");
  assert.equal(invalidated.result, undefined);
  const preserved = cache.open(earlier).initial;
  assert.equal(preserved.status, "stale");
  assert.equal(preserved.asOf, "2024-11-04");
  assert.equal(preserved.result.benchmark.points.length, 2);
});

test("selected source window excludes older gaps and unsupported actions; all short tickers are reported", async () => {
  const f = fixture({
    transform: (a, q) => {
      if (q.from < sessions[1]) throw new Error("UNSUPPORTED_ACTION");
    },
  });
  f.advance("2024-11-06T14:00:00Z");
  const narrow = { ...request, start: sessions[1] };
  const result = await f.cache.open(narrow).settled;
  assert.equal(result.status, "ready");
  assert.ok(f.calls.every((q) => q.from === sessions[1]));
  assert.equal(result.result.actual.start, sessions[1]);
  assert.equal(result.result.benchmark.points[0].date, sessions[1]);
  const short = fixture({
    transform: (a) => {
      a.firstAvailable = sessions[1];
      delete a.prices[sessions[0]];
    },
  });
  const blocked = await short.cache.open(request).settled;
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.result, undefined);
  assert.deepEqual(
    blocked.issues,
    ["AAA", "SPY"].map((symbol) => ({
      symbol,
      code: "SHORT_HISTORY",
      firstAvailable: sessions[1],
    })),
  );
});

test("wider cached windows may serve narrow requests; partial windows never satisfy wider requests", async () => {
  const f = fixture();
  f.advance("2024-11-06T14:00:00Z");
  const full = await f.cache.open(request).settled;
  const narrow = await f.cache.open({ ...request, start: sessions[1] }).settled;
  assert.equal(narrow.status, "ready");
  assert.equal(f.calls.length, 2);
  assert.equal(narrow.result.actual.start, sessions[1]);
  assert.deepEqual(narrow.dataRevisions, full.dataRevisions);
  const partial = fixture();
  partial.advance("2024-11-06T14:00:00Z");
  assert.equal(
    (await partial.cache.open({ ...request, start: sessions[1] }).settled)
      .status,
    "ready",
  );
  const wider = await partial.cache.open(request).settled;
  assert.equal(wider.status, "ready");
  assert.equal(wider.result.actual.start, sessions[0]);
  assert.equal(partial.calls.length, 4);
  assert.ok(partial.calls.slice(2).every((q) => q.from === sessions[0]));
});

test("a wider caller joining a narrow in-flight load expands only after commit", async () => {
  let release;
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  const f = fixture({ wait });
  f.advance("2024-11-06T14:00:00Z");
  const narrow = f.cache.open({ ...request, start: sessions[1] });
  const wider = f.cache.open(request);
  release();
  const [one, two] = await Promise.all([narrow.settled, wider.settled]);
  assert.equal(one.result.actual.start, sessions[1]);
  assert.equal(two.status, "ready");
  assert.equal(two.result.actual.start, sessions[0]);
  assert.equal(f.calls.length, 4);
});
