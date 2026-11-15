export type Code =
  | "INVALID_INPUT"
  | "UNVERIFIED_DATA"
  | "INSUFFICIENT_COVERAGE"
  | "SHORT_HISTORY"
  | "MISSING_PRICE"
  | "UNSUPPORTED_ACTION"
  | "NUMERIC_LIMIT";
export class BacktestError extends Error {
  readonly code: Code;
  constructor(code: Code, message: string) {
    super(message);
    this.code = code;
    this.name = "BacktestError";
  }
}
function fail(code: Code, message: string): never {
  throw new BacktestError(code, message);
}
// A private context prevents callers from changing the simulation precision.
import Decimal from "decimal.js";
const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,
  minE: -1000000000,
  maxE: 1000000000,
  toExpNeg: -1000,
  toExpPos: 1000,
});
type Rat = Decimal;
function checked(v: Decimal): Rat {
  if (!v.isFinite() || (!v.isZero() && (v.e < -900 || v.e > 900)))
    return fail("NUMERIC_LIMIT", "Decimal magnitude exceeds limit");
  return v;
}
const rat = (n: number) => new D(n);
const add = (a: Rat, b: Rat) => checked(a.plus(b));
const sub = (a: Rat, b: Rat) => checked(a.minus(b));
const mul = (a: Rat, b: Rat) => checked(a.times(b));
const div = (a: Rat, b: Rat) => {
  if (b.isZero()) return fail("INVALID_INPUT", "Division by zero");
  return checked(a.div(b));
};
const cmp = (a: Rat, b: Rat) => a.comparedTo(b);
const zero = rat(0),
  one = rat(1);
function decimal(s: string, positive = true): Rat {
  if (typeof s !== "string" || !/^\d{1,18}(?:\.\d{1,18})?$/.test(s))
    return fail("INVALID_INPUT", `Invalid decimal: ${String(s)}`);
  const result = new D(s);
  if ((positive && !result.isPositive()) || (positive && result.isZero()))
    return fail("INVALID_INPUT", "Decimal must be positive");
  return result;
}
function encoded(a: Rat): string {
  return a.toFixed();
}
function decode(s: string): Rat {
  if (typeof s !== "string" || !/^-?\d+(?:\.\d+)?$/.test(s) || s.length > 2000)
    return fail("INVALID_INPUT", "Invalid decimal result");
  return checked(new D(s));
}
/** Exact ties-to-even conversion of the supplied decimal to display dollars. */
export function display(value: string): string {
  return decode(value).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toFixed(2);
}
export function percent(value: string): string {
  return display(encoded(mul(decode(value), rat(100))));
}
function date(s: string): string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s))
    return fail("INVALID_INPUT", `Invalid date ${String(s)}`);
  const d = new Date(`${s}T00:00:00Z`);
  if (
    Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0, 10) !== s ||
    s < "1900-01-01" ||
    s > "9999-12-31"
  )
    return fail("INVALID_INPUT", `Invalid date ${s}`);
  return s;
}
/** Inclusive checked coverage; sessions may end earlier on closures. Flags are caller attestations. */
export type Calendar = {
  complete: boolean;
  finalityVerified: boolean;
  provenance: string;
  from: string;
  through: string;
  sessions: string[];
};
export type Action =
  | {
      id: string;
      type: "split";
      date: string;
      numerator: string;
      denominator: string;
    }
  | {
      id: string;
      type: "dividend";
      date: string;
      paymentDate: string;
      amount: string;
      basis: "postSplit";
    }
  | { id: string; type: "unsupported"; date: string; description: string };
export type Asset = {
  symbol: string;
  firstAvailable: string;
  from: string;
  through: string;
  complete: boolean;
  inceptionVerified: boolean;
  // Requested-window coverage does not establish lifetime inception.
  periodCoverageVerified?: boolean;
  pricesComplete: boolean;
  actionsComplete: boolean;
  accessComplete: boolean;
  prices: Record<string, string>;
  actions: Action[];
  priceBasis: "raw";
  provenance: string;
};
export type Portfolio = {
  id: string;
  holdings: { symbol: string; weight: string }[];
};
export type Input = {
  calendar: Calendar;
  assets: Asset[];
  portfolios: Portfolio[];
  start: string;
  end: string;
  amount: string;
};
function validateCalendar(c: Calendar): void {
  if (c?.complete !== true || c.finalityVerified !== true || !c.provenance)
    return fail("UNVERIFIED_DATA", "Calendar completeness is unknown");
  date(c.from);
  date(c.through);
  if (
    c.from > c.through ||
    !Array.isArray(c.sessions) ||
    c.sessions.length > 5000
  )
    return fail("INVALID_INPUT", "Invalid calendar");
  let previous = "";
  for (const s of c.sessions) {
    date(s);
    if (s <= previous || s < c.from || s > c.through)
      return fail(
        "INVALID_INPUT",
        "Calendar sessions must be ordered and within coverage",
      );
    previous = s;
  }
}
export type Preset = "1W" | "1M" | "1Y" | "5Y" | "YTD" | "Max";
/** Return requested calendar start, anchored to last verified completed session. */
export function preset(
  c: Calendar,
  kind: Preset,
): { start: string; end: string } {
  validateCalendar(c);
  const end = c.sessions.at(-1);
  if (!end) return fail("INSUFFICIENT_COVERAGE", "No completed sessions");
  let start: string;
  if (kind === "Max") start = c.from;
  else if (kind === "YTD") start = `${end.slice(0, 4)}-01-01`;
  else if (kind === "1W") {
    const d = new Date(`${end}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    start = d.toISOString().slice(0, 10);
  } else if (kind === "1M" || kind === "1Y" || kind === "5Y") {
    const y = Number(end.slice(0, 4)),
      m = Number(end.slice(5, 7)),
      day = Number(end.slice(8, 10));
    const months = kind === "1M" ? 1 : kind === "1Y" ? 12 : 60;
    const index = y * 12 + m - 1 - months,
      targetY = Math.floor(index / 12),
      targetM = (index % 12) + 1;
    const last = new Date(Date.UTC(targetY, targetM, 0)).getUTCDate();
    start = `${String(targetY).padStart(4, "0")}-${String(targetM).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
  } else return fail("INVALID_INPUT", "Unknown preset");
  date(start);
  if (start < c.from)
    return fail(
      "INSUFFICIENT_COVERAGE",
      "Calendar does not cover preset anchor",
    );
  return { start, end };
}
export function backtest(input: Input) {
  const { calendar: c, assets, portfolios, start, end } = input;
  validateCalendar(c);
  date(start);
  date(end);
  if (start > end) return fail("INVALID_INPUT", "Start after end");
  if (start < c.from || end > c.through)
    return fail(
      "INSUFFICIENT_COVERAGE",
      "Calendar does not cover requested period",
    );
  const amount = decimal(input.amount);
  if (
    !Array.isArray(assets) ||
    assets.length < 1 ||
    assets.length > 50 ||
    !Array.isArray(portfolios) ||
    portfolios.length < 1 ||
    portfolios.length > 3
  )
    return fail("INVALID_INPUT", "Invalid asset or portfolio count");
  const bySymbol = new Map<string, Asset>();
  let actionCount = 0;
  for (const a of assets) {
    if (
      typeof a.symbol !== "string" ||
      !/^[A-Z0-9.\-]{1,20}$/.test(a.symbol) ||
      bySymbol.has(a.symbol)
    )
      return fail("INVALID_INPUT", "Duplicate or empty symbol");
    if (
      a.complete !== true ||
      (a.inceptionVerified !== true &&
        !(a.periodCoverageVerified === true && a.firstAvailable <= start)) ||
      a.pricesComplete !== true ||
      a.actionsComplete !== true ||
      a.accessComplete !== true ||
      a.priceBasis !== "raw" ||
      !a.provenance
    )
      return fail("UNVERIFIED_DATA", `${a.symbol}: unverified data`);
    date(a.firstAvailable);
    date(a.from);
    date(a.through);
    if (a.from > start || a.through < end)
      return fail("INSUFFICIENT_COVERAGE", `${a.symbol}: incomplete coverage`);
    if (
      !a.prices ||
      typeof a.prices !== "object" ||
      Object.keys(a.prices).length > 5000
    )
      return fail("INVALID_INPUT", `${a.symbol}: invalid prices`);
    if (!Array.isArray(a.actions) || a.actions.length > 10000)
      return fail("INVALID_INPUT", `${a.symbol}: invalid actions`);
    actionCount += a.actions.length;
    if (actionCount > 10000) return fail("INVALID_INPUT", "Too many actions");
    const actionIds = new Set<string>();
    for (const action of a.actions) {
      if (
        typeof action.id !== "string" ||
        !action.id ||
        action.id.length > 128 ||
        actionIds.has(action.id)
      )
        return fail(
          "UNVERIFIED_DATA",
          `${a.symbol}: missing or duplicate action identity`,
        );
      actionIds.add(action.id);
      date(action.date);
      if (action.date < start || action.date > end) continue;
      if (action.type === "unsupported")
        return fail("UNSUPPORTED_ACTION", `${a.symbol}: ${action.description}`);
      if (action.type === "split") {
        decimal(action.numerator);
        decimal(action.denominator);
      } else if (action.type === "dividend") {
        if (action.basis !== "postSplit")
          return fail(
            "UNVERIFIED_DATA",
            `${a.symbol}: ambiguous dividend basis`,
          );
        date(action.paymentDate);
        decimal(action.amount);
        if (action.paymentDate < action.date)
          return fail("INVALID_INPUT", `${a.symbol}: payment before ex-date`);
      } else return fail("UNSUPPORTED_ACTION", `${a.symbol}: unknown action`);
      if (!c.sessions.includes(action.date))
        return fail(
          "UNVERIFIED_DATA",
          `${a.symbol}: action date is not a verified session`,
        );
    }
    bySymbol.set(a.symbol, a);
  }
  if (!bySymbol.has("SPY"))
    return fail("INVALID_INPUT", "SPY benchmark required");
  const ids = new Set<string>(),
    used = new Set<string>(["SPY"]);
  for (const p of portfolios) {
    if (
      !p.id ||
      ids.has(p.id) ||
      !Array.isArray(p.holdings) ||
      p.holdings.length === 0 ||
      p.holdings.length > 50
    )
      return fail("INVALID_INPUT", "Invalid portfolio");
    ids.add(p.id);
    const seen = new Set<string>();
    let total = zero;
    for (const h of p.holdings) {
      if (!bySymbol.has(h.symbol) || seen.has(h.symbol))
        return fail(
          "INVALID_INPUT",
          `Unknown or duplicate holding ${h.symbol}`,
        );
      seen.add(h.symbol);
      used.add(h.symbol);
      total = add(total, decimal(h.weight));
    }
    if (cmp(total, rat(100)) !== 0)
      return fail("INVALID_INPUT", "Weights must total 100");
  }
  const included = [...used].map((s) => bySymbol.get(s)!);
  const requestedSessions = c.sessions.filter((s) => s >= start && s <= end);
  const short = included.find(
    (a) => a.firstAvailable > (requestedSessions[0] ?? end),
  );
  if (short)
    return fail(
      "SHORT_HISTORY",
      `${short.symbol}: confirmed history starts ${short.firstAvailable}`,
    );
  const sessions = requestedSessions;
  if (sessions.length < 2)
    return fail(
      "INSUFFICIENT_COVERAGE",
      "Insufficient shared history: at least two completed trading sessions are required",
    );
  const actualStart = sessions[0]!,
    actualEnd = sessions.at(-1)!;
  const prices = new Map<string, Map<string, Rat>>();
  for (const a of included) {
    const map = new Map<string, Rat>();
    for (const s of requestedSessions) {
      if (s < a.firstAvailable) continue;
      const price = a.prices[s];
      if (price === undefined)
        return fail("MISSING_PRICE", `${a.symbol}: missing close on ${s}`);
      map.set(s, decimal(price));
    }
    prices.set(a.symbol, map);
  }
  const eventsBySymbol = new Map(
    included.map((a) => {
      const map = new Map<string, Action[]>();
      for (const event of [...a.actions].sort((x, y) =>
        x.id < y.id ? -1 : x.id > y.id ? 1 : 0,
      )) {
        const list = map.get(event.date) ?? [];
        list.push(event);
        map.set(event.date, list);
      }
      return [a.symbol, map] as const;
    }),
  );
  const calc = (p: Portfolio) => {
    const holdings = [...p.holdings]
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map((h) => ({
        asset: bySymbol.get(h.symbol)!,
        shares: div(
          div(mul(amount, decimal(h.weight)), rat(100)),
          prices.get(h.symbol)!.get(actualStart)!,
        ),
        receivables: [] as { paymentDate: string; value: Rat }[],
      }));
    const points: { date: string; value: string; receivable: string }[] = [];
    let peak = zero,
      drawdown = zero;
    for (const day of sessions) {
      let total = zero,
        receivable = zero;
      for (const h of holdings) {
        const close = prices.get(h.asset.symbol)!.get(day)!;
        if (day !== actualStart) {
          const events = eventsBySymbol.get(h.asset.symbol)!.get(day) ?? [];
          for (const a of events)
            if (a.type === "split")
              h.shares = mul(
                h.shares,
                div(decimal(a.numerator), decimal(a.denominator)),
              );
          for (const a of events)
            if (a.type === "dividend")
              h.receivables.push({
                paymentDate: a.paymentDate,
                value: mul(h.shares, decimal(a.amount)),
              });
        }
        const outstanding: typeof h.receivables = [];
        for (const r of h.receivables) {
          if (r.paymentDate <= day)
            h.shares = add(h.shares, div(r.value, close));
          else outstanding.push(r);
        }
        h.receivables = outstanding;
        total = add(total, mul(h.shares, close));
        for (const r of h.receivables) {
          total = add(total, r.value);
          receivable = add(receivable, r.value);
        }
      }
      points.push({
        date: day,
        value: encoded(total),
        receivable: encoded(receivable),
      });
      if (cmp(total, peak) > 0) peak = total;
      const dd = sub(div(total, peak), one);
      if (cmp(dd, drawdown) < 0) drawdown = dd;
    }
    const ending = decode(points.at(-1)!.value);
    return {
      id: p.id,
      points,
      ending: encoded(ending),
      totalReturn: encoded(sub(div(ending, amount), one)),
      drawdown: encoded(drawdown),
      shares: Object.fromEntries(
        holdings.map((h) => [h.asset.symbol, encoded(h.shares)]),
      ),
    };
  };
  const benchmark = calc({
    id: "SPY",
    holdings: [{ symbol: "SPY", weight: "100" }],
  });
  const results = portfolios.map((p) => {
    const result = calc(p);
    return {
      ...result,
      benchmarkDifference: encoded(
        sub(decode(result.totalReturn), decode(benchmark.totalReturn)),
      ),
    };
  });
  return {
    method: "offline-raw-post-split-v1",
    provenance: {
      calendar: c.provenance,
      assets: Object.fromEntries(included.map((a) => [a.symbol, a.provenance])),
    },
    requested: { start, end },
    actual: { start: actualStart, end: actualEnd },
    shortened: actualStart > requestedSessions[0]!,
    shortenedBy: included
      .filter((a) => a.firstAvailable > requestedSessions[0]!)
      .map((a) => ({ symbol: a.symbol, firstAvailable: a.firstAvailable })),
    benchmark,
    portfolios: results,
  };
}
