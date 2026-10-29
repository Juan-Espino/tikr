# Tikr delivery plan

Last checked: 2026-10-25.

## Current state

- Frontend integration is isolated in `C:\Users\JuanE\.t3\worktrees\tikr\feat-v0-portfolio-frontend`, based on `ffcd0cd`. Main checkout is untouched. No commit, merge, PR, provisioning, or deployment is part of this task.
- v0 ZIP was inspected before source edits. See `prototype-review.md` for reuse, dependency differences, mocked behavior, and requirement conflicts.
- The starter page is replaced by a local interactive demo: landing, bright Google-only sign-in preview, dashboard, and combined editor/results. Manrope and approved matte stone palette are implemented. Owner visual acceptance remains pending.
- Convex backend/generated files remain unchanged. Existing provider still wraps the app; a missing-URL guard permits standalone demo rendering without provisioning or inventing a deployment URL.
- Browser-local portfolios/drafts are separate from Convex and are explicitly labeled. Real auth, licensed market history, Groq, server ownership, and quotas are deferred.
- pnpm 10.11.0, Next.js 15, React 19, Tailwind 4 retained. Added only imported UI/chart dependencies; no ZIP framework/config/lockfile replacement or analytics.

### Location correction

The documents were originally committed to a separate outer repository at `C:\Users\JuanE\OneDrive\Documents\ChatGPT\tikr`, which is not this app. Its empty/unmapped gitlink observation does not describe this application. The mistaken documentation commit has been reverted there, and the original planning worktree was synchronized with that revert. Unrelated nested-repository work was preserved. Do not repair that other repository as part of app development.

## Next actionable task

**Review this local demo visually, then resolve M2 data licensing and calculation policy before real history integration.** Confirm production limits and route/deep-link behavior separately. Real Google authentication, ownership, and Groq remain subsequent milestones.

## Milestones

### M0 - Establish the source baseline

Status: source/worktree confirmed; dependencies installed with pnpm 10.11.0. Local frontend can run without environment secrets.

- Completed: located existing app and preserved its source/history.
- Completed: identified manifest scripts, pnpm lockfile, Next.js layout, and Convex provider; updated `AGENTS.md`.
- Completed: isolated frontend dependency installation and local startup. No credentials copied or read. Convex connectivity remains unverified.

Exit: frontend setup is usable. Production/backend configuration is a separate verification task.

### M1 - Review an interactive frontend prototype

Status: implemented local frontend demo; verification recorded below. Owner acceptance remains pending.

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

## Previous documentation-only verification record

- Inspected clean app Git status, manifest/lockfile, tracked files, starter page/layout, and Convex provider.
- Preserved the existing Convex managed guidance block and did not change application code or credentials.
- This is a documentation transfer/reconciliation. Application build, lint, typecheck, runtime behavior, and provider connections have not been validated by this task.
- Direct document checks passed for final newlines, trailing whitespace, local references, corrected app-state descriptions, and preservation of the original Convex guidance. Only the four intended documentation files changed before staging.

## Frontend integration evidence (2026-10-25)

### Completed behavior

- Reused v0 screen compositions and its shadcn/Base UI button foundation, corrected labels and contrast, and replaced placeholder controls and hard-coded charts. Static decorative globe avoids claiming the ZIP's arbitrary dots are geographic market hubs.
- Empty dashboard, explicit sample-example loading, create/open/rename/duplicate/pin/delete with undo. Pinned first; updated descending; stable ID tie-break. No manual ordering.
- Versioned, schema-validated browser persistence for saved experiments and an editable guest draft; loading and unavailable/corrupt-storage states. No account/session impersonation. Sign-in preview preserves draft and disables the disconnected Google button.
- Six-asset sample ticker/full-name catalog. No AI requests. Empty searches are explained; sample categories are illustrative.
- Allocation precision: integer basis points (0.01 percentage point). Remainder assigned to final holdings in insertion order (33.33/33.33/33.34). Manual add/remove preserves other weights; a new manual holding starts at zero. Positive exact-100% validation gates save/run. Editing clears old results.
- All six timeframe controls recalculate from their synthetic start dates. Buy-and-hold weighted indices, common calendar and starting amount, VOO explicitly labeled ETF, up to two saved comparisons, independent VOO toggle, percentage/USD view. Ending value, return, VOO percentage-point difference and peak-to-trough drawdown come from the plotted daily series.
- Sample data is explicitly fictional: positive deterministic indices, fixed as-of date, daily observations including weekends, no dividends/splits/costs/taxes. No real price history or backtest accuracy is claimed. Unknown assets throw instead of disappearing.
- Demo-only bounds: six catalog holdings, 80-character names, 100 local portfolios, positive USD amounts up to 100 million with two decimals. These are implementation safeguards, not approved production product limits.

### Remaining gaps

- M2-M6 remain open: licensed/free history, verified catalog, production calendar/dividend/split method, Google/Better Auth, Convex ownership and persistence, Groq and atomic quotas, policy pages, deployment.
- Screen navigation remains client state on `/`, matching the ZIP. Dedicated URLs/back-button/deep links and genuine OAuth draft handoff are not implemented.
- Chart uses a small Recharts wrapper with the shadcn palette and copied button foundation; it is not the full generated shadcn ChartContainer implementation. Chart value inspection uses click/tap and arrow keys, with a complete accessible data table in the workspace. Formal assistive-technology review remains pending.
- Globe is a static decorative sphere, not a geographic or animated market map. Exact reference-image parity cannot be assessed because original reference attachments are absent.
- Local storage is browser-only, unencrypted demo data; no cross-device sync or multi-tab conflict resolution. Clearing browser data removes saved work. Undo lasts until another deletion/reload.
- Related-asset discovery beyond sample catalog categories and real loading/error/quota workflows require their integrations; disconnected AI is labeled, with ordinary search always available.

### Verification results

- `pnpm.cmd check`: passed (configured lint plus TypeScript). Next 15 warns that `next lint` is deprecated; no ESLint warnings/errors.
- `pnpm.cmd build`: passed production compilation, lint/types, static generation and traces. No environment secrets or Convex deployment required. Initial chart typing error was repaired before the successful build.
- `pnpm.cmd typecheck`: passed.
- `node --test tests/demo.test.mjs`: 5/5 passed using Node 24's native TypeScript stripping; no test framework installed and no invented package test script. Covers exact rounding, invalid/duplicate weights, amount bounds, deterministic common dates, missing-symbol rejection, weighted buy-and-hold, value scaling and known drawdown/return fixture.
- Changed frontend files pass targeted Prettier. Repository-wide `pnpm.cmd format:check` fails on 12 unchanged baseline files: five generated Convex files, `convex/schema.ts`, `convex/tasks.ts`, `eslint.config.js`, `next.config.js`, `postcss.config.js`, `prettier.config.js`, `src/env.js`. Left untouched.
- Production browser review at 1280x800 and 390x844: desktop workspace and mobile dashboard inspected visually; dashboard/workspace have no horizontal overflow at these sizes. Invalid zero allocation disables Save/Run and clears prior chart; equal weighting restores 100%. Sign-in preview disables Google and returns to the intact draft. Save, duplicate, pin ordering, delete/undo, saved comparison, VOO toggle, dollar view and reload restoration exercised successfully.
- Corrupt-storage check preserves the invalid payload and exposes recovery UI. Browser review used only synthetic local demo data. Formal screen-reader, real touch-device, quota/network-failure and real OAuth tests are not claimed.
- Reduced motion handled by static globe, disabled chart animation, and global motion override. Keyboard/focus uses native controls, Base UI buttons, Recharts accessibility layer and an accessible data table; full assistive-technology certification remains open.
- `git diff --check` passes; untracked frontend, tests and review document inspected directly. No changes under `convex/`. All changes remain uncommitted in this worktree; main checkout and unrelated outer repository were not modified.

## Timeframe control refinement (2026-10-26)

- Owner follow-up: left-align the mobile period control and expand its options to the right; retain leftward expansion on desktop.

- Owner requested a single current-period button that expands left on hover and collapses on pointer exit. Replaced the native select in the shared RangePicker, covering dashboard and workspace.
- Right-anchored horizontal expansion preserves page layout. All six periods remain available; selection uses the existing shared-date simulation behavior. Tap toggles, keyboard Enter/Space and arrows, Escape, focus exit and outside pointer dismissal are supported. Collapsed options are inert; transitions honor reduced motion.
- No dependencies, financial calculations, backend files or main-checkout files changed. The remaining dashboard-card hierarchy work is still pending.
- Verification: `pnpm.cmd check`, targeted Prettier and `git diff --check` passed. Browser checks confirmed fixed right-edge positioning with a 220px leftward reveal, selection to 1W, pointer-exit collapse, inert hidden options, Enter/arrow-key selection to Max, and Escape restoring focus to the current-period button. Dev server restarted after T3 restart and is ready on port 3100.

### Dashboard hierarchy refinement (2026-10-26)

- Implemented square, clickable dashboard cards with asset count, period return, signed dollar change from the common $10,000 starting amount, chart and legend. The dashboard has one shared VOO ETF toggle; pin, duplicate and confirmed delete moved into the saved portfolio workspace, with delete undo retained. Rename remains in the workspace. Synthetic-data disclosure stays outside the cards.
- The development server starts on port 3100. `pnpm check` passed; desktop and 390px mobile dashboard layout, shared benchmark toggle, and opening the workspace were inspected in the browser. Full keyboard, deletion/undo, and other workspace-action regression checks remain to be repeated for this refinement. Real market data, authentication and AI remain deferred.

- Dashboard legend refinement: line samples now match the plotted strokes, and the visible benchmark legend reads VOO.

- Dashboard return percentages now use gain/loss colors with a neutral zero, and the introduction is shorter. The common $10,000 chart starting amount remains disclosed below the cards.

- Dashboard cards now give the chart the remaining card height and hide compact axes so the plot aligns with the card content; full workspace charts retain their axes.

- Typography refinement: titles use bold Cabinet Grotesk via Fontshare, while body text and controls retain Manrope; the existing Manrope stack is the fallback if the font host is unavailable.

- Simulation chart tooltip uses hover and shows the main portfolio?s USD value (and return in percentage view) for the selected date; benchmark and comparison lines do not add tooltip values or active dots. Keyboard tooltip was verified; hover and touch behavior still need direct device verification.

- Comparison lines use a repeatable ID-shuffled palette of 20 distinct muted colors, avoiding red and green. The main and benchmark line styles stay fixed when VOO is toggled. The demo still allows at most two comparisons; expanding that limit is not part of this change.

- Workspace total return and main chart lines now use gain/loss colors across dashboard and workspace. Card token matches the supplied #111111 reference. Routine simulation wording was simplified; a concise fictional-demo disclosure remains because the current history is generated rather than real.

- Card surface refined to #181818 for subtle separation from the #080808 app background; the shared card token covers dashboard and workspace surfaces.

- Owner selected #111111 for the shared card surface, replacing the #181818 contrast trial.

### Landing wireframe globe (2026-10-27)

- Inspected the supplied v0 ZIP before changes. Reused its orthographic canvas concept, coastline/grid/dot styling and rotation interactions. Imported only d3-geo and its types; no ZIP app/config/React downgrade or unrelated components.
- Land data is bundled locally with precomputed land dots and a matching static SVG fallback. Back-facing dots are culled. Responsive sizing uses ResizeObserver; DPR is capped; animation pauses offscreen/hidden, provides a pause control and respects reduced motion. Pointer and keyboard rotation plus zoom buttons support interaction without capturing page scrolling.
- Replaced the landing illustration only; login still uses its existing illustration. Portfolio and Convex functionality are unchanged.
- `pnpm check`, `pnpm build`, and `git diff --check` passed. Chrome desktop review confirmed the new geographic wireframe globe renders on the landing page and exposes rotation/zoom controls. Mobile, real touch and reduced-motion device checks remain unverified; those behaviors are implemented. Dev server is available on port 3100.

- Landing refinement: removed globe pause/zoom controls and visible instructions; rotation resumes after interaction and honors reduced motion. Centered the hero below the header.

- Added decorative, slowly fading red and green land-dot accents near five financial hubs; colors are randomized and do not represent market data. Reduced motion uses static accents.

- Expanded globe accents to land dots within three degrees of each hub; each dot belongs to its nearest hub, and each hub shares one color and fade.

- Landing entrance sequences the globe zoom-out after the headline; reduced motion displays both immediately.

- Replaced the login illustration with the shared wireframe globe at its normal size, without the landing entrance animation.

- Workspace hierarchy updated: chart and result first, holdings summary second, expandable editor and settings, compact comparison and actions. Valid portfolios open with a demo result; input edits retain and label the previous result until rerun. Sample data and assumptions remain visible. Browser interaction and responsive visual review remain to be checked.

- Added a shared left-to-right easeOutQuart entrance for historical chart lines, with an immediate reduced-motion state.

- Moved the mobile dashboard timeframe selector onto a dedicated row below the heading, providing space for rightward expansion; desktop placement remains unchanged.

- Dashboard controls now use a pressed-state Show VOO button and share a desktop row with Resume Draft and the timeframe selector, reserving expansion space.

- Dashboard VOO toggle restores button hover feedback and animates the benchmark line out; reduced motion removes it immediately.

- Workspace benchmark and comparison lines animate out before removal, with matching legend fades and reduced-motion support.

- Added App Router pages for landing (/), dashboard (/dashboard), sign-in (/sign-in), and local portfolio workspaces (/portfolio/[id]). Portfolio links resolve browser-local data and missing IDs show a recovery message. Route refresh, history navigation, and storage failure behavior still require browser review.

- Replaced the workspace holdings summary with an allocation-sized individual return map using the same simulated timeframe. Moved editing/settings into a Base UI-backed shadcn-style dialog, with visible action buttons and larger supporting text. Browser focus, touch and visual review remain unverified.

- Added dialog fade/scale transitions using Base UI lifecycle attributes, including a shorter exit and reduced-motion support.

- Moved the workspace timeframe into the performance toolbar beside Run simulation, converted VOO/dollar toggles to buttons, and simplified the chart footer.

- Timeframe selection updates the result snapshot range immediately while preserving its simulated holdings and starting amount, so pending edits remain separate.

- Added the dotted pink pig/gold-coin empty state and approved one-line guidance, including static reduced motion. Portfolio supporting text now uses larger, spaced monospace styling. Simplified performance labels and removed its repeated demo disclosure; the app-level demo indicator remains. Lint and TypeScript passed. Visual review remains pending. Next owner-requested design task: customize the Edit portfolio modal.

- Extended the approved supporting-copy typography to dashboard, landing, sign-in, chart legends, and dialog labels/descriptions. Titles and controls retain their existing fonts.

- Restyled portfolio comparisons as accessible pressed-state buttons with matching line colors and the existing two-comparison limit; existing line/legend transitions are preserved.

- Comparison buttons show chart-matched colored names before and after selection, replacing the leading line swatch.

- Redesigned the edit modal around asset toggle cards and allocation rows with a persistent status footer. Removed Run simulation; valid edits recalculate immediately and invalid edits retain the previous result. Tooltip shows the primary portfolio plus selected comparisons, excluding exiting lines and VOO. Lint/TypeScript passed; browser interactions remain unverified.

- Portfolio timeframe control now aligns left beside the display toggles and expands right; dashboard alignment stays unchanged.

- Dashboard empty state now uses a dotted suitcase with an animated graph card, static under reduced motion, and retains both portfolio and sample actions. `pnpm check` passed; the SVG parsed and its static rendering was inspected locally. In-browser motion and responsive interaction remain to be checked.

- Refined the dashboard empty-state illustration to a forward-facing briefcase: the lid opens, the graph fades/scales in, then the sequence reverses. Reduced motion shows the open case and graph as a static image. `pnpm check` and SVG validation passed; open and closed stills were inspected locally. Browser animation remains unverified.

- Dashboard empty-state refinement (2026-10-28): replaced the opening/closing sequence with a permanently open, front-facing briefcase based on the owner's reference. The dark lid and perspective tray use fine wireframe grids; the centered graph card gently floats and remains visible, with a static reduced-motion fallback. Existing empty-state copy/actions are unchanged. `pnpm.cmd check` passed, SVG XML validation passed, and a local static rendering was visually inspected. Browser motion and responsive visual review remain pending; next step is owner review of this illustration.

## Pre-merge edge-case review (2026-10-28)

- Owner reports completing the end-to-end journey, mobile-layout, and accessibility/motion review (steps 1–3). This is owner-reported verification, not a new automated audit.
- Added the pinned indicator at the right of each dashboard title, vertically centered. Browser geometry confirmed alignment (center difference below 0.01px), truncation of an 80-character title, and no dashboard horizontal overflow.
- Incognito browser checks passed: empty dashboard and empty portfolio guidance, disabled empty Save, no-comparison guidance, invalid 50% allocation blocking Save while retaining the last valid chart, equal-weight recovery, 80-character name persistence, deletion cancellation and confirmed deletion returning to the empty dashboard with cleared draft/storage.
- Found and fixed long unbroken portfolio names overflowing the editor heading: constrained the heading container; the 80-character test no longer overflows the viewport.
- Injected storage failures in the isolated incognito session: quota/write failure shows a warning, prevents navigation, and preserves stored data; blocked reads on the dashboard show recovery guidance; malformed JSON is preserved with Reset local demo offered. User-profile data was not changed.
- Remaining findings for step 5: deletion's component-local Undo state is lost when navigating to the dashboard (confirmation still protects deletion); storage error notices are hidden on the landing page because it returns before the shared notification UI, so a blocked-storage create action there lacks visible feedback. Resolve these before merge review.
- Existing financial fixture suite passed 5/5 via `node --experimental-strip-types --test tests/demo.test.mjs`. Lint/TypeScript passed via `pnpm.cmd check`. No merge, commit, or main-checkout changes. Production build/full-diff reconciliation belong to the upcoming step 5 discussion.

- Deletion navigation refinement: retain the displayed draft until the dashboard route replaces the editor, and suppress the editor's persistence effect during that transition so the deleted draft cannot be written back. The missing-portfolio fallback remains for invalid links. `pnpm.cmd check` passed; browser verification of the transition remains pending. The previously noted Undo and landing storage-notice gaps remain open.

- Dashboard timeframe picker now aligns left and expands right at all widths; existing touch, keyboard and reduced-motion behavior is retained. Visual browser verification is pending.

- Corrected dashboard desktop control order: the left-aligned timeframe picker follows Resume draft and Show VOO; mobile retains its separate first row.

- Owner chose confirmation-only deletion; removed the unused Undo state and button. Landing now displays storage errors and links to dashboard recovery when storage cannot be read. `pnpm.cmd check` passed; browser verification of these refinements remains pending. The previous Undo and hidden-landing-notice findings are resolved in code.

## PR preparation (2026-10-29)

- Remote main was verified at ffcd0cd, matching this worktree's base. `pnpm.cmd check`, the five existing demo fixture tests, and `pnpm.cmd build` passed. The owner reported reviewing the primary journey, mobile layouts, and accessibility/motion; the latest deletion navigation, landing storage notice, and dashboard picker refinements still need browser verification. Real authentication, licensed history, Groq, server ownership, and deployment remain deferred.
