import "server-only";
import { fetchCandidates, AlpacaError } from "./adapter.ts";
import type { Config, Candidates } from "./adapter.ts";
import type { Asset, Action, Calendar } from "../backtest.ts";
import type { AssetRefresh } from "../market-cache.ts";
import { EvidenceError } from "./verified-loader.ts";
import { eligibleSessions } from "../market-cache.ts";
import { marketFailure, type MarketFailure } from "../market-errors.ts";

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
): typeof fetch {
  return async (url, init) => {
    try {
      await reserve();
    } catch (error) {
      const failure = marketFailure(error);
      if (failure) throw new AdmissionFailure(failure);
      throw error;
    }
    return transport(url, init);
  };
}

export const PROVISIONAL_POLICY = "personal-provisional-sip-v2-ex-date-scope";
const provenance =
  "Personal provisional Alpaca SIP; subject to corrections; action completeness not independently established";

// These flags express acceptance under the personal provisional policy, never analyst verification.
// The fixed catalog predates the supported five-year window: missing leading bars fail too.
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
    .map<Action>((a) => {
      if (
        a.symbol !== symbol ||
        !a.date ||
        (a.date >= c.start && a.date <= c.end && !sessions.includes(a.date))
      )
        throw new Error("UNSUPPORTED_ACTION");
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
      throw new Error("UNSUPPORTED_ACTION");
    })
    .filter((a) => a.date >= c.start && a.date <= c.end);
  return {
    symbol,
    firstAvailable: c.start,
    from: c.start,
    through: c.end,
    complete: true,
    inceptionVerified: true,
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
  if (!response.ok || !response.body) {
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
    const rows: unknown = JSON.parse(Buffer.concat(parts).toString("utf8"));
    if (!Array.isArray(rows) || !rows.length || rows.length > 1300)
      throw new Error();
    let previous = "";
    const dates = rows.map((r: { date?: unknown }) => {
      const d = r?.date;
      if (
        typeof d !== "string" ||
        !/^\d{4}-\d\d-\d\d$/.test(d) ||
        !Number.isFinite(Date.parse(d)) ||
        new Date(d).toISOString().slice(0, 10) !== d ||
        d <= previous ||
        d < start ||
        d > end
      )
        throw new Error();
      previous = d;
      return d;
    });
    const sessions = eligibleSessions(dates, now);
    if (sessions.length < 2) throw new Error();
    return {
      from: start,
      through: sessions.at(-1)!,
      sessions,
      complete: true,
      finalityVerified: true,
      provenance,
    };
  } catch (e) {
    void reader.cancel().catch(() => undefined);
    if (e instanceof AlpacaError) throw e;
    throw new AlpacaError("MALFORMED");
  } finally {
    reader.releaseLock();
  }
}
export function createPersonalLoader(config: Config, calendar: Calendar) {
  return async (q: AssetRefresh) => {
    try {
      const candidates = await fetchCandidates(config, {
        symbols: [q.symbol],
        start: q.from,
        end: q.through,
        feed: "sip",
        signal: q.signal,
      });
      return {
        feed: "sip" as const,
        asset: provisionalAsset(candidates, calendar, q.symbol),
      };
    } catch (error) {
      if (error instanceof AdmissionFailure) throw error.failure;
      // Received data that contradicts a previously cached scope cannot fall back stale.
      if (
        q.previous &&
        (!(error instanceof AlpacaError) || error.code === "MALFORMED")
      )
        throw new EvidenceError("EVIDENCE_CHANGED");
      throw error;
    }
  };
}
