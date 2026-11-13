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
