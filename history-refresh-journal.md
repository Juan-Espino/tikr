# Development history-refresh task journal - 2026-11-12

Scope: owner-authorized implementation in `t3-dev-history-refresh-recovery`, base `a4038e7`; no commit/push/PR/production mutation. Synthetic isolated tests first. Canonical development target must be independently checked as `dev:stoic-corgi-586` before rollout.

## Allocation before live work

Hard task maxima: 100 initiated Alpaca HTTP requests, 67,108,864 received provider-body bytes, 1,000 Convex HTTP calls. These are task totals, including failed calls and preflight API calls, not per-run allowances. Lower remaining team/provider limits take precedence. Stop before initiating work whose conservative reservation could exceed a bound. No historical ledger/counter refund/reset. No default or production ceiling changes.

Initial allocation checkpoint (before spending): Alpaca HTTP 0; received provider bytes 0; Convex HTTP 0; deployed DB operations unmeasured; task admission-unit delta 0. Synthetic tests do not count as live requests. At that initial checkpoint provider/team headroom was unverified and live spending was blocked pending preflight. Owner permits a dated dev-only estimate extension of at most existing cumulative usage +50,000,000 admission units only with measured headroom; none applied.

## Initial source evidence

Current merged PR18 already has lease-bound observations, expiry discovery, dual-token fencing, atomic head publication/guard settlement, and operator-only exact-CAS legacy conversion. `market-policy.md` is absent; policy source is `src/lib/market-policy.ts`. Narrow reviewed v3/v4 lineage exceptions remain unchanged.

Initial candidate, subsequently reproduced and fixed: `market:acquire` increments attempts before `hosted:control begin` rejects an existing guard; `durable-market.ts` calls begin outside its cleanup try/finally. The original regression returned `acquired` instead of `guarded`; the corrected transaction rejects before counters change. Original production cause remains unknown: supplied logs contain no body/ticker mapping or original failure breadcrumbs.


## Confirmed defects and bounded corrections (November 12?13)

1. Acquisition spent an asset attempt before a retained guard rejected `begin`.
   Guard/revocation checks now precede the claim atomically. New hosted claims
   stage their next counters; only validated `begin` commits them. Catalog and
   guard rejection leave prior counters intact. Old callers remain compatible.
2. `beginRefresh` was outside cleanup, and failed settlement could skip release.
   Both now run under nested cleanup. Stale tokens cannot release/settle a new owner.
3. The final readability assertion replaced a genuine provider failure with a
   guard error, then polled a known abandoned guard. Blocked results now retain
   their original cause; only active observations wait. Guard/cooldown preflight
   runs before calendar or asset provider transport.
4. Fresh modern heads assumed disposable monthly content existed. Lost content
   produced generic `REFRESH_FAILED`; Retry could unnecessarily acquire healthy
   SPY and hit its exhausted allowance. Missing content is now identified, Retry
   validates reusable assets before selecting refresh work, and retained legacy
   chunks may rehydrate content only after the complete CURRENT root matches.
   Valid self-hashes alone never authorize a financial result.
5. A narrow Retry after lost content forgot the wider authoritative boundary.
   The failing oracle fetched November 1 instead of October 28. Revalidation now
   preserves the known wider boundary (clamped to the supported source window),
   while the investment keeps its independently selected requested period.

No engine/oracle, decimal arithmetic, payment-date reinvestment, SPY methodology,
common dates, required holdings or narrow v3/v4 lineage exception changed.

Trace UUIDs originate server-side and reach browser errors, loader/provider and
Convex gateway diagnostics. Allowlisted logs distinguish lease/control/provider
operations and contain no credentials, IPs, portfolio names, raw exceptions or
financial response bodies. Hosted state retains one original failure per guarded
source/ticker, under the existing bounded document/guard limits. Cooldown refers
to that failure. Exact successful atomic publication/readback settles the matching
guard and current failure summary. The task journal retains before/after evidence.
Validated progress extends publication time only within two minutes of the
original attempt; expired/stale owners cannot renew, publish or settle another.

## Development preflight and rollout

Canonical ignored configuration was read from main and only required DEV bindings
copied to this ignored worktree `.env.local`, with current-user ACL. Values were
never printed. Target and URL independently matched `dev:stoic-corgi-586`; no
ambient deployment key or self-hosted override was present. Main stayed clean at
`a4038e7`. The Convex CLI reused that existing development deployment.

Owner-supplied current All Projects usage: 8.9K/1M calls, 133.8 MB/1 GB database
I/O, 6.03 MB/512 MB database storage, 0.002/20 GB-hours action compute, 10/40
deployments. The pasted Pro label is recorded as owner-supplied, not independent
plan verification. The dashboard required sign-in. DEV review fields were updated
conservatively to 9,000 calls /134,000,000 I/O /6,100,000 storage as OTHER usage,
through November 30. Backend counters remained exactly 287,216,104 admission units
and 8,371 calls across that review update. No cap changed. Local admission ledger
was read at 767,106,190 units /4,891 calls and was not used or changed by hosted
acceptance. No local or backend allowance extension was needed.

Compatible backend source was rolled out to DEV. Its missing gateway key and
activation flag were configured only on DEV from the authorized canonical DEV
configuration. The authenticated endpoint is for this bounded server verification;
no public site was deployed, no synthetic fixture was deployed, and no production
mutation flag, production secret, legacy conversion or record deletion was used.

## Live acceptance and actual failure breadcrumbs

The persistent cumulative transport journal is
`%LOCALAPPDATA%/Tikr/task-journals/history-refresh-2026-11-12.json`.
`scripts/history-refresh-live.mjs` enforces fixed DEV endpoints, cumulative hard
bounds, received-body limits, serialized process ownership and conservative
in-flight body reservations. It paces provider initiations and keeps numeric
allowance headers only. The initial 20-request phase was raised to40 within the
owner's100 maximum after it was reached. Its queued phase check was corrected to
recheck after pacing: concurrent work had reached21 against that initial phase,
but never exceeded the100 task maximum. No cumulative counter was reset.

One harness preflight initially omitted the existing fixed paper-calendar host;
it refused transport before any provider HTTP call, while retaining the ordinary
provider reservation. This was a harness error, not Alpaca or application evidence.
Later phase-cap refusals interrupted three admitted DEV observations. They were
not Alpaca HTTP errors: every observed actual provider HTTP response was200.

Real traces and readback:

- `a3ff80a9-a481-4d37-a46d-56fe0544c6cd`: tech cold process returned generic
  `REFRESH_FAILED` with HTTP200 provider responses. Sanitized DEV inspection found
  fresh modern MSFT content without browser/process payload. The isolated
  cache-loss regression reproduced the defect independently.
- `d5d57e1a-13b0-43d0-82da-194e2e8b4dea`: harness phase refusal interrupted
  AAPL/NVDA/MSFT. The original per-ticker `source/UPSTREAM` timestamps were
  1794584132768 /1794584132941 /1794584134072. Exact guard ownership and first
  failures persisted. This maps to a known harness refusal, not a claimed
  historical production cause or observed Alpaca outage.
- `a010179b-ebba-43b7-a428-613309ac85d5`: restarted explicit Retry validated
  real source data and atomically settled those DEV observations. Portfolio and
  SPY returned ready with six common sessions, November5?12. Readback showed no
  remaining guards/failures, new completed heads, and AAPL/MSFT/NVDA attempts2
  retained in the current cycle. No manual record changes manufactured recovery.

Real ready operations:

| Case | Provider HTTP / received bodies | Convex HTTP / received bodies | Outcome |
| --- | --- | --- | --- |
| War cold process, retained legacy source |1 /163,702 B |15 /300,960 B |ready, six common sessions November4?11 |
| War warm reopen |0 /0 B |4 /9,015 B |same dates and holdings |
| Tech interrupted-refresh recovery |11 /751,119 B |82 /831,001 B |ready, six common sessions November5?12 |
| Tech warm reopen |0 /0 B |4 /10,742 B |same dates and holdings |

Cold PROCESS does not mean an empty database: existing owner heads and legacy
chunks were retained. Real provider bodies and transport counts are measured;
HTTP counters include failed initiations and separately noted deployment/preflight
traffic. Returned body bytes are application-received, excluding headers/wire
compression. Actual live database API/document operations are not exposed by these
transports and remain unmeasured; synthetic convex-test DB instrumentation is
separate evidence, never substituted for billing or actual live DB operations.

Observed response quota limit headers were200 for data endpoints and1000 for
paper-calendar responses, with199/999 remaining in representative headers. Their
window/reset headers were recorded; a subscription allowance was not inferred. These
are point-in-time endpoint headers, not independent subscription-plan or monthly
allowance verification. No paid plan, fallback or entitlement change occurred.

## Remaining limits and approval boundaries

The original production incident cannot be reconstructed from logs that lack the
original bodies, ticker mapping and initiating failure. Reproduced source defects
and the DEV interrupted refresh above are distinct from that unknown cause.
No production certification or rollout/migration approval is implied.

If browser, process AND matching legacy content are all lost after the two allowed
source attempts, the existing daily source allowance still blocks another fetch.
The source now identifies cache loss and its real retry time; it never fabricates
content, resets attempts or bypasses a guard to hide this architectural limit.
Public data rights, exhaustive action/finality evidence and global cache durability
remain separate limits. Production legacy token conversion still requires the
exact approved CAS/drain/backup procedure. No such conversion ran on DEV or PROD.

Final verification counts, browser acceptance, final cost and review-server
command follow below.


## Deterministic acceptance matrix

| Failure/state class | Executable evidence | Boundary proved |
| --- | --- | --- |
|401/403/429/503, timeout, partial bars, repeated pagination, unsupported actions | `tests/hosted-refresh-faults.test.ts` |actual hosted runtime + synthetic HTTP + real local Convex transactions; original cause through cooldown; restarted recovery |
|Persistent provider failure |same503 fixture |two admitted attempts, original summary retained, zero provider work during daily cooldown, next-cycle recovery |
|Retained active/expired/legacy observations |`tests/hosted-recovery.test.ts`, `tests/hosted-runtime.test.ts`, `tests/hosted-lineage.test.ts` |no stealing, exact approved legacy conversion only in isolation, unknown/current revocations remain blocking |
|Claim rejected before begin |`tests/hosted-recovery.test.ts` |old counters and reviewed-policy eligibility retained; no provider work |
|Crash before/during/after publication; stale owners; concurrent reclaim |`tests/hosted-recovery.test.ts`, `convex/market.test.ts`, `tests/durable-market.test.mjs` |atomic rollback/readback/settlement, one winner, old-worker write/finish rejection, cleanup after source/write/receipt failures |
|Bounded validated progress |`tests/hosted-recovery.test.ts` |lease and observation expiry advance together, hard two-minute bound, no attempt increment, expired/stale renewal refused |
|Missing/corrupt disposable history; retained legacy corruption |`tests/durable-market.test.mjs`, `tests/market-redesign.test.mjs` |no trust from a monthly self-hash; whole-root match required; cache-loss cause retained |
|Wider coverage, ranges, changed amounts/weights, overlap, restart |same Node suites plus`tests/hosted-runtime.test.ts` and`tests/hosted-batch.test.ts` |required coverage preserved, shared dates/holdings, deduplicated/batched work, server validation after browser/process loss |
|Corrections and invalid action inputs |adapter/personal-loader/evidence/durable Node suites |known correction revocation cannot be bypassed; unsupported/gaps fail without shortening or omission |
|Failure sanitization and UUID trace isolation |`tests/hosted-diagnostics.test.ts`, `tests/hosted-route.test.ts`, browser regression |allowlisted fields only, no exception/body/IP/portfolio canaries, original reference and retry timing |

These are finite deterministic cases, not exhaustive provider finality, real
cross-region contention, arbitrary crash timing or universal numerical certification.
The live interrupted DEV recovery is separately identified above.


## Final verification and handoff

- Final Node suite:194/194, command
  `node --conditions=react-server --experimental-strip-types --test tests/*.test.mjs`.
- Final Vitest:16 files /66 cases, `pnpm.cmd exec vitest run`.
- All five independent financial mutation probes killed by
  `node tests/backtest-mutations.mjs`; financial source/oracles are unchanged.
- `pnpm.cmd check`: lint, application TypeScript and Convex TypeScript passed.
- Final `node scripts/build-cleared.mjs`: optimized production build passed from
  an explicit source mirror and allowlisted child environment without env files.
- Focused Prettier on every changed/new code/script file and `git diff --check`
  passed. Markdown UTF-8, final newlines, local references and final status checked.
  An accidental documentation overwrite during reconciliation was corrected;
  the original accounting history was restored byte-for-byte before appending.
- Browser regression:42 distinct tests pass across the two intended fixture modes.
  The configured synthetic run passed37; its five disabled-integration/search cases
  initially failed because the fixture intentionally provides synthetic results.
  Those five passed against the separate credential-cleared `--unconfigured`
  fixture. This is not a claim that all42 passed in one server mode. Focused new
  error-reference/guard-state, professional copy and retry-intent regressions pass.
- Terra Medium independently passed10 dashboard error-state cases (five states at
 390/1440px), inspecting the mobile interrupted-refresh screenshot. That review is
  narrower than the root regression suite: independent detail-page, distinct
  per-index reference, retry-payload, keyboard and touch acceptance was not claimed.
  The earlier smoke pass was partial; a second attempt found the overnight server
  stopped. After root restored a verified cleared server, the10-case run completed.
  No source work was delegated. Both root and Terra observed two Preview snapshot
  failures: `Preview automation snapshot timed out after 15000ms.` Installed Edge
  fallback was then used in fresh contexts; root/last-review preview tabs were closed.

Final live totals remain32 provider HTTP initiations /32 HTTP200 responses /
1,840,165 received provider bytes;329 Convex HTTP requests /5,085,219 received
response bytes. Admission-unit delta30,104,947; local ledger unchanged. Exact
live DB operations, subscription/billing and original production cause remain
unverified rather than inferred. The task limits100 /64MiB /1000 were respected.

Useful artifacts (system temp): `tikr-refresh-node-final.txt`,
`tikr-refresh-vitest-final.txt`, `tikr-refresh-build-final.txt`,
`tikr-refresh-browser-full.txt`, `tikr-refresh-browser-unconfigured.txt`,
`tikr-qa-report.json`, `tikr-qa-390-REFRESH_GUARDED-abandoned.png`, and sanitized
`tikr-refresh-guards-before.txt` /`tikr-refresh-guards-after.txt` readback. The
persistent cumulative live journal above is the transport-count authority.

Review server intentionally left running, synthetic only:

- URL:`http://127.0.0.1:43139/qa-fixture/seed`; use a fresh browser profile/context
  and select **Seed isolated portfolios**. No owner localStorage is read or cleared.
- Launch cwd:`C:/Users/JuanE/.t3/worktrees/tikr/t3-dev-history-refresh-recovery`.
- Command:`node scripts/qa-market-redesign.mjs` (default loopback port43139).
- Running source mirror:`C:/Users/JuanE/AppData/Local/Temp/tikr-redesign-qa-QOYjSL`;
  it is a credential-cleared source copy, not a Git checkout. Hidden wrapper PID3372.
- Logs:`%TEMP%/tikr-refresh-review-server.out.log` and`.err.log`; health read
  returned HTTP200 with the explicit **Isolated synthetic QA only** label.
- The temporary unconfigured server on43140 was stopped after its five checks.

Source is uncommitted and ready for owner review. Main remains clean at`a4038e7`.
No PR/push/merge/production mutation, production legacy conversion, new service or
paid fallback occurred. Production rollout, exact legacy CAS/drain/backup/rehearsal,
and any broader durable-cache/attempt-policy change remain future owner decisions.


Supplemental root Edge touch check passed on the final review server at390px with
reduced motion: tapping the actual chart opened a tooltip with the primary
portfolio and `$11,000`/`10.00%`, excluded SPY from tooltip rows, and caused no
horizontal overflow. The full-page screenshot was inspected:
`%TEMP%/tikr-refresh-touch-tooltip.png`; script:`%TEMP%/tikr-refresh-touch-check.cjs`.
This was explicitly synthetic UI evidence, not a live calculation or an independent
Terra touch acceptance.


Final cleanup correction: hosted finish now exposes an idempotent `endObservation`
hook captured to the exact lease/guard owner. Validation/storage failures therefore
end liveness without acknowledging or deleting the unresolved guard. A focused
SDK/gateway test proves it sends exactly one owner-bound finish. The existing
nested cleanup still releases the lease if settlement fails. No backend API change
or additional live spending was needed. Provider-batch diagnostics also join all
bounded request-parent UUIDs to a provider trace, including coalesced requests;
HTTP200 lease refusals log a distinct allowlisted lease event.


## Owner-authorized production-path DEV rehearsal - November13

New instruction: run checklist steps1-5 and7 in this existing worktree; skip the
next-day boundary check (step6). No automation, commit/push/PR/production change is
authorized by this rehearsal. Earlier implementation work remains preserved.

Before new spending, the cumulative journal shows32 provider requests,
1,840,165 received provider bytes,329 Convex HTTP and5,085,219 received Convex bytes,
with zero pending provider-body reservations and no abandoned task lock. Remaining
hard allowance is68 provider HTTP /65,268,699 received provider bytes /671 Convex
HTTP. Allocate the remainder within the unchanged task maxima100 /64MiB /1000;
raise only the task harness phase ceiling40 to100, not any app/global quota or
admission ledger. No counter reset/refund or service provisioning. Real browser
requests will run through an HTTPS production build and the actual DEV gateway;
synthetic fault injections remain isolated transactions, never owner DEV records.

November13 rehearsal final:52 provider HTTP/2,311,974 bytes,926 Convex HTTP/
10,801,438 bytes; zero reservations. Increment20/597 calls. DEV admission estimate
360,865,884 (+43,544,833). Real matrix16/16 blocked; restart blocked; release RED.
See dev-release-rehearsal.md. No next-day check, reset/refund or production action.

November13 continued implementation: fixed allocation1500 cumulative Convex HTTP,
provider100/64MiB unchanged; no budget/counter reset. Durable monthly payload
write and strict wire-field projection replace head-only writes. Failing-before
regressions: fresh caches lost + exhausted admission; unchanged read-row checkedAt
rejected by actual Convex validator. Both pass after correction. All195 Node,
69 Convex/runtime tests,5 financial mutation probes pass; live recheck in progress.

Final follow-up:84 provider HTTP/4,828,799B;1452 Convex HTTP/22,603,067B.
Retain6,291,456 units for interrupted bodies. Backend estimate414,788,683
(+53,922,799), no ceiling extension.196Node/70Convex/5mutants/check/build pass;
real16case route matrix+normal-limit freshbrowser/restart+cash UI flow pass.
DEV relief restored. No unresolved inspected guards/failures, latest300 execution
entries no errors. Local realreview43201 remains fixed-metered with48 Convex calls
remaining; no more autonomous tests. Full limitations in dev-release-rehearsal.md.

Source readiness completed without live calls: bounded collector/state lifecycle,
syntheticbrowser restore2portfolios/55chunks/edited75-25weights, YTD/comparison/
add/remove and label checks. Review HTTP adapter now rejects normalized private
paths/foreignauthority. Journal/allocation required, no autozero/extension. Exact
production recovery runbook production-history-recovery.md finalized, not executed.
Cumulative84provider/1452Convex unchanged; noreset/refund/newallocation. Nextday6
skipped; main/source preserved, noagent/deploy/PR/commit/push this continuation.

Owner explicitly authorized another DEV review allocation after reaching1500.
Cumulative Convex task ceiling1750 (+250), all1500 priorcalls retained. Provider
100/64MiB and backend budget unchanged. Dated allocation recorded in persistent
journal; no automatic extension/reset/refund. Local harness restarted, HTTP43202
adapter unchanged. Production untouched.

Monthlyusagefollowup sourcecomplete: native DEVmonthlycalls207902 installed/readback;
local task1750cap retired for verifiedmonthlyreview withoutcounterreset. ActualDEV+
productionusage-onlypeerconnected withprivatekey; produnchanged. FractionalGBnative
stop400BadJsonBody, no native50%I/O claim; estimatedguard retained. Model warns35/
45/stopsknown50 locally; fullteaminventorynotverified.7synthetictests,check/build,
privatebannerUIstates/mobile pass withoutfinancial/providerwork. Details andremaining
enforcementgap: convex-usage-monitoring.md. Allhistoricalcounter/reservationsretained.

Final monthlyusage handoff: actualDEV+productionusage connected via authorized
GET-onlyproductionpeer. DEVnativecalls207902 active; tinyConvextaskcap retired
for allDEVoperator/review modes after nativeverification, journal preserved.
NativefractionalGBIO rejected; no native50%IO guarantee and productionsettings
unchanged. Periodiclocalwrapper50%stop is not enforcement for everydeployment.
Coverageotherteamdeploymentsunverified. UI source realpartial/sharedconfiguredstate
and simulated35/45/50/mobile pass with zerohistoryrequests;7focusedunit/integration
checks,check/build/format pass. Keyserver-only/ignored, absentfrompublicbuild.
See convex-usage-monitoring.md. Review43202running; noPR/commit/push.
