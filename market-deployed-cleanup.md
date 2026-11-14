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

# Approval-gated deployed cleanup and rollback

This remains a cleanup runbook, not an executed cleanup or production migration.
The earlier source-only checkpoint had no authorized live target. A separately
authorized November13 compatibility rollout and bounded inspection ran only on
`dev:stoic-corgi-586`, as recorded below; production cleanup remains unexecuted.
The steps below generate exact ID/revision manifests before requesting approval; wildcard deletion is prohibited.

For the current durable-payload rollout, use
[production-history-recovery.md](production-history-recovery.md) for the exact
inventory/classification, admitted refresh/CAS, counter-preserving rollback and
stop criteria. No production operation or cleanup is authorized by either file.

## Gate 1: read-only target and compatibility preflight

Obtain explicit authorization for the named target's read-only inspection. Apply
`convex-deploy-guard`: classify/announce local/dev/preview/prod; do not infer a
production target from source. Use read-only tooling; `market.read` is a mutation
that changes admission counters and is not a read-only preflight tool. No configure mutation,
provider request, environment value dump, deploy or import. Record deployed code
version and function/component/index inventory. Inspect bounded/paginated counts,
IDs and hashes for these exact resources:

1. `marketEntries`: group keys into `asset:*`, `price:*`, `result:slot*` and
   `:part*`, `calendar:shared` and parts, `catalog:0`–`catalog:31`,
   `limitation:*`, and unknown keys. Parse every asset head and mark all referenced
   monthly keys. Record each `_id`, key, revision and checkedAt in an encrypted
   operator manifest; never put payloads/secrets in a public report.
2. `marketLeases`: enumerate every `_id`, key, token hash, expiry, cycle,
   attempts/scopeAttempts, completed/completedFrom and reviewedPolicy. Do not
   interpret expiry as authorization to delete an attempt or abandoned fence.
3. `marketBudget.global`: preserve the complete row, reviewedThrough and other
   usage, all historical admission units/calls/storage counters. Compare the
   owner's separately authorized dashboard observations without equating units.
4. `marketHosted.global`: preserve guards, revocations, active work, legacy
   visitors/buckets and new provider reservation/observation fields. Enumerate
   scheduled `hosted:expireVisitors` callbacks and rateLimiter component records.
5. `tasks` table/index and deployed `tasks:get/create/updateTask/kanyeQuote`
   functions: prove no callers before proposing function/table cleanup.
6. Existing local admission directory: with separate private-file authorization,
   back up the ledger/lock/flags/receipts with ACLs. Never delete/reset a lock,
   revocation, abandoned refresh flag or ledger to make preflight pass.

Unrecognized records, unresolved guards, active provider observations, incomplete
backups or incompatible readers stop cleanup. Historical scope revocations remain
authoritative; a new source policy/window does not clear them. No global process
cache or Vercel file persistence is presumed.

## Gate 2: backups and rehearsal

Obtain explicit target-specific backup/export approval. Capture consistent table,
component and scheduled-function state plus code/schema version and operator
manifest hashes. Verify encrypted storage/access and restore into a separately
approved throwaway target. Rehearse cold/warm, cache loss, correction, revoked and
abandoned-guard cases; prove that restoration preserves rejection and counters.
Do not restore this rehearsal over the live ledger or spend provider allowance.

The compatibility schema adds optional pending-attempt metadata, not required
columns or a table deletion. That does not backfill missing monthly payloads.
Backups/rehearsal are not permission to deploy or delete anything.

## Gate 3: explicit deployment proposal

Propose exact code versions/resources and obtain fresh approval. Deploy compatible
Convex providerFinish/admissionUnits support before the corresponding server
code. Keep legacy read/acquire/write/release/control argument shapes and decode
legacy chargedIo results. The updated server writes complete monthly payloads and
`monthly-v2` heads with `content:true` in the same existing fenced lease transaction;
it never creates a new durable guard namespace.

If approval is later given, rollout must keep old and new browser clients working
through the server contract. Browser hints are optional; the server is always the
authority. Readback/receipt and revocation compatibility must be verified before
any independently approved cleanup. Public Alpaca activation additionally requires separate
rights and bounded provider allowance approvals.

## Gate 4: exact disposable-record cleanup proposal

Only after the compatibility window, backed-up rehearsal and confirmed consumer
inventory may an operator propose an explicit ID/revision manifest of:

- `marketEntries` result slot heads/parts and calendar head/parts whose deployed
  runtime readers/writers have been removed.
- `marketEntries` monthly price/action rows proven unreferenced by EVERY remaining
  head, including `content:true` heads. The corrected runtime requires their durable
  payloads. Unknown formats stop cleanup. Recompute reachability before deletion.
- Unused template task functions/table/index and the rateLimiter component only
  after separately proving zero callers, scheduled callbacks and needed records.

No lease, attempt, budget, catalog, limitation, asset root, guard, revocation,
provider reservation, receipt, secret or unknown record is on that deletion list.
Expired leases are not disposable caches. The cleanup proposal must list exact
IDs, expected revisions, row counts/bytes, dependency proofs and per-batch bounds;
ask for approval of that concrete manifest. Abort if live revisions/consumers have
changed. There is no authorized cleanup command in this change.

## Recovery and rollback

Stop new source work with the existing activation gates under an explicitly
approved operational action. Keep revocation/guard/admission state advancing;
never restore an older ledger or clear a blocking record to regain service.
Retain the compatible durable reader/writer and observation/pending-attempt fencing
when reverting UI/batching changes. Reverting to head-only writes reintroduces
payload loss. An older backend without observation fencing is not a safe rollback;
keep admission closed and obtain an approved forward repair instead.

Rehydration requires a separate manifest of root-validated normalized payloads
from an authorized snapshot/cache or a separately approved bounded provider
refresh. Rehearse it before rollout; write/readback through existing fences and
retain correction/recovery evidence. Do not restore stale price roots over newer
corrections or revocations. Verify two-session/common-date results, all negative
guard cases and accounting continuity before reopening. If authoritative data is
unavailable, show professional unavailable/retry copy and preserve records.

## Interrupted hosted guard: approval-gated reconciliation

This procedure is source-ready, not executed. Obtain fresh target-specific approval
for each live inspection, backup, deployment and conversion; no exhausted ledger
or provider cap may be reset or bypassed. Public data rights remain separately gated.

1. Read-only preflight and encrypted backup as above. Record the exact current
   AMZN guard `695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7:AMZN`,
   retained token `846ec5fd-a2b6-46e9-835b-78713b5dbf8a`, head revision or absence,
   and asset lease token/expiry or absence. The supplied payload alone does not
   establish current state or abandonment.
2. Approve and roll out compatible backend and server source. Drain all old server
   owners and in-flight provider observations; wait beyond the lease lifetime and
   verify no live owner remains. A token alone is insufficient evidence. Keep
   admission/provider budgets unchanged. If drain cannot be established, stop.
3. Present the exact target and CAS arguments for owner approval before invoking
   internal `hosted:reconcileLegacy`: scope as above, symbol `AMZN`, retained token,
   `expectedHead` and `expectedLeaseToken` from the approved manifest (null only for
   verified absence). No wildcard operation. A CAS failure requires a new bounded
   inspection and approval; never substitute freshly observed values automatically.
4. Conversion adds metadata only; it retains the original blocker. Once provider
   allowance and use are independently authorized, one explicit Retry on a new host
   must obtain the normal lease and fully validate replacement data. Publication
   and exact guard settlement occur in one transaction. Verify the committed head,
   dependencies and guard outcome under separately approved access. Verify BA's
   historical guard/revocation, unrelated tickers and all accounting remain intact.
5. Failed validation, correction, revocation, budget exhaustion or lease loss leaves
   the blocker or durable revocation authoritative. Restore no earlier ledger to
   force success. Rollback must preserve new observation metadata and use backend
   fencing; old backend code is unsafe while new owners exist. Drain traffic and
   obtain an approved forward repair rather than removing guards.

Live deployment, retained-record CAS, provider refresh and live readback remain
unverified and unauthorized here. Synthetic success is not a claim AMZN is fixed live.


## November13 DEV compatibility rollout checkpoint

The owner authorized implementation and compatible DEV rollout in this worktree,
with a bounded real-provider task. Target `dev:stoic-corgi-586` was independently
identified and announced before each deployment-affecting operation. Backend source
adds optional pending-attempt metadata and bounded current failure summaries;
existing rows remain compatible. DEV gateway configuration and team-review fields
were updated, preserving counters/caps and all retained heads, guards and revocations.
No new deployment target, synthetic deployed fixture, production mutation, backup
import/export, legacy token conversion or cleanup ran. Main remains clean at
`a4038e7`. See [history-refresh-journal.md](history-refresh-journal.md).

A real interrupted DEV refresh retained three exact observations and original
failure summaries. Normal explicit Retry acquired fenced replacement leases,
validated provider data, atomically published/read back the heads and settled only
those guards. Readback retained current-cycle attempts2 and completed heads.
No operator finish/delete or mutation of existing rows manufactured this test.
The initiating interruption was a task-harness allowance refusal; it does not
establish the original production cause.

Production remains a separate approval step: obtain a consistent read-only manifest,
confirm actual deployed versions/counters and team/provider headroom, drain old
owners, back up/rehearse, then propose the exact compatible rollout. Any token-only
legacy conversion still needs its separately approved exact CAS arguments. Do not
assume DEV success authorizes production deployment, cleanup, broader lineage
exceptions or a ledger/attempt reset. A code rollback must preserve pending-attempt
and observation fencing or stop admission and fail closed.

November13 durable-payload rollout note: the worktree now persists monthly payloads
and head atomically; it does not rewrite old deployed head-only rows automatically.
Before production: separately approve target, snapshot/drain/rehearsal and exact
bounded recovery for existing missing chunks/guards/attempts. A normal-limit DEV
restart now succeeds with spent attempts because complete data exists. Do not infer
that deploying code alone makes every legacy production head complete. Retain all
revocations and narrow lineage rules; no reset/delete/reclassification authorized.
