import { z } from "zod";

export const assets = [
  {
    ticker: "SPY",
    name: "State Street SPDR S&P 500 ETF Trust",
    type: "ETF",
    category: "Broad market",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    type: "Stock",
    category: "Technology",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    type: "Stock",
    category: "Technology",
  },
  { ticker: "AAPL", name: "Apple Inc.", type: "Stock", category: "Technology" },
  {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    type: "Stock",
    category: "Consumer",
  },
  {
    ticker: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    type: "ETF",
    category: "Dividends",
  },
] as const;
export const ranges = ["1W", "1M", "YTD", "1Y", "5Y", "Max"] as const;
export type Range = Exclude<(typeof ranges)[number], "Max">;
export type Holding = { ticker: string; weight: string };
const holdingSchema = z.object({
  ticker: z
    .string()
    // Preserve browser-local demo portfolios saved before the SPY switch.
    .transform((ticker) => (ticker === "VOO" ? "SPY" : ticker))
    .refine((t) => assets.some((a) => a.ticker === t)),
  weight: z.string().max(12),
});
export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string().max(80),
  holdings: z.array(holdingSchema).max(6),
  manual: z.boolean(),
  pinned: z.boolean(),
  updated: z.number().finite(),
  amount: z.string().max(16),
  range: z
    .enum(ranges)
    .transform((range) => (range === "Max" ? ("5Y" as const) : range)),
});
export type Portfolio = z.infer<typeof portfolioSchema>;
export function portfolioNameError(p: Portfolio, portfolios: Portfolio[]) {
  if (!p.name.trim()) return "Enter a portfolio name.";
  return portfolios.some(
    (other) =>
      other.id !== p.id &&
      other.name.trim().toLowerCase() === p.name.trim().toLowerCase(),
  )
    ? "A portfolio with this name already exists."
    : "";
}
export function suggestedPortfolioName(name: string, portfolios: Portfolio[]) {
  const names = new Set(portfolios.map((p) => p.name.trim().toLowerCase()));
  for (let suffix = 2; ; suffix++) {
    const ending = ` ${suffix}`;
    const candidate = `${(name.trim() || "New portfolio").slice(0, 80 - ending.length)}${ending}`;
    if (!names.has(candidate.toLowerCase())) return candidate;
  }
}
export const storageSchema = z.object({
  version: z.literal(1),
  portfolios: z.array(portfolioSchema).max(100),
  draft: portfolioSchema.nullable(),
});
export function basisPoints(value: string): number | null {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return null;
  const [whole = "0", fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function equalWeights(tickers: string[]): Holding[] {
  const base = Math.floor(10000 / tickers.length);
  return tickers.map((ticker, i) => ({
    ticker,
    weight: (
      (base + (i >= tickers.length - (10000 % tickers.length) ? 1 : 0)) /
      100
    ).toFixed(2),
  }));
}
export function allocation(holdings: Holding[]) {
  const weights = holdings.map((h) => basisPoints(h.weight));
  const total = weights.reduce<number>((sum, w) => sum + (w ?? 0), 0);
  const valid =
    holdings.length > 0 &&
    weights.every((w) => w !== null && w > 0) &&
    total === 10000 &&
    new Set(holdings.map((h) => h.ticker)).size === holdings.length;
  return { total, valid };
}
export function validAmount(value: string) {
  return (
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number(value) > 0 &&
    Number(value) <= 100000000
  );
}
export function newPortfolio(): Portfolio {
  return {
    id: crypto.randomUUID(),
    name: "New portfolio",
    holdings: [],
    manual: false,
    pinned: false,
    updated: Date.now(),
    amount: "10000",
    range: "1Y",
  };
}
export function examples(): Portfolio[] {
  return [
    {
      ...newPortfolio(),
      name: "Long-term core",
      holdings: equalWeights(["SPY", "MSFT", "SCHD"]),
      pinned: true,
    },
    {
      ...newPortfolio(),
      name: "AI & innovation",
      holdings: equalWeights(["MSFT", "NVDA", "AAPL"]),
    },
    {
      ...newPortfolio(),
      name: "Quiet compounding",
      holdings: equalWeights(["SPY", "SCHD"]),
    },
  ];
}
const end = Date.UTC(2026, 9, 22);
const starts: Record<Range | "Max", number> = {
  "1W": Date.UTC(2026, 9, 15),
  "1M": Date.UTC(2026, 8, 22),
  YTD: Date.UTC(2026, 0, 1),
  "1Y": Date.UTC(2025, 9, 22),
  "5Y": Date.UTC(2021, 9, 22),
  Max: Date.UTC(2020, 9, 22),
};
export type Point = { date: string; value: number };
// Synthetic positive indices, NOT prices or adjusted market history. One common fixture calendar.
function index(ticker: string, day: number): number {
  const seed = assets.findIndex((a) => a.ticker === ticker);
  if (seed < 0) throw new Error(`No sample history for ${ticker}`);
  return Math.exp(
    (0.00016 + seed * 0.000025) * day +
      (0.035 + seed * 0.012) * Math.sin(day / 43 + seed) +
      0.025 * Math.sin(day / 13 + seed),
  );
}
export function series(
  holdings: Holding[],
  range: Range,
  amount: number,
): Point[] {
  if (!allocation(holdings).valid || !Number.isFinite(amount) || amount <= 0)
    throw new Error(
      "Positive allocations must total exactly 100% and amount must be positive.",
    );
  const origin = starts.Max;
  const start = starts[range];
  const startDay = (start - origin) / 86400000;
  return Array.from({ length: (end - start) / 86400000 + 1 }, (_, d) => ({
    date: new Date(start + d * 86400000).toISOString().slice(0, 10),
    value:
      amount *
      holdings.reduce(
        (sum, h) =>
          sum +
          ((basisPoints(h.weight)! / 10000) * index(h.ticker, startDay + d)) /
            index(h.ticker, startDay),
        0,
      ),
  }));
}
export function metrics(points: Point[]) {
  const first = points[0]?.value ?? 1;
  const last = points.at(-1)?.value ?? first;
  let peak = first;
  let drawdown = 0;
  for (const p of points) {
    peak = Math.max(peak, p.value);
    drawdown = Math.min(drawdown, p.value / peak - 1);
  }
  return {
    ending: last,
    return: (last / first - 1) * 100,
    drawdown: drawdown * 100,
  };
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0,
  }).format(n);
export const percent = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
