# Asset discovery and portfolio UX: PR review

Owner requested PR preparation on 2026-11-16. This authorizes publishing the
feature branch and a review PR, not merging or changing production configuration.
Earlier uncommitted-only checkpoints in the historical notes are superseded for
this preparation. Subsequent explicit owner approval authorized the production
backend deployment and secure Groq key installation below, with AI disabled.
No PR merge, frontend release or AI activation is included in that approval.

## Production backend preparation completed - 2026-11-16

Deployed source commit `348a34000464bad27f7a1a62ba6c48c23b2c3748` to production
Convex `warmhearted-tapir-205` after announcing the target and receiving explicit
owner consent. Convex TypeScript/schema validation passed; the two discovery
indexes were added and no indexes were deleted. Secure file-based Groq key
installation succeeded without printing the key or putting it in command arguments.

Read-only verification confirms the installed key matches the supplied secure
input, `TIKR_AI_DISCOVERY_ENABLED=disabled`, and the deployed discovery search and
quota usage functions are present. Existing `SITE_URL` remains
`https://tikr-lovat.vercel.app`. No live AI request or owner portfolio operation
was performed. The Vercel production environment names were audited; its public
AI flag was absent. No Vercel configuration or frontend deployment was changed.

## Scope

- Explicit, signed-in AI asset discovery with up to six ticker suggestions;
  supported cached-catalog filtering supplies canonical names. Inline
  clarification/no-match/error states, account quota and session fences.
- Existing cloud portfolios autosave valid edits with serialized writes,
  acknowledgement reconciliation, bounded retries and conflict/deletion safety.
  New portfolios require explicit Create in account; guest login never saves alone.
- Fixed-width editor controls and bounded result motion, low-allowance color,
  tailored initial-load skeletons, retained loaded-chart date transitions, consistent
  landing navigation and a dedicated methodology page.
- The latest correction insets allocation rows so remove-button hover/focus does
  not create horizontal overflow. Routine Saved status is hidden; saving/errors
  remain visible. The landing has no skeleton/manual-save notice.

## Source readiness

Existing ownership, portfolio CRUD, deletion receipts, auth callbacks and financial
engine/provider/calendar code are unchanged. Autosave uses existing mutations;
the AI feature adds two metadata-only quota/receipt tables and new functions.
Backend and production frontend AI activation are independently gated. No paid
fallback or data-catalog enrichment is introduced.

Local checks cover 132 Vitest cases, guest/cloud/AI/autosave/deletion/motion/loading
browser scenarios, lint/both TypeScript projects, a credential-cleared optimized
auth/AI build, formatting/diff/newlines and private-pattern scans. Hover/focus
checks assert constant dialog width and no allocation horizontal overflow at
desktop and mobile widths. See plan.md and portfolio-autosave.md for exact evidence.

Terra medium reviewed synthetic browser behavior, reported the Duplicate recovery
bug (fixed), checked retry exhaustion/held creation/mobile editing, and passed the
targeted mobile deletion recheck. This is bounded evidence, not a guarantee about
every network race or new live Google end-to-end verification.

## Production activation gate: still outstanding

I do not recommend describing live AI as production-ready until these separately
approved steps have been completed:

1. Confirm that the production cached catalog is fresh and complete enough for
   the lookup contract. Do not seed, refresh or make market-provider calls merely
   to bypass a failed catalog preflight.
2. Separately approve AI activation and the frontend release. Set the production
   server `TIKR_AI_DISCOVERY_ENABLED=explicit` and intended frontend
   `NEXT_PUBLIC_AI_DISCOVERY_ENABLED=true` only for that rollout. Backend/key
   preparation is complete; both activation gates currently remain inactive.
   The hosting build includes a Convex deployment step: verify its target before
   release, and never copy DEV secrets or ignored configuration into production.
3. Smoke-test real sign-in, discovery/clarification, supported filtering and
   allowance settlement, then autosave/reload, offline recovery and conflict
   refusal against the intended deployment. Verify service capacity/account limits
   for the intended audience; earlier free-plan estimates are not guarantees.

Model relevance remains unverified: ticker-only trials improved some examples but
also exposed stale/wrong suggestions. Catalog filtering proves supported identity,
not theme relevance. The UI labels suggestions accordingly. No promise of verified
sectors, forecasts or personal recommendations is made.

Autosave's unsent private edits stay in memory. Normal reload/sign-out guards do
not guarantee recovery from crashes or forced tab termination. Production market
data rights and the previously deferred financial reliability work remain separate.

## Rollback and publication

Keep the PR draft while production activation/release gates are unresolved. A
frontend source rollback is possible, but do not remove quota receipts, cloud
definitions, deletion receipts or browser keys. If AI is activated later, disabling
its server flag stops new requests while ordinary search remains available.
Reverting autosave restores manual behavior; inspect in-flight work before rollout
or rollback rather than treating deployment as a data reset.
