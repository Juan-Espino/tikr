import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCatalog,
  searchCatalog,
  catalogShard,
  packCatalogShard,
  validateShard,
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

test("full mixed metadata catalog is losslessly packed within atomic storage limits", () => {
  const input = [
    row("SPY"),
    ...Array.from({ length: 15000 }, (_, i) => ({
      ...row(
        `X${i}`,
        `Example issuer ${i} Series A cumulative preferred shares - international income fund`,
      ),
      id: `synthetic-${i}`,
      marginable: true,
      shortable: false,
      fractionable: true,
      attributes: [],
    })),
    { ...row("ODD/WS", ""), tradable: false, exchange: "OTC" },
    { ...row("BTC/USD"), class: "crypto" },
  ];
  const rows = validateCatalog(input);
  assert.equal(rows.length, 15001);
  const entries = Array.from({ length: 32 }, (_, i) => {
    const shard = rows.filter((a) => catalogShard(a.ticker) === i);
    const payload = JSON.stringify(packCatalogShard(shard));
    assert.ok(Buffer.byteLength(payload) < 50000);
    assert.deepEqual(validateShard(JSON.parse(payload), i), shard);
    return {
      key: `catalog:${i}`,
      payload,
      revision: "a".repeat(64),
      dependencies: [],
    };
  });
  assert.ok(Buffer.byteLength(JSON.stringify(entries)) < 900000);
  for (const bad of [
    { encoding: "lzw-tuples-v1", data: "a" },
    { encoding: "bad", data: "" },
  ])
    assert.throws(() => validateShard(bad, 0));
});

test("near row ceiling varied issuer names remain bounded or fail the explicit write guard", () => {
  let seed = 12345;
  const letters = () =>
    Array.from({ length: 32 }, () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return String.fromCharCode(65 + ((seed >>> 16) % 26));
    }).join("");
  const rows = validateCatalog([
    row("SPY"),
    ...Array.from({ length: 29999 }, (_, i) =>
      row(`Z${i}`, `${letters()} holdings ${i}`),
    ),
  ]);
  const sizes = Array.from({ length: 32 }, (_, i) =>
    Buffer.byteLength(
      JSON.stringify(
        packCatalogShard(rows.filter((a) => catalogShard(a.ticker) === i)),
      ),
    ),
  );
  // Deliberately high entropy names exceed capacity: row count is not a promise
  // of storage fit, and the importer must refuse before any write.
  assert.ok(
    sizes.some((n) => n > 50000) || sizes.reduce((a, b) => a + b, 0) > 900000,
  );
});

test("eligible Palantir survives provider normalization and ticker/company-name lookup", () => {
  const rows = validateCatalog([
    row("SPY"),
    row("PLTR", "Palantir Technologies Inc. Class A Common Stock"),
  ]);
  for (const query of ["p", "pa", "pala", "palantir", "palanti", "PLTR"]) {
    assert.ok(searchCatalog(rows, query).some((a) => a.ticker === "PLTR"));
  }
});
