export function MarketPerformance() {
  return <p>Synthetic market fixture · no provider requests</p>;
}
const result = {
  view: { status: "ready" },
  displayPortfolios: [],
  displayAmount: "10000",
  retry: () => undefined,
};
export function useMarketResults() {
  return result;
}
export function MarketPerformanceView() {
  return <p>Synthetic market fixture · no provider requests</p>;
}
