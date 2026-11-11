import test from "node:test";
import assert from "node:assert/strict";
import { cachedAsset, rememberAsset } from "../src/lib/market-asset-memory.ts";

test("validated assets are isolated by source namespace/revision and callers cannot mutate cached bytes", () => {
  const asset = { symbol: "SPY", prices: { "2024-11-01": "100" }, actions: [] };
  rememberAsset("test-copy", "SPY", "rev1", asset);
  asset.prices["2024-11-01"] = "200";
  assert.equal(
    cachedAsset("test-copy", "SPY", "rev1").prices["2024-11-01"],
    "100",
  );
  cachedAsset("test-copy", "SPY", "rev1").prices["2024-11-01"] = "300";
  assert.equal(
    cachedAsset("test-copy", "SPY", "rev1").prices["2024-11-01"],
    "100",
  );
  assert.equal(cachedAsset("other-source", "SPY", "rev1"), undefined);
  assert.equal(cachedAsset("test-copy", "SPY", "rev2"), undefined);
});
test("source memory has a bounded LRU and replaces prior revisions", () => {
  for (let i = 0; i < 51; i++)
    rememberAsset("test-lru", String(i), "rev1", {
      symbol: String(i),
      prices: {},
      actions: [],
    });
  assert.equal(cachedAsset("test-lru", "0", "rev1"), undefined);
  assert.ok(cachedAsset("test-lru", "50", "rev1"));
  rememberAsset("test-lru", "50", "rev2", {
    symbol: "50",
    prices: {},
    actions: [],
  });
  assert.equal(cachedAsset("test-lru", "50", "rev1"), undefined);
  assert.ok(cachedAsset("test-lru", "50", "rev2"));
});
