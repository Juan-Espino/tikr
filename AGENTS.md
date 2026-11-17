## Follow-up PR preparation authorized - 2026-11-16

Owner now requests a PR for the local automatic-creation/UX changes and the
duplicate deletion-toast fix. This supersedes earlier local-only/no-publication
notes for commit, push and review PR only. No merge, production configuration or
deployment is authorized. Source branch is based on merged PR26 on origin/main.

Deletion regression reproduced two toasts before correction. StorageNotice mount
effects replay during Strict Mode/navigation; shared notices now use a stable
Sonner ID, updating the same toast rather than appending it. The four mobile
deletion scenarios assert exactly one success toast, including failure -> Retry.

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

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

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

# Repository guidance

## Read first

- `product.md` owns audience, scope, behavior, and open product decisions.
- `design.md` owns approved visual rules, components, and references.
- `plan.md` owns evidence-backed progress, dependencies, and the next task.

Keep confirmed requirements distinct from assistant proposals. Explicit owner decisions override older documentation; reconcile the affected documents. A v0 prompt does not prove implementation exists.

## Current application baseline (reconciled 2026-11-14)

Correct repository: `C:\Users\JuanE\Code\React Projects\tikr`, branch `main`. This is a runnable-app source tree, not the unrelated outer repository with an unmapped gitlink.

This feature worktree starts at merged PR22, `7f6e47e`, preserving PR19/20 market
history/recovery, PR21 globe and stage 1 Google-only Better Auth. Owner confirmed
production login/reload/logout/local preservation and approved stage 2 cloud
definitions. Browser-to-cloud import is removed by owner decision on 2026-11-15.
Signed-in definitions now use server-enforced ownership;
guests retain browser-local portfolios/drafts. Owner reports testing the other features;
see plan.md and cloud-portfolios.md for evidence/gaps and PR authorization; production actions remain separate.
No Groq/profile/sharing feature or public market-data rights are established.

Use pnpm: the manifest specifies `pnpm@10.11.0` and `pnpm-lock.yaml` is tracked. Preserve the Convex managed instructions above. Before Convex code changes, read `convex/_generated/ai/guidelines.md`. Generated files should not be edited as application source. `CLAUDE.md` contains parallel Convex guidance; it was not modified by the documentation transfer.

## Change discipline

- Inspect Git status, preserve unrelated work, and make focused changes.
- Read more-specific `AGENTS.md` files before editing their directories.
- Do not commit, branch, restructure Git, provision services, or deploy unless asked.
- Respect existing code conventions; prefer simple typed components and narrow abstractions.
- Do not install dependencies for documentation-only work.
- Keep credentials out of code, documentation, logs, browser storage, and public environment variables. Use server-side secrets and private secret entry when available.

## Product invariants

- Historical simulation only: no predictions or trade execution.
- Before offline engine work, read `backtest-methodology.md`. Preserve payment-date reinvestment, ex-date receivables, drifting weights, fractional shares, decimal precision, one shared period, and the two-completed-session minimum. Ordinary splits/distributions need verified normalized action inputs; unsupported events and data gaps fail rather than disappear. Metrics use unrounded daily chart values.
- SPY is the explicitly named ETF benchmark, replacing VOO by owner decision on 2026-10-30. Compared series share dates, starting amount, and methodology.
- Equal weights by default; manual weights must be positive and total exactly 100% before finalization/backtesting. Handle rounding deterministically.
- Never omit missing holdings/history silently or invent earlier prices. Statistics must agree with charts.
- Open unauthenticated guest access remains. Stage 2 signed-in definitions use verified server ownership; guest portfolios/drafts stay local. Sign-in alone never imports or saves guest work. Browser-to-cloud collection import is excluded. Preserve guest originals and never fall back silently from failed cloud saves to local storage.
- Pin portfolios, but do not add manual ordering or drag-and-drop.
- Matte near-black surfaces, Manrope, stone-white text/charts; no pastel dashboard cards. The bright login panel is intentional.
- Groq interprets category queries; a verified catalog supplies supported assets. No unchecked model tickers, personalized buy/sell advice, or AI forecasts.
- Bound input sizes/provider concurrency and preserve correctness leases/fencing/revocations. The owner removed operational market rate/budget/daily/cooldown enforcement; do not restore it from historical docs. Future AI quotas/abuse policy need separate approval.
- AI exhaustion must not block normal asset search or portfolio operations. No automatic paid fallback.
- Alpaca is the personal/non-commercial technical candidate; public/shared data permission is separately gated. The offline engine does not validate provider finality/actions or authorize integration, paid access or secret handling.
- Label mock data and demo authentication honestly.

## Actual commands and verification

Commands below are taken from the inspected manifest; their availability is not proof that they passed:

- `pnpm dev`: Next.js development server with Turbo.
- `pnpm build`: production build; requires valid environment/configuration.
- `pnpm typecheck`: TypeScript check without emitting output.
- `pnpm lint`: configured Next.js lint command.
- `pnpm check`: configured lint plus TypeScript check.
- `pnpm format:check`: configured Prettier check for TS/TSX/JS/JSX/MDX; it does not include plain Markdown files.

No test script is defined in package.json. Run `node --experimental-strip-types --test tests/demo.test.mjs tests/backtest.test.mjs` for demo and offline engine tests, then `node tests/backtest-mutations.mjs` for the five targeted fault checks. These do not validate licensed historical data or a live adapter. Preserve independent fixture oracles; do not generate expectations from the engine. Convex connectivity, real auth, provider integration and deployment need separate verification.

For the single-process on-demand cache coordinator, run `node --conditions=react-server --experimental-strip-types --test tests/market-cache.test.mjs`. It uses injected synthetic verified data and makes no provider requests. Run adapter and harness tests with the same Node conditions when changing their shared contract. See `on-demand-cache.md` for freshness/revision behavior, memory-only limits and the unresolved durable-storage/provider/UI boundaries. A passing synthetic cache suite does not establish corporate-action completeness or global cross-instance limits.

For Markdown changes, check whitespace, final newlines, document references, and confirmed/proposed labels. Run `git diff --check`; inspect untracked files directly before staging because normal Git diff omits them. Inspect final status for unrelated changes.

For application changes, start with focused existing checks, then appropriate configured checks. Follow established test patterns for allocation precision, return math, dividends/splits, common dates, missing history, ownership, draft handoff, and atomic quotas. Review desktop/mobile, focus, touch tooltips, contrast, reduced motion, and loading/error/quota states. Keep financial fixtures deterministic and sample data labeled. Validate data licensing separately from UI correctness. Report commands/results and gaps honestly.

## Coordination

Update `plan.md` with evidence-backed status and the next task. Update `product.md` for approved scope changes and `design.md` for approved visual changes. Do not convert deferred ideas or assistant suggestions into launch commitments.

## Personal data integration verification

For the optional personal server integration, read `market-data-integration.md`. Run the Node evidence/durable/admission tests with `--conditions=react-server --experimental-strip-types`, and `pnpm exec vitest run` for the local Convex transaction tests. Browser tests use the installed Edge and a credential-cleared loopback dev server; keep screenshots under system temp. Do not deploy or enable real market data merely because synthetic tests pass. Never delete/reset the admission ledger, abandoned refresh guards, locks or revocation markers to bypass evidence/resource gates. Feature implementation stays in an isolated worktree attached to a top-level sidebar-visible T3 chat. Owner-requested project documentation reconciliation may be done in main. A separate chat/worktree means a sidebar chat, not a child agent.

## Current dividend assumption and deferred polish (owner, 2026-11-13)

Apply the general Alpaca reported-USD-cash rule in `backtest-methodology.md` to all
tickers, retaining provider withholding. Do not reintroduce currency/foreign flag
rejections or invent an additional conversion/gross-up. Keep amount/date and financial
integrity validation. The four reliability improvements are tracked in `plan.md` under
**Post-MVP polish ? explicitly deferred by owner**; do not expand this task to implement
them. Preserve already implemented recovery behavior.
