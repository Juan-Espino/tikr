import test from "node:test";
import assert from "node:assert/strict";
import {
  createDurableBacktests,
  assetRecords,
} from "../src/lib/durable-market.ts";
import { chunks, readValue, revision } from "../src/lib/market-storage.ts";
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
    return {
      feed: "sip",
      asset: {
        ...asset(q.symbol),
        from: q.from,
        firstAvailable: days[0],
        prices: Object.fromEntries(
          days.filter((d) => d >= q.from).map((d) => [d, "100"]),
        ),
      },
    };
  };
  const first = await (
    await createDurableBacktests(f.options)(req, "1W")
  ).settled;
  assert.equal(first.status, "ready");
  assert.ok(calls.every((d) => d === "2024-10-29"));
  const again = await (
    await createDurableBacktests(f.options)(req, "1W")
  ).settled;
  assert.equal(again.status, "ready");
  assert.equal(calls.length, 2);
  // Synthetic store permits expansion under the same per-symbol lock; production
  // transaction coverage is exercised in convex/market.test.ts.
  f.store.acquire = async () => "token";
  const expanded = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(expanded.status, "ready");
  assert.ok(calls.slice(2).every((d) => d === days[0]));
  assert.notDeepEqual(expanded.dataRevisions, first.dataRevisions);
  const narrow = await (
    await createDurableBacktests(f.options)(req, "1W")
  ).settled;
  assert.equal(narrow.status, "ready");
  assert.equal(calls.length, 4);
  assert.equal(narrow.result.actual.start, "2024-10-29");
});

test("explicit recovery commits freshly validated history and receipts without deleting abandoned guards", async () => {
  const { mkdtemp, rm, readdir, stat } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join, resolve, sep, basename } = await import("node:path");
  const { createAdmission } = await import("../src/lib/market-admission.ts");
  const dir = await mkdtemp(join(tmpdir(), "tikr-recover-"));
  try {
    const f = fixture(),
      scope = "b".repeat(64),
      gate = createAdmission(dir);
    f.options.evidenceRevision = scope;
    f.store.recoverySymbols = (symbols) => gate.guardedSymbols(scope, symbols);
    f.store.assertReadable = async (symbols) =>
      gate.assertReadable(
        scope,
        symbols,
        Object.fromEntries(
          symbols.map((s) => [s, f.rows.get("asset:" + s)?.revision]),
        ),
      );
    f.store.beginRefresh = (symbol) => gate.beginRefresh(scope, symbol);
    f.store.confirmRefresh = async (symbol, headRevision) => {
      assert.equal(f.rows.get("asset:" + symbol)?.revision, headRevision);
      await gate.confirmRefresh(scope, symbol, headRevision);
    };
    assert.equal(
      (await (await createDurableBacktests(f.options)(req, "Max")).settled)
        .status,
      "ready",
    );
    await (await gate.beginRefresh(scope, "SPY")).endObservation();
    const guard = (await readdir(dir)).find((n) => n.endsWith(".flag"));
    const before = await stat(join(dir, guard));
    const calls = f.calls();
    const recover = await createDurableBacktests(f.options)(req, "Max", true);
    assert.equal(recover.initial.result, undefined);
    assert.equal((await recover.settled).status, "ready");
    assert.equal(f.calls(), calls + 1);
    assert.equal(
      (
        await (
          await createDurableBacktests({
            ...f.options,
            storage: { ...f.store },
          })(req, "Max")
        ).settled
      ).status,
      "ready",
    );
    const after = await stat(join(dir, guard));
    assert.equal(after.mtimeMs, before.mtimeMs);
    await gate.revoke(scope);
    await assert.rejects(
      createDurableBacktests(f.options)(req, "Max", true),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    if (
      !resolve(dir).startsWith(resolve(tmpdir()) + sep) ||
      !basename(dir).startsWith("tikr-recover-")
    )
      throw Error("UNSAFE_CLEANUP");
    await rm(dir, { recursive: true });
  }
});

test("one explicit guarded retry terminates after source, write or receipt failure", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join, resolve, sep, basename } = await import("node:path");
  const { createAdmission } = await import("../src/lib/market-admission.ts");
  for (const mode of ["source", "write", "receipt"]) {
    const dir = await mkdtemp(join(tmpdir(), "tikr-recover-"));
    try {
      const f = fixture(),
        scope = "f".repeat(64),
        gate = createAdmission(dir);
      f.options.evidenceRevision = scope;
      f.store.recoverySymbols = (s) => gate.guardedSymbols(scope, s);
      f.store.assertReadable = async (s) =>
        gate.assertReadable(
          scope,
          s,
          Object.fromEntries(
            s.map((x) => [x, f.rows.get("asset:" + x)?.revision]),
          ),
        );
      f.store.beginRefresh = (s) => gate.beginRefresh(scope, s);
      f.store.confirmRefresh = (s, r) => gate.confirmRefresh(scope, s, r);
      await (
        await createDurableBacktests(f.options)(req, "Max")
      ).settled;
      await (await gate.beginRefresh(scope, "SPY")).endObservation();
      let calls = 0;
      f.options.load = async (q) => {
        calls++;
        if (calls > 1) throw Error("UNBOUNDED_RETRY");
        if (mode === "source") throw Error("SOURCE_UNAVAILABLE");
        return { feed: "sip", asset: asset(q.symbol) };
      };
      if (mode === "write")
        f.store.write = async () => {
          throw Error("STORAGE_UNAVAILABLE");
        };
      if (mode === "receipt")
        f.store.confirmRefresh = async () => {
          throw Error("RECEIPT_UNAVAILABLE");
        };
      const final = await (
        await createDurableBacktests(f.options)(req, "Max", true)
      ).settled;
      assert.equal(final.status, "blocked");
      assert.equal(
        final.code,
        mode === "write" ? "STORAGE_UNAVAILABLE" : "REFRESH_FAILED",
      );
      assert.equal(final.result, undefined);
      assert.equal(calls, 1);
    } finally {
      if (
        !resolve(dir).startsWith(resolve(tmpdir()) + sep) ||
        !basename(dir).startsWith("tikr-recover-")
      )
        throw Error("UNSAFE_CLEANUP");
      await rm(dir, { recursive: true });
    }
  }
});

test("partial recovery cannot use a saved stale portfolio when another symbol fails", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join, resolve, sep, basename } = await import("node:path");
  const { createAdmission } = await import("../src/lib/market-admission.ts");
  const dir = await mkdtemp(join(tmpdir(), "tikr-recover-"));
  try {
    const f = fixture(),
      scope = "9".repeat(64),
      gate = createAdmission(dir);
    f.options.evidenceRevision = scope;
    f.store.recoverySymbols = (s) => gate.guardedSymbols(scope, s);
    f.store.assertReadable = async (s) =>
      gate.assertReadable(
        scope,
        s,
        Object.fromEntries(
          s.map((x) => [x, f.rows.get("asset:" + x)?.revision]),
        ),
      );
    f.store.beginRefresh = (s) => gate.beginRefresh(scope, s);
    f.store.confirmRefresh = (s, r) => gate.confirmRefresh(scope, s, r);
    assert.equal(
      (await (await createDurableBacktests(f.options)(req, "Max")).settled)
        .status,
      "ready",
    );
    const old = f.rows.get("asset:SPY").revision;
    await (await gate.beginRefresh(scope, "SPY")).endObservation();
    f.setNow("2024-11-07T14:00:00Z");
    f.options.load = async (q) => {
      if (q.symbol === "AAA") throw Error("SOURCE_UNAVAILABLE");
      return { feed: "sip", asset: asset(q.symbol) };
    };
    const attempt = await createDurableBacktests(f.options)(req, "Max", true);
    assert.equal(attempt.initial.result, undefined);
    const final = await attempt.settled;
    assert.equal(final.status, "blocked");
    assert.equal(final.result, undefined);
    assert.equal(f.rows.get("asset:SPY").revision, old);
    await f.store.assertReadable(["SPY"]); // Its proof succeeded; the portfolio must still be blocked.
  } finally {
    if (
      !resolve(dir).startsWith(resolve(tmpdir()) + sep) ||
      !basename(dir).startsWith("tikr-recover-")
    )
      throw Error("UNSAFE_CLEANUP");
    await rm(dir, { recursive: true });
  }
});

test("warm asset memory avoids monthly reads but still respects durable revisions and revocation", async () => {
  const f = fixture();
  f.store.namespace = "durable-memory-isolation";
  let monthlyReads = 0;
  const read = f.store.read;
  f.store.read = async (keys) => {
    monthlyReads += keys.filter((k) => k.startsWith("price:")).length;
    return read(keys);
  };
  const first = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(first.status, "ready");
  const calls = f.calls();
  monthlyReads = 0;
  const warm = await (
    await createDurableBacktests(f.options)({ ...req, amount: "2000" }, "Max")
  ).settled;
  assert.equal(warm.status, "ready");
  assert.equal(monthlyReads, 0);
  assert.equal(f.calls(), calls);
  assert.equal(warm.result.portfolios[0].points[0].value, "2000");
  f.rows.get("asset:AAA").revision = "f".repeat(64);
  const changed = await (
    await createDurableBacktests(f.options)({ ...req, amount: "3000" }, "Max")
  ).settled;
  assert.equal(changed.status, "blocked");
  assert.equal(changed.result, undefined);
  assert.ok(monthlyReads > 0);
  await f.store.revoke();
  await assert.rejects(
    createDurableBacktests(f.options)(req, "Max"),
    /EVIDENCE_REVOKED/,
  );
});

test("a changed supported history window clamps retained coverage to the new calendar", async () => {
  const f = fixture();
  f.options.evidenceRevision = "old-window";
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  f.options.evidenceRevision = "new-window";
  f.options.historyStart = sessions[1];
  f.options.calendar = () => ({
    ...calendar,
    from: sessions[1],
    sessions: sessions.slice(1),
  });
  const requested = [];
  f.options.load = async (q) => {
    requested.push(q.from);
    return {
      feed: "sip",
      asset: {
        ...asset(q.symbol),
        from: sessions[1],
        firstAvailable: sessions[1],
        prices: Object.fromEntries(
          sessions.slice(1).map((d, i) => [d, String(110 + i * 10)]),
        ),
      },
    };
  };
  const final = await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  assert.equal(final.status, "ready");
  assert.deepEqual(requested, [sessions[1], sessions[1]]);
  assert.equal(final.result.actual.start, sessions[1]);
});

test("known period limitations survive restart without another source attempt and do not block other periods", async () => {
  const f = fixture();
  let failingCalls = 0;
  f.options.load = async (q) => {
    if (q.symbol === "AAA") {
      failingCalls++;
      throw new MarketFailure("MISSING_PRICE");
    }
    return { feed: "sip", asset: asset(q.symbol) };
  };
  const first = await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  assert.equal(first.status, "blocked");
  assert.equal(first.code, "MISSING_PRICE");
  assert.equal(failingCalls, 1);
  const restarted = await (
    await createDurableBacktests({ ...f.options, storage: { ...f.store } })(
      req,
      "Max",
    )
  ).settled;
  assert.equal(restarted.status, "blocked");
  assert.equal(restarted.code, "MISSING_PRICE");
  assert.equal(failingCalls, 1);
  assert.equal(
    (
      await (
        await createDurableBacktests(f.options)(
          {
            portfolios: [
              { id: "spy-only", holdings: [{ symbol: "SPY", weight: "100" }] },
            ],
            amount: "1000",
          },
          "Max",
        )
      ).settled
    ).status,
    "ready",
  );
});

test("retrying incomplete coverage does not refetch a fresh unrelated benchmark", async () => {
  const f = fixture();
  await (
    await createDurableBacktests(f.options)(req, "Max")
  ).settled;
  const narrow = {
    ...asset("AAA"),
    from: sessions[1],
    firstAvailable: sessions[1],
    prices: { [sessions[1]]: "110", [sessions[2]]: "120" },
  };
  await f.store.write("asset:AAA", "token", assetRecords(narrow));
  const requested = [];
  f.options.load = async (q) => {
    requested.push(q.symbol);
    throw new MarketFailure("MISSING_PRICE");
  };
  const final = await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  assert.equal(final.status, "blocked");
  assert.equal(final.code, "MISSING_PRICE");
  assert.deepEqual(requested, ["AAA"]);
});

test("a real asset revocation survives restart while unrelated SPY remains readable", async () => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { createAdmission } = await import("../src/lib/market-admission.ts");
  const dir = await mkdtemp(join(tmpdir(), "tikr-correction-isolation-"));
  const f = fixture(),
    scope = "c".repeat(64);
  f.store.revoke = (symbol) => createAdmission(dir).revoke(scope, symbol);
  f.store.assertReadable = (symbols) =>
    createAdmission(dir).assertReadable(scope, symbols);
  const run = createDurableBacktests(f.options);
  assert.equal((await (await run(req, "Max")).settled).status, "ready");
  f.options.load = async (q) => {
    if (q.symbol === "AAA") {
      const error = new Error("changed");
      error.code = "EVIDENCE_CHANGED";
      throw error;
    }
    return { feed: "sip", asset: asset(q.symbol) };
  };
  const corrected = await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  assert.equal(corrected.result, undefined);
  const restarted = createDurableBacktests({
    ...f.options,
    storage: { ...f.store },
  });
  await assert.rejects(restarted(req, "Max"), /EVIDENCE_REVOKED/);
  const spy = {
    ...req,
    portfolios: [{ id: "spy", holdings: [{ symbol: "SPY", weight: "100" }] }],
  };
  assert.equal((await (await restarted(spy, "Max")).settled).status, "ready");
  await assert.rejects(restarted(req, "Max", true), /EVIDENCE_REVOKED/);
  // Keep the synthetic revocation marker as evidence, too.
});

// Actual application storage calls/payloads, not platform billing.
test("process results eliminate durable portfolio writes while preserving guards and revisions", async () => {
  const { withProcessResults } =
    await import("../src/lib/market-result-memory.ts");
  const f = fixture();
  const originalWrite = f.store.write.bind(f.store);
  const writes = [];
  f.store.write = async (key, token, rows) => {
    writes.push({
      key,
      documents: rows.length,
      payloadBytes: Buffer.byteLength(JSON.stringify(rows)),
    });
    return originalWrite(key, token, rows);
  };
  const options = {
    ...f.options,
    storage: withProcessResults(f.store, "synthetic-result-test", () =>
      Date.parse("2024-11-06T14:00:00Z"),
    ),
  };
  const first = await (
    await createDurableBacktests(options)(req, "Max")
  ).settled;
  assert.equal(first.status, "ready");
  assert.equal(
    writes.some((w) => w.key.startsWith("job:")),
    false,
  );
  assert.equal(
    [...f.rows.keys()].some((key) => key.startsWith("result:")),
    false,
  );
  const warm = await createDurableBacktests(options)(req, "Max");
  assert.equal(warm.initial.status, "ready");
  assert.deepEqual(warm.initial.result, first.result);
  assert.equal(f.calls(), 2);
  await f.store.revoke();
  await assert.rejects(
    createDurableBacktests(options)(req, "Max"),
    /EVIDENCE_REVOKED/,
  );
});

test("measured before/after result storage workload has identical financial output", async (t) => {
  const { withProcessResults } =
    await import("../src/lib/market-result-memory.ts");
  const measurements = [];
  for (const mode of ["durable-before", "process-after"]) {
    const f = fixture();
    const counts = {
      mode,
      readCalls: 0,
      requestedKeys: 0,
      returnedDocuments: 0,
      readPayloadBytes: 0,
      writeCalls: 0,
      writtenDocuments: 0,
      writePayloadBytes: 0,
    };
    const read = f.store.read.bind(f.store),
      write = f.store.write.bind(f.store);
    f.store.read = async (keys) => {
      const rows = await read(keys);
      counts.readCalls++;
      counts.requestedKeys += keys.length;
      counts.returnedDocuments += rows.length;
      counts.readPayloadBytes += Buffer.byteLength(JSON.stringify(rows));
      return rows;
    };
    f.store.write = async (key, token, rows) => {
      counts.writeCalls++;
      counts.writtenDocuments += rows.length;
      counts.writePayloadBytes += Buffer.byteLength(JSON.stringify(rows));
      return write(key, token, rows);
    };
    const storage =
      mode === "process-after"
        ? withProcessResults(f.store, "measurement-fixture", () =>
            Date.parse("2024-11-06T14:00:00Z"),
          )
        : f.store;
    const run = createDurableBacktests({ ...f.options, storage });
    const cold = await (await run(req, "Max")).settled;
    const warm = await (await run(req, "Max")).settled;
    assert.equal(cold.result.portfolios[0].ending, "1200");
    assert.deepEqual(warm.result, cold.result);
    measurements.push({ ...counts, syntheticLoaderCalls: f.calls() });
  }
  assert.ok(
    measurements[1].writePayloadBytes < measurements[0].writePayloadBytes,
  );
  assert.ok(
    measurements[1].writtenDocuments < measurements[0].writtenDocuments,
  );
  t.diagnostic(
    JSON.stringify({
      scope:
        "synthetic application storage operations; not provider traffic or Convex billing",
      measurements,
    }),
  );
});

test("bounded coordinator deadline includes admission queueing before healthy provider work", async () => {
  for (const [timeoutMs, expected] of [
    [5, "blocked"],
    [200, "ready"],
  ]) {
    const f = fixture();
    const load = f.options.load;
    const result = await (
      await createDurableBacktests({
        ...f.options,
        timeoutMs,
        load: async (q) => {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 30);
            q.signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timer);
                reject(Error("ABORTED"));
              },
              { once: true },
            );
          });
          return load(q);
        },
      })(req, "Max")
    ).settled;
    assert.equal(result.status, expected);
  }
});

test("durable monthly payload survives process/browser loss with refresh allowance exhausted", async () => {
  const { withDisposableHistory } =
    await import("../src/lib/market-history-storage.ts");
  const f = fixture();
  f.store.namespace = "durable-payload-before-restart";
  const first = await (
    await createDurableBacktests({
      ...f.options,
      storage: withDisposableHistory(f.store).storage,
    })(req, "Max")
  ).settled;
  assert.equal(first.status, "ready");
  for (const key of f.rows.keys())
    if (key.startsWith("result:")) f.rows.delete(key);
  f.store.namespace = "durable-payload-after-restart";
  f.store.acquire = async (key) => {
    if (key.startsWith("asset:")) throw new MarketFailure("REFRESH_COOLDOWN");
    return "token";
  };
  const second = await (
    await createDurableBacktests({
      ...f.options,
      storage: withDisposableHistory(f.store).storage,
    })(req, "Max")
  ).settled;
  assert.equal(second.status, "ready");
  assert.deepEqual(second.result, first.result);
  assert.equal(f.calls(), 2);
});

test("history persists authoritative chunks and rejects forged browser content", async () => {
  const { withDisposableHistory } =
    await import("../src/lib/market-history-storage.ts");
  const f = fixture();
  f.store.namespace = "disposable-history-fixture";
  const history = withDisposableHistory(f.store);
  const first = await (
    await createDurableBacktests({ ...f.options, storage: history.storage })(
      req,
      "Max",
    )
  ).settled;
  assert.equal(first.status, "ready");
  assert.equal(
    [...f.rows.keys()].some((key) => key.startsWith("price:")),
    true,
  );
  assert.ok(JSON.parse(f.rows.get("asset:AAA").payload).content);
  const hints = history.exported();
  assert.equal(hints.length, 2);
  // A new process namespace loses all disposable memory, but the durable content
  // hashes and revocations still refer to exactly the same legacy guard scope.
  f.store.namespace = "disposable-history-new-process";
  const restarted = withDisposableHistory(f.store, hints);
  const second = await (
    await createDurableBacktests({ ...f.options, storage: restarted.storage })(
      req,
      "Max",
    )
  ).settled;
  assert.equal(second.status, "ready");
  assert.deepEqual(second.result, first.result);
  assert.equal(f.calls(), 2);
  f.store.namespace = "disposable-history-forgery";
  for (const key of f.rows.keys())
    if (key.startsWith("result:")) f.rows.delete(key);
  const forged = withDisposableHistory(
    f.store,
    hints.map((row) => ({
      ...row,
      payload: row.payload.replace("100", "999"),
      revision: revision(JSON.parse(row.payload.replace("100", "999"))),
    })),
  );
  const rejected = await (
    await createDurableBacktests({ ...f.options, storage: forged.storage })(
      req,
      "Max",
    )
  ).settled;
  assert.equal(rejected.status, "blocked");
  assert.equal(f.calls(), 2);
  await f.store.revoke();
  await assert.rejects(
    createDurableBacktests({ ...f.options, storage: restarted.storage })(
      req,
      "Max",
    ),
    /EVIDENCE_REVOKED/,
  );
});

test("guard rejection and failed guard settlement always release the acquired lease without provider work", async () => {
  for (const stage of ["begin", "finish"]) {
    const f = fixture();
    const released = [];
    f.store.release = async (key) => {
      released.push(key);
    };
    f.store.beginRefresh = async () => {
      if (stage === "begin") throw new MarketFailure("REFRESH_GUARDED");
      return async () => {
        throw Error("STORAGE_UNAVAILABLE");
      };
    };
    const final = await (
      await createDurableBacktests(f.options)(req, "Max", true)
    ).settled;
    assert.equal(final.status, "blocked");
    assert.deepEqual(released.sort(), ["asset:AAA", "asset:SPY"]);
    assert.equal(f.calls(), stage === "begin" ? 0 : 2);
  }
});

test("retry after disposable payload loss preserves the authoritative wider coverage boundary", async () => {
  const f = fixture();
  const days = [
    "2024-10-28",
    "2024-10-29",
    "2024-10-30",
    "2024-10-31",
    "2024-11-01",
    "2024-11-04",
    "2024-11-05",
    "2024-11-06",
    "2024-11-07",
    "2024-11-08",
  ];
  f.options.calendar = () => ({
    ...calendar,
    from: days[0],
    through: "2024-11-09",
    sessions: days,
  });
  f.options.historyStart = days[0];
  f.setNow("2024-11-09T14:00:00Z");
  const requested = [];
  f.options.load = async (q) => {
    requested.push(q.from);
    return {
      feed: "sip",
      asset: {
        ...asset(q.symbol),
        firstAvailable: days[0],
        from: q.from,
        through: days.at(-1),
        prices: Object.fromEntries(
          days.filter((d) => d >= q.from).map((d) => [d, "100"]),
        ),
      },
    };
  };
  assert.equal(
    (await (await createDurableBacktests(f.options)(req, "Max")).settled)
      .status,
    "ready",
  );
  for (const key of f.rows.keys())
    if (key.startsWith("price:") || key.startsWith("result:"))
      f.rows.delete(key);
  requested.length = 0;
  const final = await (
    await createDurableBacktests(f.options)(req, "1W", true)
  ).settled;
  assert.equal(final.status, "ready");
  assert.deepEqual(requested, [days[0], days[0]]);
  assert.equal(final.result.actual.start, "2024-11-01");
});

test("lost modern disposable content can rehydrate retained legacy rows only against the current complete root", async () => {
  const { withDisposableHistory } =
    await import("../src/lib/market-history-storage.ts");
  const f = fixture();
  assert.equal(
    (await (await createDurableBacktests(f.options)(req, "Max")).settled)
      .status,
    "ready",
  );
  for (const [key, row] of f.rows) {
    if (key.startsWith("result:")) f.rows.delete(key);
    if (key.startsWith("asset:"))
      row.payload = JSON.stringify({
        ...JSON.parse(row.payload),
        content: true,
      });
  }
  const restored = withDisposableHistory({
    ...f.store,
    namespace: "retained-legacy-root-oracle",
  });
  const final = await (
    await createDurableBacktests({ ...f.options, storage: restored.storage })(
      req,
      "Max",
    )
  ).settled;
  assert.equal(final.status, "ready");
  assert.equal(f.calls(), 2);
  // A retained monthly row whose self-hash is valid still cannot override a
  // different authoritative whole-asset root after process/browser cache loss.
  const row = f.rows.get("price:AAA:2024-11");
  const value = JSON.parse(row.payload);
  value.prices[sessions[1]] = "999";
  row.payload = JSON.stringify(value);
  row.revision = revision(value);
  const changed = withDisposableHistory({
    ...f.store,
    namespace: "retained-legacy-root-negative",
  });
  const blocked = await (
    await createDurableBacktests({
      ...f.options,
      storage: changed.storage,
      load: async () => {
        throw new MarketFailure("SOURCE_FAILURE");
      },
    })(req, "Max")
  ).settled;
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.result, undefined);
});

test("an explicit retry for lost content reuses a healthy benchmark even when its provider allowance is exhausted", async () => {
  const f = fixture();
  assert.equal(
    (await (await createDurableBacktests(f.options)(req, "Max")).settled)
      .status,
    "ready",
  );
  for (const key of f.rows.keys())
    if (key.startsWith("price:AAA:") || key.startsWith("result:"))
      f.rows.delete(key);
  const acquire = f.store.acquire;
  f.store.acquire = async (...args) => {
    if (args[0] === "asset:SPY")
      throw new MarketFailure(
        "REFRESH_COOLDOWN",
        Date.parse("2024-11-07T14:00:00Z"),
      );
    return acquire(...args);
  };
  const refreshed = [];
  f.options.load = async (q) => {
    refreshed.push(q.symbol);
    return { feed: "sip", asset: asset(q.symbol) };
  };
  const final = await (
    await createDurableBacktests(f.options)(req, "Max", true)
  ).settled;
  assert.equal(final.status, "ready");
  assert.deepEqual(refreshed, ["AAA"]);
});

test("loader interpretation changes revalidate limitations without changing authoritative scope", async () => {
  for (const current of ["old-cash-rule", "provider-reported-usd-cash-v1"]) {
    const f = fixture();
    const limitation = {
      symbol: "AAA",
      code: "UNSUPPORTED_ACTION",
      from: sessions[0],
      through: sessions.at(-1),
      cycle: "2024-11-06",
      evidenceRevision: "same-authoritative-scope",
      normalizationRevision: "old-cash-rule",
    };
    // Use the actual fixture cycle rather than pretending this is a provider correction.
    const { freshnessCycle } = await import("../src/lib/market-cache.ts");
    limitation.cycle = freshnessCycle(f.options.clock());
    f.rows.set("limitation:AAA:Max", {
      key: "limitation:AAA:Max",
      payload: JSON.stringify(limitation),
      revision: revision(limitation),
      dependencies: [],
      checkedAt: f.options.clock().valueOf(),
    });
    const loaded = [];
    const original = f.options.load;
    f.options.load = async (q) => {
      loaded.push(q.symbol);
      return original(q);
    };
    const final = await (
      await createDurableBacktests({
        ...f.options,
        evidenceRevision: limitation.evidenceRevision,
        normalizationRevision: current,
      })(req, "Max")
    ).settled;
    assert.equal(
      final.status,
      current === "old-cash-rule" ? "blocked" : "ready",
    );
    assert.equal(loaded.includes("AAA"), current !== "old-cash-rule");
    assert.equal(limitation.evidenceRevision, "same-authoritative-scope");
  }
});
