import { CandlestickGlobe } from "./candlestick-globe";

export function PortfolioEmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <CandlestickGlobe variant="holdings" />
      <p className="text-muted-foreground text-sm">
        Select Edit to add your first holdings.
      </p>
    </div>
  );
}
