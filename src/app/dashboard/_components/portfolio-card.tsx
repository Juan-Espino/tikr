"use client";
import { useEffect, useId } from "react";
import { Pin } from "lucide-react";
import {
  MarketPerformanceView,
  useMarketResults,
  type MarketResult,
} from "~/components/market-performance";
import type { Portfolio, Range } from "~/lib/demo";
export function PortfolioCard({
  p,
  range,
  spy,
  onOpen,
  generation,
  displayed,
  waiting,
  report,
}: {
  p: Portfolio;
  range: Range;
  spy: boolean;
  onOpen: () => void;
  generation: string;
  displayed?: MarketResult;
  waiting: boolean;
  report: (generation: string, id: string, result: MarketResult) => void;
}) {
  const summary = useId();
  const current = useMarketResults([p], range, p.amount);
  const { view, displayPortfolios, displayAmount, retry } = current;
  useEffect(() => {
    report(generation, p.id, { view, displayPortfolios, displayAmount, retry });
  }, [generation, p.id, report, view, displayPortfolios, displayAmount, retry]);
  const usable =
    displayed?.view.series &&
    (!displayed.view.evidenceExpiresAt ||
      Date.parse(displayed.view.evidenceExpiresAt) > Date.now());
  const result: MarketResult = waiting
    ? usable
      ? { ...displayed, view: { ...displayed.view, status: "refreshing" } }
      : { ...current, view: { status: "refreshing" } }
    : ((displayed?.view.evidenceExpiresAt &&
      !(Date.parse(displayed.view.evidenceExpiresAt) > Date.now())
        ? undefined
        : displayed) ?? {
        ...current,
        view: { status: "blocked", code: "DATA_UNAVAILABLE" },
      });
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${p.name}, ${p.holdings.length} assets`}
      aria-describedby={summary}
      className="border-border bg-card focus-visible:ring-ring flex min-h-[400px] w-full min-w-0 flex-col rounded-xl border p-5 text-left focus-visible:ring-2 md:p-6"
    >
      <div className="flex min-h-10 w-full items-center justify-between gap-3">
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
        {" · "}
        {p.holdings.map((holding) => holding.ticker).join(", ")}
      </p>
      <div id={summary} className="contents">
        <MarketPerformanceView
          result={result}
          portfolios={[p]}
          range={range}
          amount={p.amount}
          spy={spy}
          compact
        />
      </div>
    </button>
  );
}
