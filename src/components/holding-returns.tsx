"use client";
import { assets, percent, type Portfolio } from "~/lib/demo";

type Tile = { ticker: string; name: string; weight: number; change: number };
function Tiles({ items, ratio = 2 }: { items: Tile[]; ratio?: number }) {
  if (items.length === 1) {
    const item = items[0]!;
    return (
      <div
        role="img"
        aria-label={`${item.name}: ${percent(item.change)} return, ${item.weight}% allocation`}
        title={`${item.name} | ${percent(item.change)} | ${item.weight}% allocation`}
        className="flex h-full min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg text-center text-sm text-stone-100"
        style={{
          background:
            item.change > 0
              ? "#244b3b"
              : item.change < 0
                ? "#623b3e"
                : "#30302e",
        }}
      >
        <span className="font-semibold">{item.ticker}</span>
        <span>{percent(item.change)}</span>
      </div>
    );
  }
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cut = 1;
  let sum = items[0]!.weight;
  while (
    cut < items.length - 1 &&
    Math.abs(sum + items[cut]!.weight - total / 2) < Math.abs(sum - total / 2)
  ) {
    sum += items[cut]!.weight;
    cut++;
  }
  const fraction = sum / total;
  const horizontal = ratio >= 1;
  return (
    <div
      className={`flex h-full min-h-0 min-w-0 gap-1 ${horizontal ? "flex-row" : "flex-col"}`}
    >
      <div className="min-h-0 min-w-0" style={{ flex: `${fraction} 1 0%` }}>
        <Tiles
          items={items.slice(0, cut)}
          ratio={horizontal ? ratio * fraction : ratio / fraction}
        />
      </div>
      <div className="min-h-0 min-w-0" style={{ flex: `${1 - fraction} 1 0%` }}>
        <Tiles
          items={items.slice(cut)}
          ratio={horizontal ? ratio * (1 - fraction) : ratio / (1 - fraction)}
        />
      </div>
    </div>
  );
}
export function HoldingReturns({
  portfolio,
  verifiedReturns,
}: {
  portfolio: Portfolio | null;
  verifiedReturns?: Record<string, string>;
}) {
  if (
    !portfolio ||
    !verifiedReturns ||
    portfolio.holdings.some((h) => verifiedReturns[h.ticker] === undefined)
  )
    return (
      <p className="text-muted-foreground mt-4 text-sm">
        Verified asset returns are unavailable.
      </p>
    );
  const items = portfolio.holdings
    .map((holding) => ({
      ticker: holding.ticker,
      name:
        assets.find((a) => a.ticker === holding.ticker)?.name ?? holding.ticker,
      weight: Number(holding.weight),
      change: Number(verifiedReturns[holding.ticker]),
    }))
    .sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker));
  return (
    <>
      <p className="text-muted-foreground mt-2 text-sm">
        Return per asset over the same shared dates. Tile size represents
        starting allocation.
      </p>
      <div className="mt-5 h-80 sm:h-96">
        <Tiles items={items} />
      </div>
      <details className="mt-4 text-sm">
        <summary>All asset returns and allocations</summary>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.ticker}
              className="flex flex-wrap justify-between gap-2"
            >
              <span>{item.name}</span>
              <span>
                {item.weight}% allocation / {percent(item.change)} return
              </span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
