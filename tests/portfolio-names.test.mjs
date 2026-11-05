import test from "node:test";
import assert from "node:assert/strict";
import {
  portfolioNameError,
  suggestedPortfolioName,
  storageSchema,
} from "../src/lib/demo.ts";

test("legacy Max range migrates in saved portfolios and drafts", () => {
  const p = {
    id: "old",
    name: "Old",
    holdings: [{ ticker: "SPY", weight: "100" }],
    manual: false,
    pinned: false,
    updated: 1,
    amount: "10000",
    range: "Max",
  };
  const result = storageSchema.parse({ version: 1, portfolios: [p], draft: p });
  assert.equal(result.portfolios[0].range, "5Y");
  assert.equal(result.draft.range, "5Y");
});
test("names ignore surrounding whitespace and case but allow an unchanged name", () => {
  const saved = [{ id: "one", name: "My portfolio" }];
  assert.equal(
    portfolioNameError({ id: "one", name: "MY PORTFOLIO" }, saved),
    "",
  );
  assert.match(
    portfolioNameError({ id: "two", name: "  my PORTFOLIO " }, saved),
    /already exists/,
  );
  assert.match(portfolioNameError({ id: "two", name: "  " }, saved), /Enter/);
  assert.equal(portfolioNameError({ id: "two", name: "Other" }, saved), "");
});
test("suggestions stay unique and bounded without mutating names", () => {
  const saved = [
    { id: "one", name: "Core" },
    { id: "two", name: "core 2" },
  ];
  assert.equal(suggestedPortfolioName("Core", saved), "Core 3");
  assert.equal(saved[0].name, "Core");
  assert.equal(suggestedPortfolioName("x".repeat(80), []).length, 80);
});
