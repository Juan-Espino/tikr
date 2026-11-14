import test from "node:test";
import assert from "node:assert/strict";
import {
  createFixture,
  portfolios,
  sessions,
} from "./support/market-fixture.ts";
import {
  createProviderMeasurement,
  measuredTransport,
} from "../src/lib/provider-measurement.ts";
test("completed provider bodies settle observed bytes; interrupted/failed outcomes retain reservation", async () => {
  const metrics = createProviderMeasurement();
  let settled = [];
  const transport = measuredTransport(
    async () => new Response("synthetic-body"),
    metrics,
    async () => async (bytes) => {
      settled.push(bytes);
    },
  );
  assert.equal(
    await (await transport("https://synthetic.invalid")).text(),
    "synthetic-body",
  );
  assert.deepEqual(settled, [14]);
  assert.equal(metrics.receivedBytes, 14);
  assert.equal(metrics.requests, 1);
  const broken = measuredTransport(
    async () => {
      throw Error("network");
    },
    metrics,
    async () => async (bytes) => {
      settled.push(bytes);
    },
  );
  await assert.rejects(broken("https://synthetic.invalid"), /network/);
  assert.deepEqual(settled, [14]);
});
test("overlapping dashboard loads coalesce SPY, wider coverage serves every shorter period and browser restart", async () => {
  const f = createFixture("after", "edge-reuse");
  const cold = await f.run({ portfolios, amount: "10000" }, "5Y");
  assert.equal(cold.final.status, "ready");
  const calls = f.provider.requests;
  assert.equal(calls, 3); // two paginated bars + one actions traversal
  for (const range of ["1W", "1M", "YTD", "1Y"]) {
    const result = await f.run(
      { portfolios, amount: "10000" },
      range,
      false,
      cold.history,
    );
    assert.equal(result.final.status, "ready");
    assert.equal(f.provider.requests, calls);
  }
  f.restart();
  const restarted = await f.run(
    { portfolios, amount: "777.77" },
    "1Y",
    false,
    cold.history,
  );
  assert.equal(restarted.final.status, "ready");
  assert.equal(f.provider.requests, calls);
  f.revoke();
  await assert.rejects(
    f.run({ portfolios, amount: "777.77" }, "1Y", false, cold.history),
    /EVIDENCE_REVOKED/,
  );
});
test("unavailable or corrupt browser cache after process loss restores durable history without a provider attempt", async () => {
  for (const hints of [undefined, "corrupt"]) {
    const f = createFixture("after", `edge-loss-${hints}`);
    const cold = await f.run(
      { portfolios: [portfolios[0]], amount: "10000" },
      "1W",
    );
    f.restart();
    const before = f.provider.requests;
    const value = await f.run(
      { portfolios: [portfolios[0]], amount: "9999" },
      "1W",
      false,
      hints === "corrupt"
        ? cold.history.map((row) => ({ ...row, payload: "{}" }))
        : [],
    );
    assert.equal(value.final.status, "ready");
    assert.equal(value.final.result.actual.end, cold.final.result.actual.end);
    assert.equal(f.provider.requests, before);
  }
});
test("coverage expansion fetches the missing prefix and rechecks overlap; next day fetches only five sessions", async () => {
  const f = createFixture("after", "edge-expansion");
  const request = { portfolios: [portfolios[0]], amount: "10000" };
  const narrow = await f.run(request, "1W");
  assert.equal(narrow.final.status, "ready");
  const wide = await f.run(request, "1Y", false, narrow.history);
  assert.equal(wide.final.status, "ready");
  const before = f.provider.receivedBytes;
  f.setNow("2026-11-12T15:00:00Z");
  const next = await f.run(request, "1Y", false, wide.history);
  assert.equal(next.final.status, "ready");
  assert.equal(next.final.result.actual.end, "2026-11-11");
  assert.ok(f.provider.receivedBytes - before < 10000);
});
test("pagination limits, partial responses and throttles fail the whole request without omitted holdings", async () => {
  for (const failure of ["partial", "throttle", "unsupported"]) {
    const f = createFixture("after", `edge-failure-${failure}`);
    f.setFailure(failure);
    const value = await f.run(
      { portfolios: [portfolios[0]], amount: "10000" },
      "1W",
    );
    assert.equal(value.final.status, "blocked");
    assert.equal(value.final.result, undefined);
  }
  const f = createFixture("after", "edge-pages");
  f.setPageSize(1);
  const result = await f.run(
    { portfolios: [portfolios[0]], amount: "10000" },
    "1Y",
  );
  assert.equal(result.final.status, "blocked");
});

test("three simultaneous dashboard portfolio loads batch unique holdings and SPY once", async () => {
  const f = createFixture("after", "edge-concurrent-dashboard");
  const values = await Promise.all(
    portfolios.map((p) => f.run({ portfolios: [p], amount: "10000" }, "1W")),
  );
  assert.ok(values.every((value) => value.final.status === "ready"));
  assert.equal(f.provider.requests, 2);
});

test("YTD comparison and holding/weight edits recalculate from warm history without omitted holdings", async () => {
  const f = createFixture("after", "acceptance-edits");
  assert.equal(
    (await f.run({ portfolios, amount: "10000" }, "5Y")).final.status,
    "ready",
  );
  const providerBefore = f.provider.requests;
  const primary = {
    id: "edited",
    holdings: [
      { symbol: "AAA", weight: "50" },
      { symbol: "BBB", weight: "50" },
    ],
  };
  const run = (p) =>
    f.run({ portfolios: [p, portfolios[1]], amount: "1234.56" }, "YTD");
  const before = (await run(primary)).final;
  assert.equal(before.status, "ready");
  assert.equal(
    before.result.actual.start,
    sessions.find((day) => day >= "2026-01-01"),
  );
  const edited = {
    ...primary,
    holdings: [
      { symbol: "AAA", weight: "75" },
      { symbol: "CCC", weight: "25" },
    ],
  };
  const after = (await run(edited)).final;
  assert.equal(after.status, "ready");
  assert.deepEqual(Object.keys(after.assetReturns).sort(), [
    "AAA",
    "CCC",
    "DDD",
    "EEE",
    "FFF",
    "SPY",
  ]);
  const series = [...after.result.portfolios, after.result.benchmark];
  for (const s of series) {
    assert.equal(s.points[0].value, "1234.56");
    assert.deepEqual(
      s.points.map((p) => p.date),
      series[0].points.map((p) => p.date),
    );
  }
  assert.notEqual(
    after.result.portfolios[0].ending,
    before.result.portfolios[0].ending,
  );
  assert.equal(f.provider.requests, providerBefore);
});
