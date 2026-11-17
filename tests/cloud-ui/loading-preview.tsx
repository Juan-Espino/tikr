// Explicitly imported only by isolated UI checks; no app route or network work.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  PageSkeleton,
  SearchRowsSkeleton,
} from "../../src/components/loading-skeletons";
import { MarketPerformanceView } from "../../src/components/market-performance";
import type { MarketResponse } from "../../src/lib/market-contract";
import { examples, DEFAULT_RANGE } from "../../src/lib/demo";
export function mountLoadingQA() {
  document.getElementById("root")!.style.display = "none";
  const host = document.createElement("div");
  document.body.append(host);
  const portfolio = examples()[0]!;
  const loaded: MarketResponse = {
    status: "ready",
    dataQuality: "synthetic",
    period: { start: "2025-01-02", end: "2025-01-03" },
    series: [
      {
        id: portfolio.id,
        ending: "10100",
        change: "100",
        totalReturn: "1",
        drawdown: "0",
        points: [
          { date: "2025-01-02", value: 100, dollars: "10000", growth: "1" },
          { date: "2025-01-03", value: 101, dollars: "10100", growth: "1.01" },
        ],
      },
    ],
  };
  function Fixture() {
    const [mode, setMode] = useState("landing");
    const [view, setView] = useState<MarketResponse>({ status: "refreshing" });
    Object.assign(window, {
      __loadingQA: {
        mode: setMode,
        loaded: () => setView(loaded),
        refresh: () => setView({ ...loaded, status: "refreshing" }),
      },
    });
    if (mode === "search")
      return (
        <div className="mx-auto max-w-2xl p-6">
          <SearchRowsSkeleton grid />
          <SearchRowsSkeleton />
        </div>
      );
    if (mode === "market")
      return (
        <div className="mx-auto max-w-5xl p-6">
          <MarketPerformanceView
            portfolios={[portfolio]}
            range={DEFAULT_RANGE}
            amount="10000"
            spy={false}
            result={{
              view,
              retry: () => undefined,
              displayPortfolios: [portfolio],
              displayAmount: "10000",
            }}
          />
        </div>
      );
    return (
      <PageSkeleton
        variant={mode as "landing" | "dashboard" | "portfolio" | "signin"}
      />
    );
  }
  createRoot(host).render(<Fixture />);
}
