import "server-only";
import type { Action, Asset, Calendar, Input, Portfolio } from "../backtest.ts";

type ErrorCode =
  | "CONFIG"
  | "AUTH"
  | "FORBIDDEN"
  | "RATE_LIMIT"
  | "UPSTREAM"
  | "TIMEOUT"
  | "ABORTED"
  | "MALFORMED"
  | "PAGINATION"
  | "LIMIT"
  | "BLOCKED";
export class AlpacaError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode) {
    super(`Alpaca adapter: ${code}`);
    this.code = code;
    this.name = "AlpacaError";
  }
}
const fail = (code: ErrorCode): never => {
  throw new AlpacaError(code);
};
type Obj = Record<string, unknown>;
const object = (v: unknown): Obj =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Obj)
    : fail("MALFORMED");
const date = (v: unknown): string => {
  if (typeof v !== "string" || !/^\d{4}-\d\d-\d\d$/.test(v))
    return fail("MALFORMED");
  const d = new Date(`${v}T00:00:00Z`);
  if (!Number.isFinite(d.valueOf()) || d.toISOString().slice(0, 10) !== v)
    return fail("MALFORMED");
  return v;
};
const timestamp = (value: unknown): string => {
  const v = text(value);
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(
      v,
    );
  if (!match) return fail("MALFORMED");
  date(match[1]);
  if (Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59)
    return fail("MALFORMED");
  const offset = match[5]!;
  if (
    offset !== "Z" &&
    (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4, 6)) > 59)
  )
    return fail("MALFORMED");
  if (!Number.isFinite(Date.parse(v))) return fail("MALFORMED");
  return v;
};
const positive = (v: unknown): string => {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0)
    return fail("MALFORMED");
  const s = String(v);
  if (!/^\d{1,18}(?:\.\d{1,18})?$/.test(s)) return fail("MALFORMED");
  return s;
};
const text = (v: unknown): string =>
  typeof v === "string" && v.length > 0 && v.length <= 128
    ? v
    : fail("MALFORMED");
export type Config = {
  keyId: string;
  secret: string;
  timeoutMs?: number;
  retries?: number;
  maxPages?: number;
  maxResponseBytes?: number;
  maxResponseChunks?: number;
  maxTotalBytes?: number;
  maxPageRecords?: number;
  maxTotalBars?: number;
  maxTotalActions?: number;
  transport?: typeof fetch;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};
export type Query = {
  symbols: string[];
  start: string;
  end: string;
  feed: "sip" | "iex";
  signal?: AbortSignal;
};
export type CandidateAction = {
  symbol: string;
  id: string;
  kind: string;
  date?: string;
  paymentDate?: string;
  amount?: string;
  numerator?: string;
  denominator?: string;
  issues: string[];
};
export type Candidates = {
  symbols: string[];
  start: string;
  end: string;
  prices: Record<string, Record<string, string>>;
  actions: CandidateAction[];
  evidence: {
    barsTraversal: "complete";
    actionsTraversal: "complete";
    actionsCompleteness: "unknown";
    note: string;
  };
};

function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(new AlpacaError("ABORTED"));
    };
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    if (signal.aborted) {
      onAbort();
      void promise.catch(() => undefined);
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(
          error instanceof Error
            ? error
            : new Error("Asynchronous operation failed"),
        );
      },
    );
  });
}
function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new AlpacaError("ABORTED"));
    };
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
}
function discard(response: Response): void {
  if (response.body) void response.body.cancel().catch(() => undefined);
}
export async function fetchCandidates(
  config: Config,
  query: Query,
): Promise<Candidates> {
  const {
    keyId,
    secret,
    timeoutMs = 10000,
    retries = 2,
    maxPages = 100,
    maxResponseBytes = 2 * 1024 * 1024,
    maxResponseChunks = 16384,
    maxTotalBytes = 32 * 1024 * 1024,
    maxPageRecords = 10000,
    maxTotalBars = 250000,
    maxTotalActions = 25000,
    transport = fetch,
    sleep = defaultSleep,
  } = config;
  if (
    !keyId ||
    !secret ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60000 ||
    !Number.isInteger(retries) ||
    retries < 0 ||
    retries > 5 ||
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 1000 ||
    !Number.isInteger(maxResponseBytes) ||
    maxResponseBytes < 1 ||
    maxResponseBytes > 16 * 1024 * 1024 ||
    !Number.isInteger(maxResponseChunks) ||
    maxResponseChunks < 1 ||
    maxResponseChunks > 65536 ||
    !Number.isInteger(maxTotalBytes) ||
    maxTotalBytes < 1 ||
    maxTotalBytes > 128 * 1024 * 1024 ||
    !Number.isInteger(maxPageRecords) ||
    maxPageRecords < 1 ||
    maxPageRecords > 10000 ||
    !Number.isInteger(maxTotalBars) ||
    maxTotalBars < 1 ||
    maxTotalBars > 500000 ||
    !Number.isInteger(maxTotalActions) ||
    maxTotalActions < 1 ||
    maxTotalActions > 100000
  )
    return fail("CONFIG");
  const symbols = query.symbols;
  if (
    !Array.isArray(symbols) ||
    symbols.length < 1 ||
    symbols.length > 50 ||
    new Set(symbols).size !== symbols.length ||
    symbols.some(
      (s) => typeof s !== "string" || !/^[A-Z0-9.\-]{1,20}$/.test(s),
    ) ||
    !["sip", "iex"].includes(query.feed)
  )
    return fail("CONFIG");
  const start = date(query.start),
    end = date(query.end);
  if (start > end) return fail("CONFIG");
  const common = { symbols: symbols.join(","), start, end, sort: "asc" };
  let totalBytes = 0,
    totalBars = 0,
    totalActions = 0;
  async function readJson(
    response: Response,
    signal: AbortSignal,
  ): Promise<Obj> {
    if (!response.body) return fail("MALFORMED");
    const reader = response.body.getReader();
    const bytes = new Uint8Array(Math.min(maxResponseBytes, maxTotalBytes));
    let size = 0,
      chunkCount = 0,
      complete = false;
    try {
      while (true) {
        const part = await abortable(reader.read(), signal);
        if (part.done) {
          complete = true;
          break;
        }
        if (!(part.value instanceof Uint8Array)) return fail("MALFORMED");
        chunkCount++;
        const nextSize = size + part.value.byteLength;
        totalBytes += part.value.byteLength;
        if (
          chunkCount > maxResponseChunks ||
          nextSize > maxResponseBytes ||
          totalBytes > maxTotalBytes
        )
          return fail("LIMIT");
        bytes.set(part.value, size);
        size = nextSize;
      }
      try {
        return object(
          JSON.parse(
            new TextDecoder("utf-8", { fatal: true }).decode(
              bytes.subarray(0, size),
            ),
          ) as unknown,
        );
      } catch (error) {
        if (error instanceof AlpacaError) throw error;
        return fail("MALFORMED");
      }
    } finally {
      if (!complete) void reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }
  function countRecords(
    groups: [string, unknown][],
    type: "bars" | "actions",
  ): void {
    let count = 0;
    for (const [, rows] of groups) {
      if (!Array.isArray(rows)) return fail("MALFORMED");
      count += rows.length;
      if (count > maxPageRecords) return fail("LIMIT");
    }
    if (type === "bars") {
      totalBars += count;
      if (totalBars > maxTotalBars) return fail("LIMIT");
    } else {
      totalActions += count;
      if (totalActions > maxTotalActions) return fail("LIMIT");
    }
  }
  async function pages(
    path: "/v2/stocks/bars" | "/v1/corporate-actions",
    params: Record<string, string>,
    consume: (p: Obj) => void,
  ) {
    const seen = new Set<string>();
    let token: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const url = new URL(path, "https://data.alpaca.markets");
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      if (token) url.searchParams.set("page_token", token);
      let result: Obj | undefined;
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (query.signal?.aborted) return fail("ABORTED");
        const controller = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
        const onAbort = () => controller.abort();
        query.signal?.addEventListener("abort", onAbort, { once: true });
        try {
          const request = transport(url.toString(), {
            method: "GET",
            cache: "no-store",
            headers: {
              "APCA-API-KEY-ID": keyId,
              "APCA-API-SECRET-KEY": secret,
              accept: "application/json",
            },
            signal: controller.signal,
            redirect: "error",
          }).then((response) => {
            if (controller.signal.aborted) discard(response);
            return response;
          });
          const response = await abortable(request, controller.signal);
          if (response.status === 401) {
            discard(response);
            return fail("AUTH");
          }
          if (response.status === 403) {
            discard(response);
            return fail("FORBIDDEN");
          }
          if (response.status === 429 || response.status >= 500) {
            discard(response);
            if (attempt === retries)
              return fail(response.status === 429 ? "RATE_LIMIT" : "UPSTREAM");
          } else if (!response.ok) {
            discard(response);
            return fail("UPSTREAM");
          } else {
            result = await readJson(response, controller.signal);
            break;
          }
        } catch (e) {
          if (query.signal?.aborted) return fail("ABORTED");
          if (timedOut) return fail("TIMEOUT");
          if (e instanceof AlpacaError) throw e;
          return fail("UPSTREAM");
        } finally {
          clearTimeout(timer);
          query.signal?.removeEventListener("abort", onAbort);
          controller.abort();
        }
        try {
          await abortable(
            sleep(Math.min(2000, 100 * 2 ** attempt), query.signal),
            query.signal,
          );
        } catch {
          if (query.signal?.aborted) return fail("ABORTED");
          return fail("UPSTREAM");
        }
      }
      if (!result) return fail("UPSTREAM");
      consume(result);
      const next = result.next_page_token;
      if (next === null) return;
      if (
        typeof next !== "string" ||
        !next ||
        next.length > 4096 ||
        seen.has(next)
      )
        return fail("PAGINATION");
      seen.add(next);
      token = next;
    }
    return fail("PAGINATION");
  }
  const prices: Record<string, Record<string, string>> = Object.fromEntries(
    symbols.map((s) => [s, Object.create(null) as Record<string, string>]),
  );
  await pages(
    "/v2/stocks/bars",
    {
      ...common,
      start: `${start}T00:00:00Z`,
      end: `${end}T23:59:59Z`,
      timeframe: "1Day",
      adjustment: "raw",
      feed: query.feed,
      limit: "10000",
    },
    (p) => {
      const groups = Object.entries(object(p.bars));
      countRecords(groups, "bars");
      for (const [symbol, rows] of groups) {
        if (!symbols.includes(symbol) || !Array.isArray(rows))
          return fail("MALFORMED");
        for (const item of rows) {
          const row = object(item);
          const barTime = timestamp(row.t);
          const day = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/New_York",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(barTime));
          date(day);
          if (day < start || day > end || Object.hasOwn(prices[symbol]!, day))
            return fail("MALFORMED");
          prices[symbol]![day] = positive(row.c);
        }
      }
    },
  );
  const actions: CandidateAction[] = [],
    ids = new Set<string>();
  await pages(
    "/v1/corporate-actions",
    { ...common, data_quality: "all", limit: "1000" },
    (p) => {
      const groups = Object.entries(object(p.corporate_actions));
      countRecords(groups, "actions");
      for (const [kind, rows] of groups) {
        if (!Array.isArray(rows)) return fail("MALFORMED");
        for (const item of rows) {
          const row = object(item),
            id = text(row.id),
            symbol = text(row.symbol);
          if (!symbols.includes(symbol) || ids.has(id))
            return fail("MALFORMED");
          ids.add(id);
          const issues: string[] = [];
          const maybeDate = (v: unknown, label: string) => {
            if (v == null || v === "") {
              issues.push(label);
              return undefined;
            }
            return date(v);
          };
          const processDate = maybeDate(
            row.process_date,
            "missing process date",
          );
          if (processDate && (processDate < start || processDate > end))
            return fail("MALFORMED");
          const eventDate = maybeDate(row.ex_date, "missing ex-date");
          const a: CandidateAction = {
            symbol,
            id,
            kind,
            date: eventDate,
            issues,
          };
          if (kind === "cash_dividends") {
            a.paymentDate = maybeDate(row.payable_date, "missing payment date");
            if (row.rate == null) issues.push("missing rate");
            else a.amount = positive(row.rate);
            if (
              row.special !== false ||
              row.foreign !== false ||
              row.sub_type != null ||
              row.due_bill_on_date != null ||
              row.due_bill_off_date != null ||
              (row.currency != null && row.currency !== "USD")
            )
              issues.push("unsupported dividend terms");
            issues.push("dividend unit basis unverified");
            if (a.paymentDate && eventDate && a.paymentDate < eventDate)
              issues.push("payment before ex-date");
          } else if (kind === "forward_splits" || kind === "reverse_splits") {
            if (row.new_rate == null || row.old_rate == null)
              issues.push("missing split ratio");
            else {
              a.numerator = positive(row.new_rate);
              a.denominator = positive(row.old_rate);
            }
            if (row.due_bill_redemption_date != null || row.new_symbol != null)
              issues.push("unsupported split terms");
          } else issues.push("unsupported action");
          actions.push(a);
        }
      }
    },
  );
  return {
    symbols: [...symbols],
    start,
    end,
    prices,
    actions,
    evidence: {
      barsTraversal: "complete",
      actionsTraversal: "complete",
      actionsCompleteness: "unknown",
      note: "Actions are selected by process date and may arrive late; traversal does not prove completeness.",
    },
  };
}

export type Proof = {
  status: "verified";
  source: string;
  method: string;
  from: string;
  through: string;
};
export type Evidence = {
  calendar: Proof;
  finality: Proof;
  actions: Record<string, Proof>;
  inception: Record<string, Proof & { firstAvailable: string }>;
  prices: Record<string, Proof>;
  access: Record<string, Proof>;
  dividendUnits: Record<string, Proof & { basis: "postSplit" }>;
};
function requireProof(
  p: Proof | undefined,
  from: string,
  through: string,
): void {
  if (
    p?.status !== "verified" ||
    typeof p.source !== "string" ||
    !p.source.trim() ||
    typeof p.method !== "string" ||
    !p.method.trim()
  )
    return fail("BLOCKED");
  try {
    if (date(p.from) > from || date(p.through) < through)
      return fail("BLOCKED");
  } catch {
    return fail("BLOCKED");
  }
}
export function toEngineInput(
  c: Candidates,
  sessions: string[],
  evidence: Evidence,
  portfolios: Portfolio[],
  amount: string,
): Input {
  if (!evidence || !Array.isArray(sessions)) return fail("BLOCKED");
  requireProof(evidence.calendar, c.start, c.end);
  requireProof(evidence.finality, c.start, c.end);
  let previous = "";
  for (const s of sessions) {
    try {
      date(s);
    } catch {
      return fail("BLOCKED");
    }
    if (s <= previous || s < c.start || s > c.end) return fail("BLOCKED");
    previous = s;
  }
  const calendar: Calendar = {
    complete: true,
    finalityVerified: true,
    provenance: `${evidence.calendar.source}; ${evidence.finality.source}`,
    from: c.start,
    through: c.end,
    sessions: [...sessions],
  };
  const assets: Asset[] = c.symbols.map((symbol) => {
    const inception = evidence.inception?.[symbol];
    requireProof(inception, c.start, c.end);
    requireProof(evidence.prices?.[symbol], c.start, c.end);
    requireProof(evidence.actions?.[symbol], c.start, c.end);
    requireProof(evidence.access?.[symbol], c.start, c.end);
    let first: string;
    try {
      first = date(inception!.firstAvailable);
    } catch {
      return fail("BLOCKED");
    }
    if (Object.keys(c.prices[symbol] ?? {}).some((s) => s < first))
      return fail("BLOCKED");
    for (const s of sessions)
      if (s >= first && !Object.hasOwn(c.prices[symbol] ?? {}, s))
        return fail("BLOCKED");
    const actions: Action[] = c.actions
      .filter((a) => a.symbol === symbol)
      .map((a) => {
        if (!a.date || !sessions.includes(a.date)) return fail("BLOCKED");
        if (a.kind === "cash_dividends") {
          requireProof(evidence.dividendUnits?.[symbol], c.start, c.end);
          if (evidence.dividendUnits?.[symbol]?.basis !== "postSplit")
            return fail("BLOCKED");
          if (
            a.issues.some((x) => x !== "dividend unit basis unverified") ||
            !a.paymentDate ||
            !a.amount
          )
            return fail("BLOCKED");
          return {
            id: a.id,
            type: "dividend",
            date: a.date,
            paymentDate: a.paymentDate,
            amount: a.amount,
            basis: "postSplit",
          };
        }
        if (
          (a.kind === "forward_splits" || a.kind === "reverse_splits") &&
          a.issues.length === 0 &&
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
        return fail("BLOCKED");
      });
    return {
      symbol,
      firstAvailable: first,
      from: c.start,
      through: c.end,
      complete: true,
      inceptionVerified: true,
      pricesComplete: true,
      actionsComplete: true,
      accessComplete: true,
      prices: c.prices[symbol]!,
      actions,
      priceBasis: "raw",
      provenance: `${evidence.prices[symbol]!.source}; ${evidence.actions[symbol]!.source}`,
    };
  });
  return { calendar, assets, portfolios, start: c.start, end: c.end, amount };
}
