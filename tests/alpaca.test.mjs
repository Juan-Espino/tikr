import test from "node:test";
import assert from "node:assert/strict";
import { fetchCandidates, toEngineInput } from "../src/lib/alpaca/adapter.ts";
import { backtest } from "../src/lib/backtest.ts";

const query = {
  symbols: ["AAA", "SPY"],
  start: "2024-01-02",
  end: "2024-01-04",
  feed: "sip",
};
const bar = (day, close) => ({ t: `${day}T05:00:00Z`, c: close });
const dividend = {
  id: "synthetic-dividend",
  symbol: "AAA",
  process_date: "2024-01-04",
  ex_date: "2024-01-03",
  payable_date: "2024-01-04",
  rate: 1,
  special: false,
  foreign: false,
};
const ok = (body) => new Response(JSON.stringify(body), { status: 200 });
function mock(barPages, actionPages) {
  const seen = [];
  return {
    seen,
    transport: async (url, options) => {
      const parsed = new URL(url);
      seen.push({
        path: parsed.pathname,
        token: parsed.searchParams.get("page_token"),
        signal: options.signal,
      });
      const pages =
        parsed.pathname === "/v2/stocks/bars" ? barPages : actionPages;
      return pages.shift() ?? assert.fail("unexpected request");
    },
  };
}
function fixture() {
  return mock(
    [
      ok({
        bars: { AAA: [bar("2024-01-02", 100), bar("2024-01-03", 99)] },
        next_page_token: "bar-next",
      }),
      ok({
        bars: {
          AAA: [bar("2024-01-04", 100)],
          SPY: [
            bar("2024-01-02", 100),
            bar("2024-01-03", 100),
            bar("2024-01-04", 100),
          ],
        },
        next_page_token: null,
      }),
    ],
    [
      ok({
        corporate_actions: { cash_dividends: [dividend] },
        next_page_token: "action-next",
      }),
      ok({ corporate_actions: {}, next_page_token: null }),
    ],
  );
}
const config = (m, extra = {}) => ({
  keyId: "test-key",
  secret: "test-secret",
  transport: m.transport,
  sleep: async () => {},
  ...extra,
});
const proof = {
  status: "verified",
  source: "synthetic fixture",
  method: "complete synthetic dataset",
  from: query.start,
  through: query.end,
};
const evidence = () => ({
  calendar: proof,
  finality: proof,
  actions: { AAA: proof, SPY: proof },
  prices: { AAA: proof, SPY: proof },
  access: { AAA: proof, SPY: proof },
  dividendUnits: { AAA: { ...proof, basis: "postSplit" } },
  inception: {
    AAA: { ...proof, firstAvailable: query.start },
    SPY: { ...proof, firstAvailable: query.start },
  },
});
const sessions = ["2024-01-02", "2024-01-03", "2024-01-04"];
const portfolio = [{ id: "p", holdings: [{ symbol: "AAA", weight: "100" }] }];
const blocked = (e) => e.code === "BLOCKED";

test("synthetic multi-symbol pages traverse and independent expected engine values", async () => {
  const m = fixture(),
    c = await fetchCandidates(config(m), query);
  assert.deepEqual(
    m.seen.map((x) => [x.path, x.token]),
    [
      ["/v2/stocks/bars", null],
      ["/v2/stocks/bars", "bar-next"],
      ["/v1/corporate-actions", null],
      ["/v1/corporate-actions", "action-next"],
    ],
  );
  assert.equal(c.evidence.actionsCompleteness, "unknown");
  assert.throws(
    () => toEngineInput(c, sessions, {}, portfolio, "100"),
    blocked,
  );
  const result = backtest(
    toEngineInput(c, sessions, evidence(), portfolio, "100"),
  );
  assert.deepEqual(
    result.portfolios[0].points.map((x) => x.value),
    ["100", "100", "101"],
  );
  assert.equal(result.benchmark.ending, "100");
});
test("observed bars contradicting genuine inception block conversion", async () => {
  const candidates = await fetchCandidates(config(fixture()), query);
  for (const symbol of ["AAA", "SPY"]) {
    const proofs = evidence();
    proofs.inception[symbol].firstAvailable = "2024-01-03";
    assert.throws(
      () => toEngineInput(candidates, sessions, proofs, portfolio, "100"),
      blocked,
    );
  }
  const younger = structuredClone(candidates);
  delete younger.prices.AAA["2024-01-02"];
  const proofs = evidence();
  proofs.inception.AAA.firstAvailable = "2024-01-03";
  assert.throws(
    () => backtest(toEngineInput(younger, sessions, proofs, portfolio, "100")),
    (e) => e.code === "SHORT_HISTORY",
  );
  const outsideSessions = structuredClone(candidates);
  outsideSessions.prices.AAA["2024-01-01"] = "100";
  assert.throws(
    () =>
      toEngineInput(outsideSessions, sessions, evidence(), portfolio, "100"),
    blocked,
  );
});

test("cycles and malformed paging fail", async () => {
  const m = mock(
    [
      ok({ bars: {}, next_page_token: "x" }),
      ok({ bars: {}, next_page_token: "x" }),
    ],
    [],
  );
  await assert.rejects(
    fetchCandidates(config(m), query),
    (e) => e.code === "PAGINATION",
  );
  const n = mock([ok({ bars: {} })], []);
  await assert.rejects(
    fetchCandidates(config(n), query),
    (e) => e.code === "PAGINATION",
  );
});
test("duplicate bars and actions fail", async () => {
  const m = mock(
    [
      ok({
        bars: { AAA: [bar("2024-01-02", 1), bar("2024-01-02", 2)] },
        next_page_token: null,
      }),
    ],
    [],
  );
  await assert.rejects(
    fetchCandidates(config(m), query),
    (e) => e.code === "MALFORMED",
  );
  const n = mock(
    [ok({ bars: {}, next_page_token: null })],
    [
      ok({
        corporate_actions: { cash_dividends: [dividend, dividend] },
        next_page_token: null,
      }),
    ],
  );
  await assert.rejects(
    fetchCandidates(config(n), query),
    (e) => e.code === "MALFORMED",
  );
});
test("missing payment, ambiguous units, unsupported actions and absent prices block engine", async () => {
  const m = fixture(),
    c = await fetchCandidates(config(m), query);
  const noUnits = evidence();
  delete noUnits.dividendUnits.AAA;
  assert.throws(
    () => toEngineInput(c, sessions, noUnits, portfolio, "100"),
    blocked,
  );
  const noPay = structuredClone(c);
  delete noPay.actions[0].paymentDate;
  noPay.actions[0].issues.push("missing payment date");
  assert.throws(
    () => toEngineInput(noPay, sessions, evidence(), portfolio, "100"),
    blocked,
  );
  const unsupported = structuredClone(c);
  unsupported.actions[0].kind = "spin_offs";
  assert.throws(
    () => toEngineInput(unsupported, sessions, evidence(), portfolio, "100"),
    blocked,
  );
  const missing = structuredClone(c);
  delete missing.prices.AAA["2024-01-03"];
  assert.throws(
    () => toEngineInput(missing, sessions, evidence(), portfolio, "100"),
    blocked,
  );
});
test("403 sanitized and 429 bounded retries", async () => {
  let count = 0;
  await assert.rejects(
    fetchCandidates(
      {
        keyId: "private",
        secret: "private",
        transport: async () => {
          count++;
          return new Response("secret response", { status: 403 });
        },
      },
      query,
    ),
    (e) => e.code === "FORBIDDEN" && !e.message.includes("secret"),
  );
  assert.equal(count, 1);
  count = 0;
  const delays = [];
  await assert.rejects(
    fetchCandidates(
      {
        keyId: "x",
        secret: "y",
        transport: async () => {
          count++;
          return new Response("", { status: 429 });
        },
        sleep: async (ms) => delays.push(ms),
        retries: 2,
      },
      query,
    ),
    (e) => e.code === "RATE_LIMIT",
  );
  assert.equal(count, 3);
  assert.deepEqual(delays, [100, 200]);
});
test("timeout and caller abort even if transport ignores signal", async () => {
  const never = async () => new Promise(() => {});
  await assert.rejects(
    fetchCandidates(
      { keyId: "x", secret: "y", transport: never, timeoutMs: 10 },
      query,
    ),
    (e) => e.code === "TIMEOUT",
  );
  const controller = new AbortController();
  const pending = fetchCandidates(
    { keyId: "x", secret: "y", transport: never },
    { ...query, signal: controller.signal },
  );
  controller.abort();
  await assert.rejects(pending, (e) => e.code === "ABORTED");
});

test("incomplete and late corporate-action candidates remain conditional", async () => {
  const m = mock(
    [ok({ bars: {}, next_page_token: null })],
    [
      ok({
        corporate_actions: {
          cash_dividends: [
            { ...dividend, payable_date: null, process_date: "2024-01-04" },
          ],
        },
        next_page_token: null,
      }),
    ],
  );
  const c = await fetchCandidates(config(m), query);
  assert.ok(c.actions[0].issues.includes("missing payment date"));
  assert.ok(c.actions[0].issues.includes("dividend unit basis unverified"));
  assert.equal(c.evidence.actionsCompleteness, "unknown");
});
test("401 and exhausted server errors are safe and bounded", async () => {
  for (const [status, code] of [
    [401, "AUTH"],
    [503, "UPSTREAM"],
  ]) {
    let count = 0;
    await assert.rejects(
      fetchCandidates(
        {
          keyId: "x",
          secret: "y",
          retries: 1,
          sleep: async () => {},
          transport: async () => {
            count++;
            return new Response("secret", { status });
          },
        },
        query,
      ),
      (e) => e.code === code && !e.message.includes("secret"),
    );
    assert.equal(count, status === 401 ? 1 : 2);
  }
});

test("retry success, bounded pages, and rejected corrected action duplicate", async () => {
  let calls = 0;
  const m = fixture();
  const transport = async (...args) => {
    calls++;
    return calls === 1
      ? new Response("", { status: 429 })
      : m.transport(...args);
  };
  const result = await fetchCandidates({ ...config(m), transport }, query);
  assert.equal(result.actions.length, 1);
  assert.equal(calls, 5);
  const bounded = mock([ok({ bars: {}, next_page_token: "more" })], []);
  await assert.rejects(
    fetchCandidates(config(bounded, { maxPages: 1 }), query),
    (e) => e.code === "PAGINATION",
  );
  const corrected = mock(
    [ok({ bars: {}, next_page_token: null })],
    [
      ok({
        corporate_actions: { cash_dividends: [dividend] },
        next_page_token: "next",
      }),
      ok({
        corporate_actions: { cash_dividends: [{ ...dividend, rate: 2 }] },
        next_page_token: null,
      }),
    ],
  );
  await assert.rejects(
    fetchCandidates(config(corrected), query),
    (e) => e.code === "MALFORMED",
  );
});

test("timestamps reject rolled dates and invalid time or offset components", async () => {
  const dateQuery = {
    ...query,
    symbols: ["SPY"],
    start: "2024-02-28",
    end: "2024-03-02",
  };
  for (const value of [
    "2024-02-30T05:00:00Z",
    "2024-13-01T05:00:00Z",
    "2024-04-31T05:00:00Z",
    "2024-02-29T24:00:00Z",
    "2024-02-29T05:60:00Z",
    "2024-02-29T05:00:60Z",
    "2024-02-29T05:00:00+24:00",
    "2024-02-29T05:00:00+00:60",
    "2024-02-29T05:00:00+0000",
  ]) {
    const m = mock(
      [ok({ bars: { SPY: [{ t: value, c: 10 }] }, next_page_token: null })],
      [],
    );
    await assert.rejects(
      fetchCandidates(config(m), dateQuery),
      (e) => e.code === "MALFORMED",
      value,
    );
  }
  for (const value of [
    "2024-02-29T05:00:00.123456789Z",
    "2024-02-29T00:00:00-05:00",
  ]) {
    const m = mock(
      [ok({ bars: { SPY: [{ t: value, c: 10 }] }, next_page_token: null })],
      [ok({ corporate_actions: {}, next_page_token: null })],
    );
    const c = await fetchCandidates(config(m), dateQuery);
    assert.equal(c.prices.SPY["2024-02-29"], "10");
  }
});

function streamed(parts, headers = {}) {
  let canceled = 0;
  const encoder = new TextEncoder();
  const stream = new ReadableStream(
    {
      pull(controller) {
        const next = parts.shift();
        if (next === undefined) controller.close();
        else controller.enqueue(encoder.encode(next));
      },
      cancel() {
        canceled++;
      },
    },
    { highWaterMark: 0 },
  );
  return {
    response: new Response(stream, { status: 200, headers }),
    canceled: () => canceled,
  };
}

test("streaming byte budgets ignore missing and false length, cancel overflow, accept exact limit", async () => {
  for (const headers of [{}, { "content-length": "1" }]) {
    const stream = streamed(["12345678", "abcdefghijklmnop"], headers);
    const m = mock([stream.response], []);
    await assert.rejects(
      fetchCandidates(config(m, { maxResponseBytes: 10 }), query),
      (e) => e.code === "LIMIT",
    );
    assert.equal(stream.canceled(), 1);
  }
  const first = JSON.stringify({ bars: {}, next_page_token: null });
  const second = JSON.stringify({
    corporate_actions: {},
    next_page_token: null,
  });
  const firstBytes = Buffer.byteLength(first),
    secondBytes = Buffer.byteLength(second);
  const m = mock([streamed([first]).response], [streamed([second]).response]);
  await fetchCandidates(
    config(m, {
      maxResponseBytes: Math.max(firstBytes, secondBytes),
      maxTotalBytes: firstBytes + secondBytes,
    }),
    query,
  );
  const n = mock([streamed([first]).response], [streamed([second]).response]);
  await assert.rejects(
    fetchCandidates(
      config(n, {
        maxResponseBytes: Math.max(firstBytes, secondBytes),
        maxTotalBytes: firstBytes + secondBytes - 1,
      }),
      query,
    ),
    (e) => e.code === "LIMIT",
  );
});

test("page and aggregate bars and actions are bounded before normalizing", async () => {
  const a = mock(
    [
      ok({
        bars: { AAA: [bar("2024-01-02", 1), bar("2024-01-03", 1)] },
        next_page_token: null,
      }),
    ],
    [],
  );
  await assert.rejects(
    fetchCandidates(config(a, { maxPageRecords: 1 }), query),
    (e) => e.code === "LIMIT",
  );
  const b = mock(
    [ok({ bars: {}, next_page_token: null })],
    [
      ok({
        corporate_actions: {
          cash_dividends: [dividend, { ...dividend, id: "2" }],
        },
        next_page_token: null,
      }),
    ],
  );
  await assert.rejects(
    fetchCandidates(config(b, { maxPageRecords: 1 }), query),
    (e) => e.code === "LIMIT",
  );
  const c = mock(
    [
      ok({ bars: { AAA: [bar("2024-01-02", 1)] }, next_page_token: "next" }),
      ok({ bars: { AAA: [bar("2024-01-03", 1)] }, next_page_token: null }),
    ],
    [],
  );
  await assert.rejects(
    fetchCandidates(config(c, { maxTotalBars: 1 }), query),
    (e) => e.code === "LIMIT",
  );
  const d = mock(
    [ok({ bars: {}, next_page_token: null })],
    [
      ok({
        corporate_actions: { cash_dividends: [dividend] },
        next_page_token: "next",
      }),
      ok({
        corporate_actions: { cash_dividends: [{ ...dividend, id: "2" }] },
        next_page_token: null,
      }),
    ],
  );
  await assert.rejects(
    fetchCandidates(config(d, { maxTotalActions: 1 }), query),
    (e) => e.code === "LIMIT",
  );
  for (const value of [0, -1, 1.5, Infinity, 16777217]) {
    const e = mock([], []);
    await assert.rejects(
      fetchCandidates(config(e, { maxResponseBytes: value }), query),
      (err) => err.code === "CONFIG",
    );
    assert.equal(e.seen.length, 0);
  }
});

test("abort interrupts request, stream read and never-resolving retry delay", async () => {
  for (const stage of ["request", "body", "backoff"]) {
    let calls = 0,
      canceled = 0,
      start;
    const started = new Promise((resolve) => (start = resolve));
    const controller = new AbortController();
    const transport = async () => {
      calls++;
      if (stage === "request") {
        start();
        return new Promise(() => {});
      }
      if (stage === "backoff") return new Response("", { status: 429 });
      return new Response(
        new ReadableStream(
          {
            pull() {
              start();
              return new Promise(() => {});
            },
            cancel() {
              canceled++;
            },
          },
          { highWaterMark: 0 },
        ),
      );
    };
    const sleep = async () => {
      start();
      return new Promise(() => {});
    };
    const pending = fetchCandidates(
      { keyId: "x", secret: "y", transport, sleep, timeoutMs: 5000 },
      { ...query, signal: controller.signal },
    );
    await started;
    controller.abort();
    await assert.rejects(pending, (e) => e.code === "ABORTED");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(calls, 1, stage);
    if (stage === "body") assert.equal(canceled, 1);
  }
});

test("chunk counts and large arrays have independent limits", async () => {
  const response = streamed(["{", '"', "x", '"', ":", "0", "}"]);
  await assert.rejects(
    fetchCandidates(
      config(mock([response.response], []), { maxResponseChunks: 3 }),
      query,
    ),
    (e) => e.code === "LIMIT",
  );
  assert.equal(response.canceled(), 1);
  for (const action of [false, true]) {
    const huge = Array.from({ length: 5000 }, () => ({}));
    const m = action
      ? mock(
          [ok({ bars: {}, next_page_token: null })],
          [
            ok({
              corporate_actions: { cash_dividends: huge },
              next_page_token: null,
            }),
          ],
        )
      : mock([ok({ bars: { AAA: huge }, next_page_token: null })], []);
    await assert.rejects(
      fetchCandidates(config(m, { maxPageRecords: 100 }), query),
      (e) => e.code === "LIMIT",
    );
  }
  const m = mock(
    [ok({ bars: { AAA: [bar("2024-01-02", 1)] }, next_page_token: null })],
    [
      ok({
        corporate_actions: { cash_dividends: [dividend] },
        next_page_token: null,
      }),
    ],
  );
  const c = await fetchCandidates(
    config(m, { maxPageRecords: 1, maxTotalBars: 1, maxTotalActions: 1 }),
    query,
  );
  assert.equal(c.actions.length, 1);
});

test("aggregate byte budget spans separate pages", async () => {
  const one = JSON.stringify({ bars: {}, next_page_token: "next" });
  const two = JSON.stringify({ bars: {}, next_page_token: null });
  const size = Buffer.byteLength(one) + Buffer.byteLength(two);
  const stream = streamed([two]);
  const m = mock([streamed([one]).response, stream.response], []);
  await assert.rejects(
    fetchCandidates(
      config(m, {
        maxResponseBytes: Math.max(
          Buffer.byteLength(one),
          Buffer.byteLength(two),
        ),
        maxTotalBytes: size - 1,
      }),
      query,
    ),
    (e) => e.code === "LIMIT",
  );
  assert.equal(stream.canceled(), 1);
});

test("resource configuration rejects invalid or excessive budgets", async () => {
  for (const [field, value] of [
    ["maxTotalBytes", 0],
    ["maxTotalBytes", Number.MAX_SAFE_INTEGER + 1],
    ["maxResponseChunks", 0],
    ["maxResponseChunks", 65537],
    ["maxPageRecords", 10001],
    ["maxTotalBars", Number.MAX_SAFE_INTEGER + 1],
    ["maxTotalActions", Number.MAX_SAFE_INTEGER + 1],
  ]) {
    const m = mock([], []);
    await assert.rejects(
      fetchCandidates(config(m, { [field]: value }), query),
      (e) => e.code === "CONFIG",
    );
    assert.equal(m.seen.length, 0);
  }
});

test("default retry timer and abort listeners are removed on cancellation", async () => {
  const { getEventListeners } = await import("node:events");
  const controller = new AbortController();
  const originalSet = globalThis.setTimeout,
    originalClear = globalThis.clearTimeout;
  let retryTimer,
    cleared = false,
    calls = 0;
  globalThis.setTimeout = (fn, ms, ...args) => {
    const timer = originalSet(fn, ms, ...args);
    if (ms === 100) retryTimer = timer;
    return timer;
  };
  globalThis.clearTimeout = (timer) => {
    if (timer === retryTimer) cleared = true;
    return originalClear(timer);
  };
  try {
    const pending = fetchCandidates(
      {
        keyId: "x",
        secret: "y",
        transport: async () => {
          calls++;
          return new Response("", { status: 429 });
        },
      },
      { ...query, signal: controller.signal },
    );
    while (!retryTimer) await new Promise((resolve) => setImmediate(resolve));
    controller.abort();
    await assert.rejects(pending, (e) => e.code === "ABORTED");
    assert.equal(cleared, true);
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    assert.equal(calls, 1);
  } finally {
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
  }
});
