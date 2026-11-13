# Market source and deployed-resource inventory

2026-11-12, dedicated feature worktree. Decisions concern local source only;
retaining/removing a source consumer does not delete deployed records.

## Durable tables, indexes and record families

| Resource | Actual consumers | Decision |
| --- | --- | --- |
| `marketEntries.by_key` | market read/write; catalog; authoritative asset roots; recovery readback | Retain table/index |
| `asset:<ticker>` | coordinator, cache root checks, atomic lease completion, recovery receipts | Retain metadata/month list/root; new `content:true` heads refer to disposable payloads |
| `price:<ticker>:<YYYY-MM>` | Legacy manifests only | New writes removed; keep old records until approved reachability cleanup |
| `limitation:<ticker>:<range>` | coordinator avoids repeated known missing/unsupported requests | Retain bound cycle/from/through/source revision evidence |
| `result:slotN` and `:partN` | Previously durable calculated views; now process storage wrapper | No new durable consumer/writer; retain deployed rows pending approved cleanup |
| `calendar:shared` and its parts | Previously hosted runtime calendar | Durable source path removed; retain deployed rows pending approved cleanup |
| `catalog:0` … `catalog:31` | search, history eligibility, hosted begin guard | Retain validated catalog; eligibility is not historical action evidence |
| `marketLeases.by_key` / `asset:<ticker>` | acquire/write/release; expansion, attempts, cooldown, fencing | Retain every row/counter, including expired/abandoned leases |
| `marketLeases` / `catalog:refresh` | catalog atomic refresh deduplication | Retain |
| `marketLeases` / `calendar:shared`, `job:result:slotN` | No new runtime use | Preserve deployed attempt/fencing evidence; migration decision only |
| `marketBudget.by_key` / `global` | all shared database admission, provider reservation/settlement, reviewed team allowance | Retain counters/ceiling/review expiry, including historical conservative charges |
| `marketHosted.by_key` / `global` | shared active slots, guards, revocations, legacy visitor data, newly scoped provider reservations | Retain entire state; bounded new reservation settlement never resets old counters |
| `tasks.by_isCompleted` | No product consumer | Source query/create/update/quote functions removed; table/index retained pending explicit migration |
| installed `rateLimiter` component | Only legacy `expireVisitors` callbacks | Retain component/package/callback until approved scheduled-job inspection proves drainage; do not reset component state |

## Functions, gateway, queues and jobs

`market.configure` remains operator-only team-budget review; runtime cannot invoke
it through the HTTP gateway. `market.read`, `acquire`, `write`, `release` remain
internal mutations. Their estimated control output is now `admissionUnits`; the
server decodes legacy `chargedIo` during phased rollout. `budget` is a helper,
not an exposed endpoint. No schema/index change was introduced.

`/market-gateway` permits only read/acquire/write/release/control under a server
secret. `hosted.control` retains enter/leave/provider/check/begin/finish/revoke and
adds providerFinish for exact-token, newly recorded reservation settlements.
`hosted.expireVisitors` and its rate-limiter consumer remain exclusively for legacy
scheduled callbacks. No refresh cron or new scheduled job is added.

`/api/market` validates bounded portfolio/history input and streams one result.
`/api/market/batch` validates all inputs first, allows at most three independent
requests and streams each completion. `/api/assets` retains catalog mode/search.
The client queue batches brief concurrent requests; aborted queued work is
removed. Provider batches deduplicate date/feed/symbol work, with two process
slots. Durable asset leases remain the cross-instance authority. The local
`market-write-queue` serializes admission reservations; it is not a global lock.

## Module consumers and cleanup

| Source | Consumer / decision |
| --- | --- |
| `market-runtime`, `market-contract`, `market-errors`, `market-diagnostics` | API and UI contract, validation, professional errors, sanitized server causes; retain |
| `market-history-wire`, `browser-history` | bounded IndexedDB hints; retain |
| `market-history-storage` | runtime root-validated disposable monthly storage; retain |
| `market-result-memory` | runtime derived result slots without Convex writes/leases; retain |
| `market-client-batch` | workspace/dashboard result hook; retain |
| `durable-market`, `market-cache` | shared refresh/revision/recovery compatibility and deterministic calculation orchestration; retain |
| `market-storage`, `market-reservation`, `market-write-queue` | server SDK/gateway, conservative preflight and serialized local reservations; retain |
| `market-admission`, `market-dev-allowance`, `market-budget`, `market-policy` | legacy ledger/flags, scoped new observations, unchanged approved allowance and policy; retain |
| `market-asset-memory` | legacy durable storage adapter and its regression tests; runtime disposable wrapper intentionally disables this second cache; retain compatibility consumer |
| `market-hosted`, `catalog-server`, `asset-catalog`, `catalog-mode` | origin checks, shared admission and catalog; retain |
| `alpaca/adapter`, `personal-loader`, `batched-loader` | bounded server provider traversal, PR16 merger decoding, normalization and range reuse; retain |
| `alpaca/verified-loader`, private evidence/oracle tools | approved reviewed replay and independent methodology acceptance; retain real consumers |
| browser `ConvexClientProvider` | No query/subscription consumers; removed provider/module/public URL consumer |
| `convex/tasks` template task/quote functions | No consumers; removed function implementations; empty compatibility module preserves generated binding imports without editing generated files |
| `capacityModel` and old measurement equations | Removed obsolete extrapolation; old CLI command forwards to the deterministic before/after matrix |
| `tests/support/observe-database` | synthetic Convex tests instrument actual local database API operations/value bytes independently of controls; no production billing claims |

Generated files are not application source and were not edited. Old deployed
functions/tables, evidence and secrets are not removed by these local changes.

## Environment names (no values inspected)

Retain server Alpaca credential pairs `ALPACA_API_KEY_ID` /
`ALPACA_API_SECRET_KEY`, with existing `APCA_API_KEY` / `APCA_API_SECRET` aliases.
`TIKR_PERSONAL_DATA_ENABLED`, `TIKR_HOSTED_DATA_ENABLED`, `TIKR_MARKET_MODE` and
`TIKR_MARKET_HOSTED_ORIGIN` remain activation/origin gates. `TIKR_CONVEX_URL`,
`TIKR_CONVEX_ADMIN_KEY`, `TIKR_CONVEX_SITE_URL`, `TIKR_MARKET_GATEWAY_KEY` remain
server connection secrets/configuration. Reviewed replay uses
`TIKR_MARKET_EVIDENCE_FILE` / `TIKR_MARKET_EVIDENCE_SHA256`.

`LOCALAPPDATA` locates the existing local admission directory; no alternate path
or namespace is introduced for application runtime. `TIKR_DEV_IO_ALLOWANCE_MONTH`
and `TIKR_DEV_IO_ALLOWANCE_BYTES` retain the bounded November development approval.
`TIKR_BROWSE_CONCURRENCY` retains shared in-flight protection. Historical
`TIKR_BROWSE_GLOBAL_PER_MINUTE` is no longer a runtime request quota; legacy expiry
compatibility remains. `NEXT_PUBLIC_CONVEX_URL` no longer has a browser consumer;
no deployed env variable/secret is deleted in this task.

QA/build helpers use only their explicit credential-cleared environment allowlist;
`TIKR_QA_PORT`, `TIKR_BROWSER_BASE_URL`, `TIKR_BROWSER_OUTPUT` control synthetic
local verification and temp artifacts. `NODE_ENV` / `SKIP_ENV_VALIDATION` retain
framework validation roles. There are no new credential or paid-service settings.

## Dependencies and local durable artifacts

Retain `convex` (server SDK/functions), `decimal.js` (unchanged 40-digit engine),
`zod` (bounded contracts), `server-only` (credential boundary) and the rate-limiter
package solely for the legacy component callback consumer above. React/Next,
charts, Base UI, icons and styling remain actual frontend consumers. Vitest,
convex-test/edge runtime and Playwright remain synthetic verification tools. No
new dependency or service was installed beyond the tracked frozen lockfile.

The existing local ledger, ledger lock, revoked flags, refresh flags, active
observations and exact-revision `.resolved.json` receipts remain at their original
location and scope. They are neither caches nor disposable worktree files.
Vercel files/process state are not durable/shared; hosted coordination remains in
Convex. Any move to a different runtime must reconcile these existing local
records before enabling provider access, rather than choosing a fresh directory.

The generic Convex template README is replaced by the actual coordination/resource
boundary and links to this inventory/runbook. Final browser evidence lives in
`market-browser-acceptance.md`; it introduces no deployed resource.
