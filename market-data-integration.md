# Personal market-data integration

Current architecture: [market-redesign-checkpoint.md](market-redesign-checkpoint.md).
This replaces the earlier durable-history/result-cache integration description.

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

The server keeps only asset roots/metadata, shared admission/fencing/attempts,
revocations and validated catalog state in Convex. Monthly normalized history is
browser/process disposable content. New calendar and derived-result writes are
removed. Legacy monthly manifests remain readable; shared guards and historical
revocations are never bypassed by a new cache identity. Recovery still binds the
atomic committed head revision to readback receipts. Files/process memory are not
shared or durable on Vercel.

See `on-demand-cache.md` for restart, cache-loss and multitab behavior;
`market-accounting.md` for control units versus measurements; and
`market-deployed-cleanup.md` before any deployment or record cleanup. Source schema
is unchanged and deployed records have not been deleted or reset.

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
