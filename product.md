## Owner-approved Alpaca dividend interpretation (2026-11-13)

For all tickers in the personal Alpaca integration, treat the provider's reported
cash-dividend `rate` as USD cash per traded share/ADR. Accept foreign, missing-currency
and other currency metadata without converting or multiplying that rate. Retain any
withholding already reflected in the provider amount; apply no additional FX, ADR
ratio, tax gross-up or tax deduction. This is an owner-approved application assumption,
not an independently established provider guarantee for every record. It supersedes
the earlier blanket foreign-dividend rejection and the claim that all results exclude
source withholding. Positive amounts, interpretable ex/payment dates, payment-date
reinvestment, split/dividend ordering, shared periods and complete holdings remain.

Owner-approved operational history feedback (2026-11-11): backend, storage, budget and evidence-guard failures show concise professional unavailable/retry copy in the app; do not expose operator recovery instructions or raw technical errors. Keep technical causes in sanitized server diagnostics. Preserve specific ticker/history limitations and known retry timing, without inventing inception or prices. Provisional-source disclosure accompanies displayed results. Existing layout and approved supporting typography remain.

Owner-approved history periods (2026-11-10): new dashboard sessions, portfolios and drafts default to 1W; comparisons use the active screen's selected period and starting amount. Owner correction (2026-11-11): migrate unmarked legacy 1Y values to 1W, including existing portfolios and drafts. Old v1 storage cannot distinguish explicit 1Y from the former default; disclose this ambiguity and let the owner select 1Y again. Record future explicit choices and preserve them. Other saved periods and the Max-to-5Y migration remain.

Owner decision (2026-11-11): a new portfolio starts with an empty name and shows ?New portfolio? as a placeholder and preview, never as an assumed name. Do not report a conflict while the user is composing it. On Done, require a nonempty unique name; show inline feedback and keep the editor open when invalid. Saving remains blocked until the name and portfolio are valid. Preserve existing browser-local portfolios and never apply a suggested name automatically.

Owner decision (2026-11-11): use the approved monochrome angled bear in shared header branding and a stationary bear for browser/touch icons. The header turns right, pauses, returns left, then rests for about ten seconds before repeating indefinitely. Reduced motion uses the stationary left pose. This focused change is explicitly authorized in main.

Owner-approved history periods (2026-11-10): new dashboard sessions, portfolios and drafts default to 1W; comparisons use the active screen's selected period and starting amount. Preserve every valid saved range, including 1Y: storage v1 records no explicit/implicit choice, so this change cannot identify which old 1Y values were defaults. No guessed migration; the previous Max-to-5Y migration remains.

Confirmed insufficient history blocks the entire requested portfolio/comparison period; never silently shorten it or omit a holding. Explain each affected ticker in accessible destructive text, include its available start only when evidence establishes it, and suggest a shorter period. Missing leading bars do not establish inception. Distinguish missing gaps, unsupported in-period corporate actions, source/provider failure and operational budgets/cooldown; an unknown cause stays unknown. Complete selected-period coverage may be used without claiming known lifetime inception. Preserve shared dates, SPY, calendar clamping, two completed sessions and the decimal/payment-date methodology.

Owner decision (2026-11-10, owner testing): request rate throttles and ephemeral visitor admission limits are removed for now, superseding earlier browsing token-bucket/visitor requirements below. Catalog import failures permit the next explicit retry without daily attempt or cooldown lockout. The editor pauses search after failure until Retry search; overlapping imports retain the same atomic catalog lease. Shared storage/I/O/provider budgets, four active hosted request slots, source refresh policy, correction/revocation/abandoned guards and lease ownership remain enforced. Historical ledger/attempt records are retained. Hosted access remains public and unauthenticated. Restore appropriate server-side request limiting as the final task before broader release; this change does not authorize deployment, live activation or credentials.

Owner-approved asset search (2026-11-10): ordinary ticker/company-name search uses a validated, durably cached Alpaca catalog instead of six demo symbols. Exact ticker matches rank first. Keep six holdings per portfolio, duplicate prevention and deterministic equal weights. Catalog eligibility does not establish history or corporate-action availability; missing leading/interior history and unsupported actions still fail. Alpaca's US-equity class does not distinguish stocks from ETFs; search presents provider names/tickers/exchanges without inferring instrument classification. Live-provider verification and public display/caching rights remain separately gated.

# Tikr product

Owner-approved market admission (2026-11-10): replace the arbitrary 10-per-128-IP-bucket and 100-global daily open caps with generous short-term abuse protection. Ordinary cached browsing retains shared Convex budgets and correction/revocation checks. Missing/stale data uses shared provider/Convex budgets and existing durable refresh deduplication. Manual retry cooldowns are enforced on the server; distinguish browsing limits, refresh cooldown, shared budget exhaustion and missing history, with known retry timing. Bound/expire full anonymous keyed visitor hashes; never persist/log raw IPs. Numerical short-term defaults remain configurable operating settings, not product quotas. Synthetic operation measurements do not establish platform billing or authorize live activation. See hosted-operation.md.

Owner decision (2026-11-06): deployed Vercel access is open and unauthenticated; Google access restriction is rejected. Portfolio definitions remain browser-local. Hosted preparation is authorized; live public Alpaca activation remains prohibited until display/caching rights are resolved and separately authorized. Historical Google-only/cloud-save proposals below are superseded for this release. Anonymous implementation limits are protective defaults, not owner-approved product quotas.

Owner decision (2026-11-05): remove Max from the timeframe control because the supported personal data window is capped at five years. Existing locally saved Max selections migrate to 5Y without losing portfolios or drafts. Older Max descriptions remain historical.

Owner decision (2026-11-05): saved portfolio names must be unique within the browser-local portfolio list, ignoring case and surrounding whitespace. Block conflicting creation/rename/save with inline feedback and a suggested alternative; never apply a replacement automatically. Duplicating opens an unsaved draft that requires a user-chosen unique name. Preserve historical duplicate records until the owner edits them; do not silently rename or delete them.


Owner decision (2026-11-05): personal local Alpaca results may use provisional live data without manual evidence approval. Label results clearly as subject to corrections; this does not establish provider finality or exhaustive action completeness. Raw SIP closes, the next-day 09:00 New York cutoff, payment-date reinvestment, decimal arithmetic, shared periods and missing/unsupported-action failures remain required. Public/shared licensing, credentials/configuration, live requests and deployment require separate authorization. Earlier manual-review requirements below remain applicable to reviewed replay and historical evidence acceptance; they no longer gate this personal provisional mode.

Current local integration status (2026-11-04): an expiring evidence-gated replay loader, internal Convex storage/leases and budget admission, and real-result UI states are implemented in the isolated feature worktree. Production/public access is disabled; actual provider evidence, Convex deployment/team usage acceptance and live activation remain incomplete. No demo series are substituted in portfolio results. Guest definitions remain browser-local and sign-in remains a preview. See `market-data-integration.md`; earlier unimplemented summaries below are historical baseline statements.

Owner-approved on-demand refresh policy: opening a portfolio checks a shared asset cache, including SPY. Fresh verified data appears immediately. While stale data refreshes, show the last verified result with its as-of date; cold assets/new ranges without a verified result show loading. Recalculate after changes. On failure retain only an existing dated verified result, otherwise explain unavailability. Deduplicate asset refreshes across portfolios and allow one automatic attempt per daily freshness cycle, with bounded explicit retry. Defer scheduled refresh jobs. Known-invalidated results must not remain an acceptable stale fallback. This policy does not resolve corporate-action completeness. Implementation scope and deployment prerequisites are in `on-demand-cache.md`.

Owner-approved Alpaca price/session policy: use Alpaca's raw SIP daily closing price consistently for every holding and SPY, with split and dividend adjustments handled by the engine. Backtests end at the latest verified completed session; exclude unfinished intraday bars and provisional today results. A session becomes eligible no earlier than 09:00 America/New_York on the following calendar day, and only after required data checks pass. This owner-approved operational buffer is not an Alpaca finality guarantee; use the New York timezone with daylight-saving rules, not a fixed UTC offset. No provisional Today experience is in the initial scope.

Owner-approved correction policy: during each daily refresh, recheck the previous five trading sessions. Changed prices or corporate actions invalidate affected cached backtests and require recalculation. Preserve data revision metadata and show the result's as-of date. If the newest candidate session is not yet verified, keep the latest earlier shared verified endpoint; do not use this rule to hide interior gaps, access failures or unknown actions within the selected period. The five-session window is an initial policy, not exhaustive coverage of older corrections. Broader historical/action reconciliation remains required and its mechanism is unresolved. These are approved requirements, not implemented refresh/cache behavior or provider evidence.

Owner-approved minimum history (2026-11-02): require at least two shared completed sessions after calendar date selection. Zero or one returns insufficient shared history, not misleading zero-return performance; older one-session proposals are superseded.

Last reconciled: 2026-11-02. This document owns product scope; `design.md` owns presentation, `plan.md` owns delivery status, and `AGENTS.md` owns repository work.

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
5. SPY is the default benchmark, with an independent on/off toggle.
6. Compare against saved portfolios: active portfolio plus up to two saved portfolios, with SPY as an additional line.
7. Google is the only sign-in method, using Better Auth. Signed-in users can save multiple portfolios and reach a dashboard.
8. Rename, duplicate, pin/unpin, and delete portfolios. No drag-and-drop or manual ordering.

## Allocation rules

- Automatic equal weighting is the default. Adding/removing holdings in this mode recalculates all weights.
- Editing a weight switches to manual mode. Preserve other manual weights on additions/removals; show the resulting remaining/excess allocation.
- Equal weight restores automatic mode.
- Require positive weights totaling exactly 100% before finalizing or running a backtest. Permit incomplete totals while editing.
- Show persistent allocation feedback, such as 85% allocated / 15% remaining or 105% allocated / 5% over.
- Distribute rounding differences deterministically: three equal assets may display 33.33%, 33.33%, and 33.34%.
- Allow fractional shares. Approved calculation arithmetic has at least 28 significant decimal digits; this offline engine uses a private 40-digit half-even context with bounded inputs. Exact allocation totals are required. Round only displayed dollars/returns/differences to two decimals, exact ties to even; measured fixture tolerances do not establish a universal error bound.

## Backtest and comparison rules

- Historical backtesting only: apply selected allocations to past data. No forward paper-trading ledger or prediction.
- Editable starting amount, lump-sum investment, USD, buy-and-hold, no recurring contributions or silent rebalancing.
- U.S.-listed stocks/ETFs and end-of-day data. Owner-approved methodology uses ex-date dividend receivables and same-asset payment-close reinvestment; see `backtest-methodology.md`.
- Timeframes: 1W, 1M, YTD, 1Y, 5Y, maximum available, conditional on licensed data coverage.
- Compared series use identical dates, starting amount, contribution assumptions, and return methodology, not each saved portfolio's individual settings.
- Presets anchor to the latest completed New York session, subtract calendar duration, clamp nonexistent target dates to month end, then roll forward. YTD starts on/after Jan 1; Max uses earliest verified common history. Enter at first eligible close on/after requested start; end at last completed close on/before requested end. Confirmed short history blocks the whole requested period with ticker-level explanation; gaps, outages/access failures and unsupported actions stop, never silently omit holdings or use cash-until-listing.
- Owner update (2026-10-30): VOO is no longer mandatory; another verified ETF tracking the general S&P 500 is acceptable as the benchmark. Earlier VOO-specific defaults and references describe the original choice; they do not require retaining VOO after this decision. Owner selected SPY for the frontend demo on 2026-10-30; real-data integration is separate. Identify the actual ETF by ticker and do not label its returns as the index itself.
- Default to percentage growth with an optional dollar-value view. Label SPY as an ETF benchmark/proxy, not the S&P 500 index itself.
- Show actual simulation dates, data-as-of date, assumptions, and any shortened shared history.
- Never silently omit a holding, fabricate pre-inception prices, or compare mismatched date ranges as equivalent.
- Editing holdings recalculates hypothetical history; it does not imply historical ownership.
- Each preset starts a fresh investment; verified exchange sessions define common actual boundaries as described in `backtest-methodology.md`.

## Results and dashboard

- Results: ending hypothetical value, total return, SPY difference in percentage points, largest historical decline/drawdown with plain-language explanation, and allocation breakdown.
- Calculate metrics from the same series used by the chart. Keep hypothetical/past-performance limitations visible.
- Dashboard cards are square and show the name, asset count, period percentage change, signed dollar change, chart, and a small legend. Opening a card opens the workspace, where portfolio management actions are available. One shared SPY ETF control above the cards toggles the benchmark across the dashboard.
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

Next.js, TypeScript, Tailwind CSS, shadcn/ui, Convex, Better Auth with Google, Groq, Vercel, and v0 for initial UI exploration. The frontend demo and route refactor are now merged into the actual app's main branch. Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, and the existing Convex provider are retained; the UI includes Manrope, Base UI-backed component foundations, and Recharts. Better Auth, Groq, real history, and durable portfolio storage remain unimplemented. Deployment has not been verified. Browser-local persistence and generated sample series must not be presented as account-backed or real market results.

Market data must be free for the intended use. Free API access alone does not establish permission for public display, caching, derived analytics, or AI processing.

Owner decision (2026-10-30): Tikr is strictly non-commercial for the current scope, with no planned ads or subscriptions. The licensed data path must support up to five years of daily history for assets with sufficient actual history; a shorter provider-wide history window is not an acceptable replacement. Preserve inception/common-date safeguards for younger assets. Research alternatives if the initial shortlist cannot meet free access and intended public-use permissions. This does not approve a provider or expand service/provisioning authorization. The earlier maximum-available option remains conditional on licensed coverage; support beyond five years is not required by this decision.

Alpaca is the owner-selected technical candidate for personal, non-commercial use. Owner-reported account tests verified representative five-year daily raw/adjusted SIP history including SPY; this is not proof of payment-date reinvestment equivalence or public/shared licensing. Adjusted bars must not be used as a proven total-return substitute or combined with double dividend credit. The offline engine is provider-independent and is not connected to Alpaca, the UI, a cache or Convex. Public/shared rights, provider action/completed-bar evidence, measured cache/refresh costs and separately scoped integration remain open. Do not silently choose paid access.

Cache shared history where permitted instead of refetching per card. Distinguish stale data, missing data, and failed calculations. Enforce saved-portfolio ownership server-side. Specify account deletion, retention, session expiry, and privacy/terms before launch.

## Proposed experience defaults

- $10,000 starting amount and 1Y initial period.
- Landing copy: Build a portfolio. Explore its past.
- Optional example and deterministic localStorage-backed prototype before integrations.
- Implemented frontend routes: `/`, `/sign-in`, `/dashboard`, `/portfolio/[id]`. The earlier `/login` proposal is superseded by `/sign-in`; guest/new portfolio handling is currently part of the local demo flow.
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
3. Independently review the offline return/dividend/date/precision/missing-history implementation and validate provider-specific evidence separately.
4. Confirm AI defaults, identity requirements, and model after testing.
5. Set practical portfolio/holding limits, duplicate-symbol rules, name validation, and numeric ranges.
6. Define initial users, operating budget, and success signals. Proposed validation: can a beginner build alternatives and explain one historical tradeoff?
7. Portfolio Visualizer and Testfolio were discussed as competitive references. Beginner-friendly experimentation is a positioning hypothesis, not validated differentiation.

- Valid changes to holdings, weights, starting amount, and timeframe immediately recalculate the portfolio, comparisons, metrics, and individual asset returns. Incomplete edits retain the last valid result with a clear status. No Run simulation action is required.

- The chart tooltip includes the active portfolio and up to two selected comparison portfolios in one panel; SPY remains excluded from the tooltip. Each row shows its color, USD value, and percentage change for the hovered date.

## Frontend route organization (2026-10-29)

The landing, dashboard, sign-in and portfolio URLs have separate App Router page entry points and route-specific UI components. Browser-local demo portfolios and drafts are shared through a provider; interactive chart and editor state remains page-local. This reorganizes the implementation without adding production persistence or authentication.

## 2026-11-12 owner simplification direction

Keep Alpaca credentials/history handling server-only; reduce Convex history/cache
work to necessary shared coordination. Browser-local portfolio definitions remain.
The implementation uses untrusted IndexedDB monthly hints plus bounded process
history, with server root validation, and deduplicates holdings and
SPY across portfolios, preserve authoritative legacy guards and corrections.
No auth/profiles/cloud portfolios scaffolding is in scope. Implementation details and verification are in [market-redesign-checkpoint.md](market-redesign-checkpoint.md).


## Owner-authorized development history recovery (November13)

Operational status distinguishes an active refresh, an interrupted refresh eligible
for explicit Retry, unresolved legacy observation review, a known cooldown/retry
time, and ticker-specific unsupported/missing history. Browser errors may show a
server-generated reference; technical diagnostics remain sanitized and server-side.
This implements the owner's November12 recovery scope without changing investment
methodology, required holdings, selected-period coverage, licensing, or production
activation. Development verification and remaining cache-loss/allowance limits are
recorded in [history-refresh-journal.md](history-refresh-journal.md).

## Owner decision November13: temporary DEV refresh relief

Until further owner notice, daily source-attempt and one-minute refresh lockouts
may be bypassed ONLY on DEV stoic-corgi-586 when its private
TIKR_DEV_REFRESH_RELIEF=explicit flag is enabled. The platform's exact site URL
must also match; the production URL cannot enable this override. Retain counters,
active lease protection, guards, revocations, validation and shared resource caps.
Production policy is unchanged and must pass separate normal-limit regressions.
No unlimited spending or repeated task-ceiling increases are authorized.

Owner approved actual Convex usage warnings35%,urgent45%,targetstop50% monthly.
Owner-only localreviewbanner showsactualconfiguredusage and incomplete/stalecoverage.
Native DEVmonthlycallprotection replaces tiny taskcallcap; no new product quotas
or financial changes. Productionusage-onlyread hookup separatelyauthorized; no
productionsettingschanged. NativefractionalGBhardstopunsupported, so no whole-team
50%I/O guarantee. See convex-usage-monitoring.md for exact active/inactive controls.

Owner decision (2026-11-13): portfolio cards omit the provisional Alpaca informational disclosure; retain actionable refresh/history errors and synthetic QA labels.

Owner decision (2026-11-13, MVP continuation) supersedes earlier quota and UI guidance:
remove operational rate/budget/daily/cooldown enforcement from shared source for DEV
and future production rollout; delete owner usage monitor UI and quota overrides.
Keep financial validation, trusted revision/lease/revocation correctness and platform
serialization bounds. Dashboard reload recovers expired work; editor Retry remains.
Error references and retained diagnostics are backend-only. See mvp-history-readiness.md
for exact evidence and the unresolved foreign missing-currency data blocker. Do not
claim that insufficient history is the only possible failure or that live foreign
amounts were verified merely because their source contains prices.
