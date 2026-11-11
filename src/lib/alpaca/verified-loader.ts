import "server-only";
import { createHash } from "node:crypto";
import { fetchCandidates, toEngineInput } from "./adapter.ts";
import type { Candidates, Evidence, Config } from "./adapter.ts";
import { eligibleSessions } from "../market-cache.ts";
import type { AssetRefresh } from "../market-cache.ts";
import type { Calendar } from "../backtest.ts";
export const digest = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
export type ReviewedAsset = {
  version: 1;
  feed: "sip";
  closeDefinition: "alpaca-sip-eligible-daily-close";
  reviewedAt: string;
  expiresAt: string;
  reviewer: string;
  candidatesHash: string;
  pendingSession?: string;
  candidates: Candidates;
  evidence: Evidence;
  calendar: Calendar;
  reconciliation: {
    status: "verified";
    source: string;
    method: string;
    includesLateCorrectionsAndCancellations: true;
    unsupportedEventsReviewed: true;
  };
};
export class EvidenceError extends Error {
  readonly code:
    | "EVIDENCE_REQUIRED"
    | "EVIDENCE_EXPIRED"
    | "EVIDENCE_CHANGED"
    | "SESSION_PENDING";
  constructor(code: EvidenceError["code"]) {
    super(code);
    this.code = code;
  }
}
/** A trusted analyst attestation, never inferred from pagination, age or a price match.
 * Replay defaults to saved bytes. A live fetch is opt-in and must exactly match the reviewed revision.
 */
export function createVerifiedLoader(options: {
  review: (symbol: string) => Promise<ReviewedAsset | undefined>;
  live?: Config;
  clock?: () => Date;
}) {
  return async (q: AssetRefresh) => {
    const now = (options.clock ?? (() => new Date()))();
    const review = await options.review(q.symbol);
    if (
      review?.version !== 1 ||
      review.feed !== "sip" ||
      review.closeDefinition !== "alpaca-sip-eligible-daily-close" ||
      !review.reviewer?.trim() ||
      review.reconciliation?.status !== "verified" ||
      !review.reconciliation.source?.trim() ||
      !review.reconciliation.method?.trim() ||
      review.reconciliation.includesLateCorrectionsAndCancellations !== true ||
      review.reconciliation.unsupportedEventsReviewed !== true
    )
      throw new EvidenceError("EVIDENCE_REQUIRED");
    const reviewed = Date.parse(review.reviewedAt),
      expires = Date.parse(review.expiresAt);
    if (
      !Number.isFinite(reviewed) ||
      !Number.isFinite(expires) ||
      reviewed > now.valueOf() ||
      expires <= now.valueOf() ||
      expires <= reviewed ||
      expires - reviewed > 32 * 86400000
    )
      throw new EvidenceError("EVIDENCE_EXPIRED");
    const c = review.candidates;
    if (
      c?.start > q.from ||
      (c.end !== q.through && review.pendingSession !== q.through) ||
      c.symbols.length !== 1 ||
      c.symbols[0] !== q.symbol ||
      digest(c) !== review.candidatesHash
    )
      throw new EvidenceError("EVIDENCE_CHANGED");
    const calendar = review.calendar;
    if (
      !calendar?.complete ||
      !calendar.finalityVerified ||
      calendar.from > q.from ||
      calendar.through < q.through ||
      !calendar.provenance ||
      calendar.sessions.length > 1300
    )
      throw new EvidenceError("EVIDENCE_REQUIRED");
    const all = calendar.sessions.filter((s) => s >= q.from && s <= q.through);
    if (
      review.pendingSession &&
      (review.pendingSession !== q.through ||
        all.at(-1) !== q.through ||
        all.at(-2) !== c.end)
    )
      throw new EvidenceError("EVIDENCE_CHANGED");
    const sessions = all.filter((s) => s <= c.end);
    if (
      !sessions.length ||
      eligibleSessions(sessions, new Date(reviewed)).at(-1) !==
        sessions.at(-1) ||
      eligibleSessions(sessions, now).at(-1) !== sessions.at(-1)
    )
      throw new EvidenceError("SESSION_PENDING");
    let candidate = c;
    if (options.live) {
      candidate = await fetchCandidates(options.live, {
        symbols: [q.symbol],
        start: c.start,
        end: c.end,
        feed: "sip",
        signal: q.signal,
      });
      // Revisions invalidate the review, rather than silently laundering old proofs onto new bytes.
      if (digest(candidate) !== review.candidatesHash)
        throw new EvidenceError("EVIDENCE_CHANGED");
    }
    const input = toEngineInput(
      {
        ...candidate,
        start: q.from,
        prices: Object.fromEntries(
          Object.entries(candidate.prices).map(([symbol, prices]) => [
            symbol,
            Object.fromEntries(
              Object.entries(prices).filter(([day]) => day >= q.from),
            ),
          ]),
        ),
        actions: candidate.actions.filter((a) => !a.date || a.date >= q.from),
      },
      sessions,
      review.evidence,
      [{ id: "review", holdings: [{ symbol: q.symbol, weight: "100" }] }],
      "100",
    );
    const asset = input.assets[0];
    if (!asset) throw new EvidenceError("EVIDENCE_REQUIRED");
    return {
      feed: "sip" as const,
      asset,
      ...(review.pendingSession
        ? { pendingSession: review.pendingSession }
        : {}),
    };
  };
}
