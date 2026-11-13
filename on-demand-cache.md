# On-demand market-data cache

Current implementation and trust protocol are documented in
[market-redesign-checkpoint.md](market-redesign-checkpoint.md). This document
supersedes the earlier proposal that durable monthly history and portfolio-result
slots should remain the principal runtime cache.

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
copies are lost, fail closed and retain the existing retry/cooldown/attempt gates.
There is no automatic allowance reset, namespace rotation or cross-instance
payload cache. Offline use does not accept a server-rejected financial result.

Legacy monthly history remains readable during migration, but new runtime writes
contain only authoritative heads. Legacy result/calendar rows remain untouched
and unused. The original durable coordinator remains the compatibility adapter
for leases, revision dependencies and recovery, with disposable storage wrappers.
See `market-source-inventory.md`, `market-accounting.md` and the approval-gated
`market-deployed-cleanup.md` before operating a deployment.
