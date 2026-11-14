// Serialization bounds for platform-compatible documents, not usage quotas.
export const MARKET_BUDGET = {
  maxDocumentBytes: 60_000,
  maxAssets: 50,
  maxResults: 16,
  maxHistorySessions: 1300,
} as const;
export function storageCharge(documentBytes: number) {
  // Base document + automatic creation index + one custom index, plus headroom.
  return 3 * (documentBytes + 1024);
}
