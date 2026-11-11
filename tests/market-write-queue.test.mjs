import test from "node:test";
import assert from "node:assert/strict";
import { withMarketWriteTurn } from "../src/lib/market-write-queue.ts";

test("four concurrent expansion writes retain full reservations without multiplying the in-flight peak", async () => {
  let used = 383_860_990,
    peak = used,
    active = 0,
    maxActive = 0;
  await Promise.all(
    Array.from({ length: 4 }, () =>
      withMarketWriteTurn(async () => {
        assert.ok(used + 64_000_000 <= 500_000_000);
        used += 64_000_000;
        peak = Math.max(peak, used);
        maxActive = Math.max(maxActive, ++active);
        await new Promise((resolve) => setImmediate(resolve));
        used -= 64_000_000 - 100_000;
        active--;
      }),
    ),
  );
  assert.equal(maxActive, 1);
  assert.equal(used, 384_260_990);
  assert.ok(peak < 500_000_000);
});
test("a rejected storage write releases its turn without suppressing its error", async () => {
  const first = withMarketWriteTurn(async () => {
    throw Error("STORAGE_UNAVAILABLE");
  });
  const second = withMarketWriteTurn(async () => 42);
  await assert.rejects(first, /STORAGE_UNAVAILABLE/);
  assert.equal(await second, 42);
});
