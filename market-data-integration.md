# Personal market-data integration

## Scope and activation gates

The implementation connects an evidence-gated loader, a durable Convex store and the existing portfolio UI. It is local personal-use code, not accepted live-provider integration or a public deployment. Production market requests are deliberately disabled. Better Auth, cloud portfolio ownership and public/shared Alpaca rights remain separate work. Guest portfolio definitions remain browser-local; credentials and private evidence never go into browser storage or public variables.

Existing private captures replay offline with integrity preserved. All six still withhold engine acceptance: independent close semantics, finality/reconciliation and exhaustive corporate actions need assessed evidence. No new authenticated calls or credentials were used for this integration. Never create a verified review merely to bypass these gates.

## Evidence loader

`src/lib/alpaca/verified-loader.ts` accepts a trusted reviewed artifact, binding the exact candidate revision, one symbol, raw SIP daily-close definition, period, calendar and expiring analyst review. Reconciliation must explicitly cover late corrections, cancellations and unsupported events. These are analyst attestations, not authenticated provider guarantees. The 09:00 New York cutoff is operational eligibility only. An explicit newest pending session may retain the immediately preceding verified common endpoint; an interior gap cannot.

The loader defaults to replaying reviewed candidates. Its optional injected live configuration re-fetches the same bounded scope and rejects a changed revision. The Next runtime uses replay only; it does not silently load Alpaca credentials or automate new review approvals. A changed reviewed artifact forces revalidation. Expired reviews cannot produce ready or stale results, including after restart; the browser removes a displayed result at its evidence expiry.

A private bundle has `version: 1`, `historyStart`, `calendar`, and `reviews` keyed by symbol using the exported `ReviewedAsset` type. Each candidate is normalized adapter output. The file is pinned by its SHA256, limited to 8 MB and read only on the server. Do not commit it or put it in synced storage. The existing private capture snapshots are NOT automatically valid bundles.

## Durable storage and refreshes

`convex/market.ts` exposes internal functions only. Source data is shared per symbol, with monthly price/action chunks, compact key-only manifests and bounded metadata and revisioned manifests. Only changed chunks are rewritten. Sixteen compressed calculation slots have content hashes and asset dependencies. A slot collision evicts cache reuse rather than returning another request's result; user portfolio definitions are never evicted by this cache.

Atomic leases last 60 seconds. One automatic refresh per New York 09:00 cycle is allowed; an explicit second attempt requires a 60-second cooldown. Late writers fail the lease-token comparison. Concurrent views can reuse a newly committed asset without duplicating the provider load. Calendar corrections, policy/evidence revisions and effective periods participate in result validity. An unchanged dated result may survive a failed refresh; known corrections revoke it.

A refresh writes and syncs a symbol-specific guard before the loader can observe data. Opens arriving during an active guard receive a loading state and wait up to 12 seconds on local guard checks before reusing committed shared data; uncertain or abandoned guards settle blocked rather than exposing old results. A known corrected evidence revision is then revoked with an independent durable marker BEFORE attempting a Convex tombstone. This makes revocation independent of database availability. The current request blocks and subsequent clients cannot call Convex for that revision. Revocations survive month changes and process restarts. A newly assessed artifact hash is required to resume. If writing the revocation marker fails, the pre-existing guard remains and blocks subsequent readers, including after restart. Uncertain returned data/persistence also retains the guard; a failure before receiving data may release it. Do not automatically steal/delete an abandoned admission lock, refresh guard or revocation marker.

The backend server uses the installed SDK's runtime `setAdminAuth` method to invoke internal mutations. This is an explicitly version-bound internal SDK interface; it needs compatibility verification on Convex upgrades. The admin key is powerful and belongs only in the trusted local server environment; it is never a function argument, response or browser variable.

## Free-tier budget

Official sources checked November 4, 2026: https://docs.convex.dev/production/state/limits and https://www.convex.dev/pricing/faq . Free limits are 0.5 GB database storage including indexes, 1 GB monthly database I/O, 1 million monthly function calls and 20 GB-hours monthly action compute. Allowances are per team, shared with other projects. Free has resource caps; Starter can incur metered charges. Do not switch to paid access automatically.

Tikr's proposed admission budgets are 100 MB storage, 500 MB monthly I/O, 250,000 monthly calls and 5 GB-hours action compute. Source entries reserve additional index/document overhead, with 6 MB held back for control/lease overhead. Documents are capped at 60 KB; the supported history is capped at 1,300 sessions and the initial catalog remains the existing six assets. There are no Convex actions in this pipeline, so its Convex action compute is zero. Engine calculations execute in Next.js; their Vercel compute/bandwidth costs are separate and are NOT certified here.

`node --conditions=react-server --experimental-strip-types scripts/measure-market-budget.mjs` reproduces actual Convex-value serialized sizing and a conservative workload model. Its stress sample uses six assets, 1,300 sessions, unusually long price decimals and bounded distributions, plus four chart lines. Current modeled personal use (one user, ten opens/day, 31 days) is approximately 13–18 MB storage including overhead and 322–358 MB monthly database I/O, including 30% calculation-cache misses and manifest reads. The initial 250 MB I/O proposal was increased to 500 MB after measuring real engine-result payloads and accounting for cold/recalculated results. This reserves at most half of the free I/O allowance for Tikr, with team headroom separately required. The modeled personal workload fits this budget, but is a forecast, not deployed billing evidence. Five or twenty users exceed that traffic budget in the same model. The 50-asset hard resource ceiling is not a promise that fifty assets refreshed daily fit this workload budget.

Internal counters are admission estimates, not team telemetry or a guarantee that denied/failed functions consume nothing. The server also reserves every SDK call BEFORE network access in `%LOCALAPPDATA%/Tikr/market-admission/ledger.json`, serializing callers with an exclusive file lock. Failure/unknown outcomes retain the full conservative reservation. Successful bounded responses refund unused estimated I/O; calls are never refunded. Repeated denied requests do not reach Convex. The ledger survives restart; do not delete/reset it to bypass a budget. This is a single-owner-machine guard, not a multihost distributed edge quota. Production is disabled.

Before enabling storage, the operator must inspect the Convex TEAM dashboard, account for other projects/deployments, and call the internal `market:configure` with reviewed other usage and an expiry. Its static allowance is not live telemetry. Configure actual account alerts and verify measured usage after a bounded trial before claiming free-tier acceptance. No deployment, provisioning, account inspection or paid-plan change was performed here.

## Local configuration after evidence review

Required private process configuration: `TIKR_PERSONAL_DATA_ENABLED=explicit`, `TIKR_MARKET_EVIDENCE_FILE` (absolute private bundle path), `TIKR_MARKET_EVIDENCE_SHA256`, `TIKR_CONVEX_URL` (HTTPS convex.cloud URL), and `TIKR_CONVEX_ADMIN_KEY`. No values are loaded automatically from the main checkout. Deploy the schema/functions and review team headroom as a separately authorized activation step; this source change does not deploy them.

The API accepts only bounded same-origin loopback POSTs and blocks production. No user identities are accepted to claim account ownership. Results stream an initial state and a settled state. UI states distinguish cold loading, ready, refreshing, dated stale and blocked. Rapid edits abort superseded requests; comparisons use one request with the active amount and period. Metrics/tooltips are formatted from decimal results, with Number conversion used for chart geometry. The asset-return view uses the same engine and actual shared dates. Authentication remains clearly a preview.

## Verification commands

- `node --conditions=react-server --experimental-strip-types --test tests/demo.test.mjs tests/backtest.test.mjs tests/alpaca.test.mjs tests/alpaca-validation-oracle.test.mjs tests/alpaca-validation.test.mjs tests/market-cache.test.mjs tests/durable-market.test.mjs tests/verified-loader.test.mjs tests/market-admission.test.mjs tests/market-storage.test.mjs`
- `pnpm exec vitest run` (official convex-test local edge runtime; no deployment).
- `pnpm check`, `node tests/backtest-mutations.mjs`, focused Prettier and `git diff --check`.
- Start a credential-cleared Next dev server on loopback port 43127; `pnpm exec playwright test` uses installed Edge. Its synthetic API fixtures are testing inputs, never a claim about Alpaca. Put browser output under system temp using `TIKR_BROWSER_OUTPUT`.
- Build under an allowlisted environment with `SKIP_ENV_VALIDATION=1`; only `.env.example` should be present by filename. Do not read secrets to run checks.

Independent review and final measured results belong in `plan.md`. Live-provider evidence, actual team allowance, deployed behavior, public rights, authentication and billing headroom remain activation gates, even if all offline checks pass.


## Final local verification

117 Node tests,7 local Convex tests and14 browser tests passed; five mutation probes, lint/typecheck, focused formatting/whitespace and a credential-cleared production build passed. Independent review granted bounded acceptance of the backend and synthetic UI integration; final production-source hashes matched across its last review. The coordinator additionally verified the SDK fixed endpoint/auth header, failed-call reservation/sanitization and streamed response cap offline with synthetic canaries. All six existing real-data captures replayed offline but remained unresolved for engine acceptance. Main checkout is unchanged. New integration work is uncommitted in the feature worktree; no PR, push, merge, provisioning or deployment was made.


## PR preparation (2026-11-04)

Final UI revision passed 24 browser tests, including final-only stream updates, comparison exits, scoped synthetic cache reuse and mandatory server revalidation for unmarked results. Pre-commit verification reran 117 Node tests, 7 local Convex tests, lint/typecheck and the five engine mutation checks. Production build evidence predates the final UI refinements; no new production build is claimed. The temporary synthetic review proxy is outside the repository and is not shipped by this PR. Provider evidence, live storage activation, authentication and public data rights remain gated.
