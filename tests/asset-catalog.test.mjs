import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCatalog,
  searchCatalog,
  catalogShard,
} from "../src/lib/asset-catalog.ts";
const row = (symbol, name = symbol) => ({
  symbol,
  name,
  exchange: "NASDAQ",
  status: "active",
  class: "us_equity",
  tradable: true,
});
test("realistic bounded catalog, deterministic exact ticker/name ranking and exclusions", () => {
  const input = [
    row("SPY"),
    row("CAT", "Caterpillar"),
    row("CATS", "Cats"),
    row("DOG", "Cat company"),
    ...Array.from({ length: 9000 }, (_, i) => row(`X${i}`)),
  ];
  const rows = validateCatalog(input);
  assert.deepEqual(
    searchCatalog(rows, "cat").map((a) => a.ticker),
    ["CAT", "CATS", "DOG"],
  );
  assert.deepEqual(
    searchCatalog(rows, "caterpillar").map((a) => a.ticker),
    ["CAT"],
  );
  assert.equal(searchCatalog(rows, "X").length, 20);
  assert.deepEqual(searchCatalog(rows, " "), []);
  assert.deepEqual(searchCatalog(rows, "z".repeat(101)), []);
  assert.equal(
    validateCatalog([row("SPY"), { ...row("BAD"), tradable: false }]).length,
    1,
  );
  for (const a of rows)
    assert.ok(catalogShard(a.ticker) >= 0 && catalogShard(a.ticker) < 32);
  assert.throws(() => validateCatalog([row("SPY"), row("SPY")]));
  assert.throws(() => validateCatalog([row("../BAD")]));
  assert.throws(() => validateCatalog([{ ...row("SPY"), tradable: "true" }]));
});

test("catalog row bound and ticker separator validation", () => {
  assert.throws(() =>
    validateCatalog(Array.from({ length: 30001 }, () => row("SPY"))),
  );
  for (const symbol of ["A.", "A..B", "A--B", "-"])
    assert.throws(() => validateCatalog([row("SPY"), row(symbol)]));
});
