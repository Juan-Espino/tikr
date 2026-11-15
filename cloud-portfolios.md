# Account cloud portfolio runbook

Owner approved cloud saving, removed browser-to-cloud collection import completely
on 2026-11-15, reports testing the other features, and authorizes commit/push/PR.
Merge, production config/deploy/data access and paid services remain separate.

## Behavior

Signed-in create/read/update/rename/duplicate/pin/delete use the account Convex
collection. Guests retain browser-local definitions/drafts, search and history.
Sign-in never automatically saves local work. A guest draft can be continued and
explicitly saved; existing guest originals stay unchanged. There is no browser-
collection import UI/API/source field/index/provider path.

Names are unique per owner ignoring case/trim. Duplicate opens a new unsaved draft
requiring a user-chosen unique name; delete requires confirmation. Pin saves only
pin state, retaining other unsaved edits. Preserve six holdings, positive exact
100% weights, deterministic equal rounding, valid starting amounts, 1W defaults,
explicit ranges and guest migrations. Comparisons use the active owner or guest
collection and shared dates/amount/methodology. Market history/results stay on the
shared pipeline; no per-portfolio results or profile table are persisted.

Cloud writes are acknowledged only after the mutation returns. Offline writes are
refused with edits retained in the tab and explicit retry. No guest fallback or
persistent offline queue. At most one write is in flight per provider; the SDK may
finish/retry that request after disconnection, without a false synced claim.
Unsaved account edits are memory-only and do not survive reload/logout/expiry.

## Ownership and concurrency

Every private function resolves a verified JWT and live Better Auth component
session, checks the session/user association, and derives the owner from
identity.tokenIdentifier. Browser owner/user/email arguments are never trusted.
ID/name reads use owner indexes. Lists paginate active owner rows, at most100 per
page. Guest lists are empty; private reads/writes refuse guests/wrong owners.
Server validation repeats financial/name/range/input bounds.

Mutations also compare a session fence to the verified session ID so pending
requests cannot cross accounts. Providers remount by account/session, separate
query cache entries and display only server-tagged rows for the mounted account.
Session-check failures hide private views while retaining in-tab edits. Confirmed
logout/account change/expiry discards private state. Auth refreshes on focus and
every60 seconds online, with a local known-expiry timer. Server checks independently
refuse expired/revoked sessions.

Updates/deletes require the opened draft revision. Serializable transactions and
indexed name checks settle races atomically. Stale writes retain edits and offer
explicit cloud reload or duplication with a new name; remote updates never replace
an active draft automatically. Normal create retries are idempotent by owner/client
ID. Deleted IDs cannot be recreated by late writes/create retries. Deletion scrubs
name/holdings/amount but retains a minimal owner/client/revision/timestamp receipt
with an empty definition. Do not remove receipts to troubleshoot. Account/auth/
receipt retention and deletion remain open owner decisions, not implemented UI.

## DEV review

From C:/Users/JuanE/.t3/worktrees/tikr/t3-account-cloud-portfolios run:

```powershell
pnpm.cmd dev --hostname localhost --port 5000
```

Use the integrated browser at http://localhost:5000. Human Google/MFA belongs to
the owner; no password/cookie/token/browser-state export. Callback stays exactly
http://localhost:5000/api/auth/callback/google.

Ignored .env.local binds DEV stoic-corgi-586 with matching public cloud/site URLs.
Owner also authorized privately reusing six existing server-side DEV market
settings: market URL, DEV admin key, personal activation/mode and APCA credential
pair. URL/key binding was verified; auth public bindings stayed unchanged. No
production backup/key or auth secret was copied. Credentials stay ignored/server-
only, absent from browser assets. No new dependency/service. Existing pnpm10.11.0,
Convex1.46.0, Better Auth1.7.25/component0.13.0 remain.

The compatible DEV source update removes import API/schema/index without deleting
portfolio/auth/market records. Existing admission ledgers, locks, guards,
revocations and counters stay intact. No old operational quota is restored.

## Evidence and limits

See plan.md for final commands/results. Automated transaction tests cover A/B
mocked live component identities + guest, owner/impersonation/session refusal,
atomic names, revision/delete/session fencing, exact financial/range validation,
create retry idempotency and scrubbed receipts. Removed transfer arguments are
rejected. Synthetic browser tests use real app components with test-only auth/
Convex transport, headless Chrome and disposable storage, making no provider/DEV
calls. They cover draft handoff, absent import control, local-byte preservation,
focus/mobile, offline/error/pending/retry, pin-only writes, conflicts/deletion,
expiry/session-error recovery and mismatched account-query suppression.

Real assistant-observed DEV checks passed: login, cloud CRUD/reload, amount/pin,
unsaved duplicate, two-tab stale refusal/reload, independent same-account session,
logout/private-ID refusal and unchanged local hashes. QA records only; no owner
local records were rewritten. Six successful portfolio writes and one refused
stale update were driven; exact DB/auth/query billing totals were not measured.
After owner-authorized DEV market connection, one SPY1W probe returned ready with
six shared points for 2026-11-06..13 and personal-provisional quality; logs observed
three provider HTTP200 responses (calendar/bars/actions). Counters continued intact.
Owner now reports testing the other features; that is owner verification, separate
from assistant observations. A second real Google account is unavailable, so real
cross-account browser verification remains unverified; automated A/B tests are
separate evidence. Removed import has no remaining acceptance requirement.

## Rollback and production rollout

PR creation does not authorize production publication. Classify/announce the target
with convex-deploy-guard before any separately approved production action. Preserve
existing production Google/auth/market configuration; never copy DEV keys/flags or
ignored env files to production. Cloud saving requires the additive portfolio
schema/functions on the same production Convex deployment as production auth.
Coordinate backend/frontend rollout without changing auth/market records/config.

Review final diff/checks and retention/privacy decisions before release. After an
approved rollout smoke-test login, save/reload, guest preservation, logout and
conflicts. Record the unavailable second-account test honestly. Market rights and
four deferred Post-MVP polish items remain separate and unchanged.

For rollback stop writes and preserve cloud rows/deletion receipts. Show cloud
editing unavailable rather than silently saving account edits locally. Reapply
only a reviewed compatible source version to the classified target; never drop the
table or reset auth/market/receipt state. Later destructive migrations require a
separately approved backup/recovery plan. No destructive rollback is authorized.
