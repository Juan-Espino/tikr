import { useMarketResults } from "../../src/components/market-performance";
import type { Portfolio } from "../../src/lib/demo";
const portfolio: Portfolio = {
  id: "retry-regression",
  name: "Synthetic retry",
  holdings: [{ ticker: "SPY", weight: "100" }],
  manual: false,
  pinned: false,
  updated: 1,
  amount: "1000",
  range: "YTD",
  rangeChoice: "explicit",
};
const calls: boolean[] = [];
if (new URLSearchParams(location.search).has("retry-qa")) {
  Object.assign(window, { __retryQA: calls });
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    if (String(input) !== "/api/market") return original(input, init);
    const body = JSON.parse(String(init?.body));
    calls.push(body.retry === true);
    const response =
      calls.length === 1
        ? { status: "blocked", code: "REFRESH_BUSY" }
        : calls.length === 2
          ? { status: "blocked", code: "SOURCE_FAILURE" }
          : { status: "ready" };
    return new Response(JSON.stringify(response) + "\n");
  };
}
export function SharedRefreshRetryQA() {
  const result = useMarketResults([portfolio], "YTD", "1000");
  return (
    <main>
      <p>Synthetic retry regression; no live provider or account.</p>
      <p role="status">
        {result.view.status}: {result.view.code}
      </p>
      <button onClick={result.retry}>Retry regression</button>
    </main>
  );
}
