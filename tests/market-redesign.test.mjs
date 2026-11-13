import test from "node:test";
import assert from "node:assert/strict";
import { createFixture, portfolios } from "./support/market-fixture.ts";
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
test("unavailable or corrupt browser cache after process loss fails closed without a new provider attempt", async () => {
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
    assert.equal(value.final.status, "blocked");
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
