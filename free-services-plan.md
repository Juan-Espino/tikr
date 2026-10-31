# Free-service feasibility research

## Latest stage-1 verdict (2026-10-30)

Dividend-adjusted entitlement evidence: owner supplied four SPY records from historical-price-eod/dividend-adjusted for October 26–29, 2026, containing adjOpen/adjHigh/adjLow/adjClose. Access to this endpoint for SPY is demonstrated on the owner's key. These adjClose values equal the supplied ordinary close values for all four dates; no conclusion about adjustment correctness follows from this short sample. Next: five-year adjusted requests for SPY and AAPL, followed by a documented distribution/split fixture and common-date/completeness checks. No account secret used by assistant; no integration or storage change.

Five-year SPY update: owner reports the 2021-10-29 through 2026-10-29 historical request works. This confirms account access to that requested span, not independently audited completeness or dividend semantics; exact count/boundaries not supplied. Together with AAPL access, private API feasibility is materially improved. Next gate: entitled dividend-adjusted series or complete corporate-action inputs with specified calculation method. No storage/import/backend changes; no public license approval inferred.

SPY account evidence: owner pasted a successful FMP historical-price-eod/full response for 2026-10-26 through 2026-10-29 with four daily SPY OHLCV records. Short-range SPY history is accessible on this key; FMP free history is not limited to individual stocks. Five-year SPY depth/completeness, dividend-inclusive methodology, and catalog-wide entitlements remain unverified. SPY is the leading benchmark candidate, not yet a completed data path. Next test: same endpoint, symbol=SPY, from=2021-10-29, to=2026-10-29; report earliest/latest date and count without sharing key or full payload. Public-use and durable-cache licensing findings remain unchanged.

Account evidence update: owner reports successful AAPL historical request extending to 2021; pasted October response confirms daily OHLCV fields with no explicit dividend-adjusted close. VOO returns a premium-symbol restriction on the same account. These are owner-run results, not assistant-authenticated tests. Browser success and Postman invalid-key response indicate differing requests; exact Postman issue unproven. Full AAPL five-year completeness/actions not audited.

Owner now accepts an alternative ETF tracking the general S&P 500 instead of mandatory VOO. Reopens private technical benchmark feasibility; public licensing rejection unchanged. Candidates to test on the same history endpoint: SPY, IVV, SPYM. [SPY issuer](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy), [IVV issuer](https://www.blackrock.com/us/individual/products/239726/ishares-core-sp-500-etf), [SPYM rename filing](https://www.sec.gov/Archives/edgar/data/1064642/000119312525245739/d918064d497k.htm). SPYM was formerly SPLG; five-year continuity needs validation if used. FMP's [sandbox guidance](https://site.financialmodelingprep.com/insights/platform/getting-started/how-to-use-a-free-fmp-account-as-a-sandbox) says free symbol/endpoint access varies by dataset; no complete applicable allowlist found in this pass. One blocked ETF does not prove all ETFs are blocked. No key requested or used; propose short-date SPY/IVV/SPYM tests before five-year requests.

FMP is now **Rejected under standard terms**, superseding the earlier Conditional inventory label and suggestion that it is the next standard-free candidate. Its official [terms sections 2.2.1 and 2.2.2](https://site.financialmodelingprep.com/terms-of-service) prohibit third-party-accessible applications and multi-individual display without a specific agreement, whether free or paid. Public guest use fails this gate irrespective of five-year endpoint entitlement. [Pricing](https://site.financialmodelingprep.com/developer/docs/pricing) separately requires a Data Display and Licensing Agreement; no published zero-cost grant established. FAQ examples of five-year annual statements do not prove five-year VOO daily entitlement. No account/API test needed to reject the ordinary license.

Owner-pasted Stooq download page lists U.S. daily ASCII at 518 MB and Metastock without data at 3.4 MB, with notice that data is solely for personal use and commercial use prohibited. These are owner-supplied page observations, not independently downloaded measurements. Archive/extracted/five-year-filtered size unmeasured. Public hosting and derived-display rights not established. Stooq remains unavailable for launch absent an applicable grant.

Additional official-source checks:

- **Finnhub: Rejected under standard terms**, superseding earlier Unknown licensing result. [Terms](https://finnhub.io/terms-of-service) prohibit sharing data or derived results with third parties without written approval and require deletion after subscription ends. Public non-commercial status does not supply permission.
- **OHLC: Rejected on required coverage.** [Historical-price documentation](https://ohlc.io/data/historical-stock-prices) lists five-year Free history only for AAPL, NVDA, JNJ, PEP, MSFT, SPY and QQQ. VOO is absent; SPY is not silently substituted. Broader access is paid. No need to infer further public rights after this failure.
- **Financial Datasets: no qualifying standard-free route established.** [Terms](https://www.financialdatasets.ai/terms-of-use) restrict personal data and derived outputs to the subscriber and exclude redistribution. [Pricing FAQ](https://www.financial-datasets.ai/pricing) places historical prices on paid plans. No signup or billing performed.
- **GetMarketHistory: no qualifying route established.** [Terms](https://getmarkethistory.com/docs/terms) make free-account allowances hourly-only, restrict reconstructable public outputs and prohibit raw redistribution. Hourly aggregation is not adopted as an alternative: complete sessions, corporate actions, five-year VOO coverage, quotas and public series rights are unproven. It does not validate the proposed public-static-files design.

Conclusion: no investigated standard free offer proves all requirements. This is a researched feasibility blocker, not a universal assertion that no negotiated grant can exist. Storage optimization or mixing providers cannot cure rights restrictions. Keep historical-file architecture as a technical proposal only; stop treating successive personal-use providers as launch candidates. A written zero-cost public-use grant or an explicit owner requirement/budget change is necessary to move beyond the current evidence. No scope/budget change accepted.

### FMP permission request ready for owner use (not sent)

Subject: Zero-cost permission for a non-commercial public portfolio-history app

We are evaluating FMP for Tikr, a public, strictly non-commercial portfolio-history app with no ads, subscriptions, trading or forecasts. Users, including guests, build hypothetical U.S. stock/ETF portfolios and compare daily historical performance against VOO for up to five years. Can FMP explicitly grant this use at recurring zero cost, including suitable stock/ETF/VOO history, split/dividend-consistent calculations, shared persistent caching, catalog/name/sector metadata and public derived portfolio and single-asset/VOO charts? If raw per-asset files may be delivered from our hosting CDN, please expressly include that right; otherwise please specify the permitted delivery architecture. Please confirm exact symbol/endpoint entitlements, refresh/call/bandwidth limits, attribution, retention/deletion, regions, and that no card, billing or automatic paid overage is required. We will not transmit supplied data to Groq without separate permission. Your published personal/data-display terms appear to require a separate agreement; please confirm whether you can provide an applicable zero-cost written grant. If not, please say so.

This draft is ready for review; no provider contacted. Exact entitlement and negotiated permission cannot be verified by public research alone. Next substantive evidence would be a provider's written answer, not another signup or integration.

Review date: 2026-10-30. Preliminary research; owner review pending. No vendor selected or production entitlement approved.

## Scope and sequence

This supplements product.md and plan.md without changing requirements. Research only: no accounts, secrets, billing, provisioning, integration changes, deployments, commits, or provider messages. Preserve historical records. Trial access and personal licenses do not establish public-use rights.

1. Market history and catalog: coverage, VOO, corporate actions, public display, caching, derived outputs, metadata and AI rights. First go/no-go gate.
2. Application calculation and refresh design: dividend policy, common dates, buy-and-hold math, deterministic precision and missing-data handling. Model calls and storage at proposed 10/100/1,000 DAU; these are scenarios, not targets.
3. Convex capacity: separately budget portfolios, shared licensed history, discovery cache and atomic quotas; ownership, retention, monitoring and hard stops.
4. Better Auth/Google: maintained integration, OAuth setup, ownership, deletion and guest draft handoff; distinguish library cost from infrastructure.
5. Hosting: Vercel eligibility, resource budgets, environments, secrets and overage controls; optional custom domain is not inherently free.
6. Groq: selected provider, model/terms/actual quotas still to verify. Exact input/user/shared limits remain proposed; ordinary search must survive exhaustion.
7. Operations: included logging, alerts, recovery/export, privacy, abuse controls and release evidence. No automatic paid fallback.

Review each stage with the owner. Labels: Verified = supported published fact (not account-tested); Conditional = additional permission/evidence needed; Rejected = standard offer fails intended public use; Unknown = not established. None of these labels is legal advice or provider approval.

## Stage 1: preliminary inventory

All sources below reviewed 2026-10-30. No authenticated API calls were made. Quotas are advertised recurring allowances, not measured entitlements. No viable permitted zero-cost public path has yet been demonstrated.

### Alpaca Basic — Rejected for ordinary public redistribution

- Verified: free, U.S. stocks/ETFs, history since 2016, 200 historical calls/minute; recent 15-minute historical restriction. IEX-only real-time coverage must not be confused with older SIP history access. [Plan documentation](https://docs.alpaca.markets/us/docs/about-market-data-api).
- Historical bars expose split/dividend/all adjustments and symbol-change handling. This is not yet a verified dividend-reinvestment methodology. [Bars reference](https://docs.alpaca.markets/us/reference/stockbarsingle-1).
- Public redistribution is blocked by the ordinary API offer. [Redistribution policy](https://alpaca.markets/support/redistribute-alpaca-api). A separate written grant would be required before reconsideration; no free exception established.
- Unknown: VOO payload and complete dates, delisted coverage, themed catalog rights, permitted shared cache/derived-only public output, card/region eligibility and termination retention.

### Twelve Data Basic — Rejected for intended public use

- Verified: $0, 8 API credits/minute and 800/day; endpoint weights apply per symbol. Basic explicitly lists internal non-display usage and U.S. equities/ETFs. [Pricing](https://twelvedata.com/pricing).
- Terms restrict free-tier commercial use and require explicit external-display/redistribution permission; storage is subject to permitted timeframes. Derived data must not reconstruct source data. A single-holding normalized chart cannot automatically be assumed to meet that test. [Terms sections 2.2–2.4](https://twelvedata.com/terms).
- Unknown: entitled daily depth, VOO, free-tier dividend data/adjustments, lifecycle metadata and independent catalog licensing. No allowance is treated as public capacity.

### Massive Stocks Basic — Rejected for intended public use

- Verified: free tier advertises 5 requests/minute and no credit card. Individual Basic–Advanced plans are personal/non-professional; customer-facing display requires Business. [Stocks page](https://www.massive.com/stocks).
- Verified: Basic history is a rolling two-year window, which cannot supply five-year history at launch. [History entitlement](https://massive.com/knowledge-base/article/how-much-historical-stock-data-does-massive-have).
- Aggregates are not dividend-adjusted; separate corporate-action processing would be necessary. [Adjustment policy](https://massive.com/knowledge-base/article/is-massives-stock-data-adjusted-for-splits-or-dividends).
- Unknown: free corporate-action/reference endpoint entitlements, VOO payload, catalog rights, shared-cache/derived-output/AI permissions and post-termination retention. Broad archive marketing is not Basic coverage.

### Financial Modeling Prep Basic — Conditional; public permission unproven

- Verified: $0, 250 calls/day, EOD and reference data advertised; free bandwidth is 500 MB per trailing 30 days. Display/redistribution requires a specific Data Display and Licensing Agreement. [Pricing and licensing notice](https://site.financialmodelingprep.com/developer/docs/pricing).
- Pricing contains restricted-symbol markers and plan-dependent historical ranges. Do not interpret its general dataset list as unrestricted free VOO/five-year access.
- Unknown: exact free symbol/endpoint coverage, VOO, adjusted data and actions, lifecycle/theme metadata, zero-cost licensing agreement, cache duration, derived-output/AI rights, card/regions and hard-stop behavior. No free public entitlement established.

### Alpha Vantage standard free access — Rejected for intended public use and required daily history

- Verified: 25 requests/day; educational/open-source exceptions require verification and are not assumed for Tikr. [Support](https://www.alphavantage.co/support/).
- Free raw daily compact output has 100 points; full daily history and daily adjusted endpoint are premium. Weekly/monthly series do not replace required daily chart/drawdown history. [Documentation](https://www.alphavantage.co/documentation/).
- Standard license is personal/non-commercial unless agreed in writing; its commercial definition extends beyond private individual activities. [Terms section 2](https://www.alphavantage.co/terms_of_service/).
- Unknown: special free written permission, independent catalog rights, cache/AI/termination rights and actual VOO entitlement. Search/listing endpoints alone do not prove licensed industry/theme evidence.

## Cross-provider unresolved evidence

- No candidate has established all of public guest display, shared persistent caching, derived portfolio series, separately reusable catalog metadata and necessary attribution at zero cost.
- VOO presence, earliest usable date, gaps, distributions, split examples, symbol changes and delisted assets still require entitled endpoint evidence. No payload was tested and no pre-inception history is assumed.
- Sector classification does not establish ETF theme exposure. Candidate catalogs need field provenance, coverage, refresh, lifecycle rules and permission to publish factual explanations. Do not send licensed metadata to Groq without permission; AI inference use is not automatically model-training permission.
- Card/billing requirements (except Massive's advertised no-card access), geographic restrictions, overage enforcement, bulk/pagination weights, retained-cache expiry/deletion and migration rights remain unverified. Pricing silence is not permission.
- Capacity modeling is deferred until a lawful candidate exists. Shared caching reduces calls only if allowed; a smaller beta does not cure a license restriction.

## Decision log and owner review

- 2026-10-30: No vendor chosen, scope concession accepted, or provider contact authorized. Stage 1 remains open; research findings await owner review.
- Questions: Is launch intended to remain non-commercial, or allow ads/subscriptions later? Would a curated stock/ETF catalog and shorter licensed history be acceptable? If the shortlist has no permitted free public route, should the next research pass prioritize alternative providers, a draft provider-permission request for owner review, or keeping the sample-data demo pending a scope/budget decision?
- Recommended next step (proposal): investigate alternatives and/or prepare a precise permission checklist after owner review. Do not implement, contact providers, or change requirements automatically.

## Stage 1 continuation: confirmed scope and alternative search (2026-10-30)

Owner confirmed strictly non-commercial current scope (no planned ads/subscriptions), up to five years of history, and research of alternatives if the original shortlist fails. Shorter provider-wide coverage is not accepted. Public users remain part of the product; non-commercial does not mean personal/internal use. Original review questions above are historical and superseded by these answers. No vendor approved or provider contact authorized.

### Alternatives screened against official sources

- **Tiingo Starter — Rejected under published standard terms.** Pricing advertises $0, 30+ years price history, 500 unique symbols/month, 50 requests/hour, 1,000/day and 1 GB/month, with internal-use licensing. [Pricing](https://www.tiingo.com/about/pricing). Current terms (updated October 6, 2026) prohibit durable free-tier storage, including derived outputs, and explicitly restrict reconstructable single-security rebased performance series. This conflicts with shared history caching and VOO/single-holding charts; the derived-products exception is not blanket permission. [Terms 1.6](https://app.tiingo.com/tos/). Actual VOO, corporate actions, metadata/AI rights, regions, card and account limits untested.
- **Marketstack Free — Rejected on depth.** Official pricing lists 100 requests/month, one year of history, splits/dividends and non-commercial use. Five-year daily access is not included. Public display/cache rights need separate verification if ever reconsidered; no reason to accept a paid tier here. [Pricing](https://marketstack.com/pricing/).
- **EODHD Sandbox — Rejected on depth.** Free offers 20 calls/day, 20 requests/minute and one year of time-series history. The 500 welcome calls are a bonus, not recurring capacity. Five-year access is not established at zero cost; public/cache/catalog rights not assessed after this depth failure. [Pricing](https://eodhd.com/pricing).
- **SimFin Free — Rejected for ordinary public sharing; interpretation exception unresolved.** Free advertises five-year charts and delayed five-year bulk downloads, with no billing/card. Exact delay, ETF/VOO coverage and corporate-action semantics unverified. [Pricing](https://www.simfin.com/en/prices/). Free/Basic license limits data to own personal research and prohibits sharing; reprocessed data remains restricted, while interpretations have an exception. No evidence establishes Tikr's daily VOO and individual-return charts as permitted interpretations. [License](https://www.simfin.com/en/commercial-license/). Official FAQ reserves redistribution for Enterprise. [FAQ](https://www.simfin.com/en/fundamental-data-download/).
- **Stooq — Unknown, not approved.** Official [download](https://stooq.com/db/h/) and [terms](https://stooq.com/t/) URLs returned a JavaScript browser-verification gate. No attempt to bypass it. Download availability, current five-year VOO coverage, dividend methodology, automation/public-display/cache/derived/catalog rights and quotas remain unverified from readable primary evidence. Third-party claims were not adopted as permission.
- **Nasdaq Data Link WIKI — Rejected for current history.** The official dataset states it has not been actively supported since April 2018; it cannot establish the current rolling five-year stock/ETF/VOO requirement. [Dataset](https://data.nasdaq.com/databases/WIKIP).
- **Finnhub — Unknown in this pass.** Official [pricing](https://finnhub.io/pricing) returned no readable content. No third-party quota or licensing claims promoted to verified evidence.

Verdict: no permitted zero-cost route demonstrated after this alternative screen. This is not proof that no provider or negotiated grant exists. No authenticated payloads, accounts or integration work. No selected provider, data samples or entitlement tests.

Next proposed review step: owner-assisted verification of Stooq/Finnhub primary terms, or draft a narrowly scoped permission request covering non-commercial public guest access, rolling five-year daily history, VOO, corporate actions, persistent shared cache, portfolio/single-asset charts, catalog display, attribution, AI filtering and termination deletion. Drafting/sending is not yet authorized; no message sent. Keep Stage 1 open and do not switch to shorter history, paid services, scraping or weekly substitutes.

## Workspace evidence (continued)

## Hybrid history proposal (2026-10-30; not an approved architecture)

Owner asked about importing history, storing it and obtaining recent/daily updates elsewhere. Technically feasible in principle; no compatible licensed pair verified. Initial history and updates both need permission for public derived charts, persistent storage and cross-source combination. A one-year provider window can fill recent history after a licensed five-year import; it cannot supply initial five-year coverage alone. Regular EOD updates suffice for current scope; live quotes are unnecessary.

Storage planning assumptions: 252 trading sessions/year, five years = approximately 1,260 observations/asset; actual calendars vary. At an illustrative 32–100 bytes/observation for a compact date/close representation (not a measured database document size), 100 assets = 126,000 observations / 4–13 MB; 1,000 = 1.26 million / 40–126 MB; 10,000 = 12.6 million / 403 MB–1.26 GB. Excludes metadata, raw/adjusted parallel series, actions, indexes, document overhead, backups and bandwidth. No Convex free-tier fit claimed. Daily growth is one observation per tracked asset plus corrections/actions, independent of visitor count; delivery/read costs still grow with traffic.

Data seam hazards: different exchange/session closes, raw versus split/dividend-adjusted series, ticker identity changes and corrected history. Splits/distributions may require repairing earlier adjusted observations, so appending today's close is insufficient. Compare overlapping dates and inspect action fixtures before combining sources; do not silently rescale away discrepancies. Any cross-source validation also needs permitted use.

Current official [Marketstack pricing](https://marketstack.com/pricing/) advertises one-year free history and 100 requests/month, so it is only a conditional update candidate. Example: at one symbol per call, 100 assets × about 21 sessions = 2,100 calls/month before actions/retries. A multi-symbol HTTP request must not be assumed to consume one quota unit. Public-display/cache/combination permissions and per-symbol metering remain unverified. [Stooq terms](https://stooq.com/t/) still returned browser verification on recheck; no initial-import rights established.

Next evidence step: prove a permitted initial source and daily updater, validate their overlap/corporate actions, measure representative files, then model database and refresh quotas. Proposal only; no vendor chosen or integration performed.

## Workspace evidence (baseline)

## Convex capacity correction (2026-10-30)

## Narrowed recommendation (2026-10-30; assistant proposal)

Owner asks to narrow options and proceed with a solution. Research scope remains; no backend integration/provisioning/deployment authorized by this planning recommendation.

1. Preferred validation path: one permitted downloadable history source, including its subsequent EOD updates; validated versioned per-asset files delivered as Next.js static assets through intended Vercel hosting. Browser calculates hypothetical results; Convex holds private portfolio definitions/auth/quota state, not market observations. Stooq is the first candidate to resolve, not an approved supplier. File serving requires explicit raw redistribution/download permission in addition to derived display. Daily refresh means a validated rebuild/redeployment; runtime writes to public/ are not persistent updates. Refresh automation credentials, scheduling, build budget and account entitlement remain unverified. Preserve last validated dataset and show as-of/stale status on failure.
2. Conditional fallback: licensed historical download plus separately permitted EOD API, producing the same files. EODHD's 20 calls/day is only a small-catalog update candidate under one-call-per-symbol assumptions and leaves little retry/action headroom. Requires explicit public/raw delivery and combination rights and overlap/action checks. Not preferred because it creates reconciliation and dual-license work.
3. Single API for full history and EOD refresh is operationally simpler than mixing sources, but none reviewed has established free public entitlements. Alpaca would be technically relevant but ordinary redistribution is prohibited; do not select it without a written applicable grant. No standard-free API recommended for launch today.

Storage proof target: hypothetical 1,000 assets × 1,260 sessions × 8 bytes (four-byte date, four-byte scaled price under validated bounds) = 10.08 MB for one price series. This is arithmetic for a proposed binary representation, not measured source size or a complete dataset. Raw+adjusted prices, corporate actions, metadata, precision validation, gaps and version retention add space. Catalog cap of 1,000 is a modeling scenario, not an accepted product restriction. Request only needed assets; never load entire catalog history per visitor. If ten assets total 200 KB served per visit (assumption), 1,000 DAU × 30 days × one such visit/day is 6 GB/month, excluding app assets, repeat requests and HTTP overhead; actual budgets must include origin transfer and requests.

Official [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby), reviewed today, lists 100 GB Fast Data Transfer, 10 GB Fast Origin Transfer and 1 million CDN requests monthly, restricts use to personal/non-commercial, and notes exhausted resources generally require waiting. Account fit is not verified. [CLI upload limit](https://vercel.com/docs/limits) is 100 MB total source upload on Hobby, not a 100 MB per-file allowance or general database quota. No Vercel Blob or extra storage service assumed free. Static-file approach avoids market-history Convex database reads/storage but does not eliminate hosting limits.

### Provider clarification draft (not sent)

We are evaluating Stooq for a strictly non-commercial public portfolio-history app, without ads, subscriptions, trading or forecasts. Users include unauthenticated visitors. May we download and periodically refresh rolling five-year daily U.S. stock/ETF history including VOO, retain a shared copy, calculate buy-and-hold/dividend-consistent portfolio and single-asset/VOO series, and serve the necessary per-asset historical files publicly from our hosting CDN? Please confirm automation/download limits, permitted file redistribution and derived display, adjustment methodology/corporate-action availability, required attribution, catalog metadata rights, correction handling, and retention/deletion obligations after access ends. We require recurring zero-cost permission without paid overage. We will not send supplied data to an AI provider unless separately permitted.

Next work: resolve this permission/depth/methodology gate, measure a permitted representative dataset and complete hosting/refresh budget; implement only under separate authorization. If public file delivery is prohibited, reject this architecture for that provider rather than hiding the files behind charts. Stage 1 remains open; no zero-cost launch path proven.

Owner requires storage/free-tier feasibility before proposing market history placement. Earlier compact-file estimates are not evidence of Convex fit. Official [limits](https://docs.convex.dev/production/state/limits), reviewed 2026-10-30, list Free database storage at 0.5 GB total including rows/indexes and database I/O at 1 GB/month. Free has hard caps; Starter is a separate usage-billed option and is not authorized. Limits apply per team unless otherwise stated. Account usage and available headroom remain unverified.

Illustrative sensitivity only: 1,000 assets × 1,260 daily observations × 200 bytes/observation = 252 MB before indexes and other app data; 200 bytes is an assumed effective row size, not measured Convex serialization. Index storage must be measured separately; do not assume a CSV-to-database multiplier or full free allowance available for prices. Reading 100 KB of history 10,000 times/month would alone be about 1 GB of database I/O if each read incurs that amount; cache behavior and actual metering are untested. Storage fit alone cannot prove free operation.

No market-history storage location selected. Next evidence needed: required catalog size, representative licensed data/encoding size, indexes/action/correction overhead, existing team usage, and explicit 10/100/1,000 DAU I/O/refresh scenarios. Reserve capacity for auth/portfolios/quotas. Consider compact file delivery separately only if licensing, hosting allowance, request costs and refresh behavior are proven; no external store or service approved. Stage 1 licensing remains unresolved.

Selected worktree HEAD verified at 06b8ef3, initially clean. The canonical app root is C:\Users\JuanE\Code\React Projects\tikr; this selected worktree is retained. Owner reports frontend/App Router merged to main; older isolated-frontend/main-untouched statements are superseded, not deleted. Branding cc71128 is outside this task. Portfolios remain browser-local and histories synthetic. Owner-reported dependency drift and existing check results were not re-tested or repaired during documentation research.

## Original coordinator research outline (imported from main checkout)

# Free-service feasibility plan

Created: 2026-10-30. Research and decisions only; no service is approved solely because it advertises a free tier. This supplements `plan.md`; it does not change product requirements.

## Goal and working rules

Establish whether the agreed public portfolio app can operate within recurring free allowances, with explicit limits and legal permissions. Distinguish development access, a limited public beta, and sustainable production use. Trial credits, personal-use-only access, and educational-only licenses are not automatically suitable for this app.

- Use current primary documentation, pricing, terms, and account-specific evidence where available. Record review dates and supporting links.
- Label results Verified, Conditional, Rejected, or Unknown. Absence of a restriction in a pricing page is not affirmative permission.
- Do not create accounts, request secrets in chat, enable billing, provision services, deploy, or change application integrations during this research.
- No card/billing requirement or automatic paid overage may be silently accepted. Document hard-stop options and failure behavior.
- Model usage at explicitly stated small-beta scenarios (proposed: 10, 100, and 1,000 daily active users). These are planning scenarios, not adopted scale targets.
- Prefer existing selected services when suitable; do not add an external service for something application code can reasonably handle.

## Ordered verification

### 1. Market history and the asset catalog: first go/no-go gate

Candidates to recheck: Alpaca, Twelve Data, Massive, Financial Modeling Prep, Alpha Vantage; add alternatives only if the shortlist fails.

Verify U.S. stocks/ETFs and VOO, actual daily historical depth, dividends/splits, adjusted-return semantics, symbol lifecycle, missing/delisted assets, metadata, and industry/theme evidence. Identify which assets/timeframes a free tier really supports.

Verify permission for public/commercial display, storing/caching history, derived portfolio returns, attribution, and any transmission to an AI provider. Price data and catalog metadata may have different entitlements. Confirm request/token/bulk limits and whether shared caching is allowed.

Exit: a permitted zero-cost data path, explicitly restricted coverage the owner accepts, or an honest blocker. Never silently substitute paid data, price-only returns, scraping, or invented history.

### 2. Calculation and refresh architecture: application code, not another vendor

Specify buy-and-hold math, dividend/reinvestment policy, precision, date boundaries, common comparison dates, VOO treatment, maximum history, costs/tax disclosures, refresh cadence, and missing-data behavior. Estimate API calls and cache/storage growth under the usage scenarios.

Exit: testable methodology, refresh budget, and no dependence on hidden paid analytics endpoints. Existing demo fixtures are a starting point, not evidence of real-data correctness.

### 3. Convex: portfolio storage and server operations

Verify free-plan eligibility for intended use; database/file storage, reads/writes, bandwidth, functions/actions, scheduled jobs, concurrency, and deployment/environment limits. Model portfolios, shared market history, query cache, and rate-limit counters separately. Decide what belongs in Convex versus other existing infrastructure only after measuring expected volume.

Exit: schema/ownership outline, retention/cache plan, expected consumption, quota monitoring, and hard-stop/recovery behavior. This investigation can run alongside stage 1.

### 4. Better Auth and Google sign-in

Verify the maintained Convex integration, adapter/component requirements, actual hosted dependencies, Google OAuth production setup/consent requirements, redirect/environment needs, and any associated fees or restrictions. Distinguish library licensing from infrastructure cost and OAuth setup requirements.

Specify server-side ownership, account/session deletion, logout, guest-draft handoff, and duplicate-save prevention. Google-only sign-in should not introduce an unnecessary transactional email vendor.

Exit: compatible integration and privacy/access-control requirements with no assumed free hosted auth entitlement.

### 5. Hosting and deployment

Evaluate the intended Vercel plan's eligibility for the actual public/commercial use, compute, bandwidth, image optimization, build, function, cron, and team/environment limits. Check interaction with Convex refresh jobs to avoid paying for duplicated scheduling.

Verify preview/production OAuth URLs, secrets handling, domain requirements, and whether a provider subdomain suffices. A custom domain is optional and must not be described as inherently free. Investigate alternatives only if the intended plan fails a requirement.

Exit: allowed deployment design, concrete resource budget, overage controls, and no unapproved paid fallback.

### 6. Groq category discovery

Verify available suitable model(s), free account eligibility, request/token/concurrency limits, commercial usage/data terms, retention, and regional restrictions. Do not reuse old quota figures as guaranteed capacity.

Confirm proposed limits with the owner: 10 searches/user/day, 300 characters/question, one in flight, cooldown, up to eight catalog matches, and shared request/token caps. Define reset, failure/cache-hit accounting, structured output validation, and ordinary-search fallback. AI interprets criteria; a verified catalog supplies assets. No unchecked generated tickers or personalized investment advice.

Exit: evaluated model, realistic usage budget, server enforcement design, privacy boundary, and hard-stop behavior. Depends on the catalog and user identity/limits decisions.

### 7. Operations, security, and release readiness

Inventory actual needs for error logging, quota alerts, backups/export/restore, uptime, analytics, bot protection, and support. Prefer included features first; optional analytics or monitoring must not become launch dependencies without a concrete reason.

Verify privacy/terms/disclosure requirements and data deletion/retention. Identify any review or operating costs that cannot honestly be promised free. Document a provider outage/exhaustion playbook and recheck triggers for changing terms, traffic, or commercialization.

Exit: minimal service inventory, documented residual risks, restore/recovery plan, and release checklist.

## Evidence required for every candidate

- Service, role, proposed plan, primary sources, review date, and account-specific items still unverified.
- Recurring free allowance versus trial credits; payment-card/billing requirement; commercial/public-use permissions; region restrictions.
- Historical coverage or service capabilities actually available at that tier.
- Rate/compute/storage/bandwidth limits, expected consumption, and remaining headroom under explicit assumptions.
- Data retention, privacy, attribution, licensing/caching/redistribution requirements, and expiry of cached data after termination.
- Hard limit versus billable overage, monitoring, fallback, and migration/export options.
- Verdict, unresolved questions, owner decisions, and next verification step. Contact the provider if necessary; do not infer approval.

## Deliverables and review rhythm

The data-feasibility chat should maintain an evidence-based service inventory and short decision log, then reconcile `plan.md` when findings are accepted. Begin with stage 1 and report its first findings/questions before implementing anything. Separate demonstrated technical feasibility from contractual permission and account verification.

After each stage, review Verified/Conditional/Rejected/Unknown findings with the owner. Do not promise that unlimited or arbitrary-scale operation will remain free. A useful outcome may be a constrained beta or an explicit requirement/budget tradeoff.
