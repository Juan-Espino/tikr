import test from "node:test";
import assert from "node:assert/strict";
import { createResponseCollector } from "../scripts/lib/qa-response-collector.mjs";

test("canceled never-ending bodies cannot block collector completion", async () => {
  const c = createResponseCollector({ timeoutMs: 10 });
  c.track(() => new Promise(() => {}));
  c.track(() => ({ status: "ready", quality: "synthetic" }));
  const result = await c.finish();
  assert.equal(result.started, 2);
  assert.equal(
    result.records.filter((r) => r.outcome === "body-unavailable").length,
    1,
  );
  assert.equal(
    result.records.filter((r) => r.outcome === "complete").length,
    1,
  );
});

test("late bodies cannot mutate evidence; failures never retain exception text", async () => {
  const c = createResponseCollector({ timeoutMs: 5 });
  let release;
  c.track(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  c.track(() => {
    throw Error("private-exception-canary");
  });
  const result = await c.finish();
  release({ unsafeLate: true });
  await Promise.resolve();
  assert.deepEqual(await c.finish(), result);
  assert(!JSON.stringify(result).includes("canary"));
  assert.equal(
    c.track(() => {
      throw Error("must not run");
    }),
    false,
  );
});

test("collector bounds retained count and summary size", async () => {
  const c = createResponseCollector({ limit: 1 });
  c.track(() => ({ oversized: "x".repeat(9000) }));
  assert.equal(
    c.track(() => ({})),
    false,
  );
  assert.deepEqual(await c.finish(), {
    started: 1,
    dropped: 1,
    records: [{ outcome: "summary-limit" }],
  });
});

test("a callback returning raw response text is not retained as evidence", async () => {
  const c = createResponseCollector();
  c.track(() => "private-body-canary");
  assert.deepEqual((await c.finish()).records, [
    { outcome: "summary-unavailable" },
  ]);
});
