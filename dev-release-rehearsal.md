# DEV release rehearsal - November13

Scope: owner authorized checklist1-5 and7 in the existing worktree, explicitly
skipping next-day check6. No production deployment/mutation or Git publication.
The existing uncommitted implementation is preserved. All additional provider and
Convex transports share the original cumulative100 /64MiB /1000 task maxima.

## Preflight and automated checks

DEV stoic-corgi-586 and its canonical worktree URLs/key binding were verified.
Reviewed team budget remains valid through November30. Starting cumulative cost:
32 provider HTTP /1,840,165 received bytes;329 Convex HTTP /5,085,219 bytes.
No active task reservation or unresolved DEV guard was present. All tech/SPY asset
leases already had two completed attempts in the current cycle. These were retained.

Fresh automated results: pnpm check (lint and both TS projects),194 Node tests,
66 Vitest cases, five killed financial mutants and credential-cleared production
build pass. Logs are under system temp with prefix tikr-rehearsal-.

## Real production-mode browser path

A credential-cleared source production build runs locally over HTTPS and calls the
actual DEV bearer gateway and real Alpaca. It is not the synthetic fixture server.
The loopback TLS certificate is temporary; no system trust-store change occurred.
All server-side external calls are metered by the persistent cumulative task
journal. Browser contexts are fresh and use only task-local portfolio definitions.

Harness setup initially used127.0.0.1; NextRequest normalizes loopback hostnames to
localhost. Exact origin checks rejected those probes BEFORE external requests.
The harness now uses https://localhost:43201 and trusted forwarding metadata from
its owned TLS terminator. Temporary diagnostic logging in the build was removed
and the exact original compiled-file SHA256 restored before actual financial tests.
The product origin gate was never weakened.

A forced stop of the owned initial test wrapper left its empty task-process lock.
Operator investigation verified no matching process or listener, zero reservations,
unchanged counters32/335, and exact lock birth matching its recorded startup. Only
that verified wrapper lock was released; application admission locks, guards and
ledgers were untouched. Future wrappers record ownership and use authenticated
loopback graceful shutdown. The reconciliation proof is in the persistent journal.

First real cold dashboard test (1W, four portfolios):

| Portfolio | Result | Preserved cause |
| --- | --- | --- |
|War PLTR/NOC/BA/RTX |blocked STORAGE_UNAVAILABLE |guard stage, trace513de0cc-73e5-4e70-9378-29a6bd6304c8; diagnostics pending |
|Tech MSFT/NVDA/AAPL/AMZN |blocked REFRESH_COOLDOWN |CACHE_CONTENT_UNAVAILABLE |
|SPY |blocked REFRESH_COOLDOWN |CACHE_CONTENT_UNAVAILABLE |
|SCHD + SPY benchmark |blocked REFRESH_COOLDOWN |CACHE_CONTENT_UNAVAILABLE |

Known cooldown returned1794664800000 (November14 14:00 UTC). No synthetic label,
horizontal overflow or fabricated ready result appeared. Transport HTTP200 denotes
streaming, not success: every final result was blocked. Source attempt counters
were not reset to make this pass. Cold screenshot/report:
%TEMP%/tikr-rehearsal-cold.png and tikr-rehearsal-cold.json.

Current release gate: RED. Complete range/reload/tab/restart checks and inspect
bounded DEV diagnostics before final assessment. Synthetic correctness is separate
from this real production-browser availability failure.

## Final rehearsal result

Release gate: **RED**. All16 real portfolio/range combinations were exercised:
war, tech, SPY and SCHD at1W/1M/1Y/5Y. Every final response was blocked by
REFRESH_COOLDOWN or STORAGE_UNAVAILABLE. No financial chart rendered, so real
holdings coverage, chart arithmetic and common-period correctness remain unverified.
Reload, second tab, detail navigation and desktop/mobile unavailable states were
checked in an isolated Edge profile. No measured horizontal overflow occurred.
One explicit Retry returned429 REFRESH_COOLDOWN. Browser evidence is in
%TEMP%/tikr-qa-matrix.json, tikr-qa-desktop.png and tikr-qa-mobile.png.

A graceful server stop/restart followed by restored task-only browser storage and
one SPY request reproduced CACHE_CONTENT_UNAVAILABLE -> daily lease rejection ->
REFRESH_COOLDOWN, retry November14 14:00UTC. Trace:
6cca385c-6348-4310-a1cc-92a58cc1bac1. The calendar provider returned200; this was
not an Alpaca history HTTP failure. No allowance/counter/guard was reset.
Artifact: %TEMP%/tikr-rehearsal-restart.json. This confirms unavailable recovery
after disposable payload loss and exhausted daily attempts; it does not establish
the original production incident's cause.

A single sanitized DEV log snapshot found two market:read OCC conflicts in its
last300 entries. This proves contention occurred during rehearsal, but does not
attribute every STORAGE_UNAVAILABLE response or the earlier BA guard failure.
No raw backend exceptions were printed or retained by the diagnostic mode.

The fresh66-case Convex suite covers controlled provider failures, interrupted
publication, stale owners, guards and runtime recovery in isolated fixtures.
Those synthetic passes do not supersede failed real availability. Test6 (next-day
boundary) was explicitly skipped; no automation was created. Secret-canary browser
verification was incomplete. Warm real-chart comparison could not pass without
ready data. Remaining work: repair and reproduce payload-loss recovery under the
existing allowance policy, reduce/retest DEV contention, then rerun the real matrix.
Production rollout and migration approvals remain separate.

## Exact bounded cost and state

Final cumulative task:52 Alpaca HTTP /2,311,974 received provider-body bytes;
926 Convex HTTP /10,801,438 received bytes. This rehearsal increment from32/329:
20 Alpaca HTTP /471,809 bytes;597 Convex HTTP /5,716,219 bytes. All remain below
100 requests /64MiB /1000 calls. Zero provider-byte reservations remain.

Final DEV budget snapshot at2026-11-13T16:47:29.676Z:360,865,884 estimated
admission units,9428 tracked calls,8,077,992 tracked storage bytes,729 entries.
Increment from preflight317,321,051:43,544,833 admission units. These estimates
are not billing or actual database I/O. Exact deployed DB operations were not
exposed by the execution-log API and remain unmeasured. No additional budget
extension, refund, global policy change or production mutation was performed.
Independent Alpaca subscription name/plan remains unverified.

The real metered server was stopped gracefully to prevent unattended budget use.
The marked synthetic review server remains at http://127.0.0.1:43139/qa-fixture/seed.
Real harness command from this worktree is node scripts/history-refresh-live.mjs
--serve-production, with the private DEV bindings and temporary TLS/build paths
recorded in the task environment; it uses https://localhost:43201. Do not leave it
running unattended against the remaining74 Convex-call allocation.

## November13 first live correction check

Terra created a task-only draft and added PLTR through hosted catalog search;
allocation validation accepted100%. First correction build reached provider200
bars/actions, then failed Convex write argument validation. An unchanged monthly
read row carried checkedAt into the write API. Actual Convex-validator test
reproduced Unexpected field checkedAt before strict write-field projection and
passes after it. The fix was rebuilt; recovery acceptance continues against the
retained failed observations. No provider outage or historical production-cause
claim follows from this new correction defect. Earlier release RED remains until
successful live acceptance is appended.

## Final correction acceptance - November13 17:37UTC

**DEV history flow: PASS within tested bounds. Production is not deployed/certified.**
This supersedes the earlier RED for the corrected source; the original production
incident's initiating cause is still unknown.

### Exact changes and evidence

1. Persist normalized monthly prices/actions in the same fenced transaction as
   their authoritative head. Before: deleting process/browser copies plus spending
   source allowance blocked reconstruction. After: identical complete calculations
   survive those losses without source admission. No financial engine change.
2. Project reused monthly rows to key/payload/revision/dependencies before write.
   The first correction's real trace71637e78 failed after provider200 at storage-write.
   Sanitized execution logs and actual Convex-validator regression established
   unexpected checkedAt. This new correction defect failed before projection and
   passes after it; it is not attributed to the original production incident.
3. Serialize gateway mutations through the bounded256-pending process write queue.
   This reduces self-contention on shared accounting. It does not guarantee that
   separate instances cannot contend. The latest300 retained DEV log entries after
   successful acceptance show zero function errors.
4. Hosted coordinator deadline45s, within existing60s route/lease and55s browser
   bounds. The old15s single-process deadline aborted healthy multi-portfolio cold
   work waiting for admission/provider slots. A bounded queue-delay regression
   demonstrates the deadline distinction. Timeout now retains stage/time/trace/code.
   Provider HTTP/page/byte limits and spending caps are unchanged.
5. Temporary DEV relief covers BOTH acquisition and abandoned-observation recovery.
   It requires the exact platform DEV site URL and private explicit flag. Tests
   prove production cannot enable it; guards, counters, budgets and active leases
   remain enforced. Relief was disabled for the final restart/browser/flow check
   and then restored as owner requested until further notice.

### Acceptance matrix

-196 Node tests,70 Convex/runtime tests, five financial mutation probes, lint/types
  and credential-cleared production build pass.
-42 browser regressions pass in their appropriate configurations:37 configured
  cases plus five disabled-data/demo cases. Running the five negative cases on the
  configured fixture initially failed their expected unavailable/demo assumptions;
  they passed on the correctly credential-cleared disabled fixture.
-Real route matrix16/16 ready: war PLTR/NOC/BA/RTX, tech MSFT/NVDA/AAPL/AMZN,
  SPY and SCHD at5Y/1Y/1M/1W. Every requested ticker is present in asset returns;
  all portfolio/SPY dates match; first points equal10000.00; chart endpoints agree
  with ending/return values and recomputed displayed drawdown. No shortened period.
  Five-year period2021-11-12..2026-11-12 has1255 common points.
-Real retained PLTR/SPY publication failure recovered with normal explicit Retry,
  validated replacement and exact guard settlement; no deletion/reset of guards.
-After graceful server restart and fresh browser WITHOUT history hints, all four
  dashboard portfolios are ready with DEV relief DISABLED and spent source attempts.
  Only one calendar request was made; zero bars/actions requests were needed.
-Actual UI create/add SPY+PLTR/equal50%/save succeeded; zero starting cash rejected,
 12345.67 accepted, saved result ready after reload and second tab. Desktop/mobile
  screenshots inspected, no mobile overflow; both holdings and provisional labels
  present. The root QA collector hung on canceled response bodies AFTER assertions
  and screenshots; only its verified owned Edge process was closed. Its finally
  block saved partial report with passed assertions and two ready response summaries.
  StorageState/synthetic-text assertion after collection did not complete.
-Terra first check found the publication regression; its later recheck stopped
  incomplete before history. Those incomplete runs are not counted as full acceptance;
  root completed the real route/browser/flow verification. No implementation delegated.
-Next-day live boundary check6 remains explicitly skipped. Synthetic next-cycle,
  provider fault, stale-owner, revocation and interrupted-publish checks still pass.

Artifacts under system temp: tikr-durable-live-matrix.json,
tikr-durable-recovery.json, tikr-durable-normal-policy-browser.json/.png,
tikr-durable-flow.json, tikr-durable-flow-desktop.png and -mobile.png,
tikr-durable-final-heads.json and tikr-durable-final-log-snapshot.json.

### Exact cost

Final cumulative task:84 provider HTTP /4,828,799 received provider-body bytes;
1452 Convex HTTP /22,603,067 received bytes. Increment from this follow-up's52/926:
32 provider HTTP /2,516,825 bytes;526 Convex HTTP /11,801,629 bytes.
Ceilings100 provider /64MiB /1500 Convex: no further extension. Retained6,291,456
provider-byte reservation units represent three interrupted bodies; they were
not reset/refunded or represented as measured received bytes. They are not live
work still running.

Final DEV preflight2026-11-13T17:37:54.026Z:414,788,683 conservative admission
units,9989 tracked calls,8,392,896 tracked storage bytes,788 entries. This follow-up
added53,922,799 admission units; no backend estimate ceiling extension was needed.
Conservative other usage stays134MB I/O/9000 calls/6.1MB storage. Actual deployed DB
API operations and billed I/O remain unmeasured. Independent Alpaca subscription
name is unverified; actual provider rate headers are retained privately in journal.

### Production reasoning and remaining release work

The same durable write/read and deadline paths execute in hosted DEV and production.
Normal-limit synthetic and real DEV restart tests demonstrate that a refresh cap
no longer blocks reading complete stored history. That supports this reproduced
failure's correction; it does not reconstruct/certify the original production outage.
Production still needs an approved compatible rollout, snapshot/drain/rehearsal and
an exact plan for old head-only rows, retained guards and current counters. Existing
old rows lacking payload cannot be made valid merely by deploying code. Their next
admitted validated refresh must persist payload, or a separately reviewed bounded
repair/migration is needed. Never broaden lineage exceptions or reset revocations.

Provider outages, missing/unsupported actions, expired evidence, genuinely exhausted
budgets, cross-instance contention and older correction completeness remain limits.
Calendar is still fetched once per current process/cycle; cold startup during its
provider outage can fail clearly. Public display/cache rights remain separately gated.
Landing's old no-market-data demo copy is misleading when live DEV is enabled and
remains copy debt; runtime results accurately show personal provisional Alpaca.
This is history-flow acceptance, not readiness for every planned product feature.

### Owner review server

Real production-mode DEV review: https://localhost:43201 (ephemeral self-signed
loopback certificate; no trust-store changes). Exact cwd:
C:/Users/JuanE/.t3/worktrees/tikr/t3-dev-history-refresh-recovery
PowerShell command: $env:NODE_ENV='development'; node scripts/history-refresh-live.mjs --serve-production
Ignored .env.local contains only the existing DEV bindings plus local build/TLS paths.
The metered server is left running with48 Convex calls/16 provider requests remaining
under the fixed task allocation; no autonomous traffic or automatic allowance reset.
Do not start a second wrapper while its task lock is held. Synthetic fixture43140
is separately marked and credential-cleared; it is not real DEV acceptance.

### Local review certificate follow-up

Owner browser rejected the ephemeral HTTPS certificate. Added loopback-only
HTTP adapter scripts/dev-review-http.mjs at http://127.0.0.1:43202, forwarding
only to owned https://localhost:43201. No trust-store or browser-security changes.
Host/origin validated before rewrite; foreign writes and private harness controls
blocked. Checks: landing200, JS200, invalid input400, foreign origin403, private
control403. No provider/Convex requests required. Underlying fixed meter remains.
Command in this worktree: node scripts/dev-review-http.mjs (both servers running).
Use the HTTP URL for owner review, superseding the direct HTTPS review link.

## Source-readiness completion (same-worktree continuation)

Source is ready for owner/source review; no PR, commit, push, new deployment or
production access occurred in this continuation. Production rollout is still an
approval-gated operation, not certified by these checks. See the specific
[production recovery runbook](production-history-recovery.md).

### Closed source and QA gaps

-Added reusable scripts/lib/qa-response-collector.mjs: fixed per-body deadline,
  bounded count/summary size, no raw text/exception retention, ignored late results,
  sealed collection and cleanup without waiting forever on canceled body reads.
  scripts/qa-history-persistence.mjs captures storageState BEFORE draining bodies,
  closes all isolated contexts and the deliberately unfinished local stream server.
  The old TEMP-only unbounded collector is historical evidence, not a test to rerun.
-Actual isolated Edge run against the marked credential-cleared fixture completed:
  YTD history, comparison, removeBBB/addCCC, invalid125% then valid75/25 weights,
  save, storageState with55 IndexedDB chunks/two portfolios, and fresh-context
  restoration of exact edited holdings. Synthetic label present; unfinished-body
  collection terminates and browser closes normally. Report/state/screenshot:
  %TEMP%/tikr-qa-persistence/. This is SYNTHETIC, not additional live acceptance.
-Real-data-label assertion completed against RETAINED real browser evidence:
  tikr-durable-normal-policy-browser.json at2026-11-13T17:33:06.851Z has four ready
  personal-provisional cases and syntheticText0. New assertion artifact:
  %TEMP%/tikr-qa-persistence/retained-real-label-assertion.json. No fresh live check
  or real-profile storageState export is claimed. The original real-flow collector
  never exported its state; the new isolated synthetic export closes the lifecycle
  coverage. Fresh real checking would require a calendar provider request on the
  current cold review process, so it was omitted to preserve the explicit allowance.
-Deterministic provisional-label test now asserts no synthetic disclosure in both
  workspace and dashboard. Existing add/remove/save and comparison tests reran.
-Added warm YTD/edit integration coverage with exact fixture year-start session,
  all expected holdings, shared dates/starting cash, changed financial result after
  weights change, and zero extra synthetic source requests. Independent financial
  oracles remain unchanged; the existing deterministic boundary coverage remains.

### Source audit and review adapter

Inspected changed runtime/contracts/diagnostics, Convex fencing/guard paths and
untracked scripts. No harness route lives under src/app; the production gateway
allowlist does not expose reconcileLegacy. Failure summaries retain only the four
validated fields, one per source/ticker under bounded guard/control-document limits.
The private DEV relief requires both exact platform site URL and explicit flag on
both acquire/recover paths; production negative tests pass. No new backend edit.

The local HTTP adapter had a URL-normalization gap: dot/encoded private paths or
backslash authority syntax could evade its raw path guard. It now validates the
normalized target origin and decoded path before opening ANY upstream request.
Only the owned localhost43201 origin is allowed; private harness controls remain
blocked. New regression covers dot/encoded/backslash/foreign-host/origin cases.
Restarted ONLY the verified review adapter when no established connections were
present. Current raw HTTP checks: landing200; normalized private paths and foreign
authority403. Underlying metered server and owner profiles/storage untouched.

Task harness now requires the pre-existing cumulative journal and exact approved
allocation; missing evidence cannot recreate counters or create an extension.
Metadata failure output filters validated bounded summaries rather than dumping
unknown stored fields. No credentials, raw financial bodies, exceptions, IPs or
portfolio names were added to diagnostics. Existing private bindings remain ignored.

### Focused verification and exact cost

Focused verification only (application/backend unchanged this continuation):
7 synthetic market integration cases plus5 collector/adapter Node cases pass;
11 focused Convex DEV-relief/diagnostic cases pass;3 existing browser cases pass
with final provisional-label absence assertions rerun; dedicated isolated browser
persistence/cancellation/edit run passes. Formatting and diff whitespace checks
pass. Earlier196/70/42 broad checks and production build remain historical evidence;
no claim that those broad suites were rerun for scripts/docs-only changes.

Provider84/4,828,799 received bytes and Convex1452/22,603,067 received bytes unchanged:
ZERO additional provider/deployed Convex calls. Retained6,291,456 reservation units
unchanged.48 Convex calls remain for owner traffic at this dated reading; no cap
extension/reset/refund. Independent Terra coverage remains partial, not certification.
Next-day live test6 remains explicitly skipped; no next-day automation was added.

### Handoff and remaining gates

Owner review remains http://127.0.0.1:43202. Exact cwd is this existing worktree;
commands: $env:NODE_ENV='development'; node scripts/history-refresh-live.mjs --serve-production
and node scripts/dev-review-http.mjs. Both are already running; do not start duplicate
listeners. No extra checkout/chat/agent was created in this continuation.

Remaining work is operational approval, not unspecified source repair: approve
actual production inventory/allocation/snapshot/drain/rehearsal and reviewed artifact;
then execute exact applicable guard CAS and admitted full-payload recovery, preserving
all counters/revocations. Exhausted production allowances remain blockers until real
eligibility or a separately reviewed policy change; deployment alone is no backfill.
The runbook contains rollback/failure criteria and no destructive command. Original
production cause, public data rights, provider finality/actions completeness and
landing demo-copy debt remain honestly separate limitations. No production guarantee.
