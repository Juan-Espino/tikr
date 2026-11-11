## Owner-approved history UX and requested periods (2026-11-10)

Implemented in the bound `feat-history-period-limitations` worktree from a clean status. Main was not touched. No agents, credentials, live provider requests, deployment/provisioning, commits, pushes, PRs, merges or ledger/guard cleanup were used. Historical publication/activation permissions below do not authorize them for this task.

New dashboard sessions, portfolios, examples and drafts default to 1W; comparisons inherit the active period/amount. Audited production 1Y occurrences: the dashboard and newPortfolio were defaults; the remaining preset/enum/sample-anchor occurrences are supported-range definitions. All saved ranges remain intact. Storage v1 cannot distinguish old explicit 1Y choices from implicit defaults, so no guessed migration is performed; existing Max-to-5Y migration remains.

Selected-period source loads replace unconditional five-year asset loads. Calendar coverage still establishes the supported ceiling, latest eligible session and clamped preset anchor. Personal provisional inputs explicitly assert window coverage without claiming lifetime inception. Confirmed later first availability blocks the whole requested portfolio/comparison period; it never shortens or omits holdings. Missing leading/interior bars remain missing data, not inferred inception. SPY, two completed sessions, shared dates, decimal/drifting-weight/split/ex-date receivable/payment-date reinvestment rules remain.

Durable cache reuse checks actual from/through, evidence revision, pending-tail boundaries and asset/chunk dependencies. Revised result policy prevents reuse of historical shortening behavior. Full windows serve narrow requests; partial windows require new scope work. Symbol locks still serialize concurrent requests/expansions; the write transaction records successful completion/from on its existing lease, avoiding a new unbudgeted source-head read. Optional per-scope attempt counts preserve total attempt counters and retain one explicit retry/cooldown after a failed expansion. Guards, abandoned-refresh refusal, revocations, shared storage/I/O/provider budgets and active hosted slots remain. Failure outside a previously cached narrow scope does not falsely revoke that intact scope; a received in-scope contradiction still revokes.

UI exposes each affected ticker with accessible destructive-red reason text: established short-history start/shorter-period suggestion, missing bars, unsupported corporate action, source failure/unknown cause, and operational limits. Both NDJSON and HTTP retry/error paths retain issues. The allocation editor now says ?Allocation is valid. History is checked separately.? BA/RTX synthetic cases demonstrate distinguishable missing-bar, unsupported-action and source paths, including exclusion of dated out-of-period events. No real BA/RTX failure cause was established; underlying reported cause remains unknown.

Verification completed: frozen-lockfile dependency install (no manifest/lockfile change); 153/153 full Node tests passed; 34/34 Vitest tests across 10 files passed; all five financial mutation probes killed. Full installed-Edge browser suite passed 38/38 on the credential-cleared loopback server. It covers 1W defaults/new portfolio/comparison and preserved saved 1Y, ticker-specific HTTP error copy/color/semantics at 390/1440px, existing keyboard/touch/focus/loading/stale/retry/reduced-motion/overflow behavior. Reviewed mobile/desktop screenshots under system temp `tikr-history-browser`; the test server is stopped. After the final overlap-correction hardening, all 16 focused personal-loader tests passed again. Final pnpm check passed lint and both TypeScript projects with no lint warnings/errors; credential-cleared SKIP_ENV_VALIDATION=1 pnpm build passed compilation, type/lint validation, static generation and traces. Changed TS/TSX Prettier and git diff --check passed. Only .env.example was present by filename; no private configuration was read. One mutation selector and several browser locators were updated for renamed tests/new default; earlier failed/interrupted runs are superseded by these completed results. The final diagnostics formatting pass changed whitespace only.

Next: owner review of the local implementation. Separately authorized real-provider evidence, public rights, deployed multihost behavior and sustained budget/platform measurements remain unresolved. No synthetic success authorizes activation, cleanup or deployment.

Owner follow-up (2026-11-10): after local completion, commit/push this dedicated branch and open a PR against main. Merge, deployment, live calls and credentials remain unauthorized. No reviewer agents requested.

## Owner-testing limiter removal (2026-11-10)

Implemented locally in the dedicated worktree: remove visitor/global browsing rates and visitor registry admission; retain four in-flight hosted resource slots and shared budgets. Catalog leases ignore historical attempt/cooldown lockout while retaining busy/token ownership checks and attempt records. Search failure waits for explicit Retry search. No persistent ledgers or guards reset; no main changes, credentials, live calls, deployment or publication.

Release checklist:
- [ ] Final broader-release task: reinstate appropriate server-side request limits and verify retry/error behavior, shared budgets and platform protections.
- [ ] Separately authorize and verify coordinated Next/Convex deployment, preserving existing state and compatible readers; local checks do not prove deployed behavior.
- [ ] Resolve public display/caching rights and separately authorize live verification/activation as applicable.

Verification: frozen-lockfile install completed without manifest/lockfile changes. Full Vitest suite passed (33 tests/10 files), including retries after two failed imports, one provider import for overlapping callers, old attempt-record compatibility, lease ownership, browsing beyond former rates/cardinality, and existing budgets/guards/revocations. Focused Node admission/durable/catalog suites passed (29 tests). `pnpm check` passed (lint plus app and Convex TypeScript); `pnpm build` passed. Four focused Edge Playwright tests passed, including error/retry states at 390px and 1440px and no new search request on typing after failure. Browser artifacts use system temp; the credential-cleared loopback verification server was stopped. `git diff --check` passed. No live/deployed verification is claimed.

Compatibility: retain the mounted limiter and legacy expiry callback for already-scheduled work, plus optional visitor/bucket arguments and historical state fields. New requests neither create visitor records nor call the limiter. Existing `TIKR_BROWSE_CONCURRENCY` remains a resource bound (default four; 1?16). For a separately authorized rollout, deploy compatible Convex control/acquire code before Next: old Next callers may still send visitor hashes, while new Next callers omit them. Do not reset budgets, attempts, leases or guards. Next task is owner review of the local diff; deployment and broader-release limiting remain pending.

## PR publication authorized (2026-11-10)

Owner authorized committing/pushing this bound feature branch and opening a PR to main after the market-history clarification. Scope is catalog import/search and diagnostics; price/action/history validation and production deployment remain separate. Reuse the recorded successful local checks and one live development catalog trial; do not issue another provider request or run another review agent. Keep private .env.local and secret-tool files out of Git. Main remains unchanged. Earlier no-publication/no-activation statements below record their historical checkpoints, not the current authorization/state.

Deployment note for eventual review: both the Next server and Convex hosted membership functions must use the updated shared shard decoder before hosted traffic writes packed catalogs. New readers accept old plain arrays, but old readers cannot decode the new packed shape. No deployment is part of this PR-publication authorization.

## One authorized live catalog trial (2026-11-10)

Owner supplied dev deployment `stoic-corgi-586`; a replacement deployment key was delivered through private secret-file entry after a key was pasted into chat. No key value was logged or committed. Privately loaded existing main-checkout Alpaca credentials for one request only. No production target, service provisioning, deploy, budget reconfiguration, counter/lease/guard reset or publication occurred.

Actual normally admitted request to the fixed paper /v2/assets endpoint: HTTP 200, 6,495,597 received bytes. Imported 13,181 eligible assets into 32 durable shards, one revision. Stored payloads decode with PLTR and SPY present. Old uncompressed serialized entries for these actual normalized assets require 1,327,123 bytes (largest shard 40,826 bytes), exceeding the old 900,000-byte atomic-write ceiling. New packed entries require 582,492 bytes. This proves a full-live-catalog write-size defect in the old code for the catalog fetched today; it does not establish which stage failed in the earlier production incident. Today's raw response fits the original 8 MiB response cap, so that cap is not the blocker for this payload.

The first immediate cold read failed CATALOG_UNAVAILABLE; later metadata inspection showed 32 valid, unexpired shards with one revision and later cold reads succeeded without another import. This is consistent with the remote write timestamp briefly leading the local clock, but the exact transient value was not captured. Local reads now allow at most five seconds of future clock skew; they still reject larger future timestamps and expire based on the original checkedAt. Synthetic tests prove +1s acceptance and +6s rejection. This tolerance does not change evidence/correction/revocation guards or extend the freshness window from read time.

All follow-up inspection/cached reads made zero provider requests; the inspection runner explicitly refuses provider access. Live catalog lookup finds PLTR for pala/palantir/palanti/PLTR. Broad p/pa queries can legitimately omit PLTR from the bounded top 20; exact PLTR ranks first. The actual UI on an isolated dev server used the real durable catalog (no intercepted response): Palantir returned one match; PLTR returned 14 matches with PLTR first. Selection assigned 100% and Save locally returned the portfolio list showing one asset PLTR. No price/history verification was performed; provider access was explicitly blocked and history remained unavailable.

Wrote private ignored worktree .env.local with the development storage URL/key and explicit personal activation, WITHOUT any Alpaca credential. Main checkout/configuration is unchanged. The owner's port-5000 process had been `next start` (production), which is incompatible with the intentionally development-only personal integration and was returning 500. Restarted this worktree's identified local process using pnpm dev on localhost:5000. Final actual endpoint checks: GET reports personal; POST Palantir returns 200/personal/one row/PLTR; POST PLTR returns 200/personal/14 rows/PLTR. The local server remains running for owner review. Imported catalog search now works; a future refresh will require separately configured provider access and must not silently fall back to demo. Historical data is still not enabled/verified.

Verification after the skew fix: focused catalog test passed, full Vitest suite 32 tests/10 files passed, pnpm check passed, production build passed. The manual actual-catalog browser flow passed using T3 preview actions; snapshot calls timed out twice, so DOM reads through preview_evaluate were used with grounded preview_act selectors. Test preview tab closed; isolated 43127 server stopped. The intended owner localhost:5000 dev server remains running. No further agents were used. Production deployment and production search remain unverified and unauthorized.

## Authorized bounded live-trial preparation (2026-11-10)

Owner authorized private local configuration and at most one normally admitted live Alpaca catalog import, followed by search/cache verification. Publication, deployment and production activation remain unauthorized. Presence-only inspection found existing legacy Alpaca credential names in the main checkout .env, but neither the worktree nor agent process has TIKR_CONVEX_URL / TIKR_CONVEX_ADMIN_KEY. Main .env.local declares a dev Convex deployment and a public provider URL; those do not supply the server admin credential. No credential value was printed or copied, and no market endpoint/provider request was made during this preparation.

Requested existing non-production storage URL/admin configuration through the private secret-entry tool; the request timed out without delivery. Consequently no live trial was attempted, no counters/leases/guards were changed, and no new live-provider evidence exists. Do not provision/deploy a storage backend or alter budget review to bypass this missing prerequisite. Next: supply the existing non-production TIKR_CONVEX_URL and TIKR_CONVEX_ADMIN_KEY privately, confirm target classification, then use normal admission for the single bounded trial. Existing Alpaca credentials may be loaded privately from the main environment file under this authorization; main source/configuration must remain unchanged.

## Local sample-versus-live diagnosis follow-up (2026-11-10)

Confirmed the running localhost:5000 worktree server reports sample mode using a new read-only `GET /api/assets` that does no storage/provider work. Environment inspection was limited to names/presence; no actual secret values were inspected. This checkout has only .env.example; the agent shell has no relevant market variables. That shell observation alone does not prove another process's environment; the server mode result and Terra browser reproduction establish the inspected server's sample source. Sample has no PLTR, explaining the local empty 200 symptom independently of earlier production 429/import failures. No live request/import was needed or performed.

Implemented explicit mode detection and response source headers, sample-scope empty feedback, configured-but-not-enabled failure instead of silent sample fallback, and malformed-200 response validation. Relevant market settings present without explicit activation now fail closed. No credentials or activation were added. Hosted-operation.md documents the actual source, required future personal settings and remaining storage/admission prerequisites; full live catalog fit and production cause remain unverified.

The additional owner-authorized read-only Codex gpt-6.1-terra / medium shared-checkout browser verifier completed: actual Palantir typing showed sample source/empty feedback; intercepted activation failure showed no sample substitution; synthetic PLTR could be selected (100%) and saved locally, then appeared in the portfolio list. Unavailable synthetic history showed no estimated returns. It closed its preview tab and changed no source. No additional agent/reviewer was run. Earlier Luna review remains complete.

Follow-up verification: full Vitest suite passed 32 tests in 10 files; the final focused route rerun passed both tests after adding source/mode cases. Five asset-catalog Node tests passed, including synthetic Palantir normalization and p/pa/pala/palantir/palanti/PLTR lookup. Six installed-Edge catalog tests passed against the credential-cleared final production build, including literal PLTR sample-empty and malformed-200 behavior. `pnpm check`, final production build, focused Prettier and Git whitespace checks passed. One intermediate check raced build-generated .next types; rerunning check after the completed build passed. One browser test initially expected old empty copy; neutral copy for an unknown response source was restored, then all six passed. The temporary 43127 server is stopped; the owner's existing 5000 server was not stopped or reconfigured. Browser artifacts remain in system temp. No additional upstream calls, credential access, activation, publication, deployment or worktree changes occurred.

Next: review the local diff and authorize/configure the intended data mode separately if live local search is desired. Existing local server currently has only sample results. Do not treat synthetic PLTR selection as live import/history verification. No additional review is pending.

## Full catalog import repair (2026-11-10)

Implemented locally in the bound `fix-alpaca-catalog-import` worktree from a clean status; main unchanged. Owner-reported production 503/cooldown does not establish cause. No credentials, live provider calls, deployment, provisioning, commits, pushes, PRs or cleanup were authorized/performed. The supplied evidence cannot distinguish provider HTTP/decode/validation/size/storage/admission failure. Local fixtures reproduce pre-filter validation rejection and uncompressed write-size rejection; these are plausible code defects, not a proven production diagnosis.

Explicit eligibility now precedes supported ticker/name validation; excluded instruments are not subject to supported-symbol syntax. Structurally malformed input and malformed eligible assets still fail. Names remain lossless up to 1,024 characters. Versioned bounded LZW tuple shards fit a 15,001-row long-name mixed metadata fixture within unchanged 50 KB shard / 900 KB atomic write ceilings. Old plain shard reads remain compatible. A near-30,000-row varied high-entropy fixture demonstrates that arbitrary metadata can still exceed the bounded write envelope: actual full-provider fit remains unverified. No truncated catalog is published. All 32 shards use one existing transaction; transaction tests demonstrate old revision preservation on invalid final document and storage-capacity refusal.

Raw response allowance is 16 MiB with eight existing hosted 2 MiB reservations or one local 16 MiB reservation. Shared budgets/counters, daily attempts/cooldowns, correction/revocation and abandoned guards remain intact. Increased per-import reservation consumes more existing quota; no quota increase/reset/refund. Fixed-stage catalog diagnostics expose only HTTP status, byte/row counts and allowlisted codes. Provider/stream, decode/validation, size, storage capacity and admission failures have safe distinct feedback; cooldown still reports its actual deadline. See hosted-operation.md for limits/cost reasoning and a concrete separately authorized one-import live procedure.

One user-authorized Codex gpt-6-luna / reasoningEffort max read-only shared-checkout review completed. No DeepSeek review was started. Fixed its stream-versus-size classification and storage-capacity classification findings locally; reconciled old ceilings and added the near-limit fixture. No second reviewer was used.

Final verification: 69 Node tests across asset-catalog, market-storage, durable-market, personal-loader, market-admission and market-cache passed with react-server/strip-types flags. Full `pnpm exec vitest run`: 31 tests in 10 files passed, including 32-shard atomic rejection. Five installed-Edge Playwright catalog tests against credential-cleared loopback production server passed, including new 390/1440px failure-copy checks, debounce/supersession/keyboard/equal weights, touch demo and six-holding/retry behavior. Screenshots/test artifacts are under system temp; server stopped. `pnpm check` and production build passed; build used SKIP_ENV_VALIDATION=1 without activation. Focused Prettier and Git whitespace checks passed. No live-provider compatibility, multihost/platform billing or production verification is claimed.

Next: owner review of this local diff. Any publication/deployment/credentials/live verification needs separate authorization. A live trial must use existing legitimate admission without resetting leases/counters/guards; stop after one bounded failed import and inspect safe stage evidence. Public display/caching rights and current team/platform headroom remain separately gated.

# Tikr delivery plan

## Asset catalog search (2026-11-10, feature worktree)

Implemented validated durable Alpaca catalog shards, bounded server-only refresh under existing leases/admission budgets, deterministic ticker/name ranking and 180 ms editor search with superseded-response rejection and native keyboard/touch result buttons. Browser-local parsing preserves valid ticker syntax; current catalog eligibility gates new historical-source work. Six holdings per portfolio, duplicate prevention, equal-weight precision, missing-history/action failures and correction/revocation guards remain. Three compared portfolios plus SPY may require nineteen distinct control symbols. Search shows provider names/tickers without inventing ETF classification. The unconfigured demo retains a clearly labeled sample picker; enabled real-data failure never silently falls back to sample search.

The authorized single independent read-only review used opencode/deepseek-v4.1-flash-free, high. It identified excessive repeated full-catalog reads, catalog availability blocking cached historical results, loss of demo editing, and recovery/validation/error-reporting gaps. Addressed with a 60-second coalesced read memo; catalog membership checks on begin-refresh while cached reads retain correction/revocation/expiry enforcement; a labeled credential-free sample path; two admitted attempts/cycle with sixty-second cooldown; twelve-second cold-reader joining via a single-shard probe; shard shape/shard-membership/duplicate validation; explicit route runtime/deadline; safe 429/503 codes and retry timing; resilient post-write release; server-side 400 for uncatalogued new requests with admission release; visible six-holding feedback and search retry. Tightened ticker separators. A real browser test exposed that Next can supply an empty POST body stream: the route now accepts empty streams and rejects nonempty bodies. Final fixes were verified locally; no second independent review is claimed.

Evidence: frozen-lockfile install; all 140 deterministic Node tests and all 30 local Vitest/Convex tests passed. After the final timestamp-validation/test-typing refinement, the affected catalog/hosted/route suites passed 10/10. All 33 installed-Edge browser tests passed on the credential-cleared loopback server, including search race/keyboard behavior, labeled demo touch selection, 429 timing/retry and six-holding limits. Existing desktop/mobile widths and reduced-motion cases pass. Five engine mutation probes were killed. Final lint plus application/Convex TypeScript checks passed; final credential-cleared `SKIP_ENV_VALIDATION=1 pnpm build` passed compilation, lint/types, page generation and traces with only `.env.example` present by filename. Browser artifacts remain under system temp/tikr-catalog-browser; the dev server was stopped.

Synthetic tests include 9,001 catalog assets, deterministic ranking, malformed/duplicate/oversized input and shards, missing/mixed revisions, size-cap rejection, preserved old shards after bad refresh, memo reuse, lease contention, a new catalog ticker reaching the real synthetic history pipeline, unknown ticker rejection, catalog-outage reuse of intact history, and guard/revocation behavior. The runtime integration uses real local convex-test storage/leases and injected provider JSON. Existing fixtures still prove missing leading/interior prices and missing/unsupported actions fail. No provider credentials, live requests, provisioning, deployment, commits/push/PR/merge, ledger/guard resets, or main-checkout changes were used.

Deliberate limits/next task: provider response/shard/write ceilings remain protective, not real-provider fit evidence. A catalog exceeding the existing 900 KB gateway-write bound fails closed. No live sizing, response compatibility, subtype completeness, exhaustive corporate-action history, public display/caching rights or sustained multihost cost is established. Keep shared budgets intact; memoization mitigates catalog I/O but does not guarantee anonymous search can never exhaust them. Two failed refresh attempts can leave new-source/search work unavailable until the next cycle; no hour-long recovery promise is made. The suggested exact-only search was not adopted because owner approval requires exact-first ranking. Cached history remains subject to existing evidence expiry, budgets and revocations. Owner authorized focused commit, push and PR to main in this feature chat on 2026-11-10. Next is PR review and separately authorized real-provider sizing/coverage/cost verification; merge and live activation remain unauthorized.

## PR #11 Convex module-name fix (2026-11-10)

Owner-reported Vercel build failure: Convex deployment rejected `market-limits.js` with `InvalidConfig` because module path components allow only alphanumeric characters, underscores and periods. Renamed the helper to `convex/market_limits.ts` and updated its sole application import in `convex/hosted.ts`. Inspected every Convex file introduced by this PR: `convex.config.ts` is valid configuration and excluded from function entry points; the new `market-admission.test.ts` is excluded by the installed bundler's multiple-dot rule, but was also renamed to `market_admission.test.ts` for consistent valid spelling. Existing `market-integration.test.ts` predates this PR and is likewise excluded. Test globs/configuration already match the renamed test; no generated files or runtime behavior changed.

Added `tests/convex-module-paths.test.mjs`: rejects the exact hyphenated regression and checks all repository Convex entry-point paths against the reported server restriction, using exclusions inspected in installed Convex 1.46.0 bundler source. Two naming tests, all 26 Vitest/Convex/hosted tests, `pnpm check` (lint plus application and Convex TypeScript), focused Prettier and `git diff --check` passed. This naming guard is an offline source check, not the deployment validator. Direct import of the installed CLI's internal bundler was unavailable because its published internal module import requires an absent `@babel/parser`; no dependency was installed to bypass this. No Convex deployment/codegen, credentials, live provider access, preview changes or agents were used. The prior Next production build did not validate server-side Convex module-path acceptance; only a subsequent remote build can confirm the reported deployment failure is resolved or reveal another one. Earlier financial/browser evidence remains unchanged; no rerun of those suites is claimed for these renames.

Next: push the authorized focused fix to existing PR [#11](https://github.com/Juan-Espino/tikr/pull/11), link it to this feature chat immediately, and report a single checks/reviews snapshot without waiting, watching or merging.

## Market admission implementation (2026-11-10)

PR preparation authorization (2026-11-10): owner explicitly authorized committing, pushing and opening a PR to main from this bound feature chat. Preview setup is deferred and unchanged. Reuse the completed local verification above/below with its recorded limits; no new agents, merge, deployment, credentials or live provider requests are authorized. Next: review the opened PR; no check watching or waiting is part of this task. The no-commit/no-push statement below records the preceding implementation checkpoint.

Implemented in the bound `C:/Users/JuanE/.t3/worktrees/tikr/feat-market-admission` checkout from a clean starting status. Main remains untouched. Owner-approved scope supersedes the old ten-per-128-IP-bucket / 100-global daily caps: short-term configurable token buckets default to 60 opens/minute per full visitor HMAC and 240 global admission attempts/minute, with four active request slots. The existing daily counters remain stored and are no longer enforced or reset. Visitor state is capped at 256 hashes and expires after ten minutes using scheduled/entry expiry; only ephemeral limiter state is removed. No raw IP persistence/logging or collision-prone bucket projection remains. Installed `@convex-dev/rate-limiter` 0.4.3 and mounted its component; generated application files were not edited. The typed component reference is local source pending separately authorized deployment/code generation.

Cached requests continue through shared Convex budget, calendar/dependency, guard and revocation checks. Missing/stale sources retain existing durable leases and cross-host coalescing. Manual source retries have server-enforced cooldowns and bounded daily attempts, with 60-second or next New York 09:00 deadlines (DST covered). Calculation-slot contention skips persistence rather than throttling fresh-source calculations. Safe errors now distinguish browsing rate limits, refresh cooldown, shared budget exhaustion, expired budget review and missing history. Gateway/pre-stream failures expose appropriate 429/503 and known `Retry-After`; later stream failures use safe NDJSON codes/deadlines. Dated stale results and their explanation remain visible. Trusted pre-network provider admission failures survive adapter sanitization and cannot falsely revoke a scope; the local SDK also preserves the safe budget-review error. No financial methodology changes.

Instrumented actual route/runtime/gateway functions against local convex-test, the actual limiter component and injected synthetic six-asset data (1,280 weekday sessions; no corporate actions; 5Y). Fresh: 13 provider requests, 63 gateway requests, 65 admission increments, 31,610,292 estimated admission I/O bytes. Cold-host cached reopen: zero provider requests, eight gateway requests, 11 admission increments, 569,618 estimated admission I/O bytes. Exact JSON byte counts, operation breakdown, reproduction command and limits are in [hosted-operation.md](hosted-operation.md). These are application counters/serialized bytes, not platform billing or live telemetry. Existing 100 MB / 500 MB / 250,000 caps are unchanged. Synthetic reservations imply fewer than 16 full six-asset refresh cycles in 500 MB before cached traffic; sustained monthly capacity is not accepted. HTTP action/component/expiry/OCC/Vercel costs still need actual platform measurements. No provider reservation refunds were inferred from synthetic payload sizes.

Local verification: 136 Node tests; 26 Vitest/convex-test/route/runtime tests; 30 installed-Edge browser tests against the credential-cleared production build; five backtest mutation checks; `pnpm check`; production build; focused Prettier and Git whitespace checks. All passed. The final full Node log is under system temp (`tikr-admission-node-final.txt`); browser output is under system temp (`tikr-admission-browser-final`). Browser verification covers the final UI; the later provider/SDK error-only fixes were verified by Node/Vitest and the final build. Browser tests cover distinct HTTP errors at 390/1440px, known retry timing, dated stale budget failure, existing loading/expiry/revalidation/reduced-motion behavior and 390/768/1440px overflow. Transaction tests cover overlapping admission/guards, >100 ordinary opens with historical counters preserved, independent full hashes, registry bounds/expiry, token refill/config validation, overlapping manual retries, atomic provider reservations and correction/revocation. Runtime tests perform more calculations than the sixteen result slots without additional provider calls. Provider/SDK negative tests prove zero provider access on admission refusal and no false correction revocation. Synthetic fixtures do not establish live provider completeness or cloud concurrency/billing.

Next: owner review in this feature chat. Any commit/PR/merge must originate here per the owner's preference so T3 can associate the worktree. Deployment, component binding verification, credentials/configuration, current team/platform measurement, data rights and live trials require separate authorization. No agents, commits, pushes, PRs, provisioning, deployment, actual credentials, live provider access, main changes or worktree cleanup occurred. Existing real ledgers, abandoned guards, leases and revocation markers were never read/reset/deleted to bypass gates. Temporary test servers are stopped after verification; test artifacts stay under system temp.

The favicon and Apple touch icon metadata now point to the owner-selected bear-aviator PNG. Next: verify the favicon in a browser when reviewing the app.

## Hosted review follow-up (2026-11-06)

Independent Sol Low review found no confirmed production-blocking defect, passed 133 Node tests and 12 Convex/route tests, and identified integration/concurrency test gaps. Added a full hosted runtime test using the real Convex gateway against convex-test with synthetic provider transport: cold module instances reuse durable calendar/results, the next freshness cycle refreshes both, and revocation during a held cached-result read rejects the in-flight request. A local-admission mock throws if hosted execution uses the filesystem ledger. Added simultaneous admission and refresh-guard races: at most four requests enter and one guard writer wins. All 14 Convex/route/runtime tests now pass; lint and both TypeScript projects pass. These additions exercise simulated concurrency and real application paths, not deployed cloud timing or live market data. No deployment, credential access or public activation. Next: owner review of hosted configuration/runbook, followed by separately authorized deployment and hosted verification.


## Hosted production preparation (2026-11-06)

Owner-approved release direction is open unauthenticated Vercel access with browser-local portfolio definitions; the Google restriction is superseded. Prepared in `C:/Users/JuanE/.t3/worktrees/tikr/t3-a65802e1` from `2269d0d15f2c462a90442403416b4dd3bc344e64`. No branch/worktree creation, commits, deployment, provisioning, credential handling or live provider requests were performed.

Implemented configured canonical hosted-origin validation and production runtime enablement behind explicit disabled-by-default flags. Hosted storage uses a private bearer HTTP gateway restricted to cache/control operations, never a deploy/admin key. Convex holds bounded atomic anonymous admission, concurrent request slots, provider reservations, durable refresh guards/revocations and shared calendar cache/leases. Existing asset leases, budget caps, mathematical engine, SPY/shared dates and provisional UI remain intact. Local filesystem admission remains only for the compatible local path; no existing ledger or guard was reset. See [hosted-operation.md](hosted-operation.md) for exact configuration, target classification, deployment sequence, disable/rollback and budget review.

Verified: 130 deterministic Node tests across the two recorded invocations; 12 local Convex/route tests, all five mutation probes, final lint and both TypeScript projects, focused formatting/whitespace, and credential-cleared production build passed. Tests prove production-origin anonymous route streaming, origin rejection and input bounds, shared admission/concurrency, persistent guard ownership/revocation, storage failure sanitization, HTTP authentication and operator-function rejection; existing transactional integration tests cover independent coordinators coalescing SPY. Initial browser run found a loopback oversized-body regression (403 versus 413); fixed and rebuilt. Final installed-Edge browser rerun against the credential-cleared production build passed all 28 tests; output is under system temp (`tikr-hosted-browser-final`). The temporary loopback server was stopped.

Remaining activation requirements: separately resolve public Alpaca display/caching rights and obtain deployment/live activation authorization; privately configure the matching gateway key, provider entitlements, canonical Vercel origin and exact Convex target; review actual team headroom and platform firewall/spend controls; then perform a bounded deployed two-instance/live trial. Offline tests do not establish those results. The 100 daily global opens, 10 per hash bucket and four concurrent request slots are conservative implementation defaults, not owner-approved product quotas. Platform HTTP/action/Vercel costs remain outside the existing database admission estimate. No paid fallback or budget increase was added.
## PR preparation (2026-11-05)

Final combined revision passed 130 Node tests, 7 local Convex tests, all five backtest mutation probes, lint and both TypeScript projects, a production build, and 28 installed-Edge browser tests. The build and browser test server had personal market requests disabled. A focused independent Sol Low review found no blocking defect and passed 35 focused tests; it did not independently rerun the full suite. Live local SPY verification is recorded below; NVDA's failure, public/shared licensing and sustained team budget remain unresolved. The owner requested PR creation; no production activation is implied.

## Input error and timeframe follow-up (2026-11-05)

Portfolio name conflicts now use the existing destructive token for an invalid border/ring and error text, following shadcn's accessible invalid-field pattern. Max is removed from both timeframe pickers; legacy saved Max portfolio/draft values migrate to 5Y. Existing simulation and server contracts retain Max for compatibility. Three focused Node tests, two Edge browser tests, lint and both TypeScript checks passed. Next: owner review in the local feature worktree.

## Portfolio naming and card identity (2026-11-05)

Inspected the owner's dashboard state: two separate saved portfolios shared the name New portfolio, one NVDA and one SPY; SPY already had results while the NVDA card was blocked. The annotation did not establish a stale-response defect. Cards now show holding tickers; a browser regression confirms that saving an NVDA-to-SPY edit refreshes the correct card and removes the NVDA error.

Saved names are unique ignoring case and surrounding whitespace, checked both in the editor and save operation. Conflicts show an inline suggestion without changing user input; self-renames remain valid. Duplicate creates an unsaved draft with the original name, requiring an explicit unique name before saving. Existing duplicates are preserved and require correction when edited. Eight name/demo Node tests, two focused Edge browser tests and lint/app/Convex TypeScript checks passed. No main checkout changes, credentials changes, deployment, commit or push for this follow-up. Next: owner review of the updated cards and naming flow; the separate NVDA data failure still needs investigation.


## Live personal configuration (2026-11-05)

Configured the existing development deployment and synced backend functions with Convex typechecking enabled. Private ignored worktree configuration uses existing local Alpaca credentials and a development-only deploy key; its Windows ACL permits the owner and SYSTEM. Main configuration was not changed. Personal provisional mode is enabled on the loopback dev server, port 43127.

Live calendar, raw SIP bars and corporate-action requests succeeded. The first full-history request exposed a process-date/ex-date boundary bug: SPY returned a valid dividend with entitlement before the investment window but payment inside it. The personal loader now validates supported actions before filtering by ex/effective date; unsupported terms still fail. Policy revision v2 identifies this changed normalization; no admission ledger, lock, guard or revocation marker was deleted or reset. Ten loader regressions pass, including the boundary and malformed-action revocation cases; lint and both TypeScript projects pass.

A live one-month SPY portfolio reached ready with 23 points per portfolio/benchmark, October 5 through November 4. Subsequent opens returned ready cached data. Installed Edge at 1440px and 390px rendered matching backend ending values, a 23-day accessible table and provisional disclosure without horizontal overflow. Convex inspection found 62 monthly price records, one asset head and two result records. Reported development usage after the checks was 40 function calls and about 0.000169 GB database I/O; reporting may lag and does not establish monthly fit.

The operator reports Tikr is the only team project in use. Other-project usage was configured as zero on that basis, with a 24-hour review expiry; team-wide plan/storage totals were not independently established. Reassess that configuration before expiry to maintain availability. Credentials, market payloads and the deploy key remain outside tracked files. No production deployment, commit or push. Next: owner review of the live local app, then integration review; sustained budget fit and public access remain separate.

## Personal provisional implementation (2026-11-05)

Implemented in `C:\Users\JuanE\.t3\worktrees\tikr\t3-7a02e9bc`: explicit server-only personal provisional mode bypasses the manual evidence bundle, obtains bounded exchange calendar/raw SIP bars/actions, and uses the existing durable storage/cache and decimal engine. Results carry a provisional quality marker visible in workspace and compact dashboard. Reviewed replay remains available. Provider requests reserve durable local budget before transport; missing history and unsupported/ambiguous actions fail, including revocation when received data contradicts an old scope. No engine methodology or Convex function/schema changes.

Verification: all 125 Node tests, eight focused personal-loader regressions included, passed. Seven local Convex tests, all five mutation checks, lint/typecheck and 25 browser tests passed. Browser checks used an allowlisted credential-cleared loopback server and synthetic fixtures; output is under system temp (`tikr-personal-browser`). The final production build passed in an allowlisted credential-cleared environment with SKIP_ENV_VALIDATION=1. Focused Prettier and Git whitespace checks passed. The temporary dev server was stopped. Restored frozen-lockfile dependencies with no manifest/lock changes. An initial browser/build attempt collided in the shared Next output directory and failed; sequential verification supersedes that attempt.

Next task: separately authorize private configuration, verify Convex team headroom/configuration and deployment prerequisites, then run a bounded live Alpaca trial for endpoint/account compatibility and corrections. No credentials were accessed, authenticated requests made, services provisioned, deployment performed, commit created or push made. Public/shared licensing and real account ownership/authentication remain separate. The saved historical evidence captures remain unaccepted as independently verified data; the owner decision authorizes labeled provisional use, not rewritten historical findings.

Owner decision (2026-11-05): personal local Alpaca results may use provisional live data without manual evidence approval. Label results clearly as subject to corrections; this does not establish provider finality or exhaustive action completeness. Raw SIP closes, the next-day 09:00 New York cutoff, payment-date reinvestment, decimal arithmetic, shared periods and missing/unsupported-action failures remain required. Public/shared licensing, credentials/configuration, live requests and deployment require separate authorization. Earlier manual-review requirements below remain applicable to reviewed replay and historical evidence acceptance; they no longer gate this personal provisional mode.

## Alpaca evidence request draft (2026-11-05)

Prepared `alpaca-evidence-request.md` with specific close, correction, action-coverage and unit questions. Massive is a documented trade-rule comparison lead, not a verified equivalent or approved data source; entitlement and permitted validation use remain unknown. No inquiry sent, account created, paid access, credentials or live requests. Next: owner review and authorization before sending the draft; resolve source equivalence and rights before accepting captures.

## Alpaca evidence assessment (2026-11-05)

Reviewed current Alpaca primary documentation against the six-case findings. Engine acceptance remains no-go: independent matching SIP-close semantics, historical correction detection, and exhaustive action coverage/units are unproven. The documented action event stream is a lead, not established completeness evidence. Acceptance criteria and exact provider questions are in `alpaca-real-data-review.md`. No new capture, private replay, credentials, activation or deployment. Next: obtain authoritative answers and a permitted matching reference before issuing proofs or replaying into the engine; provider contact needs separate authorization.

## T3 handoff verification (2026-11-04 Pacific / 2026-11-05 UTC)

PR [#6](https://github.com/Juan-Espino/tikr/pull/6) is merged at `d776f9c96c957acb4a6030b762106d7f6b2b5508` (2026-11-05 00:32:24 UTC). The GitHub CLI independently confirmed both Vercel and Vercel Preview Comments checks succeeded on head `da7706094adcf9ec9467eaf7b32e49535d7e76de`; the connected GitHub API returned 404 and was not used as evidence. The app checkout at `C:\Users\JuanE\Code\React Projects\tikr` was already clean at this merge when inspected. Its origin is `https://github.com/Juan-Espino/tikr.git`; a fresh fetch confirmed main and origin/main have zero commits of divergence. No fast-forward was necessary.

Validation runs in the existing T3 task worktree at the same merge, with dependencies restored using `pnpm.cmd install --frozen-lockfile` (10.11.0; manifest/lock unchanged). Child processes use an allowlisted, credential-cleared environment with `SKIP_ENV_VALIDATION=1`; only `.env.example` is present by filename. Fresh results: 117/117 Node tests (`--conditions=react-server --experimental-strip-types --test tests/*.test.mjs`), 7/7 local Convex tests, all five mutation probes, and all three components of `pnpm check` (Next lint, app TypeScript, Convex TypeScript) passed. A fresh production build passed on the merged final UI. These checks do not accept real-provider evidence or prove deployed Convex behavior. Private opt-in scripts were inspected separately; live capture was not run.

The installed-Edge Playwright suite also passed 24/24 tests against a credential-cleared loopback server on port 43127, including responsive overflow, evidence expiry, final-only snapshots, dashboard bounded waits, comparison exits, reduced motion and marked-synthetic versus live revalidation behavior. Browser outputs are under system temp (`tikr-handoff-browser-results`); these synthetic fixtures do not validate Alpaca. The test server was stopped after verification.

Next task: assess matching raw SIP close semantics, finality/corrections and exhaustive corporate-action completeness/units against the saved capture evidence in `alpaca-real-data-review.md`. Keep all six captures unaccepted until independently supported; never manufacture verified flags. Actual Convex team headroom and separately authorized deployment/configuration and bounded live trial remain later activation gates. Public/shared data rights, real Google authentication and portfolio ownership remain separate. Historical research documents must be reconciled individually if supplied; no historical worktree content was copied over merged documents.

This checkpoint supersedes older statements below that PR #6 changes are uncommitted or isolated from main. Older validation records remain historical. Application main and its local environment were preserved; no commit, push, deployment, live-data activation or worktree cleanup was performed.

Current local integration status (2026-11-04): an expiring evidence-gated replay loader, internal Convex storage/leases and budget admission, and real-result UI states are implemented in the isolated feature worktree. Production/public access is disabled; actual provider evidence, Convex deployment/team usage acceptance and live activation remain incomplete. No demo series are substituted in portfolio results. Guest definitions remain browser-local and sign-in remains a preview. See `market-data-integration.md`; earlier unimplemented summaries below are historical baseline statements.

## On-demand refresh section (implementation)

Owner-approved policy is recorded in product/methodology docs. Implemented a server-only single-process coordinator in `src/lib/market-cache.ts`: shared asset refreshes including SPY, 09:00 New York freshness cycles, stale verified snapshots, bounded retries, revision-based invalidation and fail-closed calculations. Twenty-two new synthetic regressions pass, including review fixes for calendar/effective-end dependencies, cold/mixed pending newest-session coverage, and global invalidation before calendar-outage fallbacks. Source is isolated in the current feature worktree; no main checkout, live calls, credentials, scheduler, UI, deployment or dependency changes. `tsconfig.json` enables explicit TypeScript imports under noEmit for native source tests. See `on-demand-cache.md`. Verification completed: all 86 offline tests pass, the five existing engine mutations were killed, lint/typecheck and the credential-cleared production build pass, and focused formatting/Git whitespace checks pass. Independent review accepted the revised single-process core after 22/22 cache tests and its own adversarial calendar-outage reproduction; four frozen source/test/config/doc hashes matched at both ends. Documentation completion notes were added after that review. No merge, commit, push or live-data acceptance is claimed. Durable/distributed storage, an evidence-validating real-data loader and UI wiring remain integration work; provider completeness is still unverified.

## Owner decisions after live review

Approved Alpaca raw SIP daily close for holdings and SPY, completed-session endpoints, and eligibility no earlier than 09:00 America/New_York on the following calendar day after required checks. Recheck the previous five trading sessions during each daily refresh; invalidate/recalculate affected cached results when prices/actions change, preserve revisions and display as-of dates. Defer an unverified newest endpoint without concealing interior gaps. Recorded in `product.md` and `backtest-methodology.md`. This is an operational policy, not a provider finality guarantee or implemented cache/refresh process. Broader reconciliation of older corrections remains open. Next: resolve corporate-action completeness/reconciliation and independent matching-close semantics, then validate the readiness/correction implementation. Documentation only; main checkout and implementation remain unchanged.

## Six-case Alpaca evidence review (2026-11-03 local)

All six prepared cases were captured and assessed using 12 total data-only requests, 53 daily bars and two expected actions. Saved snapshots passed offline replay/integrity checks. Independent numerical comparisons agree for all 53 closes at the documented source precision; issuer, exchange, inception and DST evidence was checked. Full methodology acceptance remains blocked by matching close/feed semantics, a completed-bar/correction policy and exhaustive corporate-action coverage. No live engine calculation, integration or methodology change. See `alpaca-real-data-review.md` for the completed investigation, source evidence and exact remaining work. This supersedes the earlier single-sample checkpoint below. Next: establish and review the provider evidence policy, then replay the saved samples without inventing verified proofs.

## First authorized Alpaca sample (2026-11-03 local)

The owner-approved `nvda-split` SIP capture used 2 data-only requests (1,061 response bytes), returning three NVDA bars, three SPY bars and the expected 10-for-1 split effective 2024-06-10. Numeric fidelity, proposed session coverage and event/scope checks passed; saved snapshot integrity, offline replay and protected local output ACL were verified. Overall result remains unresolved: independent prices and finality/calendar/action/inception/access evidence are pending, and the engine was not run. See `alpaca-validation.md`. Next: review the existing capture against independent references and establish the remaining evidence, without treating successful traversal as completeness. Main checkout and credential files were unchanged.

## Private Alpaca validation harness (2026-11-03)

Implementation is isolated on `feat/alpaca-real-data-validation` from main `a55bbcc`. New private CLI supports bounded raw-response capture, credential-free digest-checked replay, per-case observations/evidence reporting, numeric-token fidelity checks and an exact BigInt closed-form oracle. Six seeded cases cover SPY distributions, NVIDIA's split, Reddit inception, NYSE holiday/half-day/DST boundaries. Case facts and calendars require a dated review bound to the exact snapshot before engine execution.

Local verification passed 64 tests (25 new harness/oracle checks), all five engine mutation probes, lint/typecheck, focused formatting/whitespace and a credential-free production build. Independent revised review accepted the bounded offline harness after full source coverage and 25/25 independent synthetic checks, including effective Windows directory/file ACL inspection. Local outputs use protected owner/SYSTEM-only ACLs under LocalAppData; capture requires an owner no-sync acknowledgment. The credential-free tests use synthetic responses. Live account validation remains pending: the process has no supplied Alpaca credentials and automatic approval review rejected reading the protected app environment files. No authenticated call has run in this task. Reference assertions, action completeness, bar finality, provider corrections and public/shared rights remain open; repeated observations cannot establish a universal guarantee. Run results and independent review will be recorded in `alpaca-validation.md`.

## PR preparation scope (2026-11-02)

Preparation completed: production build rerun on the latest two-session implementation passed using an allowlisted environment with SKIP_ENV_VALIDATION=1 and no production dotenv files present. No credential file contents were read. The configured build may fetch public Google fonts; no authenticated market-data requests occurred. Repeated 21/21 tests, all five mutation checks, lint/TypeScript, targeted source/test formatting and Git whitespace checks passed.

Final diff review covered all tracked changes and every untracked engine/test/oracle file. Dependency diff is only decimal.js 10.6.0 and its lock records; no framework/config/UI/provider changes. Reconciled the minimum-session rule, full approved policy, personal-use Alpaca scope, agent test commands and historical review limitations. PR scope is ten files: AGENTS.md, package.json, pnpm-lock.yaml, product.md, plan.md, backtest-methodology.md, src/lib/backtest.ts, tests/backtest.test.mjs, tests/backtest-mutations.mjs and tests/fixtures/backtest-oracles.json. Existing app-root environment and coordination changes were not copied wholesale. No commit, push or PR was created by this preparation.

This is an offline engine milestone only: provider-independent calculation code, deterministic tests/oracles, five mutation checks, the decimal.js dependency/lock entry, and relevant product/methodology/agent/status documents. No UI wiring, provider adapter, credentials/environment files, cache deployment or unrelated application changes belong in this proposed PR. Owner has approved the two-session minimum; one-session handling is no longer open. A universal numerical error bound and real provider evidence remain limitations, not assertions made by this milestone.

The independent reviewer accepted the preceding gap-fixed revision conditionally. Later owner-approved two-session handling is locally tested and documented, not independently re-reviewed. Earlier notes below are historical and do not override current policy. This preparation task does not itself commit, push, create a PR or merge changes.

Minimum-history verification (2026-11-02): 21/21 tests passed, five mutants killed, lint/TypeScript and whitespace checks passed. New boundary regression failed before the fix. Calendar fixtures now reject the one-session half-day case while retaining a separate accepted two-session half-day case. No new production build or independent review is claimed for this small update.

Owner approved at least two shared completed sessions (2026-11-02). Coordinator added a failing one-session/younger-inception regression and changed the engine to reject zero/one while accepting two. This updates the previously independently reviewed snapshot; old hashes no longer apply. Local checks must be recorded separately. No merge/provider integration/deployment authorized.

Offline backtest implementation (2026-11-02, independent worktree): provider-independent engine uses a private 40-digit decimal context, normalized post-split dividend units, payment-date receivables and caller-attested completeness. The gap fix received conditional independent acceptance; the subsequent approved two-session minimum passed local tests. No provider integration, cache measurement, real-data validation, licensing approval or UI integration is claimed. Universal error bounds and provider evidence remain open. Next: finish focused PR preparation, then separately investigate provider evidence and measured cache budget.

Main-checkout handoff (2026-10-30): owner requested integrating the reviewed worktree changes into C:\Users\JuanE\Code\React Projects\tikr. Applied SPY frontend/fixtures and reconciled research/product/design/AGENTS updates while preserving pre-existing main edits and staged state. No branch merge commit, commit, push or PR created. Main HEAD remains 7b56909; changes await owner review and commit. Main fixture suite passed 6/6; uncached lint and standalone TypeScript passed after restoring frozen-lockfile dependencies. Cached lint initially reported stale type errors. Browser/build review not repeated.

Current worktree update (2026-10-30): fast-forwarded research/free-services-feasibility to local main at `7b56909`, importing the branding/globe changes. Preserved and reconciled uncommitted SPY frontend changes and research/coordinator documents; main checkout left untouched. No new commit or push. Prior synchronization notes below describe earlier states. Current task: verify combined checks and let owner review the updated worktree.

Combined verification passed: `pnpm.cmd check` (lint and TypeScript), all six existing/updated fixture tests, and `git diff --check`. No unmerged files remain. Browser review and production build were not repeated for this synchronization; next step is owner review of the updated worktree.

Worktree synchronization (2026-10-30): owner clarified to update only this research worktree from the local main checkout, leaving main untouched. Both committed trees are at 06b8ef3, so no source merge was needed. Reconciled main's uncommitted AGENTS/product/design/plan updates into this worktree while preserving SPY and research changes; retained its original free-services outline alongside local findings. Remote-tracking origin/main is separately at 7b56909 (branding merge); it was not imported by this local-checkout synchronization. No commit, push, branch move or write to the main checkout.

Frontend benchmark switch (2026-10-30): owner selected SPY to replace VOO. Updated dashboard/workspace controls, comparison labels, chart legends, benchmark series, sample catalog/fund name, examples and existing fixtures. Legacy browser-local demo VOO holdings migrate to SPY with a visible notice, preserving portfolio/draft fields. Real FMP history/auth/backend integration remains unimplemented; synthetic-data disclosures stay in place. Verification pending below.

Verification: initial tests/check were blocked by absent node_modules. Restored exact existing dependencies with `pnpm.cmd install --frozen-lockfile`; manifest and lockfile unchanged. `pnpm.cmd check` passed lint and TypeScript; `node --experimental-strip-types --test tests/demo.test.mjs` passed 6/6, including legacy saved portfolio/draft migration and unknown-symbol rejection. Targeted frontend Prettier applied; `git diff --check` passed. Remaining source VOO literals are compatibility handling/notice and its regression fixture. Browser interaction review and production build were not run for this ticker switch. Next: owner review of SPY labels, then separate real-data validation/integration planning.

Owner-run SPY dividend-adjusted endpoint succeeded for October 26–29, 2026. This proves short-range endpoint entitlement, not corporate-action correctness or five-year adjusted coverage. Next: five-year adjusted SPY and AAPL checks, then action/date methodology validation. Public licensing remains separate.

Five-year SPY check: owner reports success for the requested five-year range. SPY remains the leading replacement benchmark candidate. Next data task is dividend-adjusted endpoint entitlement/methodology and date-completeness validation; private technical feasibility is improved, public licensing remains unresolved.

SPY feasibility evidence (2026-10-30): owner-run FMP request returned four daily records covering October 26–29. SPY short-range access verified by supplied response; next step is five-year SPY depth/count and dividend-method validation. No benchmark integration or full-feasibility claim; no need to test other ETFs unless SPY fails subsequent checks.

Benchmark decision update (2026-10-30): owner accepts another S&P 500-tracking ETF instead of mandatory VOO; product.md reconciled. Owner-run FMP AAPL history reaches 2021, VOO denied by premium-symbol restriction. Next private feasibility step: short-date SPY, IVV, then SPYM entitlement checks, then five-year/action validation for a successful candidate. No general ETF exclusion inferred and no benchmark chosen. Public-use license gate remains open; no backend changes.

Latest data research: FMP standard license rejected based on explicit terms 2.2.1/2.2.2 covering complimentary multi-user apps; Finnhub standard terms also reject sharing derived results. Additional leads OHLC, Financial Datasets and GetMarketHistory do not establish free required coverage/rights. Owner supplied Stooq's personal-use notice and 518 MB U.S. daily listing. Full evidence and unsent FMP permission draft are in free-services-plan.md. M2 is blocked on data permission/entitlement evidence, not implementation. No permitted zero-cost public path proven; next evidence is an applicable written grant or owner-approved scope/budget change. No provider contacted, account created, history downloaded, or backend changed.

## Data-feasibility research checkpoint (2026-10-30)

Selected research worktree HEAD verified at `06b8ef3`. Owner's current merge-history report supersedes older isolated-frontend/main-untouched descriptions below; historical verification records are preserved. Portfolios remain browser-local, history remains synthetic, and branding `cc71128` is outside this research task.

Stage 1 preliminary official-source evidence is recorded in `free-services-plan.md`. No candidate yet demonstrates a permitted zero-cost public history/catalog path. Findings await owner review; M2 stays open. Next task: review licensing blockers and acceptable scope, then continue evidence gathering before selecting or integrating a provider. No application checks were rerun, dependencies installed, provider contacted, or backend integration changed.

Owner follow-up: current scope is strictly non-commercial with no planned ads/subscriptions; five-year history support is required, and alternatives should be researched. Recorded in product.md. Alternative screening in free-services-plan.md found depth failures (Marketstack/EODHD), storage/chart restrictions (Tiingo), public-sharing restrictions (SimFin), obsolete history (WIKI), and unreadable primary evidence (Stooq/Finnhub). No permitted free path demonstrated; M2 remains open. Next: owner review of these findings and unresolved primary-source permissions. No shorter-history concession, vendor selection or paid fallback adopted.

Hybrid history discussion: importing five years once and using a separately permitted recent-history updater is technically plausible. Illustrative compact storage estimates and reconciliation hazards are recorded in free-services-plan.md; actual database size/free-tier fit and a compatible licensed provider pair remain unverified. This is a proposal, not an approved architecture or implementation task.

Owner correction: determine storage and I/O budget before proposing Convex for history. Official Free limits reviewed: 0.5 GB database storage including indexes and 1 GB/month database I/O; account headroom and actual encoded data size unmeasured. Record in free-services-plan.md. No history placement approved; next capacity task is a measured catalog/encoding/index/traffic budget, alongside unresolved data rights.

Narrowed assistant recommendation: validate a single permitted downloadable EOD source feeding versioned static per-asset files on intended Vercel hosting; keep market observations out of Convex. Stooq permission draft prepared in free-services-plan.md, not sent. Hybrid API updates remain conditional fallback; no standard-free public API approved. Owner has not adopted catalog limits, storage design or vendor. Next gate: explicit public file/display/cache rights plus five-year VOO and adjustment evidence, followed by measured bytes/refresh/hosting budget. No implementation or deployment.

Latest checkout update (2026-10-30): local main is now at `7b56909`, including the branding merge. Restoring local documentation after the pull conflicted only in this file; retained both the branding history and coordinator reconciliation below. Older checkout/branch observations remain historical. No new commit or push was made during conflict resolution.

Last checked: 2026-10-30.

## Current state

- Frontend integration and route ownership refactor are merged into the actual app at `C:\Users\JuanE\Code\React Projects\tikr`, branch `main`, HEAD `06b8ef3`. Local Git history records merges of the frontend and App Router refactor. This reconciliation does not create or modify a PR.
- v0 ZIP was inspected before source edits. See `prototype-review.md` for reuse, dependency differences, mocked behavior, and requirement conflicts.
- The owner reports the frontend is virtually complete. Source includes landing, bright Google-only sign-in preview, dashboard, and portfolio workspaces with shared browser-local persistence. Design work is substantially complete; latest route/provider lifecycle regression is still a distinct verification gap, not a reason to restart the UI.
- Convex backend/generated files remain unchanged. Existing provider still wraps the app; a missing-URL guard permits standalone demo rendering without provisioning or inventing a deployment URL.
- Browser-local portfolios/drafts are separate from Convex and are explicitly labeled. Real auth, licensed market history, Groq, server ownership, and quotas are deferred.
- pnpm 10.11.0, Next.js 15, React 19, Tailwind 4 retained. Added only imported UI/chart dependencies; no ZIP framework/config/lockfile replacement or analytics.
- The latest branding/empty-state commit `cc71128` (Add Tiky branding and globe empty states) is on the clean local branch `feat/tiky-branding`, not yet in main. Its worktree is `C:\Users\JuanE\.t3\worktrees\tikr\feat-v0-portfolio-frontend`. This review does not merge it or assume the branding is a confirmed product rename.

### Location correction

The documents were originally committed to a separate outer repository at `C:\Users\JuanE\OneDrive\Documents\ChatGPT\tikr`, which is not this app. Its empty/unmapped gitlink observation does not describe this application. The mistaken documentation commit has been reverted there, and the original planning worktree was synchronized with that revert. Unrelated nested-repository work was preserved. Do not repair that other repository as part of app development.

## Next actionable task

The ordered research checklist for the data-feasibility handoff is `free-services-plan.md` (2026-10-30). Begin with licensed free market history/catalog feasibility; verify Convex/auth in parallel where useful, then hosting, Groq, and operational services. This is a research outline, not provider approval or authorization to provision integrations.

**Review and integrate the remaining `feat/tiky-branding` commit through the intended frontend handoff, synchronize main's dependencies, and finish the focused frontend closeout below; then resolve M2 free market-data permissions and calculation policy.** No merge is authorized by this status review alone. Run `pnpm.cmd install --frozen-lockfile` in the correct app root before repeating checks: this checkout currently cannot resolve several dependencies already declared in package.json. Do not change application types or relax lint rules to compensate for missing packages. M2 is the largest feasibility gate before real history can replace demo series. In parallel, M3 can add Better Auth Google sign-in, Convex portfolio ownership/persistence, and guest-draft handoff without depending on a price provider. Groq discovery follows a verified asset catalog and approved quotas; it is not the next critical dependency.

### Workspace binding caveat

The coordinator chat is still attached to `C:\Users\JuanE\.t3\worktrees\tikr\t3-39cd552a` in the unrelated outer repository, not this app's Git worktree family. T3 reports the thread is already attached; its handoff tool cannot move an already-attached worktree, and thread-update cannot change workspace/branch. No shell-created checkout, mixed repository history, project-wide setting change, or new thread was used to imply a successful migration. This review uses the explicit correct application path. Future implementation should be bound to the actual app project; the chat's workspace migration remains unresolved.

### Focused frontend closeout

- Existing source and prior records support an implemented demo, not real Google auth, licensed returns, or server persistence.
- Recheck refresh/back/forward, invalid portfolio URLs, guest draft handoff, deletion navigation, and storage failure/recovery after the shared-provider refactor.
- Keep user data intact during testing. Prior browser evidence predates some lifecycle changes; no new browser review is claimed here.
- Rerun configured checks and the existing five demo fixture tests. The results do not prove the production return methodology or provider licensing.

## Milestones

### M0 - Establish the source baseline

Status: source/worktree confirmed; dependencies installed with pnpm 10.11.0. Local frontend can run without environment secrets.

- Completed: located existing app and preserved its source/history.
- Completed: identified manifest scripts, pnpm lockfile, Next.js layout, and Convex provider; updated `AGENTS.md`.
- Completed: isolated frontend dependency installation and local startup. No credentials copied or read. Convex connectivity remains unverified.

Exit: frontend setup is usable. Production/backend configuration is a separate verification task.

### M1 - Review an interactive frontend prototype

Status: frontend demo and route refactor merged; owner reports near completion. Focused post-refactor route/storage regression remains pending.

- Landing, Google-only login composition, dashboard, combined builder/results.
- Deterministic labeled sample data; metrics agree with charts.
- Equal/manual weights, exact 100% validation, local drafts, rename/duplicate/pin/delete.
- VOO and saved-portfolio comparisons, responsive layouts, accessibility, motion fallback, empty/error states.
- Explicitly label mocked integrations; demo persistence is not real account storage.

Exit: owner accepts visuals/core flow and relevant available checks pass.

### M2 - Prove free data and calculation design

Status: unresolved feasibility gate. Can proceed alongside M1.

- Prove zero-cost permissions for public use, history caching, and derived outputs. No provider selected yet.
- Verify VOO and representative stocks/ETFs, historical depth, corporate actions, metadata, limits, and outages.
- Specify adjusted returns/dividend reinvestment, buy-and-hold math, precision, trading calendar, costs/tax disclosure, missing history, and metric formulas.
- Define catalog evidence/curation, industry/theme tags, refresh, and unsupported/delisted-symbol behavior.
- Establish deterministic fixtures for splits/dividends, allocation rounding, and common-date comparisons.

Exit: permitted data path and reproducible calculation spec. If none meets the free requirement, request a scope/budget decision; do not silently pay or label price-only results as dividend-inclusive.

### M3 - Add identity and durable portfolios

Status: not started. Depends on M0 and approved app structure; independent of real history.

- Convex and Better Auth with Google, based on verified current integration guidance.
- Preserve draft through OAuth and prevent duplicate callback saves.
- Server-side ownership; persist names, holdings, pin state.
- Define expiry/logout, deletion/retention, privacy/terms, and recovery.

Exit: cross-user access is prevented and real save/edit/delete/draft handoff work end-to-end.

### M4 - Integrate historical backtesting

Status: not started. Depends on M2 and relevant UI/storage foundation.

- Server-only provider access, shared licensed history cache, end-of-day refresh.
- Replace mocks with the specified engine; expose dates/as-of/methodology/stale/error states.
- Consistent comparison and dashboard assumptions; test outages, short histories, unavailable symbols, and edits.

Exit: fixture/reference cases match and real-data paths contain no unlabeled sample results.

### M5 - Add bounded Groq discovery

Status: provider selected; implementation not started. Depends on catalog feasibility in M2 and approved identity/quota policy.

- Confirm proposed user count, input size, UTC reset, result cap, cooldown, and guest policy.
- Select/evaluate model and verify actual request/token limits and data terms.
- Interpret queries into validated filters, retrieve only catalog assets, and ground match reasons.
- Atomic server-side budgets, bounded prompts/outputs, concurrency, caching, timeouts/retries, abuse controls.
- Ordinary search survives provider failure/exhaustion; no automatic paid fallback.
- Test ambiguity, no matches, fake symbols, off-topic/prompt-injection input, concurrent requests, and reset boundaries.

Exit: supported results, enforced budgets, no unchecked financial claims, and no quota bypass through direct requests.

### M6 - Validate and deploy

Status: not started. Depends on approved preceding deliverables.

- Existing configured checks, desktop/mobile/keyboard/motion review.
- Secrets, privacy, authorization, budgets, data permissions, and disclosures review.
- Intended Vercel/Convex environments; verify production callbacks and data status.
- Initial user feedback and small set of agreed success signals.

Exit: verified deployment, reproducible release checks, known limitations, owner acceptance.

## Coordination rules

- Update status only with evidence; distinguish design acceptance, frontend completion, integrations, and launch readiness.
- Record decisions in their owning document and dependencies here.
- Track scope changes explicitly; do not promote assistant proposals into requirements.
- The owner authorized undoing the misplaced documentation commit and adding the documents to this app. This correction does not authorize unrelated branches, PRs, scaffolding, service provisioning, or deployment.

## Previous documentation-only verification record

- Inspected clean app Git status, manifest/lockfile, tracked files, starter page/layout, and Convex provider.
- Preserved the existing Convex managed guidance block and did not change application code or credentials.
- This is a documentation transfer/reconciliation. Application build, lint, typecheck, runtime behavior, and provider connections have not been validated by this task.
- Direct document checks passed for final newlines, trailing whitespace, local references, corrected app-state descriptions, and preservation of the original Convex guidance. Only the four intended documentation files changed before staging.

## Frontend integration evidence (2026-10-25)

### Completed behavior

- Reused v0 screen compositions and its shadcn/Base UI button foundation, corrected labels and contrast, and replaced placeholder controls and hard-coded charts. Static decorative globe avoids claiming the ZIP's arbitrary dots are geographic market hubs.
- Empty dashboard, explicit sample-example loading, create/open/rename/duplicate/pin/delete with undo. Pinned first; updated descending; stable ID tie-break. No manual ordering.
- Versioned, schema-validated browser persistence for saved experiments and an editable guest draft; loading and unavailable/corrupt-storage states. No account/session impersonation. Sign-in preview preserves draft and disables the disconnected Google button.
- Six-asset sample ticker/full-name catalog. No AI requests. Empty searches are explained; sample categories are illustrative.
- Allocation precision: integer basis points (0.01 percentage point). Remainder assigned to final holdings in insertion order (33.33/33.33/33.34). Manual add/remove preserves other weights; a new manual holding starts at zero. Positive exact-100% validation gates save/run. Editing clears old results.
- All six timeframe controls recalculate from their synthetic start dates. Buy-and-hold weighted indices, common calendar and starting amount, VOO explicitly labeled ETF, up to two saved comparisons, independent VOO toggle, percentage/USD view. Ending value, return, VOO percentage-point difference and peak-to-trough drawdown come from the plotted daily series.
- Sample data is explicitly fictional: positive deterministic indices, fixed as-of date, daily observations including weekends, no dividends/splits/costs/taxes. No real price history or backtest accuracy is claimed. Unknown assets throw instead of disappearing.
- Demo-only bounds: six catalog holdings, 80-character names, 100 local portfolios, positive USD amounts up to 100 million with two decimals. These are implementation safeguards, not approved production product limits.

### Remaining gaps

- M2-M6 remain open: licensed/free history, verified catalog, production calendar/dividend/split method, Google/Better Auth, Convex ownership and persistence, Groq and atomic quotas, policy pages, deployment.
- Screen navigation remains client state on `/`, matching the ZIP. Dedicated URLs/back-button/deep links and genuine OAuth draft handoff are not implemented.
- Chart uses a small Recharts wrapper with the shadcn palette and copied button foundation; it is not the full generated shadcn ChartContainer implementation. Chart value inspection uses click/tap and arrow keys, with a complete accessible data table in the workspace. Formal assistive-technology review remains pending.
- Globe is a static decorative sphere, not a geographic or animated market map. Exact reference-image parity cannot be assessed because original reference attachments are absent.
- Local storage is browser-only, unencrypted demo data; no cross-device sync or multi-tab conflict resolution. Clearing browser data removes saved work. Undo lasts until another deletion/reload.
- Related-asset discovery beyond sample catalog categories and real loading/error/quota workflows require their integrations; disconnected AI is labeled, with ordinary search always available.

### Verification results

- `pnpm.cmd check`: passed (configured lint plus TypeScript). Next 15 warns that `next lint` is deprecated; no ESLint warnings/errors.
- `pnpm.cmd build`: passed production compilation, lint/types, static generation and traces. No environment secrets or Convex deployment required. Initial chart typing error was repaired before the successful build.
- `pnpm.cmd typecheck`: passed.
- `node --test tests/demo.test.mjs`: 5/5 passed using Node 24's native TypeScript stripping; no test framework installed and no invented package test script. Covers exact rounding, invalid/duplicate weights, amount bounds, deterministic common dates, missing-symbol rejection, weighted buy-and-hold, value scaling and known drawdown/return fixture.
- Changed frontend files pass targeted Prettier. Repository-wide `pnpm.cmd format:check` fails on 12 unchanged baseline files: five generated Convex files, `convex/schema.ts`, `convex/tasks.ts`, `eslint.config.js`, `next.config.js`, `postcss.config.js`, `prettier.config.js`, `src/env.js`. Left untouched.
- Production browser review at 1280x800 and 390x844: desktop workspace and mobile dashboard inspected visually; dashboard/workspace have no horizontal overflow at these sizes. Invalid zero allocation disables Save/Run and clears prior chart; equal weighting restores 100%. Sign-in preview disables Google and returns to the intact draft. Save, duplicate, pin ordering, delete/undo, saved comparison, VOO toggle, dollar view and reload restoration exercised successfully.
- Corrupt-storage check preserves the invalid payload and exposes recovery UI. Browser review used only synthetic local demo data. Formal screen-reader, real touch-device, quota/network-failure and real OAuth tests are not claimed.
- Reduced motion handled by static globe, disabled chart animation, and global motion override. Keyboard/focus uses native controls, Base UI buttons, Recharts accessibility layer and an accessible data table; full assistive-technology certification remains open.
- `git diff --check` passes; untracked frontend, tests and review document inspected directly. No changes under `convex/`. All changes remain uncommitted in this worktree; main checkout and unrelated outer repository were not modified.

## Timeframe control refinement (2026-10-26)

- Owner follow-up: left-align the mobile period control and expand its options to the right; retain leftward expansion on desktop.

- Owner requested a single current-period button that expands left on hover and collapses on pointer exit. Replaced the native select in the shared RangePicker, covering dashboard and workspace.
- Right-anchored horizontal expansion preserves page layout. All six periods remain available; selection uses the existing shared-date simulation behavior. Tap toggles, keyboard Enter/Space and arrows, Escape, focus exit and outside pointer dismissal are supported. Collapsed options are inert; transitions honor reduced motion.
- No dependencies, financial calculations, backend files or main-checkout files changed. The remaining dashboard-card hierarchy work is still pending.
- Verification: `pnpm.cmd check`, targeted Prettier and `git diff --check` passed. Browser checks confirmed fixed right-edge positioning with a 220px leftward reveal, selection to 1W, pointer-exit collapse, inert hidden options, Enter/arrow-key selection to Max, and Escape restoring focus to the current-period button. Dev server restarted after T3 restart and is ready on port 3100.

### Dashboard hierarchy refinement (2026-10-26)

- Implemented square, clickable dashboard cards with asset count, period return, signed dollar change from the common $10,000 starting amount, chart and legend. The dashboard has one shared VOO ETF toggle; pin, duplicate and confirmed delete moved into the saved portfolio workspace, with delete undo retained. Rename remains in the workspace. Synthetic-data disclosure stays outside the cards.
- The development server starts on port 3100. `pnpm check` passed; desktop and 390px mobile dashboard layout, shared benchmark toggle, and opening the workspace were inspected in the browser. Full keyboard, deletion/undo, and other workspace-action regression checks remain to be repeated for this refinement. Real market data, authentication and AI remain deferred.

- Dashboard legend refinement: line samples now match the plotted strokes, and the visible benchmark legend reads VOO.

- Dashboard return percentages now use gain/loss colors with a neutral zero, and the introduction is shorter. The common $10,000 chart starting amount remains disclosed below the cards.

- Dashboard cards now give the chart the remaining card height and hide compact axes so the plot aligns with the card content; full workspace charts retain their axes.

- Typography refinement: titles use bold Cabinet Grotesk via Fontshare, while body text and controls retain Manrope; the existing Manrope stack is the fallback if the font host is unavailable.

- Simulation chart tooltip uses hover and shows the main portfolio?s USD value (and return in percentage view) for the selected date; benchmark and comparison lines do not add tooltip values or active dots. Keyboard tooltip was verified; hover and touch behavior still need direct device verification.

- Comparison lines use a repeatable ID-shuffled palette of 20 distinct muted colors, avoiding red and green. The main and benchmark line styles stay fixed when VOO is toggled. The demo still allows at most two comparisons; expanding that limit is not part of this change.

- Workspace total return and main chart lines now use gain/loss colors across dashboard and workspace. Card token matches the supplied #111111 reference. Routine simulation wording was simplified; a concise fictional-demo disclosure remains because the current history is generated rather than real.

- Card surface refined to #181818 for subtle separation from the #080808 app background; the shared card token covers dashboard and workspace surfaces.

- Owner selected #111111 for the shared card surface, replacing the #181818 contrast trial.

### Landing wireframe globe (2026-10-27)

- Inspected the supplied v0 ZIP before changes. Reused its orthographic canvas concept, coastline/grid/dot styling and rotation interactions. Imported only d3-geo and its types; no ZIP app/config/React downgrade or unrelated components.
- Land data is bundled locally with precomputed land dots and a matching static SVG fallback. Back-facing dots are culled. Responsive sizing uses ResizeObserver; DPR is capped; animation pauses offscreen/hidden, provides a pause control and respects reduced motion. Pointer and keyboard rotation plus zoom buttons support interaction without capturing page scrolling.
- Replaced the landing illustration only; login still uses its existing illustration. Portfolio and Convex functionality are unchanged.
- `pnpm check`, `pnpm build`, and `git diff --check` passed. Chrome desktop review confirmed the new geographic wireframe globe renders on the landing page and exposes rotation/zoom controls. Mobile, real touch and reduced-motion device checks remain unverified; those behaviors are implemented. Dev server is available on port 3100.

- Landing refinement: removed globe pause/zoom controls and visible instructions; rotation resumes after interaction and honors reduced motion. Centered the hero below the header.

- Added decorative, slowly fading red and green land-dot accents near five financial hubs; colors are randomized and do not represent market data. Reduced motion uses static accents.

- Expanded globe accents to land dots within three degrees of each hub; each dot belongs to its nearest hub, and each hub shares one color and fade.

- Landing entrance sequences the globe zoom-out after the headline; reduced motion displays both immediately.

- Replaced the login illustration with the shared wireframe globe at its normal size, without the landing entrance animation.

- Workspace hierarchy updated: chart and result first, holdings summary second, expandable editor and settings, compact comparison and actions. Valid portfolios open with a demo result; input edits retain and label the previous result until rerun. Sample data and assumptions remain visible. Browser interaction and responsive visual review remain to be checked.

- Added a shared left-to-right easeOutQuart entrance for historical chart lines, with an immediate reduced-motion state.

- Moved the mobile dashboard timeframe selector onto a dedicated row below the heading, providing space for rightward expansion; desktop placement remains unchanged.

- Dashboard controls now use a pressed-state Show VOO button and share a desktop row with Resume Draft and the timeframe selector, reserving expansion space.

- Dashboard VOO toggle restores button hover feedback and animates the benchmark line out; reduced motion removes it immediately.

- Workspace benchmark and comparison lines animate out before removal, with matching legend fades and reduced-motion support.

- Added App Router pages for landing (/), dashboard (/dashboard), sign-in (/sign-in), and local portfolio workspaces (/portfolio/[id]). Portfolio links resolve browser-local data and missing IDs show a recovery message. Route refresh, history navigation, and storage failure behavior still require browser review.

- Replaced the workspace holdings summary with an allocation-sized individual return map using the same simulated timeframe. Moved editing/settings into a Base UI-backed shadcn-style dialog, with visible action buttons and larger supporting text. Browser focus, touch and visual review remain unverified.

- Added dialog fade/scale transitions using Base UI lifecycle attributes, including a shorter exit and reduced-motion support.

- Moved the workspace timeframe into the performance toolbar beside Run simulation, converted VOO/dollar toggles to buttons, and simplified the chart footer.

- Timeframe selection updates the result snapshot range immediately while preserving its simulated holdings and starting amount, so pending edits remain separate.

- Added the dotted pink pig/gold-coin empty state and approved one-line guidance, including static reduced motion. Portfolio supporting text now uses larger, spaced monospace styling. Simplified performance labels and removed its repeated demo disclosure; the app-level demo indicator remains. Lint and TypeScript passed. Visual review remains pending. Next owner-requested design task: customize the Edit portfolio modal.

- Extended the approved supporting-copy typography to dashboard, landing, sign-in, chart legends, and dialog labels/descriptions. Titles and controls retain their existing fonts.

- Restyled portfolio comparisons as accessible pressed-state buttons with matching line colors and the existing two-comparison limit; existing line/legend transitions are preserved.

- Comparison buttons show chart-matched colored names before and after selection, replacing the leading line swatch.

- Redesigned the edit modal around asset toggle cards and allocation rows with a persistent status footer. Removed Run simulation; valid edits recalculate immediately and invalid edits retain the previous result. Tooltip shows the primary portfolio plus selected comparisons, excluding exiting lines and VOO. Lint/TypeScript passed; browser interactions remain unverified.

- Portfolio timeframe control now aligns left beside the display toggles and expands right; dashboard alignment stays unchanged.

- Dashboard empty state now uses a dotted suitcase with an animated graph card, static under reduced motion, and retains both portfolio and sample actions. `pnpm check` passed; the SVG parsed and its static rendering was inspected locally. In-browser motion and responsive interaction remain to be checked.

- Refined the dashboard empty-state illustration to a forward-facing briefcase: the lid opens, the graph fades/scales in, then the sequence reverses. Reduced motion shows the open case and graph as a static image. `pnpm check` and SVG validation passed; open and closed stills were inspected locally. Browser animation remains unverified.

- Dashboard empty-state refinement (2026-10-28): replaced the opening/closing sequence with a permanently open, front-facing briefcase based on the owner's reference. The dark lid and perspective tray use fine wireframe grids; the centered graph card gently floats and remains visible, with a static reduced-motion fallback. Existing empty-state copy/actions are unchanged. `pnpm.cmd check` passed, SVG XML validation passed, and a local static rendering was visually inspected. Browser motion and responsive visual review remain pending; next step is owner review of this illustration.

## Pre-merge edge-case review (2026-10-28)

- Owner reports completing the end-to-end journey, mobile-layout, and accessibility/motion review (steps 1–3). This is owner-reported verification, not a new automated audit.
- Added the pinned indicator at the right of each dashboard title, vertically centered. Browser geometry confirmed alignment (center difference below 0.01px), truncation of an 80-character title, and no dashboard horizontal overflow.
- Incognito browser checks passed: empty dashboard and empty portfolio guidance, disabled empty Save, no-comparison guidance, invalid 50% allocation blocking Save while retaining the last valid chart, equal-weight recovery, 80-character name persistence, deletion cancellation and confirmed deletion returning to the empty dashboard with cleared draft/storage.
- Found and fixed long unbroken portfolio names overflowing the editor heading: constrained the heading container; the 80-character test no longer overflows the viewport.
- Injected storage failures in the isolated incognito session: quota/write failure shows a warning, prevents navigation, and preserves stored data; blocked reads on the dashboard show recovery guidance; malformed JSON is preserved with Reset local demo offered. User-profile data was not changed.
- Remaining findings for step 5: deletion's component-local Undo state is lost when navigating to the dashboard (confirmation still protects deletion); storage error notices are hidden on the landing page because it returns before the shared notification UI, so a blocked-storage create action there lacks visible feedback. Resolve these before merge review.
- Existing financial fixture suite passed 5/5 via `node --experimental-strip-types --test tests/demo.test.mjs`. Lint/TypeScript passed via `pnpm.cmd check`. No merge, commit, or main-checkout changes. Production build/full-diff reconciliation belong to the upcoming step 5 discussion.

- Deletion navigation refinement: retain the displayed draft until the dashboard route replaces the editor, and suppress the editor's persistence effect during that transition so the deleted draft cannot be written back. The missing-portfolio fallback remains for invalid links. `pnpm.cmd check` passed; browser verification of the transition remains pending. The previously noted Undo and landing storage-notice gaps remain open.

- Dashboard timeframe picker now aligns left and expands right at all widths; existing touch, keyboard and reduced-motion behavior is retained. Visual browser verification is pending.

- Corrected dashboard desktop control order: the left-aligned timeframe picker follows Resume draft and Show VOO; mobile retains its separate first row.

- Owner chose confirmation-only deletion; removed the unused Undo state and button. Landing now displays storage errors and links to dashboard recovery when storage cannot be read. `pnpm.cmd check` passed; browser verification of these refinements remains pending. The previous Undo and hidden-landing-notice findings are resolved in code.

## PR preparation (2026-10-29)

- Remote main was verified at ffcd0cd, matching this worktree's base. `pnpm.cmd check`, the five existing demo fixture tests, and `pnpm.cmd build` passed. The owner reported reviewing the primary journey, mobile layouts, and accessibility/motion; the latest deletion navigation, landing storage notice, and dashboard picker refinements still need browser verification. Real authentication, licensed history, Groq, server ownership, and deployment remain deferred.

## Route ownership refactor (2026-10-29)

- Each App Router entry now renders its own client page: landing, dashboard, sign-in, and dynamic portfolio. Removed `TikrApp` and its `view` switch. Dashboard cards and portfolio editor/comparison components live alongside their routes under private `_components` folders.
- Root layout hosts a shared demo portfolio provider for hydration, browser persistence, drafts, save/delete operations, and notices. Page-specific timeframe, chart toggles, comparison selection and editor state remain local to the appropriate page. Shared shell renders navigation and storage feedback without deciding which page to show.
- Portfolio URL IDs resolve against the hydrated store; absent IDs retain the recovery UI. Delete state updates and dashboard navigation share a React transition. No Convex functions, credentials, main-checkout changes, commits, or pushes are part of this refactor.
- Verification: lint/TypeScript passed without warnings and all five financial fixture tests passed. Production build verification is recorded below. Browser regression of refresh/back/forward, invalid links, draft handoff, storage recovery, and deletion remains pending for the new provider lifecycle.
- Final production build passed after the route refactor. The build emits all four intended routes, with route-specific bundles. No browser interaction results are claimed for this change.


## Bear branding assets (2026-10-29)
Created full-scene PNG, transparent rider PNG, clean SVG head and 16/24/32/48/180/192/512px exports. Connected favicon metadata and dashboard BearCruiser component. Animation is a 12-second horizontal translation with offscreen reset, manual pause, and reduced-motion fallback. Lint and TypeScript passed. Transparency metadata verified; small-icon export inspected. Browser motion, responsive appearance and owner review of the simplified head remain pending. No backend, deployment, commit or main-checkout changes.

- Bear identity update: installed the approved aviator-head preview and refreshed icon exports; shared wordmark appears on landing, sign-in and the app shell. Lint and TypeScript passed; 32px export visually inspected. Browser appearance remains unverified.

- Updated the dashboard rider to a generated crouching bear with aviators. Its six-second loop travels between stage edges and flips at each turnaround; pause and reduced motion are retained. pnpm check passed. Browser motion and narrow-screen appearance remain to be verified.

- Refined the dashboard rider pose to a kneeling crouch and moved both turnarounds offscreen. Pause and reduced motion remain; pnpm check passed. Browser motion review remains pending.

- Generated monochrome-board kneeling and standing rider illustrations; dashboard defaults to kneeling, with a standing component option. Loop crosses in three seconds per direction and waits two seconds offscreen at each end. pnpm check passed; browser motion and responsive review remain pending.

- Matched kneeling bear fur to the standing pose and combined both in the dashboard loop, switching offscreen. Pause and static reduced-motion fallback remain. pnpm check passed; browser motion review remains pending.

- Replaced the dashboard skating animation with the generated static candlestick globe illustration at the owner's request. Lint and TypeScript passed. Responsive visual review remains pending; the candlesticks are decorative, not market data.

- Replaced the static cropped candlestick image in the dashboard with a complete orthographic wireframe globe and independently fixed decorative candlesticks. The globe rotates at the landing globe's rate, pauses offscreen or when hidden, and respects reduced motion; the empty section uses the page background. pnpm check passed. Responsive visual and motion review remains pending.

- Replaced the empty portfolio pig with the shared dashboard wireframe globe and a decorative three-tile overlay; removed unused pig coin styles. pnpm check passed; desktop/mobile and motion visual review remain pending.

## Coordinator reconciliation (2026-10-30)

- Reviewed actual app main at `06b8ef3`, its manifest, route tree, shared localStorage provider, and recent merge history. Updated the current-state summaries in all four coordination documents; older entries above remain historical evidence, not current branch status.
- Owner reports near-complete frontend. No new design approval, browser regression, deployment, or live backend verification is claimed by this review.
- Reran the existing demo fixture suite: 5/5 passed with `node --experimental-strip-types --test tests/demo.test.mjs`.
- `pnpm.cmd check` failed in lint; its chained TypeScript step therefore did not run. A separate `pnpm.cmd typecheck` also failed. Missing modules include lucide-react, Recharts, Base UI, d3-geo, and utility dependencies already listed in the manifest. Direct module-resolution checks confirm the main checkout's install is not synchronized. Do not infer a new frontend regression solely from the resulting unsafe-any/type-resolution errors.
- No dependency install, source fixes, production build, secret access, commit, merge, push, project-setting change, or workspace migration was performed in this coordinator review. Reconcile dependencies from the frozen lockfile and repeat checks before adding backend work.
- Git whitespace checks pass for the documentation edits. Browser lifecycle checks remain pending as described above.

## Private Alpaca adapter milestone (2026-11-02)

Review completion (2026-11-03): after timestamp/server-boundary/resource/cancellation fixes and the contradictory-inception regression, two focused independent Terra/high passes completed full adapter-source and test/tooling/evidence/diff coverage. No actionable findings remained within the offline candidate/caller-attestation contract. All nine frozen file hashes matched at both ends of each pass. Independent verification passed 39 tests, five mutation checks, lint/TypeScript, actual server-only client-import build rejection, cleared-environment private CLI rejection and a credential-free production build. The coordinator also completed a full source read and repeated these checks. Earlier partial-review reports did not grant acceptance. This completion note is a documentation update after review, not a source change.

Accepted scope is offline client/normalization and externally evidence-gated engine conversion only. Calendar/finality/inception/action completeness and normalized units still require real provider evidence; public/shared rights and cache/refresh costs remain separately gated. No authenticated calls, credentials, UI wiring, deployment or cache architecture belong in this PR.

Added a server-only, injected-transport candidate client with bounded paging, retries and timeouts; raw daily bar and corporate-action candidates; and an evidence-gated offline engine conversion. Synthetic fixtures cover traversal, failure handling and the conditional boundary. A private command refuses to run without explicit process configuration; no credentials or authenticated requests were used. The adapter is not integrated with the UI or Convex, and successful traversal does not establish action completeness or production readiness. See `alpaca-evidence.md` for source evidence and unresolved finality, inception, action and licensing gates. Next: independent review of this milestone and establish a separately justified provider-evidence process before any real-data engine conversion.

Verification for this milestone: 21 existing and 9 adapter tests passed; all five mutation checks passed after normalizing CRLF in the mutation harness. `pnpm check` passed. New source/test files passed Prettier; the repository-wide check reports pre-existing formatting differences. Credential-free production build and independent review are recorded in the handoff; provider and licensing verification remain open.

## Alpaca adapter review fixes (2026-11-02)

Independent review requested changes to timestamp validation, the client boundary, response budgets and retry cancellation. The revision validates timestamp components, uses Next's pinned `server-only` marker, caps streamed bytes/chunks and page/aggregate records, and aborts retries promptly. A disposable-project build confirms Next rejects a client import. The tests are synthetic; external proof records remain attestations and provider completeness remains unresolved. Verification: 21 existing and 17 adapter tests passed, five mutations passed, `pnpm check` passed, the isolated negative build failed for the expected server-only reason, and the credential-free production build passed. The private command rejected missing credentials. Next: coordinator-owned independent review of the frozen revision, followed by separately authorized provider evidence work if appropriate.


## Personal data integration checkpoint (2026-11-04)

Local implementation exists in the isolated `feat/alpaca-real-data-validation` worktree, after commit `bf84f26`. This new batch remains uncommitted; no PR, push, merge, provisioning or deployment was performed. The main app checkout remains clean at `a55bbcc` and the engine source is unchanged.

- Implemented expiring, revision-bound, raw-SIP analyst-evidence replay loader; unknown finality/actions/inception/units still fail closed. Its optional live-fetch interface is not enabled by the runtime. Replayed all six existing private captures with global network disabled: integrity passed, 53 bars total, evidence/engine acceptance remains unresolved. No credentials or new authenticated provider requests were used.
- Implemented internal Convex storage, monthly price/action chunks with compact manifests, compressed result slots, dependency/lease comparisons and atomic attempts. Persistent local admission budgets count pre-network reservations, including failed/unknown calls. Write-ahead refresh guards and independent revocation markers stop known corrections from escaping after errors, lock contention, in-flight reads or restart. Active guards provide bounded loading/coalescing; abandoned guards block rather than serving old data.
- Connected existing dashboard/detail UI to the typed local-only stream. Loading, ready, refreshing with dated results, stale, blocked, retry, evidence expiry and shared portfolio/SPY periods are exercised. Metrics, exact tooltips, asset returns and table use engine values; no synthetic series are substituted. Guest portfolio storage and sign-in preview remain honestly labeled. Production market access is disabled.
- Reproducible sizing now uses actual engine-result payloads and Convex serialized document sizes. Six assets / 1,300 sessions / one user / ten opens daily / 31 days / 30% cache misses: representative ~17.5 MB storage and ~322 MB monthly I/O; stress ~12.6 MB and ~358 MB. Local action compute is in Next.js, with zero Convex actions. These are forecasts, not deployed billing measurements. Initial 250 MB monthly I/O proposal was raised to 500 MB, half the free allowance; storage cap stays100 MB and calls250,000. Five- and twenty-user models fail the budget check. Actual team usage, account plan, other deployments and post-activation measurements remain unverified prerequisites.

Verification after final source changes: 117/117 Node tests passed;7/7 official convex-test edge-runtime tests passed;14/14 installed-Edge browser tests passed (independently rerun); five engine mutants killed; `pnpm check`, focused Prettier and `git diff --check` passed. Credential-cleared production build passed with validation skipped and only `.env.example` present by filename. The test server was stopped afterward. Screenshots reviewed at mobile/desktop with overflow checks at390/768/1440px. A temporary Python stdout encoding error hid an earlier suite summary; the complete suite was rerun with safe output and reported117/117, exit0.

Independent review reached bounded acceptance after correction/expiry/admission/coalescing and UI retry/card fixes. Complete source/diff coverage was accumulated across bounded passes, with final reviewed source hashes matching at start/end. The final integration follow-up independently passed17 durable tests and14 browser tests. The three additional SDK transport/sanitization tests were run by the coordinator afterward without changing reviewed production source. No universal numerical-error, provider-completeness or billing certification is claimed.

Next task is activation evidence, not another UI implementation: assess and document eligible-close semantics and exhaustive action/revision reconstruction, produce reviewed private artifacts without inventing verified flags, inspect the actual Convex Free TEAM usage/headroom, then separately authorize deployment/configuration and a bounded real end-to-end trial. Do not deploy, enable public/shared market access, use paid fallback or loosen methodology just to remove a blocked state. See `market-data-integration.md` for configuration and limits.


## UI review follow-up (2026-11-04)

Implemented the owner-requested dashboard chart sizing and axes, concise card status, accessible daily table, comparison placement, and stable chart while changing timeframes or comparisons. Browser review uses synthetic data; live provider verification and production readiness remain separate. Follow with owner review and independent validation before any commit or merge.


Owner follow-up: coordinated dashboard loading, targeted pulses, and portfolio comparison color/exit animation are implemented for synthetic review. Verify behavior and retain the live-data evidence gates before merge.


UI follow-up: final-only snapshot swaps and comparison exit timing implemented. The review proxy explicitly marks synthetic responses for an eight-entry, 30-second in-memory cache; unmarked data is never served from this client cache. Live provider correctness and server-side cache validity remain separate gates.


Owner authorized commit, push and PR preparation on 2026-11-04 after UI review. Next: review the combined PR and CI; merge/main-checkout update requires the owner's next instruction. The synthetic-only browser cache does not bypass live server revocation checks.


PR #6 preview follow-up: reproduced six TS5097 errors from the separate Convex TypeScript project. Enabled explicit TypeScript import extensions in its existing no-emit/bundler configuration and added the Convex project check to pnpm check. The reported temporary-filesystem warning was not the build failure.

## Focused six-asset reliability (2026-11-05)

Independent Sol Low review inspected the three-file diff and passed 70 focused synthetic tests. It found no confirmed calculation defect, but qualified live retry reliability, provider ex-date semantics and incomplete negative-case coverage. Its one concrete finding was accidental encoding changes in three historical passages; those passages were restored byte-for-text from the base revision. The review did not independently verify live results, account telemetry, browser tests or the production build.

Implementation worktree: `C:\Users\JuanE\.t3\worktrees\tikr\t3-1a020605`, clean base `e46f2cf`. Main and the old worktree were not edited. Owner authorized private configuration transfer and bounded personal live diagnostics; the copied ignored file has an explicit current-user Windows ACL. No deployment, provision, commit, push, PR, budget increase or ledger/guard reset was performed.

Live diagnosis started with NVDA. Calendar and raw SIP bars succeeded (1,263 closes over the bounded source window), then provisional conversion failed with `UNSUPPORTED_ACTION`: the adapter rejected any split due-bill date, including NVDA's redemption on its split ex-date. AMZN also reports later due-bill settlement. Ordinary splits now retain the reported ratio at ex-date when redemption is on/after ex-date; invalid/earlier dates and symbol changes fail. Same-day ambiguous split/dividend cases still fail. The engine and its decimal/payment-date rules were not modified. API field definitions: https://docs.alpaca.markets/us/reference/corporateactions-1 . Settlement metadata does not shift the raw ex-date split price/share transformation.

MSFT and AMZN had another observed failure, `MALFORMED` during action decoding: cash-merger records use acquiree/acquirer symbols instead of `symbol`. The adapter validates and excludes an acquirer-only cash-consideration record because it does not transform the held acquirer shares. An included acquiree is normalized using its effective date and remains an explicit unsupported action. Unrelated/unknown/malformed shapes are not accepted. Regression fixtures use synthetic prices and independent arithmetic: one share at 100 becomes ten shares, a payment-close dividend contributes ten dollars, and ending value at 12 is exactly 130. Negative fixtures cover acquiree events, invalid dates, earlier due bills and symbol changes.

Live local API: SPY, NVDA, MSFT, AAPL, AMZN and SCHD each returned ready for 1Y with 252 shared points ending 2026-11-04. SPY self-comparison matched. Equal 20% NVDA/MSFT/AAPL/AMZN/SCHD plus separate SPY returned ready for 1W (6 points), 1M (23), YTD (212), 1Y (252) and 5Y (1,255), with identical portfolio/benchmark boundaries. Reopening the 5Y calculation returned identical output. The live browser displayed that mixed 5Y result, the provisional/correction disclosure and as-of date, and retained the result after reload without horizontal overflow. One early automatic NVDA attempt and one explicit mixed 5Y retry returned REFRESH_FAILED; bounded explicit retry/normal cached reopen subsequently succeeded. No marker was cleared to obtain success. This is not proof of flawless retry behavior, provider finality or exhaustive action history.

Budget evidence: preserved local November ledger began at 409 calls / 82,879,016 reserved bytes and reached 864 calls / 207,104,598 bytes after diagnostics and browser reload. Those counters include provider reservations and Convex traffic, with successful storage reservation refunds; they are not provider-only counts or billing telemetry. Every live provider call used the existing 2 MiB admission reservation, zero automatic retries, eight-page/8 MiB/1,300-bar/1,000-action caps. The configured admission review was accepting the trial. No sustained monthly fit is claimed.

Owner-supplied team screenshot reports 380/1M function calls, 522.71 KB/512 MB database storage, 5.23 MB/1 GB database I/O, 0/20 GB-hours action compute and 5/40 deployments; other shown storage/egress/search totals are zero. The screenshot has no plan name or billing-period header. The owner reports these as current November team figures and says Tikr is the only project. They are owner-supplied evidence, not independently authenticated telemetry or named-plan confirmation. The browser dashboard redirected to sign-in, so independent team usage remains unverified.

Owner subsequently authorized extending the development review through November without increasing caps. After reading the deployment guard, private configuration independently matched `dev:stoic-corgi-586` and its HTTPS storage endpoint; the dev target was announced before mutation. `market:configure` succeeded with `otherStorage=1000000`, `otherIo=6000000`, `otherCalls=400`, and `reviewedThrough=1796083199999` (`2026-11-30T23:59:59.999Z`). These rounded reservations conservatively count all supplied team usage as other usage, including Tikr. Together with the existing app caps, 101 MB storage, 506 MB I/O and 250,400 calls remain below the existing 75% admission thresholds. The existing configure handler patches review fields while preserving existing counters; no reset or cap increase occurred. The single configuration mutation retained a 32,768-byte local reservation, leaving the observed ledger at 865 calls / 207,137,366 bytes. No additional Alpaca requests were made after final live verification. Usage must be reassessed before December or material workload changes; named-plan/billing-period confirmation and sustained monthly capacity remain limits.

Final verification:
- `node --conditions=react-server --experimental-strip-types --test tests/*.test.mjs`: 133/133 passed, including the final negative fixture. Output retained under system temp as `tikr-six-asset-node.txt`.
- `pnpm exec vitest run`: 7/7 local Convex transaction tests passed.
- `pnpm check`: lint, application TypeScript and Convex TypeScript passed. `node tests/backtest-mutations.mjs`: all five targeted mutants killed.
- `pnpm exec playwright test`: 28/28 installed-Edge tests passed against the credential-cleared loopback server, covering visible errors, expiry, retry, comparison periods, loading, mobile widths and provisional disclosure. Artifacts are under system temp `tikr-six-asset-browser`. This is synthetic UI evidence, separate from the live browser result/reload described above.
- Focused Prettier on the adapter and personal-loader tests passed; `git diff --check` passed.
- Sequential credential-cleared `SKIP_ENV_VALIDATION=1 pnpm build`: passed compilation, lint/type validity, static generation and build traces. The interrupted build's exit status was not available, so a fresh nonconcurrent build supplied the final evidence. The dev server was stopped before building. Private configuration was excluded from Next's recognized filenames throughout synthetic browser/build checks, then restored to ignored `.env.local` with its private ACL retained.

Only `src/lib/alpaca/adapter.ts`, `tests/personal-loader.test.mjs` and this plan changed. No new agents/worktrees, commits, pushes, PRs, deployments, service provisioning, paid fallback, or deletion/reset of ledgers/locks/guards/revocations occurred. Remaining limits: transient REFRESH_FAILED behavior was observed and not independently root-caused; subsequent retries and cached opens succeeded. Provider finality/action completeness, older corrections and sustained monthly fit are not established. Next: review this focused diff and independently investigate transient retry behavior if it recurs; reassess actual team usage before the review expires.


## Hosted 503 diagnostics (2026-11-06)

Implementation worktree: `C:\Users\JuanE\.t3\worktrees\tikr\t3-ae95b9ed`, fast-forwarded from `2269d0d` to origin/main PR9 merge `82a67178f2b5f0b6e687caeb0a65639adc59218b` before edits. Main and its unrelated dirty `.env.example` were not touched. Added server-only exact-allowlist diagnostics for origin/admission/config/calendar/runtime/stream failures, including settled blocked results and release failures. Raw exceptions and request/provider data are never serialized. Client responses remain generic and guards/quotas remain enforced.

Evidence: canonical-only credential lookup rejected legacy APCA configuration before calendar/provider fetch. Canonical-first per-field fallback now supports the legacy names; empty canonical values still fail closed. Missing trusted visitor header and malformed gateway config independently reproduce zero-fetch failures. No demonstrated header defect justified replacing the trusted Vercel header or relaxing checks. Current production root cause after the reported credential correction remains unknown. Updated feature `.env.example` to blank/commented server-only configuration and documented fallback/diagnostic/deploy interpretation.

Verification: frozen-lockfile dependency install; six focused synthetic Vitest tests across hosted diagnostics, route and full runtime passed; `pnpm check` passed lint and both TypeScript projects after narrowing the helper environment type. Tests use injected transport and synthetic credentials, including complete hosted calendar/cache/results, missing credentials/no fetch, missing visitor/no fetch, malformed config/no fetch and log sanitization. No live provider requests, secrets access, deployment, commit, push, PR, extra agents or worktrees. No production build or deployed header/config/entitlement verification claimed. Next: review this patch, deploy Vercel only with authorization, inspect fixed stage/code logs and verify canonical environment scopes, matching gateway activation and existing admission review without resetting counters/guards. Public rights and live activation remain separately gated.
