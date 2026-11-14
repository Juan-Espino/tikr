# On-demand market-data cache

Current implementation and trust protocol are documented in
[market-redesign-checkpoint.md](market-redesign-checkpoint.md). This document
now includes the November13 durable-payload correction below. Monthly history is
durable; derived portfolio results remain bounded process caches.

The browser owns IndexedDB monthly hints (8 MB / seven days), not authoritative
history. Every operation visits the server. The server compares the complete
normalized asset with the fresh durable manifest root before publishing browser
content to process memory or calculating results. Revocation/guard rejection,
evidence expiry, malformed history and known corrections always override hints.

The process history cache is 8 MB / 24 hours; derived results are 4 MiB / 24 hours.
These are encoded-payload bounds, not complete runtime memory guarantees. Calendar
coalescing and provider batching are process-local. Shared per-asset refresh
leases, attempts, authoritative roots, hosted admission and revocations remain in
Convex; no process map is described as global coordination.

Wider history covers shorter ranges. Expansion fetches missing older coverage and
rechecks the latest five sessions; each daily cycle repeats the correction window.
Actions in refreshed windows replace old actions. Portfolio edits recalculate
from unrounded normalized values using the original decimal/payment-date engine.
Missing coverage/actions block rather than silently shorten or omit a holding.

IndexedDB denial, eviction, expiry or corruption is a cache miss. Multitab writes
are transactional; stale hints still require server validation. Restart loses
process caches; valid browser hints can rehydrate authoritative roots. If both
copies are lost, durable monthly chunks rehydrate history only after complete
validation against the current root. Old head-only records without matching chunks
still fail closed and retain the
existing retry/cooldown/attempt gates.
There is no automatic allowance reset, namespace rotation or cross-instance
acceptance shortcut. Offline use does not accept a server-rejected financial result.

Legacy monthly history remains readable; new runtime writes atomically persist
monthly payloads with authoritative heads. Legacy result/calendar rows remain untouched
and unused. The original durable coordinator remains the compatibility adapter
for leases, revision dependencies and recovery, with disposable storage wrappers.
See `market-source-inventory.md`, `market-accounting.md` and the approval-gated
`market-deployed-cleanup.md` before operating a deployment.


## November13 cache-loss correction

A fresh head is metadata, not proof that disposable content is present. Cache loss
now falls through to ordinary admitted reconstruction rather than an unexplained
`REFRESH_FAILED`. Missing/corrupt monthly content never becomes a financial result.
An explicit Retry first validates reusable source content, so a missing holding
does not force a healthy SPY refresh. Re-fetching lost wider content preserves its
authoritative coverage boundary, clamped to the supported source window. The
requested calculation still starts at its own selected period.

Retained legacy reconstruction does not restore durable history writes or accept
old data by age/policy alone. Its complete reconstructed root must match the current
server head. Tests reject a retained monthly row with a valid self-hash but a
mismatched complete root. Once all disposable and matching legacy copies are lost,
an exhausted daily source allowance remains an honest operational limit. No reset,
implicit period shortening or unbounded reconstruction allowance is introduced.

Traceable retained-state and real DEV evidence is in
[history-refresh-journal.md](history-refresh-journal.md). Production migration and
cache durability remain separate decisions.

## November13 durable payload correction (supersedes head-only storage)

A fresh failing-before regression demonstrated that the history wrapper omitted
monthly price/action records from Convex writes. Authoritative roots survived,
but fresh browsers/processes could not reconstruct those assets and admission
then returned daily cooldown. This establishes a DEV defect, not the original
production incident's unknown trigger.

The wrapper now commits bounded monthly payloads with their head in the existing
fenced transaction. Browser/process copies remain accelerators, authenticated by
the current full-asset root; malformed hints are discarded and durable payloads
can replace them. Forged self-consistent monthly hashes cannot bypass the root.
Current/unknown revocations, lineage exceptions, full requested periods and all
financial methodology remain unchanged. No new service/schema/backfill is needed.
Old head-only entries become durable on the next legitimately admitted refresh;
existing records are not deleted/reset or declared complete by migration.

Gateway calls now share the bounded process write queue to reduce self-contention
on global accounting/control documents. This does not remove cross-instance
transaction conflicts; real acceptance and safe error diagnostics remain necessary.
