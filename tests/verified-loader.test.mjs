import test from "node:test";
import assert from "node:assert/strict";
import {
  createVerifiedLoader,
  digest,
} from "../src/lib/alpaca/verified-loader.ts";
const sessions = ["2024-11-01", "2024-11-04"];
const proof = {
  status: "verified",
  source: "synthetic independent review",
  method: "fixture only",
  from: sessions[0],
  through: sessions[1],
};
function fixture() {
  const candidates = {
    symbols: ["SPY"],
    start: sessions[0],
    end: sessions[1],
    prices: { SPY: { "2024-11-01": "100", "2024-11-04": "110" } },
    actions: [],
    evidence: {
      barsTraversal: "complete",
      actionsTraversal: "complete",
      actionsCompleteness: "unknown",
      note: "synthetic",
    },
  };
  return {
    version: 1,
    feed: "sip",
    closeDefinition: "alpaca-sip-eligible-daily-close",
    reviewer: "test",
    reviewedAt: "2024-11-05T14:00:00Z",
    expiresAt: "2024-11-06T14:00:00Z",
    candidates,
    candidatesHash: digest(candidates),
    calendar: {
      complete: true,
      finalityVerified: true,
      provenance: "synthetic",
      from: sessions[0],
      through: sessions[1],
      sessions,
    },
    evidence: {
      calendar: proof,
      finality: proof,
      actions: { SPY: proof },
      inception: { SPY: { ...proof, firstAvailable: "1993-01-29" } },
      prices: { SPY: proof },
      access: { SPY: proof },
      dividendUnits: {},
    },
    reconciliation: {
      status: "verified",
      source: "synthetic",
      method: "fixture only",
      includesLateCorrectionsAndCancellations: true,
      unsupportedEventsReviewed: true,
    },
  };
}
const request = {
  symbol: "SPY",
  from: sessions[0],
  through: sessions[1],
  recheckFrom: sessions[0],
  signal: new AbortController().signal,
};
const run = (review) =>
  createVerifiedLoader({
    review: async () => review,
    clock: () => new Date("2024-11-05T15:00:00Z"),
  })(request);
test("exact synthetic review permits conversion, not proof of live provider completeness", async () => {
  const out = await run(fixture());
  assert.equal(out.feed, "sip");
  assert.equal(out.asset.prices["2024-11-04"], "110");
});
test("absent or partial action reconciliation blocks before any request", async () => {
  await assert.rejects(run(undefined), /EVIDENCE_REQUIRED/);
  const r = fixture();
  r.reconciliation.includesLateCorrectionsAndCancellations = false;
  await assert.rejects(run(r), /EVIDENCE_REQUIRED/);
});
test("tampering, scope mismatch and expiry block conversion", async () => {
  for (const mutate of [
    (r) => (r.candidates.prices.SPY["2024-11-04"] = "111"),
    (r) => (r.candidates.symbols = ["AAA"]),
    (r) => (r.expiresAt = "2024-11-05T14:00:00Z"),
    (r) => (r.feed = "iex"),
  ]) {
    const r = fixture();
    mutate(r);
    await assert.rejects(run(r));
  }
});
test("09:00 next-day eligibility is not inferred to prove finality", async () => {
  const r = fixture();
  r.reviewedAt = "2024-11-05T13:59:59Z";
  await assert.rejects(run(r), /SESSION_PENDING/);
  const missing = fixture();
  missing.evidence.finality = undefined;
  await assert.rejects(run(missing), /BLOCKED/);
});
test("a complete traversal with an interior gap is rejected", async () => {
  const r = fixture();
  delete r.candidates.prices.SPY["2024-11-01"];
  r.candidatesHash = digest(r.candidates);
  await assert.rejects(run(r), /BLOCKED/);
});


test("reviewed full revision may project a requested short window without accepting older gaps or actions", async () => {
  const r = fixture();
  r.candidates.start = "2024-10-01";
  r.candidates.actions = [{ id: "old", symbol: "SPY", date: "2024-10-01", kind: "spin_offs", issues: ["unsupported action"] }];
  r.candidatesHash = digest(r.candidates);
  r.calendar.from = "2024-10-01"; r.calendar.sessions = ["2024-10-01", ...r.calendar.sessions];
  const out = await run(r);
  assert.equal(out.asset.from, sessions[0]); assert.deepEqual(out.asset.actions, []);
  r.candidates.prices.SPY[sessions[0]] = "999";
  await assert.rejects(() => run(r), /EVIDENCE_CHANGED/);
});
