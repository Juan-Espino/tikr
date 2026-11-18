# Current status - 2026-11-17

See [plan.md](plan.md) for the controlling MVP status and [account-deletion.md](account-deletion.md)
for deletion/privacy implementation and gaps. Latest explicit owner instructions control.

## Historical decisions and evidence

Everything below is historical context. Latest explicit owner decisions and the
current summary control; older explicit-Save instructions are superseded by PR27.

## Automatic creation and local review - owner approved 2026-11-16

Supersedes earlier explicit Create in account / sign-in-never-saves requirements.
A signed-in portfolio with a nonblank valid name, at least one holding, valid
allocation and amount is created automatically after 500ms; name-only/empty work
remains temporary. The active guest/example-copy draft recovers through sign-in
and saves automatically to that account when valid. Originals remain read-only.
No legacy collection import or cross-account recovery is added. Creation and
updates share one serialized coordinator, stable client ID, revision fences,
bounded retries, and exact idempotent replay of uncertain creates. Newer edits
remain editable during creation. No cloud save acknowledgement is implied by login.
Name conflicts require correction; invalid edits keep the last valid cloud state.
Private account work remains in memory; temporary guest recovery is account-bound
before creation and settled only after acknowledgement without deleting newer work.
Normal route navigation retains the provider queue; forced closure/crash recovery
of private unsent edits is not guaranteed. This round is local owner review only:
no new commit, push, PR, merge, production deployment or production configuration.

## Owner-approved autosave update - 2026-11-16

Existing account definitions now use validated, serialized frontend autosave. New definitions still require Create in account; guest login alone never saves. The existing server ownership, expected revision, name uniqueness and deletion receipts are unchanged. Earlier manual-save instructions below remain historical. See portfolio-autosave.md for offline/retry/conflict/delete behavior, memory-only privacy limits and automated/Terra-medium browser evidence. No new backend deployment or production activation accompanies this frontend update.

## Guest/examples release preparation - approved 2026-11-15

Owner now authorizes production readiness preparation plus commit/push/PR for this
feature. Merge, production access/configuration/deployment and paid services remain
separate. This supersedes earlier no-publication checkpoints below.

Final behavior: guest read-only examples and one temporary recovery draft; explicit
Sign in to save, safe OAuth return, then explicit account Save. Signed-in dashboards
show only account portfolios, omit Examples and the redundant Portfolios nav button,
and have no visible collection heading. Resume appears only for actual unsaved
work. Navigation uses Portfolios / All portfolios / View portfolios. Centered shared
dialogs confirm replace/discard/delete; deletion uses destructive buttons. Sonner
notifications expire without a close or manual-dismiss control. Existing browser
collection bytes are preserved but have no legacy/import UI. Private cloud edits
never become guest recovery content; account-bound recovery is isolated in the UI.

No Convex/schema, auth route/config, market engine/provider, calendar, production
binding, quota or deferred-polish change is included. Only Sonner is added to the
locked frontend dependencies. Current source is based on merged PR24 at b18a87d.
Production rollout reuses existing auth/cloud CRUD and existing production public
cloud/site bindings; no new secret/env/provider activation is required. Never copy
DEV ignored configuration into a release. The configured Vercel build already has
a Convex-deploy step; its eventual execution is part of the separately approved
release, not this preparation. Backend definitions are unchanged by this PR.

Release checks include all local Vitest cases, focused guest/name/auth-return/trial
Node checks, both synthetic browser suites, lint/both TS, changed-file formatting,
diff/newlines/private scans, and an optimized credential-cleared build with synthetic
public auth bindings (`node scripts/build-cleared.mjs --auth-fixture`). The fixture
build compiles the configured auth/provider path without real deployment access.
It does not prove live OAuth exchange, production cloud availability or market rights.
No real second Google account is available; mocked A/B coverage is distinct.

After an approved release: smoke-test guest example/reload, draft->Google safe
return->explicit Save, save/reload, name collision, logout/private-ID refusal and
unchanged existing account definitions. Production smoke verification is outstanding
until that release is authorized. Roll back frontend source if needed while keeping
cloud rows/deletion receipts and both browser keys intact; no data reset/migration.
A rollback to older frontend code does not understand the temporary trial key.

## Owner review corrections - approved 2026-11-15

Supersedes the earlier compatibility UI and signed-in example visibility decisions
below: remove the older-browser entry, route and user-facing old-workflow copy.
Leave all existing browser data bytes untouched; no migration/deletion/import.
Examples are displayed to guests only. Account dashboards show only account work.
Resume draft appears only for a new unsaved draft or changed saved definition,
never an acknowledged unchanged save. Landing resume uses the same rule.

Use shadcn Sonner for transient notifications, retaining actionable inline save
errors/conflicts/pending states. Use the existing shadcn/Base UI account-dialog
composition for discard, replacement and deletion confirmations: title, explanation,
Cancel and explicit action, keyboard dismissal/focus return. Portfolio action
buttons share one aligned row with consistent spacing. No backend/financial changes,
production access/deploy or Git publication are authorized by these corrections.

## Simplified examples and temporary drafts - owner approved 2026-11-15

This decision supersedes older editable-example, persistent guest-library and
single-draft handoff restrictions below. Collection import remains excluded.
Examples are stable read-only originals available to guests and signed-in users,
separate from the authenticated cloud collection. Try your own mix creates a new
unsaved copy; examples never become saved originals. Guest results/search remain
open, with Sign in to save followed by an explicit cloud Save after login.

One bounded versioned temporary trial uses `tikr-trial-v1` as a reload/OAuth recovery
bridge, not a library or cloud sync. Replacement/discard is explicit. Once edited
in a signed-in session its recovery is bound to that account; guest/other-account
sessions cannot restore it. Private saved cloud definitions/edits stay in memory.
The legacy `tikr-demo-v1` collection is never written, migrated, deleted or imported.
Older browser portfolios provides separate read-only inspection, including its old
draft, using existing compatibility interpretation without changing stored bytes.
Malformed records fail visibly without overwrite. This minimal compatibility path
adds no export wizard or import API/schema/index.

Cloud ownership, atomic names, client-ID idempotency, session/revision fences and
deletion receipts remain unchanged. Same-ID recovery with different cloud contents
retains edits and requires explicit conflict resolution. No backend change/deploy,
financial-engine change, operational quota, Groq feature or deferred polish is added.
Source is in the isolated guest/examples worktree at merged PR24 base
`b18a87d8c3bc41cd9696812ef2b35da43c0bf29b`; no commit/push/PR/merge or production
access/configuration/deployment is authorized for this task. Earlier publication
permissions below describe previous work and do not authorize this branch.

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
