# Production history rollout and recovery proposal

Status: reviewable procedure only. Apart from the explicitly authorized metadata
inspection below, no production inventory, snapshot, migration,
refresh, CAS, deployment or cleanup was performed for this document. Each live
operation below needs the owner's target-specific approval. The earlier retained
fixture is historical evidence, not the current production manifest. The original
production incident's initiating cause remains unknown.

This procedure uses the existing internal functions and hosted runtime. It adds
no operator backdoor or general database overwrite. Production must not receive
the DEV refresh-relief flag; its exact platform-URL guard also rejects production.
The skipped next-day live acceptance test remains skipped; this runbook schedules
no task or automation.

## Confirmed AMZN production guard inspection ? 2026-11-14

Owner authorized guard/lease/head metadata reads only on `warmhearted-tapir-205`.
At 15:41:32 UTC, two read-only system queries inspected hosted state and leases;
both result sets were complete. No provider request, mutation or deployment ran.
The existing v5 AMZN guard still has token `846ec5fd-a2b6-46e9-835b-78713b5dbf8a`.
There is no matching observation or failure summary. AMZN lease token is
`981f824e-de5c-4988-83b3-6eb67feacc55`, expires `0`, completed `false`.
SPY has no guard and has a completed, expired lease. The historical v3 revocation
remains present. These reads confirm a current legacy AMZN blocker; they do not
establish why the original worker stopped. No head was read: the existing
`market:read` entry point is a mutation and was intentionally not invoked.

Recovery remains approval-gated: drain relevant work, obtain a read-only exact
AMZN head revision (or verified absence), snapshot the relevant metadata, and
recheck the guard and lease tokens. Then separately approve the existing
`hosted:reconcileLegacy` exact-CAS call using those fresh expected values. It
retains the guard while creating an expired observation; the next admitted,
validated refresh must publish/read back replacement data before exact guard
settlement. Do not delete guards, reset counters, or remove revocations.
The isolated hosted-runtime regression passes this recovery sequence.
The frontend deployment alone does not migrate this retained database state.

## 1. Freeze the proposed artifacts and allocation

Before asking for rollout approval, attach the reviewed source/build hashes,
Convex schema/function versions, server configuration-key inventory (no values),
and rollback artifact hashes. The worktree is uncommitted: a future reviewed
release identifier is a required field, not an invented SHA in this runbook.

Name the exact production deployment and frontend target from fresh authorized
evidence. Confirm their URLs/account belong together and that no deploy-key or
CLI default points elsewhere. Apply `convex-deploy-guard` separately before each
approved operation. DEV `stoic-corgi-586` success is not production authorization.

Approve one finite provider-request/body-byte/Convex-call allocation for recovery,
with current team plan/usage and provider quota evidence, a dated review expiry,
and a persistent cumulative journal. Reserve headroom for other features and
active traffic. Include backup/inventory/control calls in the allocation; exact
DB operations and billed I/O are separate measurements. The DEV task's remaining
48 calls are not a production allocation. Do not auto-increase limits or refund
historical counters when work is blocked.

## 2. Read-only inventory with exact classifications

Use bounded paginated read-only operator tooling, not `market:read` (a budgeted
mutation), `configure`, gateway calls or a provider request. Keep payloads and
tokens in an access-controlled encrypted operator artifact; publish only hashes,
counts, timestamps and approved symbol identifiers. Obtain these fields:

| Resource | Required inventory |
| --- | --- |
| Each requested asset and SPY | Exact document ID/key/root revision/checkedAt; manifest format/evidence revision, from/through/pending session, referenced monthly keys and payload hashes; missing or malformed referenced rows |
| Each referenced monthly row | Exact ID/key/revision, payload hash and size; reconstruct all prices/actions and compare the FULL normalized asset root, not just individual self-hashes |
| Asset lease | ID/key/token in private manifest, expiry/cycle/attempts/scopeAttempts/attemptedAt, completed/completedFrom/reviewedPolicy/pendingAttempt |
| Hosted global state | Complete row hash and private copy; guards, observation token/leaseToken/expiry, current failure summary, revocations, active requests, provider reservations and legacy fields |
| Budget global state | Full row, all historical counters, month/reviewedThrough/other-usage review, plus fresh independent team evidence |
| Deployment/runtime | Actual code/schema/index/component versions, configuration key names and activation state; all old server owners and scheduled jobs capable of writes |

Classify each target explicitly:

1. **Complete current payload:** all referenced rows reconstruct the exact current
   root. No provider repair. Test a new process/browser with a different amount
   and no hints, subject to separately approved normal admission checks.
2. **Head-only or mismatched payload:** a root is metadata, not available data.
   Do not stamp it fresh, synthesize rows or infer missing history from a browser.
   Mark it for a bounded validated refresh through the current runtime.
3. **Current observation active:** wait for the owner or stop under approved drain.
   Expiry alone does not prove all old hosts have stopped.
4. **Current observation expired:** normal explicit Retry may reclaim atomically,
   subject to current revocations, scope, daily attempts, cooldown and shared budget.
5. **Token-only legacy guard:** needs the exact operator CAS below after drain.
6. **Revoked or unknown scope/format:** keep blocked. Only the existing exact
   `supersededMarketScope` v3/v4-to-reviewed-v5 exceptions apply. No new window,
   policy string, inactivity assumption or allowlist change authorizes recovery.

An unknown state, missing page, duplicate key, inconsistent manifest or incomplete
backup stops the proposal. Record the current retry time where available. Inventory
must include SPY: an unrepaired benchmark can block every otherwise healthy portfolio.

## 3. Snapshot, drain and offline rehearsal

After separate approval, take a consistent encrypted snapshot of tables, component
state and scheduled functions plus code/configuration inventory and manifest hashes.
Verify restore integrity in a separately approved isolated rehearsal target. No
production snapshot is copied into this worktree or current DEV records.

Rehearse the complete classifications above with normal production limits and
synthetic provider data first. Preserve original counters/revocations in the
rehearsal; never interpret a test-only clock as permission to reset live state.
Include the actual argument validator, missing monthly rows, full-root mismatch,
token-only/expired/active observations, late old-worker writes, provider failures,
budget exhaustion and a fresh browser/process without hints. An unexpected failure
must be fixed and the relevant rehearsal repeated before rollout.

Under separately approved operational gates, stop new source admission and drain
all old/new frontend instances and provider workers that can write. Keep existing
revocation and accounting state. Wait beyond all observed lease/observation expiries
including the bounded progress extension (up to two minutes from attemptedAt),
then verify no owner is active and re-read exact target heads/leases/guards. A fixed
sleep, absent dashboard activity or expired token is not sufficient drain evidence.

No real refresh starts while activation gates are closed. Reopening a controlled
recovery window is a separate approved step with its own finite allocation.

## 4. Compatible rollout, then exact legacy CAS if needed

Deploy the reviewed compatible backend/schema before its corresponding server:
optional pending-attempt metadata, observation/fencing/failure handling and atomic
publication must be present. Then deploy the server that writes durable monthly
payloads, projects write fields, validates whole roots and uses the bounded hosted
deadline. Do not deploy old writers alongside it during recovery. Code deployment
alone does not restore old missing chunks.

For each token-only guard that is still in the approved manifest, present this
concrete operation with privately supplied exact values for approval:

```json
{
  "function": "hosted:reconcileLegacy",
  "args": {
    "scope": "695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7",
    "symbol": "<ONE_APPROVED_SYMBOL>",
    "token": "<CURRENT_EXACT_GUARD_TOKEN>",
    "expectedHead": "<CURRENT_EXACT_HEAD_REVISION_OR_VERIFIED_NULL>",
    "expectedLeaseToken": "<CURRENT_EXACT_LEASE_TOKEN_OR_VERIFIED_NULL>"
  }
}
```

This is a non-executable template, not approval for AMZN or any historical token.
Replace a verified absence with JSON null, not the string above. The implementation
accepts ONLY the reviewed v5 scope, an unchanged exact guard with no observation,
an expired/absent lease matching the supplied token, and the supplied head revision
or absence. It creates an expired observation while RETAINING the guard; it does
not validate data, consume a provider attempt or make that asset readable. It still
charges normal admission units. This internal function is not gateway-exposed.

On `RECONCILIATION_CHANGED` or any different precondition, STOP. Obtain a new bounded
inventory and new approval; never replace CAS values automatically. For a future
scope or unknown historical guard, this function is not an authorized general
migration. Leave the blocker in place and propose a separately reviewed procedure.

## 5. One admitted validated recovery at a time

Open only the approved recovery window, use the reviewed server, and submit one
explicit Retry for a listed target. Prefer one holding plus SPY initially; reuse
the same warm benchmark. Set the requested period from the actual requirement,
not a shorter range or fake expansion chosen to bypass admission. No fake policy,
scope rotation, `configure` reset, direct `marketEntries` write or DEV relief.

The current runtime must perform this sequence:

1. Current/unknown revocation and guard checks; exact normal lease acquisition.
   Rejected/busy/guarded requests do not spend a provider-attempt allowance.
2. `hosted:control` begin checks catalog, observation and lease ownership before
   committing pending attempt counters. An old owner cannot acquire the new fence.
3. Existing Alpaca normalization validates complete requested coverage/actions,
   shared eligible sessions, corrections and the unchanged financial methodology.
   Missing prices, unsupported actions or unknown evidence fail specifically.
4. Bounded progress, then `market:write` with exact lease and guard tokens. Monthly
   payloads and authoritative head publish atomically. The transaction verifies its
   head readback and settles only that observation/guard/failure. No operator finish
   or guard deletion substitutes for this commit.
5. Under approved access, verify matching full-root reconstruction from durable
   chunks, completed lease/from/attempt counters, exact guard settlement and
   unchanged unrelated guards/revocations. The initiating safe failure must remain
   available while blocked; successful settlement removes only its current summary.

If normal allowance is exhausted, retain it and report the exact returned retry
time. This implementation offers no production override for that condition. Wait
for legitimate eligibility or propose a separately scoped recovery policy change;
do not imply the rollout repairs that row immediately. Avoid repeated provider
calls to reproduce the same known refusal.

Keep exact initiated provider HTTP/body bytes, Convex HTTP and admission estimates
in the approved journal. Interrupted body reservations stay retained. Stop before
the finite remaining allocation/headroom would be insufficient for safe completion
and readback. A paid plan or provisioning change is not implicit authorization.

## 6. Acceptance and stop criteria

Proceed beyond the first repaired asset only when it passes:

- New process/browser with no hints, normal production limits and spent attempts
  reads complete durable history without a bars/actions request.
- Every requested holding and SPY appears, selected dates are not shortened, start
  cash and date arrays match, and chart endpoints/statistics agree.
- Warm reads, comparisons and amount/weight edits reuse validated history. Current
  and unknown revocations, stale-owner publish and partial-data probes fail closed
  in rehearsal. Do not deliberately corrupt production records to test negatives.
- Within the same accounting month/cycle, budget counters retain their history
  except the existing exact newly settled provider reservation mechanism. Record
  legitimate automatic month/cycle transitions separately; never force one or
  manually reset/refund history. Unrelated state is preserved.

Stop on a CAS mismatch, live owner, new revision/correction, revocation, incomplete
data/actions, unknown error, lease loss, timeout, accounting discontinuity, capacity
exhaustion or unsupported schema. Preserve the trace/stage/code/timestamp, counters
and blocker. A specific permanent data limitation is an honest blocked outcome,
not permission to fabricate data or mark the migration complete. Latest retained
logs are bounded evidence, not proof that no errors ever occur.

## 7. Rollback and handoff

Close new admission under approval and drain before rollback. Never import an old
budget/guard/revocation snapshot over advancing production state. Keep the compatible
backend and durable reader/writer if reverting the UI; an older backend that lacks
pending-attempt/observation fencing is NOT a valid live rollback while new records
or workers exist. Keep service unavailable and use a reviewed forward repair if
that compatibility cannot be preserved.

Do not overwrite a newer root with an older snapshot, clear an abandoned guard,
delete referenced chunks or replay old lease tokens. Snapshot restoration is for
the isolated rehearsal unless an exact production restore is separately approved.
There is no authorized destructive cleanup in this rollout.

Record repaired/unrepaired assets, exact approved artifact hashes, before/after
state hashes, retained blockers, safe failure references, actual costs and remaining
allocation. Reopen normal traffic only after approved readback/acceptance. Public
display/cache rights, provider finality, older corporate-action corrections and the
unknown original incident cause remain distinct release limitations.

## Recovery hardening and exact inventory command (2026-11-14)

New source rejects refresh begin without exactly one symbol and a matching live
lease. This prevents new token-only guards; do not enable an old-host compatibility
bypass. Drain old hosts before migration. Runtime waits at most two seconds with
eight control rechecks for an active owner, then returns a bounded blocked state;
it does not promise recovery during every outage or wait indefinitely. Expired
modern observations recover automatically without explicit Retry.

After deployment of the reviewed backend, authorized operator tooling may invoke
internal query `hosted:recoveryMetadata` with `symbols: ["AMZN", "SPY"]` and
`asOf: <fresh UTC epoch milliseconds>`. For other ticker batches use at most 19
symbols. The explicit time prevents cached query classifications surviving expiry.
The query returns exact head/lease/guard CAS values without financial payloads.
Classification describes each guard, not a waiver of global revocation checks.
The query is not available through the public gateway and is not yet deployed to
production. Existing production read authorization does not authorize its rollout.

Final checks: 69 Convex/runtime tests passed; a new regression against original
HEAD fails because lease-less begin succeeds, then passes with hardening. Source
review found a query-clock caching issue, corrected using explicit asOf and an
expiry-without-write test. No live provider request was needed for this work.
DEV CLI deployment traffic is not instrumented as exact HTTP/DB operations.
Historical incident cost remains two production metadata HTTP reads, separately
journaled; no counter reset/refund or production mutation.

Best estimate, not an established root cause: the original AMZN worker stopped
before completing publication/cleanup. Its expired incomplete lease and token-only
guard are consistent with older execution being terminated, timing out, or failing
on provider/storage work. A healthy browser connection does not exclude any of
those server-side events. No retained failure summary identifies which happened.

Final validation: DEV stoic-corgi-586 deployed successfully after the query-clock
fix. Credential-cleared production build passed. Sol Low review/recheck passed.
The owner HTTP review process still uses its previously built runtime; it has not
been restarted onto this new build. No new real-browser matrix was run.

## Authorized production AMZN repair completed ? 2026-11-14

Owner explicitly approved the AMZN-only repair and bounded replacement request.
Target was production warmhearted-tapir-205; no code deployment or environment
change occurred. Read-only preflight found zero unexpired hosted active entries,
the exact retained legacy guard and expired incomplete AMZN lease. Relevant
metadata was backed up locally before mutation. The CAS used head revision
`de66fdf19795939a6373669118d47d89bb61d23a2e8478010a88d742e8b2ec10`, guard token
`846ec5fd-a2b6-46e9-835b-78713b5dbf8a`, lease token
`981f824e-de5c-4988-83b3-6eb67feacc55` and the reviewed v5 scope. It succeeded.

One public AMZN-only 1W request (no explicit retry) returned HTTP 200 ready at
2026-11-14T16:12:04.730Z in 2782 ms, 47673 response bytes. AMZN portfolio and SPY
both had six finite points spanning 2026-11-06 through 2026-11-13. Readback confirms
monthly-v2 content replacement, completed lease/expires zero, AMZN guard settled,
and every other guard and revocation unchanged. No blanket delete/reset occurred.
The new AMZN head revision is
`70c8512d6f112a9657674a2f374f5485cdcde04f6e9f119c902340019f852c21`.

Cost: two direct read-only Convex HTTP requests, one exact-CAS mutation HTTP
request, one public market HTTP request. Internal backend Convex call/DB operation
counts and provider HTTP/body bytes were not instrumented by this public endpoint;
these are unknown, not zero. No repeated live matrix or automatic retry was run.
Private local metadata snapshots and the cumulative operation journal are under
LOCALAPPDATA/Tikr/task-journals/prod-amzn-repair-2026-11-14. No credential is stored
there. This repairs the existing AMZN blocker only; uncommitted prevention hardening
is deployed to DEV and still requires a reviewed production code rollout. Original
worker termination reason remains unknown. This check is not financial certification.
