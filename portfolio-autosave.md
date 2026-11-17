# Account portfolio autosave

Owner approved 2026-11-16. This supersedes manual-save requirements for edits to
existing account portfolios. New portfolios still require **Create in account**;
sign-in alone never creates or imports a guest draft. Examples remain read-only.

## Workflow

- Edits appear immediately. Valid changes save after 500ms without another edit.
- The provider owns the coordinator, so closing the editor does not stop saving.
  Done requests an immediate flush and closes the editor.
- One mutation runs per portfolio at a time. Intermediate unsent edits are
  replaced by the latest snapshot; no keystroke queue is retained.
- An acknowledgement advances the known revision but merges it into the latest
  local definition. It never replaces newer holdings, weights, names or settings.
- Status is Saving / Saved / Changes not saved. Autosaves do not emit success
  toasts. Errors retain actionable inline Retry or conflict recovery controls.
- Empty/invalid allocations, invalid amounts and names remain editable but do not
  replace the last valid cloud definition. Adding a holding with manual weights
  may require completing its weight before saving resumes.
- New creation is explicit and uses the existing client-ID idempotency behavior.
  If edits arrive during creation, the new revision is attached and the latest
  valid definition is subsequently autosaved. The normal UI disables starting
  another edit while the explicit creation request is pending.

## Failure and concurrency behavior

The existing authenticated Convex update mutation remains the only persistence
path. Owner/session fencing, name uniqueness and expected revisions are unchanged.
The small complete definition (at most six holdings) is written atomically; no
schema, endpoint, additional service or dependency was added.

Offline edits remain in memory. Reconnection resumes a valid pending snapshot.
Transient failures use up to three retries after the initial attempt, delayed by
1, 2 and 4 seconds. Exhaustion stops automatic attempts until explicit Retry.
Each uncertain write is reconciled with an authenticated read before another
write: an unchanged revision permits retry; exactly the expected next revision
with the attempted definition acknowledges the lost response; any other change
pauses for conflict recovery. Nothing silently rebases over another tab's edit.

Load cloud version explicitly replaces local edits. Conflict Duplicate explicitly
copies the same conflicted definition to a new unsaved ID; a guarded copy intent
prevents ordinary navigation from bypassing the pending-change protection.

Confirmed deletion supersedes queued edits, including invalid ones, and waits for
an already-sent write. It reconciles an uncertain acknowledgement before selecting
the delete revision. A failed deletion keeps edits; Retry delete remains a delete
action. Acknowledged deletion retires the coordinator entry, so delayed work cannot
resurrect it. Server deletion receipts remain intact.

Account/session unmount disposes timers and fences late callbacks by entry
identity. A different account never receives another account's queued definition.
beforeunload warns while changes are unacknowledged. Signing out with pending
changes offers Cancel or Sign out anyway. In-flight server operations may finish
before logout; the UI does not claim it can revoke a completed write.

Private account edits are never written to localStorage. These guards cannot
guarantee recovery after browser crashes, forced tab termination or ignored leave
warnings. The existing bounded account-bound guest recovery bridge is preserved.

## Landing changes

The landing page shows its real hero during session/portfolio initialization,
without a page skeleton or account-loader skeleton. Creation actions are briefly
disabled until the correct context is ready. The permanent account notice about
confirming saves is removed; inline errors and transient notifications remain.

## Verification

- `pnpm.cmd exec vitest run --maxWorkers=1`: 132 passed across 26 files, including
  18 autosave coordinator cases and the pending/private-identity authentication
  regression. Fake-clock retry checks advance five additional minutes after
  exhaustion and still observe exactly four attempts.
- `node scripts/qa-autosave.mjs`: explicit creation, rapid additions/removals,
  newer edits during held writes, reconnect, lost acknowledgements, invalid manual
  weights, conflicts/reload, navigation guards, sign-out cancellation, mobile
  editing/pin and cross-account late-response fences.
- `node scripts/qa-autosave-delete.mjs`: four mobile deletion scenarios: held
  update plus newer queued edits, invalid allocation, delete failure/retry, and
  lost update acknowledgement. Mutation counts assert no unnecessary queued
  update and no post-delete resurrection after the guard interval.
- Existing cloud suite: ten scenario groups passed, including remote deletion,
  conflict Duplicate, held saves, private-session hiding and pin coordination.
- Guest suite: nine groups passed with legacy bytes unchanged and explicit
  guest-to-account creation preserved.
- AI browser regression, lint/both TypeScript projects, formatting/diff checks and
  optimized credential-cleared auth/AI production build passed.

Terra on medium ran the browser checks. Its first review found a blocked conflict
Duplicate path, which was fixed and browser-reproduced. The subsequent review
independently checked persistent failure/retry and held creation. A final targeted
review passed the four mobile deletion cases and found no actionable defect.
This is bounded synthetic evidence, not proof of every possible network failure
or a new real Google end-to-end test. No owner portfolio was modified by QA.

Latest artifacts include `tikr-autosave-XdMkAj`, `tikr-cloud-ui-xlsZrC`,
`tikr-guest-ui-SvCKbi`, `tikr-ai-ui-PcGAjy`, and cleared build
`tikr-cleared-build-g46pki`, under system temp.

## Source map

- `src/lib/portfolio-autosave.ts`: serialized state machine and retry/reconcile.
- `src/providers/cloud-portfolios-provider.tsx`: validation, authenticated adapter,
  creation, conflict recovery, deletion and leave protection.
- `src/app/portfolio/[id]/_components/portfolio-page.tsx`: quiet save status,
  explicit new creation and Done flush.
- `src/components/account-menu.tsx`: pending identity guard and sign-out protection.
- `tests/auth-autosave.test.ts`: deterministic concurrency/failure cases.
- `scripts/qa-autosave*.mjs`: isolated browser fault scenarios.

Changes remain uncommitted. This update requires no new backend deployment,
production configuration or secret. Review on the existing localhost:5000 server.
