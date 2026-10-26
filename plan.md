# Tikr delivery plan

Last checked: 2026-10-25.

## Current state

- Correct application repository: `C:\Users\JuanE\Code\React Projects\tikr`, branch `main`.
- Existing Create T3 App baseline: Next.js/React/TypeScript, Tailwind 4, Convex provider, and starter task UI. The layout still uses Geist and starter metadata; no approved portfolio frontend is implemented yet.
- `package.json` declares `pnpm@10.11.0` and development/build/lint/typecheck scripts. No application test script is defined.
- Better Auth, Groq, and shadcn/ui are not in the inspected manifest; Manrope is not in the inspected layout. Real portfolio backtesting, auth, discovery, and deployment have not been verified.
- Four coordination documents now live in the app root. Existing Convex agent instructions are preserved in `AGENTS.md`.
- A v0 prompt was supplied; no generated output has been reviewed/imported here.

### Location correction

The documents were originally committed to a separate outer repository at `C:\Users\JuanE\OneDrive\Documents\ChatGPT\tikr`, which is not this app. Its empty/unmapped gitlink observation does not describe this application. The mistaken documentation commit has been reverted there, and the original planning worktree was synchronized with that revert. Unrelated nested-repository work was preserved. Do not repair that other repository as part of app development.

## Next actionable task

**Review any v0 output against the existing application and approved design.** If no output exists, use the supplied v0 prompt to begin design exploration, then integrate intentionally into this existing app rather than scaffolding a replacement. Check `product.md` for outstanding market-data and AI-limit decisions.

## Milestones

### M0 - Establish the source baseline

Status: source location confirmed and coordination docs transferred; setup scripts identified, execution not validated.

- Completed: located existing app and preserved its source/history.
- Completed: identified manifest scripts, pnpm lockfile, Next.js layout, and Convex provider; updated `AGENTS.md`.
- Pending: validate environment/setup when development work begins. No credentials were read during this documentation task.

Exit: app source is available and actual commands are recorded; successful setup execution remains to be verified.

### M1 - Review an interactive frontend prototype

Status: starter app exists, but portfolio prototype implementation/review has not started. Visual exploration can proceed alongside setup validation.

- Landing, Google-only login composition, dashboard, combined builder/results.
- Deterministic labeled sample data; metrics agree with charts.
- Equal/manual weights, exact 100% validation, local drafts, rename/duplicate/pin/delete.
- VOO and saved-portfolio comparisons, responsive layouts, accessibility, motion fallback, empty/error states.
- Explicitly label mocked integrations; demo persistence is not real account storage.

Exit: owner accepts visuals/core flow and relevant available checks pass.

### M2 - Prove free data and calculation design

Status: unresolved feasibility gate. Can proceed alongside M1.

- Prove zero-cost permissions for public use, history caching, and derived outputs. No provider selected yet.
- Verify VOO and representative stocks/ETFs, historical depth, corporate actions, metadata, limits, and outages.
- Specify adjusted returns/dividend reinvestment, buy-and-hold math, precision, trading calendar, costs/tax disclosure, missing history, and metric formulas.
- Define catalog evidence/curation, industry/theme tags, refresh, and unsupported/delisted-symbol behavior.
- Establish deterministic fixtures for splits/dividends, allocation rounding, and common-date comparisons.

Exit: permitted data path and reproducible calculation spec. If none meets the free requirement, request a scope/budget decision; do not silently pay or label price-only results as dividend-inclusive.

### M3 - Add identity and durable portfolios

Status: not started. Depends on M0 and approved app structure; independent of real history.

- Convex and Better Auth with Google, based on verified current integration guidance.
- Preserve draft through OAuth and prevent duplicate callback saves.
- Server-side ownership; persist names, holdings, pin state.
- Define expiry/logout, deletion/retention, privacy/terms, and recovery.

Exit: cross-user access is prevented and real save/edit/delete/draft handoff work end-to-end.

### M4 - Integrate historical backtesting

Status: not started. Depends on M2 and relevant UI/storage foundation.

- Server-only provider access, shared licensed history cache, end-of-day refresh.
- Replace mocks with the specified engine; expose dates/as-of/methodology/stale/error states.
- Consistent comparison and dashboard assumptions; test outages, short histories, unavailable symbols, and edits.

Exit: fixture/reference cases match and real-data paths contain no unlabeled sample results.

### M5 - Add bounded Groq discovery

Status: provider selected; implementation not started. Depends on catalog feasibility in M2 and approved identity/quota policy.

- Confirm proposed user count, input size, UTC reset, result cap, cooldown, and guest policy.
- Select/evaluate model and verify actual request/token limits and data terms.
- Interpret queries into validated filters, retrieve only catalog assets, and ground match reasons.
- Atomic server-side budgets, bounded prompts/outputs, concurrency, caching, timeouts/retries, abuse controls.
- Ordinary search survives provider failure/exhaustion; no automatic paid fallback.
- Test ambiguity, no matches, fake symbols, off-topic/prompt-injection input, concurrent requests, and reset boundaries.

Exit: supported results, enforced budgets, no unchecked financial claims, and no quota bypass through direct requests.

### M6 - Validate and deploy

Status: not started. Depends on approved preceding deliverables.

- Existing configured checks, desktop/mobile/keyboard/motion review.
- Secrets, privacy, authorization, budgets, data permissions, and disclosures review.
- Intended Vercel/Convex environments; verify production callbacks and data status.
- Initial user feedback and small set of agreed success signals.

Exit: verified deployment, reproducible release checks, known limitations, owner acceptance.

## Coordination rules

- Update status only with evidence; distinguish design acceptance, frontend completion, integrations, and launch readiness.
- Record decisions in their owning document and dependencies here.
- Track scope changes explicitly; do not promote assistant proposals into requirements.
- The owner authorized undoing the misplaced documentation commit and adding the documents to this app. This correction does not authorize unrelated branches, PRs, scaffolding, service provisioning, or deployment.

## Verification record

- Inspected clean app Git status, manifest/lockfile, tracked files, starter page/layout, and Convex provider.
- Preserved the existing Convex managed guidance block and did not change application code or credentials.
- This is a documentation transfer/reconciliation. Application build, lint, typecheck, runtime behavior, and provider connections have not been validated by this task.
- Direct document checks passed for final newlines, trailing whitespace, local references, corrected app-state descriptions, and preservation of the original Convex guidance. Only the four intended documentation files changed before staging.
