// Reviewed normalization revision: acquirer-only stock mergers and acquiree-only
// cash mergers without an acquirer. Never derive a new policy from a request/error.
export const PERSONAL_SOURCE_POLICY =
  "personal-provisional-sip-v5-acquiree-only-mergers" as const;

// Exact PR16-reviewed transition, including its coverage window. Unknown policies,
// dates and current-scope revocations remain authoritative in every runtime.
export const REVIEWED_V5_SCOPE =
  "695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7";
export function supersededMarketScope(
  historical: string,
  current: string,
  policy?: string,
): boolean {
  return (
    policy === PERSONAL_SOURCE_POLICY &&
    current === REVIEWED_V5_SCOPE &&
    (historical ===
      "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7" ||
      historical ===
        "dcb3fad8de5e1ec032403090533da422eaa911b249dfd8511affd38539b87d8d")
  );
}

// Same month-aligned five-year window and seven-day boundary buffer in source
// loading and zero-scope hosted admission identity.
export function personalHistoryStart(cycle: string): string {
  const monthStart = `${Number(cycle.slice(0, 4)) - 5}${cycle.slice(4, 7)}-01`;
  return new Date(Date.parse(monthStart) - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
}
