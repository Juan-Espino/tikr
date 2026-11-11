import test from "node:test";
import assert from "node:assert/strict";
import {
  createDurableBacktests,
  assetRecords,
} from "../src/lib/durable-market.ts";
import { chunks, readValue, revision } from "../src/lib/market-storage.ts";
import { capacityModel } from "../src/lib/market-budget.ts";
import { MarketFailure } from "../src/lib/market-errors.ts";
const sessions = ["2024-11-01", "2024-11-04", "2024-11-05"];
const calendar = {
  complete: true,
  finalityVerified: true,
  provenance: "synthetic",
  from: sessions[0],
  through: "2024-11-06",
  sessions,
};
const req = {
  portfolios: [{ id: "one", holdings: [{ symbol: "AAA", weight: "100" }] }],
  amount: "1000",
};
const asset = (symbol) => ({
  symbol,
  firstAvailable: sessions[0],
  from: sessions[0],
  through: sessions.at(-1),
  complete: true,
  inceptionVerified: true,
  pricesComplete: true,
  actionsComplete: true,
  accessComplete: true,
  priceBasis: "raw",
  provenance: "synthetic",
  prices: Object.fromEntries(sessions.map((d, i) => [d, String(100 + i * 10)])),
  actions: [],
});
function fixture() {
  let now = new Date("2024-11-06T14:00:00Z"),
    calls = 0;
  const rows = new Map(),
    leases = new Map();
  let revoked = false;
  const guards = new Set();
  const store = {
    async revoke() {
      revoked = true;
    },
    async assertReadable(symbols) {
      if (revoked) throw Error("EVIDENCE_REVOKED");
      if (symbols.some((s) => guards.has(s))) throw Error("REFRESH_GUARDED");
    },
    async beginRefresh(symbol) {
      guards.add(symbol);
      return async () => {
        guards.delete(symbol);
      };
    },
    async read(keys) {
      if (revoked) throw Error("EVIDENCE_REVOKED");
      return keys
        .map((k) => rows.get(k))
        .filter(Boolean)
        .map((r) => structuredClone(r));
    },
    async acquire(key, cycle, retry) {
      if (leases.get(key)?.cycle === cycle && !retry) return null;
      leases.set(key, { cycle });
      return "token";
    },
    async write(key, token, entries) {
      for (const e of entries) {
        for (const d of e.dependencies)
          if (rows.get(d.key)?.revision !== d.revision)
            throw Error("REVISION_CHANGED");
        rows.set(e.key, { ...structuredClone(e), checkedAt: now.valueOf() });
      }
    },
    async release() {},
  };
  const options = {
    evidenceValidUntil: () => Date.parse("2024-12-01T00:00:00Z"),
    storage: store,
    calendar: () => calendar,
    load: async (q) => {
      calls++;
      return { feed: "sip", asset: asset(q.symbol) };
    },
    supportedSymbols: ["AAA", "SPY"],
    historyStart: sessions[0],
    clock: () => now,
  };
  return {
    store,
    rows,
    options,
    calls: () => calls,
    setNow: (d) => (now = new Date(d)),
  };
}

test("refresh cooldown and shared-budget refusals survive cache error sanitization", async () => {
  for (const code of [
    "REFRESH_COOLDOWN",
    "SHARED_BUDGET_EXHAUSTED",
    "MISSING_PRICE",
  ]) {
    const f = fixture();
    const retryAt = Date.parse("2024-11-06T14:01:00Z");
    f.store.acquire = async () => {
      throw new MarketFailure(code, retryAt);
    };
    const final = await (
      await createDurableBacktests(f.options)(req, "Max", true)
    ).settled;
    assert.equal(final.status, "blocked");
    assert.equal(final.code, code);
    assert.equal(final.retryAt, retryAt);
    assert.equal(f.calls(), 0);
  }
});
test("restart reuses durable shared asset/result records without a provider refresh", async () => {
  const f = fixture();
  const run = createDurableBacktests(f.options);
  const first = await run(req, "Max");
  assert.equal(first.initial.status, "refreshing");
  const final = await first.settled;
  assert.equal(final.status, "ready");
  assert.equal(final.result.portfolios[0].ending, "1200");
  assert.equal(f.calls(), 2);
  const reopened = await createDurableBacktests(f.options)(req, "Max");
  assert.equal(reopened.initial.status, "ready");
  assert.equal(f.calls(), 2);
});
test("asset correction invalidates a persisted result and recalculates", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  const revised = asset("AAA");
  revised.prices[sessions.at(-1)] = "150";
  for (const e of assetRecords(revised))
    f.rows.set(e.key, { ...e, checkedAt: Date.parse("2024-11-06T14:00:00Z") });
  const opened = await createDurableBacktests(f.options)(req, "Max");
  assert.equal(opened.initial.status, "refreshing");
  assert.equal((await opened.settled).result.portfolios[0].ending, "1500");
});
test("missing asset chunk or mixed revisions cannot produce a result", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.rows.delete("price:AAA:2024-11");
  f.rows.delete(
    [...f.rows.keys()].find(
      (k) => k.startsWith("result:slot") && !k.includes("part"),
    ),
  );
  const v = await (await createDurableBacktests(f.options)(req, "Max")).settled;
  assert.equal(v.status, "blocked");
  assert.equal(v.result, undefined);
});
test("monthly source chunks change only when their data changes", () => {
  const a = asset("AAA");
  a.prices["2024-12-02"] = "130";
  a.through = "2024-12-02";
  const before = assetRecords(a);
  a.prices["2024-12-02"] = "140";
  const after = assetRecords(a);
  assert.equal(
    before.find((r) => r.key === "price:AAA:2024-11").revision,
    after.find((r) => r.key === "price:AAA:2024-11").revision,
  );
  assert.notEqual(before.at(-1).revision, after.at(-1).revision);
});
test("manifest integrity and result chunk limits are enforced", async () => {
  const f = fixture(),
    value = { v: "test" };
  for (const e of chunks("result:slot0", value))
    f.rows.set(e.key, { ...e, checkedAt: 0 });
  const head = f.rows.get("result:slot0");
  assert.deepEqual(await readValue(f.store, head), value);
  f.rows.get("result:slot0:part0").payload = "{}";
  await assert.rejects(readValue(f.store, head), /REVISION_CHANGED/);
  assert.throws(
    () => chunks("result:slot0", "a".repeat(1_000_001)),
    /PAYLOAD_LIMIT/,
  );
  assert.equal(revision(value).length, 64);
});
test("capacity model refuses unsupported scale and shows traffic growth", () => {
  const base = {
    assets: 6,
    sessions: 1260,
    users: 1,
    opensPerDay: 2,
    headBytes: 2000,
    cacheHitsPercent: 70,
    chartBytes: 300_000,
    sourceBytes: 50_000,
  };
  assert.equal(capacityModel(base).fits, true);
  assert.equal(capacityModel({ ...base, users: 1000 }).fits, false);
  assert.throws(() => capacityModel({ ...base, assets: 51 }), /CATALOG_LIMIT/);
});

test("pending newest session preserves an explicitly verified older common endpoint", async () => {
  const f = fixture();
  f.options.load = async (q) => {
    const a = asset(q.symbol);
    a.through = sessions[1];
    delete a.prices[sessions[2]];
    return { feed: "sip", asset: a, pendingSession: sessions[2] };
  };
  const result = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(result.status, "stale");
  assert.equal(result.result.actual.end, sessions[1]);
  assert.equal(result.code, "SESSION_PENDING");
  const again = await createDurableBacktests(f.options)(req, "Max");
  assert.equal(again.initial.status, "stale");
});
test("a failed later refresh retains only an unchanged dated verified result", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.setNow("2024-11-07T14:00:00Z");
  f.options.load = async () => {
    throw new Error("private-error");
  };
  const job = await createDurableBacktests(f.options)(req, "Max");
  assert.equal(job.initial.status, "refreshing");
  const result = await job.settled;
  assert.equal(result.status, "stale");
  assert.equal(result.asOf, sessions.at(-1));
  assert.ok(!JSON.stringify(result).includes("private-error"));
});
test("a changed evidence bundle forces revalidation rather than a fresh memo hit", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.options.evidenceRevision = "different-evidence";
  f.options.load = async () => {
    throw Error("unverified");
  };
  const result = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(result.status, "blocked");
  assert.equal(result.result, undefined);
});
test("known corrected evidence revokes a persisted asset even after the request ends", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.options.load = async () => {
    const e = new Error("EVIDENCE_CHANGED");
    e.code = "EVIDENCE_CHANGED";
    throw e;
  };
  await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  await assert.rejects(
    createDurableBacktests(f.options)(req, "Max"),
    /EVIDENCE_REVOKED/,
  );
});

test("same-cycle reopen and restart reject expired evidence before serving a cached result", async () => {
  const f = fixture();
  f.options.evidenceValidUntil = () => Date.parse("2024-11-06T15:00:00Z");
  const run = createDurableBacktests(f.options);
  assert.equal((await (await run(req, "Max")).settled).status, "ready");
  f.setNow("2024-11-06T15:01:00Z");
  await assert.rejects(run(req, "Max"), /EVIDENCE_EXPIRED/);
  await assert.rejects(
    createDurableBacktests(f.options)(req, "Max"),
    /EVIDENCE_EXPIRED/,
  );
});

test("failed Convex tombstone cannot serve a known correction in this request or after restart", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  const write = f.store.write;
  f.store.write = async (...args) => {
    if (args[2].some((e) => e.payload.includes("invalidated")))
      throw Error("CONVEX_UNAVAILABLE");
    return write(...args);
  };
  f.options.load = async () => {
    const e = new Error("changed");
    e.code = "EVIDENCE_CHANGED";
    throw e;
  };
  const result = await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  assert.equal(result.result, undefined);
  await assert.rejects(
    createDurableBacktests({ ...f.options, storage: { ...f.store } })(
      req,
      "Max",
    ),
    /EVIDENCE_REVOKED/,
  );
});

test("an in-flight saved result cannot escape a revocation from a separate store instance", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  let release, reading;
  const reached = new Promise((r) => (reading = r)),
    wait = new Promise((r) => (release = r));
  const read = f.store.read;
  const delayed = {
    ...f.store,
    async read(keys) {
      const result = await read(keys);
      if (keys.some((k) => k.includes(":part"))) {
        reading();
        await wait;
      }
      return result;
    },
  };
  const pending = createDurableBacktests({ ...f.options, storage: delayed })(
    req,
    "Max",
  );
  await reached;
  await f.store.revoke();
  release();
  await assert.rejects(pending, /EVIDENCE_REVOKED/);
});

test("failed revocation marker creation leaves the pre-existing refresh guard after restart", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.store.revoke = async () => {
    throw Error("MARKER_WRITE_FAILED");
  };
  f.options.load = async () => {
    const error = new Error("changed");
    error.code = "EVIDENCE_CHANGED";
    throw error;
  };
  assert.equal(
    (await (await createDurableBacktests(f.options)(req, "Max", true)).settled)
      .result,
    undefined,
  );
  const restarted = await createDurableBacktests({
    ...f.options,
    storage: { ...f.store },
  })(req, "Max");
  assert.equal(restarted.initial.status, "refreshing");
  const final = await restarted.settled;
  assert.equal(final.status, "blocked");
  assert.equal(final.result, undefined);
});

test("a second open after a real on-disk guard joins the refresh without another loader call", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises"),
    { tmpdir } = await import("node:os"),
    { join, resolve, sep, basename } = await import("node:path"),
    { createAdmission } = await import("../src/lib/market-admission.ts");
  const dir = await mkdtemp(join(tmpdir(), "tikr-join-"));
  try {
    const admission = createAdmission(dir),
      scope = "f".repeat(64),
      f = fixture();
    f.store.assertReadable = (symbols) =>
      admission.assertReadable(scope, symbols);
    f.store.beginRefresh = (symbol) => admission.beginRefresh(scope, symbol);
    f.store.revoke = () => admission.revoke(scope);
    let release, started;
    const observed = new Promise((r) => (started = r)),
      wait = new Promise((r) => (release = r));
    let calls = 0;
    f.options.load = async (q) => {
      calls++;
      started();
      await wait;
      return { feed: "sip", asset: asset(q.symbol) };
    };
    const one = await createDurableBacktests(f.options)(req, "Max");
    await observed;
    const two = await createDurableBacktests({
      ...f.options,
      storage: { ...f.store },
    })(req, "Max");
    assert.equal(two.initial.status, "refreshing");
    release();
    assert.equal((await one.settled).status, "ready");
    assert.equal((await two.settled).status, "ready");
    assert.equal(calls, 2);
  } finally {
    const target = resolve(dir);
    if (
      !target.startsWith(resolve(tmpdir()) + sep) ||
      !basename(target).startsWith("tikr-join-")
    )
      throw Error("UNSAFE_CLEANUP");
    await rm(target, { recursive: true });
  }
});

test("monthly compact heads preserve out-of-order actions and reject changed action chunks", async () => {
  const f = fixture();
  const a = asset("AAA");
  a.actions = [
    {
      id: "later",
      type: "dividend",
      date: sessions[2],
      paymentDate: sessions[2],
      amount: "1",
      basis: "postSplit",
    },
    {
      id: "earlier",
      type: "dividend",
      date: sessions[1],
      paymentDate: sessions[2],
      amount: "2",
      basis: "postSplit",
    },
  ];
  f.options.load = async (q) => ({
    feed: "sip",
    asset: q.symbol === "AAA" ? a : asset("SPY"),
  });
  const first = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(first.status, "ready");
  const warm = await createDurableBacktests(f.options)(req, "Max");
  assert.equal(warm.initial.status, "ready");
  const head = f.rows.get("asset:AAA");
  assert.equal(JSON.parse(head.payload).meta.actions, undefined);
  assert.equal(
    JSON.parse(head.payload).prices.every((k) => typeof k === "string"),
    true,
  );
});

test("pending newest data anchors the preset to the earlier shared verified endpoint", async () => {
  const days = [
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
      "2024-01-05",
      "2024-01-08",
      "2024-01-09",
      "2024-01-10",
      "2024-01-11",
      "2024-01-12",
    ],
    f = fixture();
  f.options.historyStart = days[0];
  f.options.calendar = () => ({
    ...calendar,
    from: days[0],
    through: "2024-01-14",
    sessions: days,
  });
  f.setNow("2024-01-13T14:00:00Z");
  f.options.load = async (q) => ({
    feed: "sip",
    pendingSession: days.at(-1),
    asset: {
      ...asset(q.symbol),
      from: days[0],
      firstAvailable: days[0],
      through: days.at(-2),
      prices: Object.fromEntries(
        days.slice(0, -1).map((d, i) => [d, String(100 + i)]),
      ),
    },
  });
  const view = await (
    await createDurableBacktests(f.options)(req, "1W")
  ).settled;
  assert.equal(view.status, "stale");
  assert.deepEqual(view.result.actual, {
    start: "2024-01-04",
    end: "2024-01-11",
  });
});


test("durable full and partial manifests respect the requested window across restart and revisions", async () => {
  const f = fixture();
  const days = ["2024-10-01", "2024-10-29", ...sessions];
  f.options.calendar = () => ({ ...calendar, from: days[0], sessions: days });
  f.options.historyStart = days[0];
  const calls = [];
  f.options.load = async (q) => {
    calls.push(q.from);
    return { feed: "sip", asset: { ...asset(q.symbol), from: q.from, firstAvailable: days[0],
      prices: Object.fromEntries(days.filter((d) => d >= q.from).map((d) => [d, "100"])) } };
  };
  const first = await (await createDurableBacktests(f.options)(req, "1W")).settled;
  assert.equal(first.status, "ready"); assert.ok(calls.every((d) => d === "2024-10-29"));
  const again = await (await createDurableBacktests(f.options)(req, "1W")).settled;
  assert.equal(again.status, "ready"); assert.equal(calls.length, 2);
  // Synthetic store permits expansion under the same per-symbol lock; production
  // transaction coverage is exercised in convex/market.test.ts.
  f.store.acquire = async () => "token";
  const expanded = await (await createDurableBacktests(f.options)(req, "Max")).settled;
  assert.equal(expanded.status, "ready"); assert.ok(calls.slice(2).every((d) => d === days[0]));
  assert.notDeepEqual(expanded.dataRevisions, first.dataRevisions);
  const narrow = await (await createDurableBacktests(f.options)(req, "1W")).settled;
  assert.equal(narrow.status, "ready"); assert.equal(calls.length, 4);
  assert.equal(narrow.result.actual.start, "2024-10-29");
});
