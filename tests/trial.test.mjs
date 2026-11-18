import { test } from "node:test";
import assert from "node:assert/strict";
import {
  examples,
  newPortfolio,
  hasUnsavedPortfolio,
  hasResumablePortfolio,
} from "../src/lib/demo.ts";
import {
  TRIAL_KEY,
  LEGACY_KEY,
  readTrial,
  writeTrial,
  settleTrial,
} from "../src/lib/trial.ts";
const storage = () => {
  const map = new Map([[LEGACY_KEY, "{ malformed legacy bytes }"]]);
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
test("examples have stable reserved IDs and cannot become recovery drafts", () => {
  const a = examples(),
    b = examples();
  assert.deepEqual(a, b);
  const s = storage();
  assert.throws(() => writeTrial(s, a[0], null));
  assert.equal(s.getItem(TRIAL_KEY), null);
});
test("recovery preserves incomplete edits, reloads and exact legacy bytes", () => {
  const s = storage(),
    before = s.getItem(LEGACY_KEY),
    p = newPortfolio();
  writeTrial(s, p, null);
  const edited = {
    ...p,
    name: "Trial",
    holdings: [{ ticker: "SPY", weight: "bad" }],
    amount: "",
  };
  writeTrial(s, edited, p);
  assert.deepEqual(readTrial(s), { ...edited, rangeChoice: "default" });
  assert.equal(s.getItem(LEGACY_KEY), before);
  assert.throws(() => writeTrial(s, p, p));
});
test("private trial edits are owner bound, never restored to guest or B", () => {
  const s = storage(),
    p = newPortfolio();
  writeTrial(s, p, null);
  writeTrial(s, { ...p, name: "Private trial" }, p, "A");
  assert.equal(readTrial(s), null);
  assert.equal(readTrial(s, "B"), null);
  assert.equal(readTrial(s, "A").name, "Private trial");
  assert.throws(() => writeTrial(s, newPortfolio(), null));
  const next = newPortfolio();
  writeTrial(s, next, null, null, true);
  assert.equal(readTrial(s).id, next.id);
});
test("acknowledgement only settles the exact saved draft; newer edits/replacements survive", () => {
  const s = storage(),
    p = { ...newPortfolio(), name: "First" };
  writeTrial(s, p, null);
  settleTrial(s, { ...p, name: "Other" }, "A");
  assert.ok(readTrial(s));
  settleTrial(s, p, "A");
  assert.equal(readTrial(s), null);
  const next = newPortfolio();
  writeTrial(s, next, null);
  settleTrial(s, p, "A");
  assert.equal(readTrial(s).id, next.id);
  assert.ok(s.getItem(LEGACY_KEY));
});
test("malformed, oversized, cloud and reserved recovery inputs fail without rewriting", () => {
  for (const raw of [
    "{bad",
    "x".repeat(16001),
    JSON.stringify({ version: 1, draft: { ...newPortfolio(), revision: 1 } }),
    JSON.stringify({ version: 1, draft: examples()[0] }),
  ]) {
    const s = storage();
    s.setItem(TRIAL_KEY, raw);
    assert.throws(() => readTrial(s));
    assert.throws(() => writeTrial(s, newPortfolio(), null));
    assert.equal(s.getItem(TRIAL_KEY), raw);
  }
});

test("new recovery preserves actual VOO holdings and explicit 1Y without legacy migrations", () => {
  const s = storage(),
    p = {
      ...newPortfolio(),
      holdings: [{ ticker: "VOO", weight: "100.00" }],
      range: "1Y",
      rangeChoice: "explicit",
    };
  writeTrial(s, p, null);
  assert.equal(readTrial(s).holdings[0].ticker, "VOO");
  assert.equal(readTrial(s).range, "1Y");
  const before = s.getItem(TRIAL_KEY);
  assert.throws(() => writeTrial(s, { ...p, id: "x".repeat(81) }, p));
  assert.equal(s.getItem(TRIAL_KEY), before);
});

test("resume only includes unsaved drafts or changed saved definitions", () => {
  const p = { ...newPortfolio(), name: "Saved", revision: 1 };
  assert.equal(hasUnsavedPortfolio(null, [p]), false);
  assert.equal(hasUnsavedPortfolio(p, [{ ...p }]), false);
  assert.equal(hasUnsavedPortfolio(p, []), false);
  assert.equal(hasUnsavedPortfolio({ ...p, amount: "20000" }, [p]), true);
  assert.equal(hasUnsavedPortfolio(newPortfolio(), [p]), true);
});

test("resume listings require a name, holding, valid allocation and amount", () => {
  const empty = newPortfolio();
  const valid = {
    ...empty,
    name: "Core",
    holdings: [{ ticker: "SPY", weight: "100.00" }],
  };
  for (const draft of [
    empty,
    { ...valid, name: " " },
    { ...valid, holdings: [] },
    { ...valid, amount: "" },
    { ...valid, holdings: [{ ticker: "SPY", weight: "50" }] },
  ]) {
    assert.equal(hasResumablePortfolio(draft, []), false);
    assert.equal(hasUnsavedPortfolio(draft, []), true);
  }
  assert.equal(hasResumablePortfolio(valid, []), true);
  const saved = { ...valid, revision: 1 };
  assert.equal(hasResumablePortfolio(saved, [saved]), false);
  assert.equal(
    hasResumablePortfolio({ ...saved, amount: "20000" }, [saved]),
    true,
  );
});
