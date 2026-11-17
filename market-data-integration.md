## Calendar coverage clarification - 2026-11-15 (unpublished source)

The personal loader records the requested inclusive calendar bounds separately
from its eligible returned session list. Consumers verify range coverage through
the shared New York eligibility cutoff, then use actual sessions for the latest
endpoint and presets. No weekend/holiday list, missing-bar substitution, legacy
metadata expansion, schema migration or evidence-policy change is introduced.
HTTP 200 bodies must be fully read within existing bounds and parsed as ordered,
unique ISO dates within the request; supplied open/close times must be valid.
Identity Content-Length mismatch, invalid UTF-8/JSON and partial HTTP status fail.
A syntactically valid provider omission cannot independently be identified as a
closure versus erroneous omission: acceptance remains explicitly provisional.

Backend calendar rejection logs expose only an allowlisted reason and existing
trace metadata; public professional error handling is unchanged. Deterministic
loader/coordinator/actual streamed-route and isolated chart acceptance evidence is
in plan.md. No live-provider/production access or rollout occurred for this fix.

## Status reconciliation - 2026-11-14

PR 19 (history/dividend recovery) and PR 20 (guard prevention) are merged on main at
`7172173`. [plan.md](plan.md) is the current status entry point. Earlier no-PR,
uncommitted and DEV-only statements below describe historical checkpoints, not
current source status. Production AMZN's approved exact repair succeeded; the
initiating worker interruption remains unknown. Merge/PR checks do not independently
certify post-merge production versions. No live request/deployment in this doc pass.

The all-ticker reported-USD cash assumption supersedes foreign/missing-currency
rejection. Operational app quotas/cooldowns, DEV relief and usage monitor were
subsequently removed; counters/correctness guards remain. Do not reinstate old
controls from examples below. Keep financial validation, leases/fencing, revocations
and input/serialization/provider-concurrency bounds. Four Post-MVP polish items
remain deferred. No new deployed cleanup/production mutation authorization follows.

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

# Personal market-data integration

Current architecture: [market-redesign-checkpoint.md](market-redesign-checkpoint.md).
The November13 correction restores durable monthly history while retaining process-only results.

## Scope and activation gates

Alpaca credentials and normalization remain server-only. Portfolio definitions and
drafts remain browser-local; there is no auth/profile/cloud-portfolio scaffolding.
Hosted access is unauthenticated, but live public display and caching rights are
not established. No synthetic test or successful build authorizes activation,
credentials, deployment, paid use or live provider calls.

Personal provisional mode remains explicitly enabled through the existing server
configuration. It accepts provisional coverage under the owner policy and labels
results subject to corrections. Reviewed replay remains an expiring, hash-bound
private evidence-file alternative. Neither mode fabricates inception, prices,
missing actions or earlier common history. Read `backtest-methodology.md` before
engine changes and `alpaca-validation.md` for evidence/oracle procedures.

## Durable storage and refreshes

The server keeps asset roots/metadata and matching monthly normalized payloads,
shared admission/fencing/attempts, revocations and validated catalog state in Convex.
Browser/process history copies are disposable accelerators. New calendar and derived-result writes are
removed. Legacy monthly manifests remain readable; shared guards and historical
revocations are never bypassed by a new cache identity. Recovery still binds the
atomic committed head revision to readback receipts. Files/process memory are not
shared or durable on Vercel.

See `on-demand-cache.md` for restart, cache-loss and multitab behavior;
`market-accounting.md` for control units versus measurements; and
`market-deployed-cleanup.md` before any deployment or record cleanup. The earlier source-only checkpoint below is historical. The November13 DEV
compatibility rollout adds an optional pending-attempt field; deployed records
have not been deleted or reset.

## Server configuration inventory

`ALPACA_API_KEY_ID` / `ALPACA_API_SECRET_KEY` (existing `APCA_API_KEY` /
`APCA_API_SECRET` aliases), activation flags, Convex server/gateway configuration,
reviewed evidence path/hash and development allowance settings are server-side.
The unused browser Convex provider and its public-URL consumer are removed.
Never copy/read private env or owner browser data for synthetic verification.
Names and consumer decisions are in `market-source-inventory.md`; no secret
values belong in documentation, browser storage or logs.

## Local verification

Use pnpm.cmd on Windows. Run `pnpm.cmd check`, the Node suites with
`--conditions=react-server --experimental-strip-types`, `pnpm.cmd exec vitest run`
and `node tests/backtest-mutations.mjs`. Run the deterministic cost matrix through
`scripts/measure-market-redesign.mjs`; the old measurement command is a compatible
alias and no longer extrapolates a fixed traffic capacity model.

`scripts/build-cleared.mjs` copies explicit source paths into system temp, excludes
env files and builds with a credential-cleared environment. The isolated browser
fixture script similarly copies source, injects deterministic server data and
listens on a unique loopback port. Its `--unconfigured` mode exercises the real
disabled integration. Use a fresh browser context and keep artifacts in temp.
Terra actual-browser verification is separate from optional Playwright regression.

## Hosted retained-lineage correction (2026-11-12 implementation)

Source-only fix in `t3/fix-hosted-history-revoked-lineage`, based on `4f02383`.
The owner supplied the production `marketHosted/global` payload; no production
read, provider call, credential access, deployment or record change was performed.
The report establishes a retained v3 global marker and old BA guard plus a distinct
current-v5 AMZN guard. It does not establish why either observation originally
failed. Production may now differ from that supplied snapshot.

`supersededMarketScope` in `src/lib/market-policy.ts` is the single local/hosted
classifier. It accepts only these exact historical hashes for the reviewed v5
scope `695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7`:

- v3 requested-period, start 2021-10-25:
  `5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7`.
- v4 stock-merger-acquirer, same start:
  `dcb3fad8de5e1ec032403090533da422eaa911b249dfd8511affd38539b87d8d`.

It requires the exact v5 policy too. Other dates/policies/current or unknown
revocations remain blocking. Local per-asset flags and local admission-ledger
revocations remain authoritative. The old hosted global markers and guards remain
stored; compatibility does not delete or acknowledge them. Hosted begin now checks
all authoritative scopes for the requested symbol, as hosted read already did.

The server-only control caller sends policy identity through the bearer-authenticated
gateway to the internal control mutation. Identity scope must match asset operation
scope; zero-scope enter/provider operations use the same source-window calculation
and New York freshness cycle as source loading. No browser verified flag is accepted.
Missing identity fails closed against historical revocations; unknown policy literals
and mismatched identities are rejected. Existing release/finish/revoke operations
remain available. Budgets, reservations, counters, guard limits and four active
request slots retain their existing accounting; compatibility itself resets none.
Normal operations still incur normal conservative charges.

The runtime test seeds the complete owner-supplied retained global payload, then
runs the actual hosted runtime through synthetic gateway HTTP/Convex transactions
and validated synthetic provider responses. SPY, BA, RTX and LMT require fresh data;
AMZN remains blocked. This is synthetic source validation, not live market evidence.
The AMZN negative case initially exceeded five seconds because durable guard waiting
performs 30 real 400ms polls while the fixture faked only Date. Temporary operation
timing identified the AMZN open at about 12.2 seconds; other opens completed and
the later read/revocation barrier was reached. The test now explicitly advances
fake timers for that guard wait, preserves its rejection and uses the default
five-second timeout. No production polling or timeout behavior was changed.

A batch HTTP 200 means the NDJSON transport opened: each indexed body can still
contain `status: blocked` / `EVIDENCE_REVOKED`. It is not evidence of usable history.

### Historical compatibility-only checkpoint: AMZN recovery not yet implemented

Superseded for source readiness by ?Hosted interrupted-refresh recovery? below.
The following describes the earlier patch; live recovery remains unverified.

Local recovery already binds freshly validated data, an atomic committed head,
matching readback and an exact-head-revision receipt. It refuses active observations
and retains original flags. `market-storage.ts` deliberately exposes those recovery
hooks only locally. Hosted guards contain only scope/symbol -> token; they contain
no observation liveness, completion time or receipt. A `marketLeases.expires` value
alone cannot establish that an old provider response is no longer in flight. The
hosted `finish` path can remove only its matching owner token; do not impersonate it.
This patch adds no AMZN exception, guard deletion, stolen lease or recovery writer.

Additional read-only evidence needed, under separate target-specific approval:

1. A consistent snapshot of `marketHosted/global`, especially the exact AMZN token,
   all active request/provider reservations, revocations and budget ledger.
2. `marketLeases` row for `asset:AMZN`: token, expiry, cycle, attemptedAt, attempts,
   scopeAttempts, completed/completedFrom and reviewedPolicy. Map observation token
   to lease ownership and deployed host/request identity where available. Absence
   of this mapping remains an evidence gap, not proof of inactivity.
3. `marketEntries` authoritative `asset:AMZN` head: exact revision, evidenceRevision,
   checkedAt, normalized root, coverage, format and dependency revisions; include
   any retained payload/parts and existing receipt evidence. Readback is not fresh
   provider validation. Capture deployed server/Convex code and policy versions.
4. Evidence that every producer of the original observation is quiescent/fenced;
   current token-only state cannot prove this. Unknown liveness must remain blocking.

Proposed recovery needs a separately reviewed protocol: durable observation ownership
and terminal/quiescence evidence, an atomic fenced recovery claim that cannot race
an active owner, bounded freshly validated normalized history, ordinary atomic head
commit, exact matching readback, then a durable receipt bound to original guard token,
scope, symbol and committed revision. Reads must invalidate that receipt on later
head changes/revocation; original guards and counters remain retained. Rehearse active
old response, concurrent claims, revocation during readback, wrong revision, source
failure and receipt failure before asking to enable it. Do not execute a manual
finish/delete using the known production token. If these proofs cannot be supplied,
keep AMZN unavailable.

### Approval-gated rollout proposal

First review this uncommitted source diff and synthetic results. Separately authorize
read-only production snapshot/version comparison and approved backup/rehearsal per
`market-deployed-cleanup.md`; stop on unknown state. Obtain explicit deployment
approval for the concrete targets/versions. Deploy Convex support for optional policy
identity first, then the matching server caller. Old callers omit identity and remain
fail-closed until upgraded. Rehearse mixed versions and rollback: rolling back the
caller/backend may restore unavailability, never clear records to regain service.
No schema or policy bump, namespace change or cleanup is required.

After separately approved rollout, verify retained revocations/guards and accounting
continuity, SPY/unrelated history after fresh validation, unknown/current rejection,
concurrency and per-result NDJSON statuses. Any real provider validation needs its
own bounded allowance/rights/activation approval. Expect AMZN-containing comparisons
to remain unavailable; do not claim that the global correction restores all cards.

## Hosted interrupted-refresh recovery (2026-11-12, source only)

Guards now optionally carry an observation bound to the exact `asset:SYMBOL`
lease token and its 60-second expiry. Expiry never makes old data readable. An
explicit Retry discovers expired observations, acquires the ordinary durable
lease under unchanged budgets/attempt limits, validates fresh source data through
the existing engine boundary, and replaces the guarded asset. Fresh owners remain
blocked/coalesced by the existing bounded polling. Failures return the existing
temporary unavailable/retry UI; retries remain subject to cooldown/daily budgets.

Hosted writes carry both guard and lease tokens. The transaction checks ownership,
expiry, current/unknown revocation, dependencies and head identity, then publishes
the replacement and settles only that exact guard atomically. A crash before commit
retains the guard; a crash after commit leaves the published head with no unresolved
guard. Stale hosts cannot publish or finish a replacement owner's observation.
Token-only begin callers remain source compatible but cannot resolve guards with
legacy finish. New code must be deployed before admitting recovery traffic.

Legacy token-only observations have no trustworthy creation/expiry evidence and
are never automatically presumed abandoned. `hosted:reconcileLegacy` is an internal,
operator-only CAS conversion, absent from the HTTP gateway. It accepts only the
reviewed current-v5 scope, exact symbol/token, expected head revision (or null),
and expected asset lease token (or null); it rejects live leases and changed state.
It preserves the guard token, all heads, revocations and counters and adds expired
observation metadata. Conversion does not establish data validity or unlock reads.
See `market-deployed-cleanup.md` for the authorization sequence. No actual retained
production record was inspected, converted or resolved in this task.


## November13 development recovery verification

Owner-authorized work stays in `t3-dev-history-refresh-recovery`, based on merged
PR18 at `a4038e7`. Compatible backend changes were deployed only to
`dev:stoic-corgi-586`. The DEV bearer gateway and current rounded team-review fields
were configured for bounded verification. Production was neither inspected nor
mutated, and no public site, paid service, provisioning of a new target, legacy
conversion, ledger reset or record cleanup was performed.

See [history-refresh-journal.md](history-refresh-journal.md) for exact before/after
reproductions, trace IDs, costs, retained-state readback and remaining limits.
New hosted claims defer attempt-counter changes until catalog/guard validation
admits `begin`; rejected guards and waiting claims do not spend an attempt. Original
failure summaries remain attached to guarded source/ticker state through cooldown.
Only active guards wait; expired observations permit an ordinary explicit Retry,
while token-only legacy guards still require exact approved operator conversion.
The reviewed normalization validation exception remains narrow and counters are
retained. Validated source progress grants bounded publication time, never an
unlimited heartbeat. Stale owners cannot publish or settle replacement observations.

Browser/process content loss is distinct from an upstream failure. Retained legacy
monthly rows are optional reconstruction hints and must reproduce the COMPLETE
current authoritative root before use. A valid monthly self-hash alone is never
sufficient. If reconstruction fails, ordinary source lease/attempt/admission gates
apply. Retry detects missing payload before selecting work and reuses a healthy
benchmark instead of needlessly spending its provider allowance. Wider authoritative
coverage survives revalidation even when its disposable payload is lost; the
selected investment period is never silently shortened.

Real DEV verification recovered AAPL/MSFT/NVDA from retained expired observations,
returned the full tech portfolio plus SPY for November5?12, then reopened warm with
zero provider requests. The originating interruption was the bounded task harness,
not an observed Alpaca outage. The earlier real cold-process generic cache failure
was separately reproduced in isolated fixtures. Neither result reconstructs the
unknown original production failure or certifies production, provider finality,
exhaustive actions or public display/cache rights.

### November13 real browser release rehearsal

The later real DEV rehearsal supersedes any broad readiness interpretation of the
prior warm success: all16 portfolio/range cases were blocked. A graceful restart
with restored task browser storage confirmed missing disposable payload + exhausted
daily source attempts returns CACHE_CONTENT_UNAVAILABLE -> REFRESH_COOLDOWN.
Two market:read OCC conflicts occurred; the precise cause of every storage failure
is unresolved. Synthetic194 Node/66 Convex checks passed. Next-day testing skipped.
See dev-release-rehearsal.md. Production readiness remains blocked.

## November13 durable payload DEV verification

Head-only writes were reproduced before the correction with a fresh process,
no browser hints, no persisted result and exhausted source admission: blocked.
After persisting monthly payloads atomically with the head, the same case is ready
with identical complete results and zero additional source loads. Actual hosted
runtime also passes fresh-browser/different-cash calculation under normal production
limits without another bars request. This is a DEV reproduction, not attribution
of the unknown original production cause.

Temporary DEV refresh relief is platform-URL bound to stoic-corgi-586, explicitly
configured server-side, and preserves counters/guards/budgets. Production cannot
enable it through the same flag. Existing old head-only rows are not silently
backfilled: their next admitted validated refresh persists complete payloads.
A future production rollout must account for those rows and existing daily attempts;
no broader lineage exception, revocation reset or production repair is authorized.

Final November13 continued acceptance:196 Node,70 Convex/runtime,5 mutants,
lint/types/build and42 appropriately scoped browser regressions pass. Real16-case
route matrix passes; fresh-process/browser4portfolio check with DEV relief OFF
passes without bars/actions provider work. Equalweights/cash/create/save/reload/
secondtab UI flow passes, with a canceled-response collector limitation documented.
DEV relief restored; production unchanged. Exact evidence/cost/limits and old-head
production recovery requirements: dev-release-rehearsal.md final section.

Source-readiness continuation: collector storageState/cancellation lifecycle now
passes in isolated synthetic browser (2portfolios,55chunks,edited75/25weights).
YTD/comparison/add/remove/weight and exact cached year-start checks pass. Retained
real four-case evidence asserts ready personal-provisional responses and synthetic
labelcount0; no new live run. Specific approval-gated production recovery procedure:
production-history-recovery.md. No production inspection/action in this continuation.

MVP continuation2026-11-13: exactforeign cash terms and remainingunknowncurrency are
recorded in mvp-history-readiness.md. ExplicitUSDcashnormalization now permitsforeign
and special flags without guessedFX/ADRratio. Missingforeigncurrency remainsunverified.
AutoexpiredguardrecoveryretainsCAS/revocations; operationalquotas removedsharedsource.

FinalMVPfollowupacceptance: actualforeignASML/TSM1Yremainsblockedafteroneeditorretry;
sourcecurrencyabsentcannotestablishUSDgrosscashperADR/share. Real1Wloading/recovery,
WARchartandreloadpass. Nooperationalquotaenforcementwasrestored. Seemvp-history-readiness.md.

## Shared refresh / dashboard recovery ? local work, 2026-11-17

Owner authorizes this narrowly scoped local fix on PR27 base `766030c7e572bc8438acee5e93a3e89c7859ece3`.
No production access, backend deployment, publication, data cleanup or financial-policy change.

Deterministic evidence: two independent coordinators sharing transaction storage, with an acquisition
barrier and SPY delayed 1.8 seconds, previously returned ready/blocked; the lease loser exhausted
its three 400ms checks before publication. The corrected case returns ready/ready with one SPY load.
A separate dashboard defect replaced still-refreshing cards with DATA_UNAVAILABLE after its 8-second
atomic display window. That window now releases each card to its actual state, including loading.
This reproduces two causes; the owner's HTTP-200 traces alone do not prove payload validity or
attribute every production failure. No production verification has been performed.

Lease losers wait with bounded exponential backoff (200ms to 2s), guard/evidence checks, complete
root reconstruction and revision readback. A guard remains authoritative: waiting never deletes it
or launches a second provider refresh. Existing abandoned-owner recovery remains fenced; this patch
adds no new reclaim protocol. Hosted startup guard waiting and the core share the existing 45s
budget; browser/route limits remain 55/60s. Monotonic time measures deadlines. Cache timeout has a
specific REFRESH_TIMEOUT code. Browser terminal active/busy responses can trigger at most two
ordinary rechecks per financial identity/session; they do not set retry authorization.

Client in-flight sharing is session-scoped and includes complete request/history bytes; explicit
retries do not share. Independent consumers receive independent bounded response streams. One
consumer cancellation cannot cancel peers. Provider batching cancels only once every member signal
has aborted, and removes its listeners on settlement. No provider coverage/batching policy changes.
Previous dashboard generations and old range results cannot be presented as current completed work.

Local evidence: Node durable/cache/redesign 73 passed; wider cache/storage run 72 passed;
Vitest 146 passed across 29 files with --testTimeout=60000, including the new cancellation and
Convex join cases. Lint, both TS, changed-file formatting, diff whitespace and added-line secret
pattern checks passed. Final credential-cleared --auth-fixture optimized build passed.
Four-portfolio delayed fixture: 2 actual provider HTTP calls (bars + actions), 57 storage reads,
18 writes, 21 lease calls and 36 guard checks. Warm reopen: 0 provider HTTP, 4 additional reads.
These are fixture application operations, not billing or an estimate of production traffic.
The shared Convex fixture proves separate coordinator/storage instances join one validated SPY load.
It is separate from the four-portfolio browser fixture, whose shared storage is in memory.

Synthetic local UI: `TIKR_QA_PORT=5190 node --conditions=react-server --experimental-strip-types
scripts/serve-guest-qa.mjs --shared-refresh`, then `http://127.0.0.1:5190/?shared-refresh`.
The scenario creates only synthetic in-memory account rows, uses the actual market hook/cards and
local mocked provider transport, selects YTD, and labels the data. Fresh incognito browser observed
loading followed by four charts, no error flashes, at 390px and 1440px; no existing profile was seeded.
An initial narrow-to-wide test with all provider calls artificially delayed did fail, so that result
is not counted as passing evidence. The final fixture delays only SPY-containing provider calls. A dedicated concurrent narrow1W/wide5Y
regression now verifies waiting followed by authoritative fenced expansion, without accepting narrow
coverage as a complete wide result.

Remaining verification limits: no live provider/OAuth/production smoke test; not every requested
crash/expiry/range/abort permutation has a new dedicated join regression. Existing guard/revocation,
correction, malformed/missing content and bounded queue tests remain relevant but do not certify all
cross-instance failure interleavings. Storage RPCs retain their existing individual timeout/cleanup
behavior; no new storage cancellation API was introduced. Exactly one independent Sol Low read-only review completed. It found two P2 defects:
manual Retry could reuse an automatic attempt number, and postdeadline operations could start.
Both were corrected locally without another reviewer. Automatic/manual attempts now share one
monotonic sequence while explicit retry authorization stays separate. Deadline checks run after
sleeps, before guard/provider work and after acquisition; late owned tokens are released.
New regressions cover guard sleep, late acquisition/expansion/guard completion (zero provider starts),
and a virtual-time hosted 45s guard wait (no RPC begins after expiry, fewer than 30 checks).
The actual hook browser regression observes busy -> ordinary recheck -> SOURCE_FAILURE -> manual
Retry -> ready, with request retry flags [false, false, true]. Different history bytes are now
included in the client identity test. Final fixes were verified by the implementer, not re-reviewed.
