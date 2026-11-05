// Conservative admission budgets, not a replacement for Convex team usage metrics.
export const MARKET_BUDGET = {
  storageBytes: 100_000_000,
  monthlyIoBytes: 500_000_000,
  monthlyCalls: 250_000,
  maxDocumentBytes: 60_000,
  maxEntries: 6000,
  maxAssets: 50,
  maxResults: 16,
  maxHistorySessions: 1300,
} as const;
export const FREE_ALLOWANCE = {
  storageBytes: 500_000_000,
  monthlyIoBytes: 1_000_000_000,
  monthlyCalls: 1_000_000,
  actionGbHours: 20,
} as const;
export function storageCharge(documentBytes: number) {
  // Base document + automatic creation index + one custom index, plus headroom.
  return 3 * (documentBytes + 1024);
}
export function capacityModel(input: {
  assets: number;
  sessions: number;
  users: number;
  opensPerDay: number;
  chartBytes: number;
  sourceBytes: number;
  days?: number;
  headBytes: number;
  cacheHitsPercent: number;
  sourceChargedBytes?: number;
  resultChargedBytes?: number;
}) {
  for (const key of [
    "assets",
    "sessions",
    "users",
    "opensPerDay",
    "chartBytes",
    "sourceBytes",
    "headBytes",
    "cacheHitsPercent",
  ] as const)
    if (!Number.isSafeInteger(input[key]) || input[key] < 0)
      throw new Error("INVALID_BUDGET_INPUT");
  for (const v of Object.values(input))
    if (!Number.isSafeInteger(v) || v < 0)
      throw new Error("INVALID_BUDGET_INPUT");
  if (input.assets > 50 || input.sessions > 1300)
    throw new Error("CATALOG_LIMIT");
  const days = input.days ?? 31;
  const opens = input.users * input.opensPerDay * days;
  // Conservative workload assumptions; measurements must replace these in deployment.
  if (input.cacheHitsPercent > 100) throw new Error("INVALID_BUDGET_INPUT");
  const hits = Math.floor((opens * input.cacheHitsPercent) / 100),
    misses = opens - hits;
  const lookup = input.headBytes * input.assets * 2 + 48_000;
  const io =
    hits * (input.chartBytes * 2 + lookup) +
    misses *
      (input.assets * input.sourceBytes * 2 +
        input.chartBytes * 4 +
        lookup +
        128_000) +
    input.assets * days * (input.sourceBytes * 8 + 96_000);
  const calls = opens * 12 + input.assets * days * 8;
  const storage =
    input.sourceChargedBytes !== undefined &&
    input.resultChargedBytes !== undefined
      ? input.assets * input.sourceChargedBytes +
        16 * input.resultChargedBytes +
        6_000_000
      : storageCharge(
          input.assets * input.sourceBytes + 16 * input.chartBytes,
        ) + 6_000_000;
  return {
    storageBytes: storage,
    monthlyIoBytes: io,
    monthlyCalls: calls,
    fits:
      storage < MARKET_BUDGET.storageBytes &&
      io < MARKET_BUDGET.monthlyIoBytes &&
      calls < MARKET_BUDGET.monthlyCalls,
  };
}
