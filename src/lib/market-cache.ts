import { marketFailure, type MarketFailureCode } from "./market-errors.ts";
import "server-only";
import { createHash } from "node:crypto";
import { backtest, BacktestError } from "./backtest.ts";
import type { Asset, Calendar, Portfolio } from "./backtest.ts";

type Result = ReturnType<typeof backtest>;
type Code =
  | MarketFailureCode
  | "INVALID_INPUT"
  | "CALENDAR_UNAVAILABLE"
  | "UNVERIFIED_DATA"
  | "DAILY_LIMIT"
  | "REFRESH_FAILED"
  | "LIMIT"
  | "CALCULATION_FAILED"
  | "SESSION_PENDING";
export class CacheError extends Error {
  readonly code: Code;
  constructor(code: Code) {
    super(code);
    this.code = code;
  }
}
const fail = (code: Code): never => {
  throw new CacheError(code);
};
const POLICY = "alpaca-raw-sip-next-day-0900-v1";
const date = (value: string) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail("INVALID_INPUT");
  return value;
};
function shift(day: string, days: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
function local(now: Date) {
  if (!Number.isFinite(now.valueOf())) return fail("INVALID_INPUT");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  const cycle = Number(p.hour) >= 9 ? today : shift(today, -1);
  return { cycle, eligibleThrough: shift(cycle, -1) };
}
export const freshnessCycle = (now: Date) => local(now).cycle;
/** Operational eligibility, not a provider finality assertion. */
export function eligibleSessions(sessions: string[], now: Date): string[] {
  const { eligibleThrough } = local(now);
  let previous = "";
  return sessions.filter((s) => {
    date(s);
    if (s <= previous) fail("INVALID_INPUT");
    previous = s;
    return s <= eligibleThrough;
  });
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
const hash = (value: unknown) =>
  createHash("sha256").update(stable(value)).digest("hex");
const clone = <T>(value: T): T => structuredClone(value);
function positive(value: string): bigint {
  if (typeof value !== "string" || !/^\d{1,18}(\.\d{1,18})?$/.test(value))
    return fail("INVALID_INPUT");
  const [whole, fraction = ""] = value.split(".");
  const scaled = BigInt(whole! + fraction.padEnd(18, "0"));
  if (scaled <= 0n) return fail("INVALID_INPUT");
  return scaled;
}
export type BacktestRequest = {
  portfolios: Portfolio[];
  amount: string;
  start: string;
  end: string; // ISO date or "latest".
};
export type CacheView = {
  status: "ready" | "refreshing" | "stale" | "blocked";
  requested: { start: string; end: string };
  result?: Result;
  assetReturns?: Record<string, string>;
  asOf?: string;
  dataCheckedAt?: string;
  dataRevisions?: Record<string, string>;
  code?: Code;
  retryAt?: number;
  issues?: { symbol: string; code: Code }[];
};
export type AssetRefresh = {
  symbol: string;
  from: string;
  through: string;
  recheckFrom: string;
  previous?: Asset;
  signal: AbortSignal;
};
export type CacheOptions = {
  supportedSymbols: string[];
  historyStart: string;
  calendar: () => Calendar;
  // Trusted server-side loader must establish provider evidence before returning.
  // Candidate traversal or the 09:00 rule alone must never set these flags.
  load: (
    request: AssetRefresh,
  ) => Promise<{ feed: "sip"; asset: Asset; pendingSession?: string }>;
  clock?: () => Date;
  timeoutMs?: number;
  retryCooldownMs?: number;
};
type Entry = {
  asset: Asset;
  pendingSession?: string;
  calendarRevision: string;
  revision: string;
  checkedAt: string;
  cycle: string;
  bytes: number;
};
type Saved = {
  result: Result;
  effectiveEnd: string;
  calendarRevision: string;
  revisions: Record<string, string>;
  checkedAt: string;
  bytes: number;
};

/** Single-process personal-use coordinator. No network, credentials or scheduler by default.
 * A shared instance coalesces portfolios; durable/distributed coordination is a separate integration.
 */
export function createOnDemandBacktests(options: CacheOptions) {
  const historyStart = date(options.historyStart);
  const supported = new Set(options.supportedSymbols);
  if (
    !supported.has("SPY") ||
    supported.size !== options.supportedSymbols.length ||
    supported.size > 50 ||
    [...supported].some((s) => !/^[A-Z][A-Z0-9.-]{0,15}$/.test(s))
  )
    fail("INVALID_INPUT");
  const timeoutMs = options.timeoutMs ?? 15000,
    cooldown = options.retryCooldownMs ?? 60000;
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60000 ||
    !Number.isInteger(cooldown) ||
    cooldown < 1 ||
    cooldown > 86400000
  )
    fail("INVALID_INPUT");
  const clock = options.clock ?? (() => new Date());
  const entries = new Map<string, Entry>(),
    results = new Map<string, Saved>();
  const running = new Map<string, Promise<void>>();
  const attempts = new Map<
    string,
    { cycle: string; count: number; at: number }
  >();
  const errors = new Map<string, Code>();
  const retryTimes = new Map<string, number>();
  const MAX_BYTES = 16 * 1024 * 1024,
    MAX_ITEM = 2 * 1024 * 1024;
  let entryBytes = 0,
    resultBytes = 0;
  function invalidate(symbol: string) {
    for (const [key, saved] of results)
      if (symbol in saved.revisions) {
        resultBytes -= saved.bytes;
        results.delete(key);
      }
  }
  function context(now: Date) {
    const calendar = clone(options.calendar());
    const { cycle, eligibleThrough } = local(now);
    if (
      calendar?.complete !== true ||
      calendar.finalityVerified !== true ||
      !calendar.provenance ||
      date(calendar.from) > historyStart ||
      date(calendar.through) < eligibleThrough ||
      !Array.isArray(calendar.sessions) ||
      calendar.sessions.length > 5000
    )
      return fail("CALENDAR_UNAVAILABLE");
    const sessions = eligibleSessions(calendar.sessions, now);
    if (
      calendar.sessions.some((s) => s < calendar.from || s > calendar.through)
    )
      fail("CALENDAR_UNAVAILABLE");
    const latest = sessions.at(-1);
    if (!latest) return fail("CALENDAR_UNAVAILABLE");
    const ctx = { calendar, sessions, latest, cycle };
    // A newly observed calendar correction affects every saved calculation,
    // including one next opened while the calendar source is unavailable.
    for (const [key, saved] of results) {
      if (
        saved.calendarRevision !== calendarRevision(ctx, saved.effectiveEnd)
      ) {
        resultBytes -= saved.bytes;
        results.delete(key);
      }
    }
    return ctx;
  }
  function validate(request: BacktestRequest) {
    date(request.start);
    if (request.end !== "latest") date(request.end);
    if (
      request.start < historyStart ||
      (request.end !== "latest" && request.end < request.start) ||
      !Array.isArray(request.portfolios) ||
      !request.portfolios.length ||
      request.portfolios.length > 3
    )
      fail("INVALID_INPUT");
    positive(request.amount);
    const symbols = new Set(["SPY"]),
      ids = new Set<string>();
    for (const p of request.portfolios) {
      if (
        typeof p.id !== "string" ||
        !p.id.trim() ||
        p.id.length > 128 ||
        ids.has(p.id) ||
        !Array.isArray(p.holdings) ||
        !p.holdings.length ||
        p.holdings.length > 50
      )
        fail("INVALID_INPUT");
      ids.add(p.id);
      const holdings = new Set<string>();
      let sum = 0n;
      for (const h of p.holdings) {
        if (!supported.has(h.symbol) || holdings.has(h.symbol))
          fail("INVALID_INPUT");
        holdings.add(h.symbol);
        symbols.add(h.symbol);
        sum += positive(h.weight);
      }
      if (sum !== 100n * 10n ** 18n) fail("INVALID_INPUT");
    }
    return [...symbols].sort();
  }
  function calendarRevision(ctx: ReturnType<typeof context>, through: string) {
    return hash({
      from: historyStart,
      through,
      sessions: ctx.sessions.filter((s) => s >= historyStart && s <= through),
    });
  }
  function fresh(entry: Entry | undefined, ctx: ReturnType<typeof context>) {
    return (
      !!entry &&
      entry.cycle === ctx.cycle &&
      entry.asset.from <= historyStart &&
      entry.calendarRevision === calendarRevision(ctx, entry.asset.through) &&
      (entry.asset.through >= ctx.latest ||
        (entry.pendingSession === ctx.latest &&
          entry.asset.through === ctx.sessions.at(-2)))
    );
  }
  function admit(
    asset: Asset,
    symbol: string,
    ctx: ReturnType<typeof context>,
    pendingSession?: string,
  ) {
    const requiredThrough =
      pendingSession === ctx.latest
        ? (ctx.sessions.at(-2) ?? fail("UNVERIFIED_DATA"))
        : ctx.latest;
    if (
      !requiredThrough ||
      (pendingSession !== undefined &&
        (pendingSession !== ctx.latest || asset.through !== requiredThrough))
    )
      fail("UNVERIFIED_DATA");
    if (
      asset?.symbol !== symbol ||
      asset.priceBasis !== "raw" ||
      asset.complete !== true ||
      asset.inceptionVerified !== true ||
      asset.pricesComplete !== true ||
      asset.actionsComplete !== true ||
      asset.accessComplete !== true ||
      !asset.provenance ||
      date(asset.from) > historyStart ||
      date(asset.through) < requiredThrough ||
      !asset.prices ||
      !Array.isArray(asset.actions) ||
      asset.actions.length > 10000 ||
      Object.keys(asset.prices).length > 5000
    )
      fail("UNVERIFIED_DATA");
    const first = date(asset.firstAvailable);
    for (const [day, price] of Object.entries(asset.prices)) {
      date(day);
      if (
        day < first ||
        day < asset.from ||
        day > asset.through ||
        !ctx.sessions.includes(day)
      )
        fail("UNVERIFIED_DATA");
      positive(price);
    }
    for (const day of ctx.sessions)
      if (
        day >= historyStart &&
        day >= first &&
        day <= asset.through &&
        !Object.hasOwn(asset.prices, day)
      )
        fail("UNVERIFIED_DATA");
  }
  function refresh(
    symbol: string,
    ctx: ReturnType<typeof context>,
    retry: boolean,
  ): Promise<void> | undefined {
    if (running.has(symbol)) return running.get(symbol)!;
    const now = clock();
    const last = attempts.get(symbol);
    if (
      last?.cycle === ctx.cycle &&
      (!retry || last.count >= 2 || now.valueOf() - last.at < cooldown)
    ) {
      errors.set(symbol, "DAILY_LIMIT");
      return;
    }
    attempts.set(symbol, {
      cycle: ctx.cycle,
      count: last?.cycle === ctx.cycle ? last.count + 1 : 1,
      at: now.valueOf(),
    });
    const task = Promise.resolve().then(async () => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const expiry = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new CacheError("REFRESH_FAILED"));
          }, timeoutMs);
        });
        const payload = await Promise.race([
          options.load({
            symbol,
            from: historyStart,
            through: ctx.latest,
            recheckFrom: ctx.sessions
              .filter((s) => s >= historyStart)
              .slice(-5)[0]!,
            previous: entries.has(symbol)
              ? clone(entries.get(symbol)!.asset)
              : undefined,
            signal: controller.signal,
          }),
          expiry,
        ]);
        if (payload?.feed !== "sip") fail("UNVERIFIED_DATA");
        const asset = clone(payload.asset);
        admit(asset, symbol, ctx, payload.pendingSession);
        const revision = hash({ policy: POLICY, feed: "sip", asset });
        const previous = entries.get(symbol);
        if (previous && previous.revision !== revision) invalidate(symbol);
        const bytes = Buffer.byteLength(JSON.stringify(asset));
        if (
          bytes > MAX_ITEM ||
          entryBytes - (previous?.bytes ?? 0) + bytes > MAX_BYTES
        )
          fail("LIMIT");
        entryBytes += bytes - (previous?.bytes ?? 0);
        entries.set(symbol, {
          asset,
          pendingSession: payload.pendingSession,
          calendarRevision: calendarRevision(ctx, asset.through),
          revision,
          checkedAt: clock().toISOString(),
          cycle: ctx.cycle,
          bytes,
        });
        errors.delete(symbol);
        retryTimes.delete(symbol);
      } catch (e) {
        // Never forward provider bodies, secret-bearing exception messages or loader objects.
        const failure = marketFailure(e);
        errors.set(
          symbol,
          failure?.code ??
            (e instanceof CacheError ? e.code : "REFRESH_FAILED"),
        );
        if (failure?.retryAt) retryTimes.set(symbol, failure.retryAt);
      } finally {
        if (timer) clearTimeout(timer);
        running.delete(symbol);
      }
    });
    running.set(symbol, task);
    return task;
  }
  function view(
    request: BacktestRequest,
    symbols: string[],
    key: string,
  ): CacheView {
    const base = { requested: { start: request.start, end: request.end } };
    let ctx: ReturnType<typeof context>;
    try {
      ctx = context(clock());
    } catch {
      const saved = results.get(key);
      return {
        ...base,
        status: saved ? "stale" : "blocked",
        ...(saved
          ? {
              result: clone(saved.result),
              asOf: saved.result.actual.end,
              dataCheckedAt: saved.checkedAt,
              dataRevisions: clone(saved.revisions),
            }
          : {}),
        code: "CALENDAR_UNAVAILABLE",
      };
    }
    let saved = results.get(key);
    if (
      saved &&
      saved.calendarRevision !== calendarRevision(ctx, saved.effectiveEnd)
    ) {
      resultBytes -= saved.bytes;
      results.delete(key);
      saved = undefined;
    }
    const pending = symbols.some((s) => running.has(s));
    if (symbols.every((s) => fresh(entries.get(s), ctx))) {
      const revisions = Object.fromEntries(
        symbols.map((s) => [s, entries.get(s)!.revision]),
      );
      try {
        const sharedThrough = symbols
          .map((s) => entries.get(s)!.asset.through)
          .sort()[0]!;
        const sharedEnd = ctx.sessions
          .filter((s) => s <= sharedThrough)
          .at(-1)!;
        const end =
          request.end === "latest" || request.end > sharedEnd
            ? sharedEnd
            : request.end;
        const revision = calendarRevision(ctx, end);
        let current = saved;
        if (
          !current ||
          hash(current.revisions) !== hash(revisions) ||
          current.effectiveEnd !== end ||
          current.calendarRevision !== revision
        ) {
          const result = backtest({
            calendar: {
              ...ctx.calendar,
              through: ctx.latest,
              sessions: ctx.sessions,
            },
            assets: symbols.map((s) => clone(entries.get(s)!.asset)),
            portfolios: clone(request.portfolios),
            amount: request.amount,
            start: request.start,
            end,
          });
          const bytes = Buffer.byteLength(JSON.stringify(result));
          if (bytes > MAX_ITEM) fail("LIMIT");
          if (current) {
            resultBytes -= current.bytes;
            results.delete(key);
          }
          while (results.size >= 16 || resultBytes + bytes > MAX_BYTES) {
            const first = results.entries().next().value;
            if (!first) break;
            resultBytes -= first[1].bytes;
            results.delete(first[0]);
          }
          current = {
            result,
            effectiveEnd: end,
            calendarRevision: revision,
            revisions,
            checkedAt: symbols.map((s) => entries.get(s)!.checkedAt).sort()[0]!,
            bytes,
          };
          results.set(key, current);
          resultBytes += bytes;
        }
        current.checkedAt = symbols
          .map((s) => entries.get(s)!.checkedAt)
          .sort()[0]!;
        return {
          ...base,
          status: pending
            ? "refreshing"
            : (request.end === "latest" || request.end > sharedEnd) &&
                sharedEnd < ctx.latest
              ? "stale"
              : "ready",
          ...((request.end === "latest" || request.end > sharedEnd) &&
          sharedEnd < ctx.latest
            ? { code: "SESSION_PENDING" as const }
            : {}),
          result: clone(current.result),
          asOf: current.result.actual.end,
          dataCheckedAt: symbols
            .map((s) => entries.get(s)!.checkedAt)
            .sort()[0]!,
          dataRevisions: clone(current.revisions),
        };
      } catch (e) {
        return {
          ...base,
          status: "blocked",
          issues:
            e instanceof BacktestError
              ? symbols
                  .filter((symbol) => e.message.startsWith(symbol + ":"))
                  .map((symbol) => ({
                    symbol,
                    code: "CALCULATION_FAILED" as const,
                  }))
              : undefined,
          code:
            e instanceof BacktestError
              ? "CALCULATION_FAILED"
              : e instanceof CacheError
                ? e.code
                : "CALCULATION_FAILED",
        };
      }
    }
    return {
      ...base,
      status: pending ? "refreshing" : saved ? "stale" : "blocked",
      ...(saved
        ? {
            result: clone(saved.result),
            asOf: saved.result.actual.end,
            dataCheckedAt: saved.checkedAt,
            dataRevisions: clone(saved.revisions),
          }
        : {}),
      retryAt:
        Math.max(0, ...symbols.map((s) => retryTimes.get(s) ?? 0)) || undefined,
      issues: symbols
        .filter((symbol) => errors.has(symbol))
        .map((symbol) => ({ symbol, code: errors.get(symbol)! })),
      ...(pending
        ? {}
        : {
            code:
              symbols.map((s) => errors.get(s)).find(Boolean) ??
              "UNVERIFIED_DATA",
          }),
    };
  }
  return {
    open(
      input: BacktestRequest,
      { retry = false }: { retry?: boolean } = {},
    ): { initial: CacheView; settled: Promise<CacheView> } {
      const request = clone(input),
        symbols = validate(request),
        key = hash({ policy: POLICY, request });
      let ctx: ReturnType<typeof context>;
      try {
        ctx = context(clock());
      } catch {
        const initial = view(request, symbols, key);
        return { initial, settled: Promise.resolve(initial) };
      }
      const tasks = symbols
        .filter(
          (s) =>
            !fresh(entries.get(s), ctx) ||
            (retry && !!entries.get(s)?.pendingSession),
        )
        .map((s) => refresh(s, ctx, retry))
        .filter((t): t is Promise<void> => !!t);
      const initial = view(request, symbols, key);
      return {
        initial,
        settled: tasks.length
          ? Promise.all(tasks).then(() => view(request, symbols, key))
          : Promise.resolve(initial),
      };
    },
  };
}
