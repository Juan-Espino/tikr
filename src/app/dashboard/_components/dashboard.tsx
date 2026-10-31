"use client";
import { useState } from "react";
import { CandlestickGlobe } from "~/components/candlestick-globe";

import { Button } from "~/components/ui/button";
import { RangePicker } from "~/components/range-picker";

import { examples, newPortfolio, type Range } from "~/lib/demo";

import { useDemoPortfolios } from "~/providers/demo-portfolios-provider";
import { AppShell } from "~/components/app-shell";
import { PortfolioCard } from "./portfolio-card";
function Disclosure() {
  return (
    <p className="text-muted-foreground text-xs leading-6">
      Demo data only, not actual historical returns. USD, lump sum, buy and
      hold; dividends, splits, fees and taxes are not modeled. The demo includes
      weekends and ends October 22, 2026. Past performance does not guarantee
      future returns.
    </p>
  );
}
export default function Dashboard() {
  const { portfolios, setPortfolios, draft, open } = useDemoPortfolios();
  const [range, setRange] = useState<Range>("1Y");
  const [spy, setSpy] = useState(true);
  return (
    <AppShell centered>
      {" "}
      <>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-[.18em] uppercase">
              Portfolio lab
            </p>
            <h1 className="mt-2 text-3xl tracking-tight">Your experiments</h1>
            <p className="text-muted-foreground mt-3 text-sm">
              All your portfolios in one place.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="order-1 w-full sm:order-3 sm:w-72">
            <RangePicker alignStart value={range} onChange={setRange} />
          </div>
          {draft && (
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
              Your portfolios will appear here.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={() => open(newPortfolio())}>
                Build a portfolio
              </Button>
              <Button
                variant="outline"
                onClick={() => setPortfolios(examples())}
              >
                Load sample experiments
              </Button>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                />
              ))}
          </div>
        )}
        <div className="mt-8">
          <p className="text-muted-foreground text-xs">
            Dashboard charts start at $10,000.
          </p>
          <Disclosure />
        </div>
      </>
    </AppShell>
  );
}
