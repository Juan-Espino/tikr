"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarketResult } from "~/components/market-performance";
import { CandlestickGlobe } from "~/components/candlestick-globe";

import { Button } from "~/components/ui/button";
import { RangePicker } from "~/components/range-picker";

import {
  DEFAULT_RANGE,
  examples,
  newPortfolio,
  hasUnsavedPortfolio,
  type Range,
} from "~/lib/demo";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { AppShell } from "~/components/app-shell";
import { PortfolioCard } from "./portfolio-card";
function Disclosure() {
  return (
    <p className="text-muted-foreground text-xs leading-6">
      Hypothetical historical results in USD, with buy-and-hold weights and
      payment-date dividend reinvestment. Ordinary splits are handled. No
      additional fees or taxes are applied; reported dividends may reflect
      source withholding. Past performance does not guarantee future returns.
    </p>
  );
}
export default function Dashboard() {
  const { portfolios, draft, open, cloud } = useDemoPortfolios();
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const [spy, setSpy] = useState(true);
  const generation = JSON.stringify({
    range,
    portfolios: portfolios.map((p) => ({
      id: p.id,
      amount: p.amount,
      holdings: p.holdings,
    })),
  });
  const activeGeneration = useRef(generation);
  activeGeneration.current = generation;
  const [batch, setBatch] = useState<{
    generation: string;
    results: Record<string, MarketResult>;
  }>({ generation: "", results: {} });
  const [previous, setPrevious] = useState<Record<string, MarketResult>>({});
  const [timedOut, setTimedOut] = useState("");
  const report = useCallback(
    (incoming: string, id: string, result: MarketResult) => {
      if (incoming !== activeGeneration.current) return;
      setBatch((old) => ({
        generation: incoming,
        results: {
          ...(old.generation === incoming ? old.results : {}),
          [id]: result,
        },
      }));
    },
    [],
  );
  const current = useMemo(
    () => (batch.generation === generation ? batch.results : {}),
    [batch, generation],
  );
  const complete = portfolios.every(
    (p) => current[p.id] && current[p.id]!.view.status !== "refreshing",
  );
  const waiting = !complete && timedOut !== generation;
  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(generation), 8000);
    return () => window.clearTimeout(timer);
  }, [generation]);
  useEffect(() => {
    if (complete) setPrevious(current);
  }, [current, complete]);
  return (
    <AppShell centered dashboard>
      {" "}
      <>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-[.18em] uppercase">
              Portfolio dashboard
            </p>
            <h1 className="sr-only">Portfolio dashboard</h1>
            <p className="text-muted-foreground mt-3 text-sm">
              {cloud
                ? "Portfolios saved to your account."
                : "Explore examples or build your own portfolio. Sign in to save."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="order-1 w-full sm:order-3 sm:w-72">
            <RangePicker alignStart value={range} onChange={setRange} />
          </div>
          {draft && hasUnsavedPortfolio(draft, portfolios) && (
            <Button
              variant="outline"
              className="order-2 max-w-full break-words whitespace-normal sm:order-1"
              onClick={() => open(draft)}
            >
              Resume draft: {draft.name}
            </Button>
          )}
          <Button
            variant="outline"
            aria-pressed={spy}
            onClick={() => setSpy((current) => !current)}
            className={`order-3 sm:order-2 ${spy ? "!bg-card hover:!bg-muted" : "!bg-background hover:!bg-muted"}`}
          >
            Show SPY
          </Button>
        </div>
        {portfolios.length === 0 ? (
          <section className="border-border bg-background mt-8 flex min-h-96 flex-col items-center justify-center rounded-xl border px-5 py-10 text-center md:px-7 md:py-12">
            <CandlestickGlobe />
            <p className="text-muted-foreground mt-4 text-sm">
              {cloud
                ? "Your saved portfolios will appear here."
                : "Build your own mix without an account."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={() => open(newPortfolio())}>
                Build a portfolio
              </Button>
            </div>
          </section>
        ) : (
          <div
            aria-busy={waiting}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[...portfolios]
              .sort(
                (a, b) =>
                  Number(b.pinned) - Number(a.pinned) ||
                  b.updated - a.updated ||
                  a.id.localeCompare(b.id),
              )
              .map((p) => (
                <PortfolioCard
                  key={p.id}
                  p={p}
                  range={range}
                  onOpen={() => open(p)}
                  spy={spy}
                  generation={generation}
                  displayed={
                    waiting
                      ? previous[p.id]
                      : current[p.id]?.view.status === "refreshing"
                        ? undefined
                        : current[p.id]
                  }
                  waiting={waiting}
                  report={report}
                />
              ))}
          </div>
        )}
        {!cloud && (
          <section className="mt-10" aria-labelledby="examples-title">
            <h2 id="examples-title" className="text-2xl">
              Examples
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Read-only starting points. Open one to inspect its historical
              results.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {examples().map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-5 text-left"
                  onClick={() => open(p)}
                >
                  <span>{p.name}</span>
                  <span className="text-muted-foreground mt-2 text-xs">
                    {p.holdings.map((h) => h.ticker).join(" / ")}
                  </span>
                </Button>
              ))}
            </div>
          </section>
        )}
        <div className="mt-8">
          <p className="text-muted-foreground text-xs">
            Each chart uses that portfolio’s starting amount.
          </p>
          <Disclosure />
        </div>
      </>
    </AppShell>
  );
}
