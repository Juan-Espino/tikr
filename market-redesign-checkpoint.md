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

# Alpaca / Convex redesign

Implementation in the dedicated history-refresh worktree, based on merged PR18
at `a4038e7`. Owner authorizes compatible DEV stoic-corgi-586 rollout and bounded
real DEV verification. No production mutation, publication or provisioning.

## Responsibilities and trust boundary

The browser owns portfolio definitions/drafts and a disposable IndexedDB history
cache. It sends bounded monthly price/action hints, never credentials. It always
requests server validation before using history; there is no offline financial
result acceptance. Amount, weight, range, comparison and submit-time name behavior
remain unchanged. Source/feed/methodology version and month are in the cache key;
monthly content digests travel with records. Coverage and the complete normalized
asset revision are bound by the server's durable manifest.

The Next server validates requests, catalog membership, the calendar and raw SIP
normalization, runs the decimal/payment-date engine, and checks shared guards and
revisions. Each browser monthly digest must match its payload; the complete
assembled asset must then match the authoritative manifest root. Only after that
root check may a hint populate shared process memory. A forged hint cannot poison
another request's trusted cache. Existing server results can independently be
valid even when a browser hint is rejected.

Convex retains necessary shared asset manifests (metadata, month keys, root
revision and checked time), refresh leases/attempts, admission budgets, catalog
membership and hosted guards/revocations. November13 correction: monthly payloads
now persist atomically with the head to survive loss of browser/process copies.
Portfolio results and calendar remain process caches. The manifest's `content: true`
retains compatibility with root-validated browser hints; it no longer means payload
storage is omitted. The existing
`monthly-v2` metadata and root revision preserve atomic head write, lease
completion and recovery readback. Source schema and existing records are retained.

## Batching, coverage and freshness

Client requests started together are grouped in envelopes of at most three, with
unique monthly hints. Results stream independently, preserving the dashboard's
bounded wait and individual failure behavior. Starting amounts remain per card;
comparisons retain one shared amount and period. A batch over the transfer bound
uses individual bounded requests instead of dropping history or holdings.

Provider loaders combine unique symbols with the same date/feed query, including
SPY once. A process allows two active provider batches, bounded pagination,
received-body bytes, bars and actions, and zero automatic runtime retries. Shared
per-symbol Convex leases—not process maps—coordinate distinct instances. The
server still performs authoritative checks for each operation.

A wider validated asset covers shorter requested periods without provider work.
Expansion fetches a missing prefix plus the five-session correction window;
next-cycle refresh fetches that window through the new completed endpoint. Very
short calendars use a single complete query. The final asset merges ranges and
replaces actions in refreshed windows; it is validated in full before commit.
Missing leading/interior prices, unsupported actions and provider failures block
the requested result. No dates/holdings are silently shortened or omitted.

Calendar eligibility remains next-day 09:00 New York, with two completed common
sessions, raw SIP prices and identical SPY methodology. This buffer and the
provisional policy do not establish provider finality or exhaustive action rights.

## Cache lifecycle and failure behavior

| Cache | Bound / expiry | Validation / loss behavior |
| --- | --- | --- |
| IndexedDB monthly hints | 8 MB encoded payload; seven days; newest writes retained | Protocol/month identity; server root validation every operation; missing/corrupt/unavailable/blocked IDB is a miss |
| Process monthly content | 8 MB encoded payload; 24 hours; oldest insertion eviction | Namespace/source/feed/methodology plus authoritative asset root; publish only after full validation |
| Process derived results | 4 MiB encoded payload; 24 hours; oldest insertion eviction | Current durable asset dependencies, calendar, freshness cycle and evidence expiry checked |
| Calendar | One current-cycle process promise | Refetched after restart; no durable calendar cache or cross-instance coalescing claim |
| Catalog | Existing bounded minute memos and seven-day durable catalog | Catalog eligibility does not prove history/action availability |

Bounds exclude JavaScript/IndexedDB implementation overhead. Temporary request and
calculation memory is additional. Multitab IndexedDB writes are transactional;
last-writer hints may be stale but cannot override the server root. The browser
stores no durable portfolio-result cache. On storage denial or quota failure,
work continues using the server cache when possible.

Restart/multiple instances lose independent process state. Browser hints can
rehydrate a current manifest without provider work. New durable monthly payloads
also survive loss of both disposable caches. Old head-only records without
matching payload still fail closed. Explicit retry uses existing
shared attempt/cooldown/resource gates; it is not an entitlement to another
provider call (except the separately configured DEV-only relief). Exhausted attempts or an abandoned legacy guard can therefore
require operator reconciliation. No automatic fresh namespace or record reset is
used to recover availability. Offline requests end unavailable after the bounded
network timeout; previously rejected results are not accepted offline.

Historical local revocation flags, legacy ledger revocations and guards are
checked across source scopes. Hosted historical revocations conservatively block
history checks even after a source-window change; old guards for a requested
symbol remain blocking. Valid current-scope recovery still commits/readbacks an
exact revision and preserves original guard records/receipts. Cross-scope
uncertainty fails closed until an approved reconciliation.

## Accounting and operational acceptance

See [market-accounting.md](market-accounting.md) for separate measurements,
retained controls and capacity uncertainty. The old local 750 MB development
counter is not the owner's Convex dashboard I/O. No historical charges were
reclassified/refunded, no ceiling raised and no policy identifier bumped.

See [market-source-inventory.md](market-source-inventory.md) for every market
resource and consumer decision, and
[market-deployed-cleanup.md](market-deployed-cleanup.md) for exact approval gates,
backup, migration and rollback requirements. This source change is not a deployed
migration. Public display/cache licensing remains a separate activation gate.

## Verification evidence

The Node, Convex transaction, streaming API and browser suites exercise synthetic
inputs only. PR #16's merger decoding, correction/recovery, concurrency, period,
1W migration and submit-time naming behavior remain regression requirements.
`market-history-acceptance.md` records earlier live acceptance, not authorization
for new live requests. Terra Medium completed 16/16 independent browser cases. See
`market-browser-acceptance.md` for exact fallback/observed scope and `plan.md` for
final commands, the baseline formatting limitation and review readiness.
