# Tikr product

Last reconciled: 2026-10-25. This document owns product scope; `design.md` owns presentation, `plan.md` owns delivery status, and `AGENTS.md` owns repository work.

## Decision status

Confirmed requirements come from the product discussion. Proposed defaults below are not approvals. A v0 prompt is a prototype brief, not implementation evidence. Tikr is the working name, not a confirmed public brand.

## Target user and problem

People who want to experiment with stock/ETF allocations and explore historical outcomes without buying assets. Beginners are welcome, including people considering retirement, but this is a stock-portfolio experimentation tool, not a retirement planner or reproduction of an employer 401(k) menu.

Core promise: build a hypothetical portfolio, explore its history, and compare alternatives under the same conditions.

## Confirmed user journey

1. Public landing page explains the product and offers portfolio creation.
2. Guests can build and backtest before login. Preserve their draft through authentication so saving does not require rebuilding.
3. Search supported U.S.-listed stocks/ETFs by ticker or full company/fund name and add holdings.
4. Keep editing and results in one workspace; change holdings/weights and rerun without switching screens.
5. VOO is the default benchmark, with an independent on/off toggle.
6. Compare against saved portfolios: active portfolio plus up to two saved portfolios, with VOO as an additional line.
7. Google is the only sign-in method, using Better Auth. Signed-in users can save multiple portfolios and reach a dashboard.
8. Rename, duplicate, pin/unpin, and delete portfolios. No drag-and-drop or manual ordering.

## Allocation rules

- Automatic equal weighting is the default. Adding/removing holdings in this mode recalculates all weights.
- Editing a weight switches to manual mode. Preserve other manual weights on additions/removals; show the resulting remaining/excess allocation.
- Equal weight restores automatic mode.
- Require positive weights totaling exactly 100% before finalizing or running a backtest. Permit incomplete totals while editing.
- Show persistent allocation feedback, such as 85% allocated / 15% remaining or 105% allocated / 5% over.
- Distribute rounding differences deterministically: three equal assets may display 33.33%, 33.33%, and 33.34%.
- Specify internal precision before implementation; avoid arbitrary floating-point equality validation.

## Backtest and comparison rules

- Historical backtesting only: apply selected allocations to past data. No forward paper-trading ledger or prediction.
- Editable starting amount, lump-sum investment, USD, buy-and-hold, no recurring contributions or silent rebalancing.
- U.S.-listed stocks/ETFs and end-of-day data. Use consistent dividend/split treatment; the exact adjusted-return/reinvestment methodology remains to be specified.
- Timeframes: 1W, 1M, YTD, 1Y, 5Y, maximum available, conditional on licensed data coverage.
- Compared series use identical dates, starting amount, contribution assumptions, and return methodology, not each saved portfolio's individual settings.
- Default to percentage growth with an optional dollar-value view. Label VOO as an ETF benchmark/proxy, not the S&P 500 index itself.
- Show actual simulation dates, data-as-of date, assumptions, and any shortened shared history.
- Never silently omit a holding, fabricate pre-inception prices, or compare mismatched date ranges as equivalent.
- Editing holdings recalculates hypothetical history; it does not imply historical ownership.
- Distinguish a new simulation from cropping an existing chart; exact timeframe/trading-calendar boundaries remain a calculation-spec task.

## Results and dashboard

- Results: ending hypothetical value, total return, VOO difference in percentage points, largest historical decline/drawdown with plain-language explanation, and allocation breakdown.
- Calculate metrics from the same series used by the chart. Keep hypothetical/past-performance limitations visible.
- Dashboard cards are square and show the name, asset count, period percentage change, signed dollar change, chart, and a small legend. Opening a card opens the workspace, where portfolio management actions are available. One shared VOO ETF control above the cards toggles the benchmark across the dashboard.
- Shared dashboard timeframe selector. Pinned portfolios first, then most recently updated; pinned tie-breaking needs a defined implementation rule.
- Empty dashboard offers creation and an example. Deletion needs confirmation or undo.

## Related assets and Groq discovery

Confirmed: use Groq for natural-language industry/theme discovery and limit both user question count and input size.

- Keep ordinary ticker/name search and deterministic related assets independent of AI.
- Use verified sector, industry, theme, and asset-type metadata.
- AI interprets the request into validated criteria; retrieve results from a supported asset catalog. Do not display unchecked model-generated tickers.
- Explain matches from catalog evidence, exclude already-added assets from related suggestions, and handle ambiguous/no-match searches honestly.
- Do not rank predicted winners, give personalized buy/sell advice, or imply thematic similarity guarantees diversification.
- Enforce input/output bounds, concurrency, per-user quotas, and shared request/token budgets server-side. Keep credentials server-only.
- Fallback to ordinary search when exhausted/unavailable. No automatic paid fallback.
- Cache appropriate generic queries without exposing private data. Category discovery should not send portfolios, account details, or unnecessary personal data.

### Proposed AI defaults: awaiting confirmation

- AI requires sign-in; guests retain ordinary search and curated related assets.
- 10 searches/user/day, resetting at midnight UTC.
- 300 characters/question with a visible counter.
- One in-flight request/user and a short cooldown.
- Up to eight matching stocks/ETFs per search.
- Shared caps below actual account request/token allowances.

Model, exact cooldown, Unicode length rules, failure/cache-hit accounting, retries, timeouts, and shared thresholds remain open. Verify account allowances and terms at integration time; free access is not guaranteed indefinitely.

## Intended stack and data constraint

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Convex, Better Auth with Google, Groq, Vercel, and v0 for initial UI exploration. Current isolated frontend worktree: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, and the existing Convex provider are retained. The local demo adds Manrope, a copied shadcn/Base UI button foundation and Recharts. Better Auth, Groq, real history, and durable portfolio storage remain unimplemented. Deployment has not been verified. The original main-checkout baseline remains the starter.

Market data must be free for the intended use. Free API access alone does not establish permission for public display, caching, derived analytics, or AI processing.

Earlier candidates: Alpaca, Twelve Data, Massive, Financial Modeling Prep, Alpha Vantage. None is selected or proven to satisfy the full zero-cost requirement. Revalidate permissions, adjusted returns, depth, coverage, catalog metadata, limits, and outages. Do not silently choose a paid service.

Cache shared history where permitted instead of refetching per card. Distinguish stale data, missing data, and failed calculations. Enforce saved-portfolio ownership server-side. Specify account deletion, retention, session expiry, and privacy/terms before launch.

## Proposed experience defaults

- $10,000 starting amount and 1Y initial period.
- Landing copy: Build a portfolio. Explore its past.
- Optional example and deterministic localStorage-backed prototype before integrations.
- Candidate routes: `/`, `/login`, `/dashboard`, `/portfolio/new`, `/portfolio/[id]`.
- Signed-in landing visitors go to dashboard, consistent with the original intent; specify access to the public landing page if needed.
- Disclose excluded taxes/costs and other unmodeled effects after finalizing the calculation policy.

## Deferred or excluded

- Trading, brokerage connections, forecasts, live-price requirements.
- Recurring contributions, configurable rebalancing, mutual funds, employer-plan menus, international/multicurrency investing, cash allocations, shorts, leverage.
- AI result explanations were discussed but not selected; no general chatbot.
- News, public sharing/social features, leaderboards, subscriptions, individual stock-detail pages.
- Main-app light mode; the bright login panel is intentional.

## Open decisions and validation

1. Review the integrated local v0 demo described in `plan.md`; the original main checkout is at `C:\Users\JuanE\Code\React Projects\tikr`; see `plan.md`.
2. Prove a free permitted data source and verified discovery catalog.
3. Specify exact return/dividend/date/precision/missing-history policies.
4. Confirm AI defaults, identity requirements, and model after testing.
5. Set practical portfolio/holding limits, duplicate-symbol rules, name validation, and numeric ranges.
6. Define initial users, operating budget, and success signals. Proposed validation: can a beginner build alternatives and explain one historical tradeoff?
7. Portfolio Visualizer and Testfolio were discussed as competitive references. Beginner-friendly experimentation is a positioning hypothesis, not validated differentiation.

- Valid changes to holdings, weights, starting amount, and timeframe immediately recalculate the portfolio, comparisons, metrics, and individual asset returns. Incomplete edits retain the last valid result with a clear status. No Run simulation action is required.

- The chart tooltip includes the active portfolio and up to two selected comparison portfolios in one panel; VOO remains excluded from the tooltip. Each row shows its color, USD value, and percentage change for the hovered date.

## Frontend route organization (2026-10-29)

The landing, dashboard, sign-in and portfolio URLs have separate App Router page entry points and route-specific UI components. Browser-local demo portfolios and drafts are shared through a provider; interactive chart and editor state remains page-local. This reorganizes the implementation without adding production persistence or authentication.
