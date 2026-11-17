import Link from "next/link";
import { TikrLogo } from "~/components/tikr-logo";
export const metadata = { title: "Methodology | Tikr" };
const sections = [
  [
    "A historical sandbox",
    "Tikr shows hypothetical historical outcomes, not forecasts or recommendations. Sample data is explicitly labeled. A supported ticker or AI suggestion does not establish complete, verified price history or investment suitability.",
  ],
  [
    "Starting investment and allocation",
    "A single USD starting amount is allocated at the beginning of the selected period. Equal weights are the default. Manual weights must be positive and total exactly 100%. Fractional shares are allowed. Holdings are bought and held without periodic rebalancing, so their weights drift as values change.",
  ],
  [
    "One shared period",
    "The portfolio and SPY ETF benchmark use the same starting amount, dates and calculation rules. At least two completed shared market sessions are required. Requested periods may be clamped to completed sessions; the interface reports the actual period and any limitations. Missing prices are never invented or silently dropped.",
  ],
  [
    "Dividends and splits",
    "Ordinary splits adjust share counts without creating returns. Dividend entitlement is based on shares held for the ex-date. Cash is reinvested at the payment-date close; when payment is not a trading day, the next available session is used. Unpaid dividends remain receivables in portfolio value. Provider-reported cash amounts retain any source withholding; no extra currency conversion or tax gross-up is invented.",
  ],
  [
    "Returns and risk",
    "Total return compares ending value with the starting investment. Maximum drawdown measures the largest decline from a prior peak over the observed daily values. Differences versus SPY are expressed in percentage points. Calculations use decimal arithmetic and unrounded daily values; displayed figures are rounded.",
  ],
  [
    "Costs and data limitations",
    "The simulation applies no additional brokerage fees, taxes, spreads or slippage, and does not deduct fund operating expenses a second time. Data must meet the applicable source's coverage and corporate-action requirements. Gaps, unsupported events and unavailable history can block a result. Cached or provisional data remains subject to the limitations shown in the interface.",
  ],
  [
    "Interpreting the result",
    "Past performance does not guarantee future returns. Selecting assets with hindsight does not show that they could have been selected in advance. AI discovery supplies candidate tickers; catalog membership confirms support, not thematic accuracy. Historical results are not personalized financial advice.",
  ],
];
export default function MethodologyPage() {
  return (
    <main className="min-h-screen">
      <header className="border-border flex items-center justify-between gap-4 border-b px-5 py-5 md:px-10">
        <Link href="/" aria-label="Tikr home">
          <TikrLogo />
        </Link>
        <Link
          href="/"
          className="hover:bg-muted rounded-lg px-3 py-2 text-sm text-stone-300 focus-visible:outline-2"
        >
          Back to home
        </Link>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <p className="text-muted-foreground mb-3 text-xs">
          How the simulation works
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Methodology</h1>
        <p className="text-muted-foreground mt-5 text-sm leading-7">
          The assumptions behind Tikr&apos;s historical comparisons. Data
          availability and source limitations are shown with each result.
        </p>
        <div className="mt-10 space-y-8">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
