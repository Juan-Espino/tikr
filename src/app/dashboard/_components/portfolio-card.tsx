"use client";
import { useEffect, useState } from "react";

import { Pin } from "lucide-react";

import { HistoryChart } from "~/components/history-chart";
import {
  equalWeights,
  metrics,
  percent,
  series,
  type Portfolio,
  type Range,
} from "~/lib/demo";

export function PortfolioCard({
  p,
  range,
  spy,
  onOpen,
}: {
  p: Portfolio;
  range: Range;
  spy: boolean;
  onOpen: () => void;
}) {
  const [showBenchmark, setShowBenchmark] = useState(spy);
  useEffect(() => {
    if (spy) {
      setShowBenchmark(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowBenchmark(false);
      return;
    }
    const timer = window.setTimeout(() => setShowBenchmark(false), 900);
    return () => window.clearTimeout(timer);
  }, [spy]);
  const points = series(p.holdings, range, 10000);
  const benchmark = series(equalWeights(["SPY"]), range, 10000);
  const stats = metrics(points);
  const change = stats.ending - 10000;
  const changeAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(change));
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${p.name}, ${p.holdings.length} assets, ${percent(stats.return)}, ${change >= 0 ? "gain" : "loss"} ${changeAmount}`}
      className="border-border bg-card focus-visible:ring-ring flex aspect-square w-full min-w-0 flex-col overflow-hidden rounded-xl border p-5 text-left transition-colors hover:border-stone-500 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none md:p-6"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg" title={p.name}>
          {p.name}
        </h2>
        {p.pinned && (
          <Pin
            aria-label="Pinned"
            className="size-4 shrink-0 fill-stone-200 text-stone-200"
          />
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {p.holdings.length} {p.holdings.length === 1 ? "asset" : "assets"}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-2xl tracking-tight ${stats.return > 0 ? "text-emerald-400" : stats.return < 0 ? "text-red-400" : ""}`}
        >
          {percent(stats.return)}
        </span>
        <span className="text-muted-foreground text-sm">
          {change >= 0 ? "+" : "-"}
          {changeAmount}
        </span>
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col pt-4">
        <HistoryChart
          compact
          amount={10000}
          lines={[
            { name: p.name, points },
            ...(showBenchmark
              ? [
                  {
                    name: "SPY ETF benchmark",
                    points: benchmark,
                    kind: "benchmark" as const,
                    exiting: !spy,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </button>
  );
}
