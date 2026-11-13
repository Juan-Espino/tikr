# Approval-gated deployed cleanup and rollback

This is a runbook, not executed migration. No deployment, live inspection,
backup/export/import, secret change or record deletion occurred in this task.
The deployment identity and concrete record IDs remain unknown because private
configuration/live access were not authorized. The steps below generate exact
ID/revision manifests before requesting approval; wildcard deletion is prohibited.

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

No source schema change is needed for this redesign. Backups/rehearsal are not
permission to deploy or delete anything.

## Gate 3: explicit deployment proposal

Propose exact code versions/resources and obtain fresh approval. Deploy compatible
Convex providerFinish/admissionUnits support before the corresponding server
code. Keep legacy read/acquire/write/release/control argument shapes and decode
legacy chargedIo results. The updated server may then read old monthly manifests
and write `monthly-v2` asset heads with `content:true` in the same existing lease
transaction; it never creates a new durable guard namespace.

If approval is later given, rollout must keep old and new browser clients working
through the server contract. Browser hints are optional; the server is always the
authority. Readback/receipt and revocation compatibility must be verified before
reducing durable history. Public Alpaca activation additionally requires separate
rights and bounded provider allowance approvals.

## Gate 4: exact disposable-record cleanup proposal

Only after the compatibility window, backed-up rehearsal and confirmed consumer
inventory may an operator propose an explicit ID/revision manifest of:

- `marketEntries` result slot heads/parts and calendar head/parts whose deployed
  runtime readers/writers have been removed.
- `marketEntries` monthly price/action rows not referenced by any remaining legacy
  head. A `content:true` head does not require durable monthly rows, but unknown or
  legacy heads do. Recompute reachability immediately before deletion.
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
Retain the new compatibility reader when reverting UI/batching changes: an old
reader cannot reconstruct monthly payloads that were deliberately not persisted.
A full code rollback may therefore fail closed until approved rehydration.

Rehydration requires a separate manifest of root-validated normalized payloads
from an authorized snapshot/cache or a separately approved bounded provider
refresh. Rehearse it before rollout; write/readback through existing fences and
retain correction/recovery evidence. Do not restore stale price roots over newer
corrections or revocations. Verify two-session/common-date results, all negative
guard cases and accounting continuity before reopening. If authoritative data is
unavailable, show professional unavailable/retry copy and preserve records.
