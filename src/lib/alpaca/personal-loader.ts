import "server-only";
import { traceFields } from "../market-trace.ts";
import { fetchCandidates, AlpacaError } from "./adapter.ts";
import type { Config, Candidates } from "./adapter.ts";
import type { Asset, Action, Calendar } from "../backtest.ts";
import type { AssetRefresh } from "../market-cache.ts";
import { EvidenceError } from "./verified-loader.ts";
import {
  eligibleSessions,
  isCalendarDate,
  rejectCalendar,
} from "../market-calendar.ts";
import { marketFailure, type MarketFailure } from "../market-errors.ts";
import {
  providerMeasurement,
  measuredTransport,
  type ProviderMeasurement,
} from "../provider-measurement.ts";

// Preserve a trusted pre-network refusal through the adapter's sanitized transport
// boundary. This is not received contradictory data and must never revoke a scope.
class AdmissionFailure extends AlpacaError {
  readonly failure: MarketFailure;
  constructor(failure: MarketFailure) {
    super("LIMIT");
    this.failure = failure;
    this.message = failure.code;
  }
}

// Injection is for deterministic boundary tests; production uses the durable ledger.
export function createAdmittedTransport(
  reserve: () => Promise<unknown>,
  transport: typeof fetch = fetch,
  measurement: ProviderMeasurement = providerMeasurement,
): typeof fetch {
  return measuredTransport(transport, measurement, async () => {
    try {
      return await reserve();
    } catch (error) {
      const failure = marketFailure(error);
      if (failure) throw new AdmissionFailure(failure);
      throw error;
    }
  });
}

import { PERSONAL_SOURCE_POLICY } from "../market-policy.ts";
export const PROVISIONAL_POLICY = PERSONAL_SOURCE_POLICY;
// Separates cached interpretation failures/results from authoritative scope guards.
export const ALPACA_CASH_INTERPRETATION = "provider-reported-usd-cash-v1";
const provenance =
  "Personal provisional Alpaca SIP; reported dividend rates treated as USD cash per traded share/ADR with source withholding retained; subject to corrections";

// These flags express acceptance under the personal provisional policy, never analyst verification.
// Complete window coverage does not prove inception; leading missing bars fail too.
export function provisionalAsset(
  c: Candidates,
  calendar: Calendar,
  symbol: string,
): Asset {
  const sessions = calendar.sessions.filter((d) => d >= c.start && d <= c.end);
  if (
    c.symbols.length !== 1 ||
    c.symbols[0] !== symbol ||
    !sessions.length ||
    c.evidence.barsTraversal !== "complete" ||
    c.evidence.actionsTraversal !== "complete"
  )
    throw new Error("UNVERIFIED_DATA");
  const prices = c.prices[symbol] ?? {};
  if (sessions.some((d) => !Object.hasOwn(prices, d)))
    throw new Error("MISSING_PRICE");
  if (Object.keys(prices).some((d) => !sessions.includes(d)))
    throw new Error("UNVERIFIED_DATA");
  const actions: Action[] = c.actions
    .filter((a) => !a.date || (a.date >= c.start && a.date <= c.end))
    .map<Action>((a) => {
      const reject = (reason: string): never => {
        console.error(
          JSON.stringify({
            event: "market_action_rejected",
            stage: "validation",
            code: "UNSUPPORTED_ACTION",
            ...traceFields(),
            symbol: /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ? symbol : "unknown",
            kind: [
              "cash_dividends",
              "forward_splits",
              "reverse_splits",
            ].includes(a.kind)
              ? a.kind
              : "other",
            reason,
            ...(a.terms ? { terms: a.terms } : {}),
          }),
        );
        throw new Error("UNSUPPORTED_ACTION");
      };
      if (
        a.symbol !== symbol ||
        !a.date ||
        (a.date >= c.start && a.date <= c.end && !sessions.includes(a.date))
      )
        return reject("invalid_event_date_or_symbol");
      if (
        (a.kind === "forward_splits" || a.kind === "reverse_splits") &&
        !a.issues.length &&
        a.numerator &&
        a.denominator
      )
        return {
          id: a.id,
          type: "split",
          date: a.date,
          numerator: a.numerator,
          denominator: a.denominator,
        };
      if (
        a.kind === "cash_dividends" &&
        a.paymentDate &&
        a.amount &&
        a.issues.every((i) => i === "dividend unit basis unverified") &&
        !c.actions.some((b) => b.date === a.date && b.kind !== "cash_dividends")
      )
        return {
          id: a.id,
          type: "dividend",
          date: a.date,
          paymentDate: a.paymentDate,
          amount: a.amount,
          basis: "postSplit",
        };
      return reject(
        a.kind === "cash_dividends"
          ? !a.paymentDate || !a.amount
            ? "missing_dividend_fields"
            : a.issues.some((i) => i !== "dividend unit basis unverified")
              ? "unverified_dividend_terms"
              : "ambiguous_same_day_action"
          : a.kind === "forward_splits" || a.kind === "reverse_splits"
            ? "unverified_split_terms"
            : "unsupported_event_type",
      );
    })
    .filter((a) => a.date >= c.start && a.date <= c.end);
  return {
    symbol,
    firstAvailable: c.start,
    from: c.start,
    through: c.end,
    complete: true,
    inceptionVerified: false,
    periodCoverageVerified: true,
    pricesComplete: true,
    actionsComplete: true,
    accessComplete: true,
    priceBasis: "raw",
    provenance,
    prices,
    actions,
  };
}

function bounded<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const expired = () => {
      cleanup();
      reject(new AlpacaError("TIMEOUT"));
    };
    const cleanup = () => signal.removeEventListener("abort", expired);
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error instanceof Error ? error : new AlpacaError("UPSTREAM"));
      },
    );
    if (signal.aborted) expired();
    else signal.addEventListener("abort", expired, { once: true });
  });
}

// Fixed paper-trading data-only endpoint, with timeout, redirect denial and a bounded stream.
export async function fetchPersonalCalendar(
  config: Config,
  start: string,
  end: string,
  now: Date,
): Promise<Calendar> {
  if (
    !isCalendarDate(start) ||
    !isCalendarDate(end) ||
    start > end ||
    !Number.isFinite(now.valueOf())
  )
    return rejectCalendar("malformed");
  const url = new URL("https://paper-api.alpaca.markets/v2/calendar");
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  const signal = AbortSignal.timeout(config.timeoutMs ?? 10000);
  let response: Response;
  try {
    response = await bounded(
      (config.transport ?? fetch)(url.toString(), {
        headers: {
          "APCA-API-KEY-ID": config.keyId,
          "APCA-API-SECRET-KEY": config.secret,
        },
        signal,
        redirect: "error",
        cache: "no-store",
      }),
      signal,
    );
  } catch (error) {
    if (error instanceof AdmissionFailure) throw error.failure;
    throw new AlpacaError(signal.aborted ? "TIMEOUT" : "UPSTREAM");
  }
  if (response.status !== 200 || !response.body) {
    void response.body?.cancel().catch(() => undefined);
    throw new AlpacaError("UPSTREAM");
  }
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await bounded(reader.read(), signal);
      if (part.done) break;
      size += part.value.length;
      if (size > 256000 || parts.length >= 4096) {
        void reader.cancel().catch(() => undefined);
        throw new AlpacaError("LIMIT");
      }
      parts.push(part.value);
    }
    const bytes = Buffer.concat(parts);
    const length = response.headers.get("content-length");
    if (
      length !== null &&
      (!response.headers.get("content-encoding") ||
        response.headers.get("content-encoding") === "identity") &&
      (!/^\d+$/.test(length) || Number(length) !== size)
    )
      throw new Error();
    const rows: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!Array.isArray(rows) || rows.length > 1300) throw new Error();
    let previous = "";
    const dates = rows.map(
      (r: { date?: unknown; open?: unknown; close?: unknown }) => {
        const validTime = (v: unknown) =>
          typeof v === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
        if (
          !r ||
          typeof r !== "object" ||
          Array.isArray(r) ||
          (r.open !== undefined && !validTime(r.open)) ||
          (r.close !== undefined && !validTime(r.close)) ||
          (typeof r.open === "string" &&
            typeof r.close === "string" &&
            r.open >= r.close)
        )
          throw new Error();
        const d = r?.date;
        if (!isCalendarDate(d) || d <= previous || d < start || d > end)
          throw new Error();
        previous = d;
        return d;
      },
    );
    const sessions = eligibleSessions(dates, now);
    if (!sessions.length) return rejectCalendar("no_eligible_session");
    return {
      from: start,
      through: end,
      sessions,
      complete: true,
      finalityVerified: true,
      provenance,
    };
  } catch (e) {
    void reader.cancel().catch(() => undefined);
    if (e instanceof AlpacaError) throw e;
    if (e instanceof Error && e.message === "CALENDAR_UNAVAILABLE") throw e;
    console.error(
      JSON.stringify({
        event: "market_calendar_rejected",
        reason: "malformed",
        ...traceFields(),
      }),
    );
    throw new AlpacaError("MALFORMED");
  } finally {
    reader.releaseLock();
  }
}
export function createPersonalLoader(
  config: Config,
  calendar: Calendar,
  candidatesLoader = fetchCandidates,
  reuseCoverage = true,
) {
  return async (q: AssetRefresh) => {
    let observed: Candidates | undefined;
    let activeRange: { start: string; end: string } | undefined;
    let changedOverlap = false;
    try {
      const previous = q.previous;
      const recheck =
        calendar.sessions.filter((day) => day <= q.through).slice(-5)[0] ??
        q.from;
      const ranges: { start: string; end: string }[] = [];
      if (
        reuseCoverage &&
        previous &&
        calendar.sessions.filter((day) => day <= q.through).length > 5 &&
        previous.from <= q.through &&
        previous.through >= recheck
      ) {
        if (q.from < previous.from) {
          const end = calendar.sessions
            .filter((day) => day < previous.from)
            .at(-1);
          if (end && end >= q.from) ranges.push({ start: q.from, end });
        }
        ranges.push({
          start: recheck < q.from ? q.from : recheck,
          end: q.through,
        });
      } else ranges.push({ start: q.from, end: q.through });
      let merged: Asset | undefined = previous
        ? structuredClone(previous)
        : undefined;
      for (const range of ranges) {
        activeRange = range;
        observed = undefined;
        const candidates = await candidatesLoader(config, {
          symbols: [q.symbol],
          ...range,
          feed: "sip",
          signal: q.signal,
        });
        observed = candidates;
        const part = provisionalAsset(candidates, calendar, q.symbol);
        if (previous) {
          const start = previous.from > part.from ? previous.from : part.from;
          const end =
            previous.through < part.through ? previous.through : part.through;
          const actions = (asset: Asset) =>
            JSON.stringify(
              asset.actions
                .filter((a) => a.date >= start && a.date <= end)
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((action) =>
                  Object.fromEntries(
                    Object.entries(action).sort(([a], [b]) =>
                      a.localeCompare(b),
                    ),
                  ),
                ),
            );
          if (
            start <= end &&
            (Object.entries(part.prices).some(
              ([day, value]) =>
                day >= start && day <= end && previous.prices[day] !== value,
            ) ||
              actions(previous) !== actions(part))
          )
            changedOverlap = true;
        }
        merged = merged
          ? {
              ...part,
              from: merged.from < part.from ? merged.from : part.from,
              firstAvailable:
                merged.from < part.from
                  ? merged.firstAvailable
                  : part.firstAvailable,
              through:
                merged.through > part.through ? merged.through : part.through,
              prices: { ...merged.prices, ...part.prices },
              actions: [
                ...merged.actions.filter(
                  (action) =>
                    action.date < part.from || action.date > part.through,
                ),
                ...part.actions,
              ].sort(
                (a, b) =>
                  a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
              ),
            }
          : part;
      }
      return {
        feed: "sip" as const,
        asset: {
          ...merged!,
          from: q.from,
          through: q.through,
          prices: Object.fromEntries(
            Object.entries(merged!.prices).filter(
              ([day]) => day >= q.from && day <= q.through,
            ),
          ),
          actions: merged!.actions.filter(
            (action) => action.date >= q.from && action.date <= q.through,
          ),
        },
      };
    } catch (error) {
      if (error instanceof AdmissionFailure) throw error.failure;
      // Received data that contradicts a previously cached scope cannot fall back stale.
      let contradictsPrevious =
        changedOverlap ||
        !activeRange ||
        !q.previous ||
        (activeRange.start <= q.previous.through &&
          activeRange.end >= q.previous.from);
      if (observed && q.previous) {
        const start =
          q.previous.from > observed.start ? q.previous.from : observed.start;
        const end =
          q.previous.through < observed.end ? q.previous.through : observed.end;
        if (start <= end) {
          try {
            const overlap = provisionalAsset(
              {
                ...observed,
                start,
                end,
                prices: Object.fromEntries(
                  Object.entries(observed.prices).map(([symbol, prices]) => [
                    symbol,
                    Object.fromEntries(
                      Object.entries(prices).filter(
                        ([day]) => day >= start && day <= end,
                      ),
                    ),
                  ]),
                ),
              },
              calendar,
              q.symbol,
            );
            const actionKey = (actions: Action[]) =>
              JSON.stringify(
                actions
                  .filter((a) => a.date >= start && a.date <= end)
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((a) =>
                    Object.fromEntries(
                      Object.entries(a).sort(([a], [b]) => a.localeCompare(b)),
                    ),
                  ),
              );
            contradictsPrevious =
              changedOverlap ||
              Object.entries(overlap.prices).some(
                ([day, price]) => q.previous!.prices[day] !== price,
              ) ||
              actionKey(overlap.actions) !== actionKey(q.previous.actions);
          } catch {
            /* A received contradiction within the old scope still revokes. */
          }
        } else contradictsPrevious = changedOverlap;
      }
      if (
        q.previous &&
        contradictsPrevious &&
        (!(error instanceof AlpacaError) || error.code === "MALFORMED")
      )
        throw Object.assign(new EvidenceError("EVIDENCE_CHANGED"), {
          limitation: marketFailure(error)?.code,
        });
      throw error;
    }
  };
}
