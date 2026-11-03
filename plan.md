# Tikr delivery plan

## PR preparation scope (2026-11-02)

Preparation completed: production build rerun on the latest two-session implementation passed using an allowlisted environment with SKIP_ENV_VALIDATION=1 and no production dotenv files present. No credential file contents were read. The configured build may fetch public Google fonts; no authenticated market-data requests occurred. Repeated 21/21 tests, all five mutation checks, lint/TypeScript, targeted source/test formatting and Git whitespace checks passed.

Final diff review covered all tracked changes and every untracked engine/test/oracle file. Dependency diff is only decimal.js 10.6.0 and its lock records; no framework/config/UI/provider changes. Reconciled the minimum-session rule, full approved policy, personal-use Alpaca scope, agent test commands and historical review limitations. PR scope is ten files: AGENTS.md, package.json, pnpm-lock.yaml, product.md, plan.md, backtest-methodology.md, src/lib/backtest.ts, tests/backtest.test.mjs, tests/backtest-mutations.mjs and tests/fixtures/backtest-oracles.json. Existing app-root environment and coordination changes were not copied wholesale. No commit, push or PR was created by this preparation.

This is an offline engine milestone only: provider-independent calculation code, deterministic tests/oracles, five mutation checks, the decimal.js dependency/lock entry, and relevant product/methodology/agent/status documents. No UI wiring, provider adapter, credentials/environment files, cache deployment or unrelated application changes belong in this proposed PR. Owner has approved the two-session minimum; one-session handling is no longer open. A universal numerical error bound and real provider evidence remain limitations, not assertions made by this milestone.

The independent reviewer accepted the preceding gap-fixed revision conditionally. Later owner-approved two-session handling is locally tested and documented, not independently re-reviewed. Earlier notes below are historical and do not override current policy. This preparation task does not itself commit, push, create a PR or merge changes.

Minimum-history verification (2026-11-02): 21/21 tests passed, five mutants killed, lint/TypeScript and whitespace checks passed. New boundary regression failed before the fix. Calendar fixtures now reject the one-session half-day case while retaining a separate accepted two-session half-day case. No new production build or independent review is claimed for this small update.

Owner approved at least two shared completed sessions (2026-11-02). Coordinator added a failing one-session/younger-inception regression and changed the engine to reject zero/one while accepting two. This updates the previously independently reviewed snapshot; old hashes no longer apply. Local checks must be recorded separately. No merge/provider integration/deployment authorized.

Offline backtest implementation (2026-11-02, independent worktree): provider-independent engine uses a private 40-digit decimal context, normalized post-split dividend units, payment-date receivables and caller-attested completeness. The gap fix received conditional independent acceptance; the subsequent approved two-session minimum passed local tests. No provider integration, cache measurement, real-data validation, licensing approval or UI integration is claimed. Universal error bounds and provider evidence remain open. Next: finish focused PR preparation, then separately investigate provider evidence and measured cache budget.

Main-checkout handoff (2026-10-30): owner requested integrating the reviewed worktree changes into C:\Users\JuanE\Code\React Projects\tikr. Applied SPY frontend/fixtures and reconciled research/product/design/AGENTS updates while preserving pre-existing main edits and staged state. No branch merge commit, commit, push or PR created. Main HEAD remains 7b56909; changes await owner review and commit. Main fixture suite passed 6/6; uncached lint and standalone TypeScript passed after restoring frozen-lockfile dependencies. Cached lint initially reported stale type errors. Browser/build review not repeated.

Current worktree update (2026-10-30): fast-forwarded research/free-services-feasibility to local main at `7b56909`, importing the branding/globe changes. Preserved and reconciled uncommitted SPY frontend changes and research/coordinator documents; main checkout left untouched. No new commit or push. Prior synchronization notes below describe earlier states. Current task: verify combined checks and let owner review the updated worktree.

Combined verification passed: `pnpm.cmd check` (lint and TypeScript), all six existing/updated fixture tests, and `git diff --check`. No unmerged files remain. Browser review and production build were not repeated for this synchronization; next step is owner review of the updated worktree.

Worktree synchronization (2026-10-30): owner clarified to update only this research worktree from the local main checkout, leaving main untouched. Both committed trees are at 06b8ef3, so no source merge was needed. Reconciled main's uncommitted AGENTS/product/design/plan updates into this worktree while preserving SPY and research changes; retained its original free-services outline alongside local findings. Remote-tracking origin/main is separately at 7b56909 (branding merge); it was not imported by this local-checkout synchronization. No commit, push, branch move or write to the main checkout.

Frontend benchmark switch (2026-10-30): owner selected SPY to replace VOO. Updated dashboard/workspace controls, comparison labels, chart legends, benchmark series, sample catalog/fund name, examples and existing fixtures. Legacy browser-local demo VOO holdings migrate to SPY with a visible notice, preserving portfolio/draft fields. Real FMP history/auth/backend integration remains unimplemented; synthetic-data disclosures stay in place. Verification pending below.

Verification: initial tests/check were blocked by absent node_modules. Restored exact existing dependencies with `pnpm.cmd install --frozen-lockfile`; manifest and lockfile unchanged. `pnpm.cmd check` passed lint and TypeScript; `node --experimental-strip-types --test tests/demo.test.mjs` passed 6/6, including legacy saved portfolio/draft migration and unknown-symbol rejection. Targeted frontend Prettier applied; `git diff --check` passed. Remaining source VOO literals are compatibility handling/notice and its regression fixture. Browser interaction review and production build were not run for this ticker switch. Next: owner review of SPY labels, then separate real-data validation/integration planning.

Owner-run SPY dividend-adjusted endpoint succeeded for October 26–29, 2026. This proves short-range endpoint entitlement, not corporate-action correctness or five-year adjusted coverage. Next: five-year adjusted SPY and AAPL checks, then action/date methodology validation. Public licensing remains separate.

Five-year SPY check: owner reports success for the requested five-year range. SPY remains the leading replacement benchmark candidate. Next data task is dividend-adjusted endpoint entitlement/methodology and date-completeness validation; private technical feasibility is improved, public licensing remains unresolved.

SPY feasibility evidence (2026-10-30): owner-run FMP request returned four daily records covering October 26–29. SPY short-range access verified by supplied response; next step is five-year SPY depth/count and dividend-method validation. No benchmark integration or full-feasibility claim; no need to test other ETFs unless SPY fails subsequent checks.

Benchmark decision update (2026-10-30): owner accepts another S&P 500-tracking ETF instead of mandatory VOO; product.md reconciled. Owner-run FMP AAPL history reaches 2021, VOO denied by premium-symbol restriction. Next private feasibility step: short-date SPY, IVV, then SPYM entitlement checks, then five-year/action validation for a successful candidate. No general ETF exclusion inferred and no benchmark chosen. Public-use license gate remains open; no backend changes.

Latest data research: FMP standard license rejected based on explicit terms 2.2.1/2.2.2 covering complimentary multi-user apps; Finnhub standard terms also reject sharing derived results. Additional leads OHLC, Financial Datasets and GetMarketHistory do not establish free required coverage/rights. Owner supplied Stooq's personal-use notice and 518 MB U.S. daily listing. Full evidence and unsent FMP permission draft are in free-services-plan.md. M2 is blocked on data permission/entitlement evidence, not implementation. No permitted zero-cost public path proven; next evidence is an applicable written grant or owner-approved scope/budget change. No provider contacted, account created, history downloaded, or backend changed.

## Data-feasibility research checkpoint (2026-10-30)

Selected research worktree HEAD verified at `06b8ef3`. Owner's current merge-history report supersedes older isolated-frontend/main-untouched descriptions below; historical verification records are preserved. Portfolios remain browser-local, history remains synthetic, and branding `cc71128` is outside this research task.

Stage 1 preliminary official-source evidence is recorded in `free-services-plan.md`. No candidate yet demonstrates a permitted zero-cost public history/catalog path. Findings await owner review; M2 stays open. Next task: review licensing blockers and acceptable scope, then continue evidence gathering before selecting or integrating a provider. No application checks were rerun, dependencies installed, provider contacted, or backend integration changed.

Owner follow-up: current scope is strictly non-commercial with no planned ads/subscriptions; five-year history support is required, and alternatives should be researched. Recorded in product.md. Alternative screening in free-services-plan.md found depth failures (Marketstack/EODHD), storage/chart restrictions (Tiingo), public-sharing restrictions (SimFin), obsolete history (WIKI), and unreadable primary evidence (Stooq/Finnhub). No permitted free path demonstrated; M2 remains open. Next: owner review of these findings and unresolved primary-source permissions. No shorter-history concession, vendor selection or paid fallback adopted.

Hybrid history discussion: importing five years once and using a separately permitted recent-history updater is technically plausible. Illustrative compact storage estimates and reconciliation hazards are recorded in free-services-plan.md; actual database size/free-tier fit and a compatible licensed provider pair remain unverified. This is a proposal, not an approved architecture or implementation task.

Owner correction: determine storage and I/O budget before proposing Convex for history. Official Free limits reviewed: 0.5 GB database storage including indexes and 1 GB/month database I/O; account headroom and actual encoded data size unmeasured. Record in free-services-plan.md. No history placement approved; next capacity task is a measured catalog/encoding/index/traffic budget, alongside unresolved data rights.

Narrowed assistant recommendation: validate a single permitted downloadable EOD source feeding versioned static per-asset files on intended Vercel hosting; keep market observations out of Convex. Stooq permission draft prepared in free-services-plan.md, not sent. Hybrid API updates remain conditional fallback; no standard-free public API approved. Owner has not adopted catalog limits, storage design or vendor. Next gate: explicit public file/display/cache rights plus five-year VOO and adjustment evidence, followed by measured bytes/refresh/hosting budget. No implementation or deployment.

Latest checkout update (2026-10-30): local main is now at `7b56909`, including the branding merge. Restoring local documentation after the pull conflicted only in this file; retained both the branding history and coordinator reconciliation below. Older checkout/branch observations remain historical. No new commit or push was made during conflict resolution.

Last checked: 2026-10-30.

## Current state

- Frontend integration and route ownership refactor are merged into the actual app at `C:\Users\JuanE\Code\React Projects\tikr`, branch `main`, HEAD `06b8ef3`. Local Git history records merges of the frontend and App Router refactor. This reconciliation does not create or modify a PR.
- v0 ZIP was inspected before source edits. See `prototype-review.md` for reuse, dependency differences, mocked behavior, and requirement conflicts.
- The owner reports the frontend is virtually complete. Source includes landing, bright Google-only sign-in preview, dashboard, and portfolio workspaces with shared browser-local persistence. Design work is substantially complete; latest route/provider lifecycle regression is still a distinct verification gap, not a reason to restart the UI.
- Convex backend/generated files remain unchanged. Existing provider still wraps the app; a missing-URL guard permits standalone demo rendering without provisioning or inventing a deployment URL.
- Browser-local portfolios/drafts are separate from Convex and are explicitly labeled. Real auth, licensed market history, Groq, server ownership, and quotas are deferred.
- pnpm 10.11.0, Next.js 15, React 19, Tailwind 4 retained. Added only imported UI/chart dependencies; no ZIP framework/config/lockfile replacement or analytics.
- The latest branding/empty-state commit `cc71128` (Add Tiky branding and globe empty states) is on the clean local branch `feat/tiky-branding`, not yet in main. Its worktree is `C:\Users\JuanE\.t3\worktrees\tikr\feat-v0-portfolio-frontend`. This review does not merge it or assume the branding is a confirmed product rename.

### Location correction

The documents were originally committed to a separate outer repository at `C:\Users\JuanE\OneDrive\Documents\ChatGPT\tikr`, which is not this app. Its empty/unmapped gitlink observation does not describe this application. The mistaken documentation commit has been reverted there, and the original planning worktree was synchronized with that revert. Unrelated nested-repository work was preserved. Do not repair that other repository as part of app development.

## Next actionable task

The ordered research checklist for the data-feasibility handoff is `free-services-plan.md` (2026-10-30). Begin with licensed free market history/catalog feasibility; verify Convex/auth in parallel where useful, then hosting, Groq, and operational services. This is a research outline, not provider approval or authorization to provision integrations.

**Review and integrate the remaining `feat/tiky-branding` commit through the intended frontend handoff, synchronize main's dependencies, and finish the focused frontend closeout below; then resolve M2 free market-data permissions and calculation policy.** No merge is authorized by this status review alone. Run `pnpm.cmd install --frozen-lockfile` in the correct app root before repeating checks: this checkout currently cannot resolve several dependencies already declared in package.json. Do not change application types or relax lint rules to compensate for missing packages. M2 is the largest feasibility gate before real history can replace demo series. In parallel, M3 can add Better Auth Google sign-in, Convex portfolio ownership/persistence, and guest-draft handoff without depending on a price provider. Groq discovery follows a verified asset catalog and approved quotas; it is not the next critical dependency.

### Workspace binding caveat

The coordinator chat is still attached to `C:\Users\JuanE\.t3\worktrees\tikr\t3-39cd552a` in the unrelated outer repository, not this app's Git worktree family. T3 reports the thread is already attached; its handoff tool cannot move an already-attached worktree, and thread-update cannot change workspace/branch. No shell-created checkout, mixed repository history, project-wide setting change, or new thread was used to imply a successful migration. This review uses the explicit correct application path. Future implementation should be bound to the actual app project; the chat's workspace migration remains unresolved.

### Focused frontend closeout

- Existing source and prior records support an implemented demo, not real Google auth, licensed returns, or server persistence.
- Recheck refresh/back/forward, invalid portfolio URLs, guest draft handoff, deletion navigation, and storage failure/recovery after the shared-provider refactor.
- Keep user data intact during testing. Prior browser evidence predates some lifecycle changes; no new browser review is claimed here.
- Rerun configured checks and the existing five demo fixture tests. The results do not prove the production return methodology or provider licensing.

## Milestones

### M0 - Establish the source baseline

Status: source/worktree confirmed; dependencies installed with pnpm 10.11.0. Local frontend can run without environment secrets.

- Completed: located existing app and preserved its source/history.
- Completed: identified manifest scripts, pnpm lockfile, Next.js layout, and Convex provider; updated `AGENTS.md`.
- Completed: isolated frontend dependency installation and local startup. No credentials copied or read. Convex connectivity remains unverified.

Exit: frontend setup is usable. Production/backend configuration is a separate verification task.

### M1 - Review an interactive frontend prototype

Status: frontend demo and route refactor merged; owner reports near completion. Focused post-refactor route/storage regression remains pending.

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

## Route ownership refactor (2026-10-29)

- Each App Router entry now renders its own client page: landing, dashboard, sign-in, and dynamic portfolio. Removed `TikrApp` and its `view` switch. Dashboard cards and portfolio editor/comparison components live alongside their routes under private `_components` folders.
- Root layout hosts a shared demo portfolio provider for hydration, browser persistence, drafts, save/delete operations, and notices. Page-specific timeframe, chart toggles, comparison selection and editor state remain local to the appropriate page. Shared shell renders navigation and storage feedback without deciding which page to show.
- Portfolio URL IDs resolve against the hydrated store; absent IDs retain the recovery UI. Delete state updates and dashboard navigation share a React transition. No Convex functions, credentials, main-checkout changes, commits, or pushes are part of this refactor.
- Verification: lint/TypeScript passed without warnings and all five financial fixture tests passed. Production build verification is recorded below. Browser regression of refresh/back/forward, invalid links, draft handoff, storage recovery, and deletion remains pending for the new provider lifecycle.
- Final production build passed after the route refactor. The build emits all four intended routes, with route-specific bundles. No browser interaction results are claimed for this change.


## Bear branding assets (2026-10-29)
Created full-scene PNG, transparent rider PNG, clean SVG head and 16/24/32/48/180/192/512px exports. Connected favicon metadata and dashboard BearCruiser component. Animation is a 12-second horizontal translation with offscreen reset, manual pause, and reduced-motion fallback. Lint and TypeScript passed. Transparency metadata verified; small-icon export inspected. Browser motion, responsive appearance and owner review of the simplified head remain pending. No backend, deployment, commit or main-checkout changes.

- Bear identity update: installed the approved aviator-head preview and refreshed icon exports; shared wordmark appears on landing, sign-in and the app shell. Lint and TypeScript passed; 32px export visually inspected. Browser appearance remains unverified.

- Updated the dashboard rider to a generated crouching bear with aviators. Its six-second loop travels between stage edges and flips at each turnaround; pause and reduced motion are retained. pnpm check passed. Browser motion and narrow-screen appearance remain to be verified.

- Refined the dashboard rider pose to a kneeling crouch and moved both turnarounds offscreen. Pause and reduced motion remain; pnpm check passed. Browser motion review remains pending.

- Generated monochrome-board kneeling and standing rider illustrations; dashboard defaults to kneeling, with a standing component option. Loop crosses in three seconds per direction and waits two seconds offscreen at each end. pnpm check passed; browser motion and responsive review remain pending.

- Matched kneeling bear fur to the standing pose and combined both in the dashboard loop, switching offscreen. Pause and static reduced-motion fallback remain. pnpm check passed; browser motion review remains pending.

- Replaced the dashboard skating animation with the generated static candlestick globe illustration at the owner's request. Lint and TypeScript passed. Responsive visual review remains pending; the candlesticks are decorative, not market data.

- Replaced the static cropped candlestick image in the dashboard with a complete orthographic wireframe globe and independently fixed decorative candlesticks. The globe rotates at the landing globe's rate, pauses offscreen or when hidden, and respects reduced motion; the empty section uses the page background. pnpm check passed. Responsive visual and motion review remains pending.

- Replaced the empty portfolio pig with the shared dashboard wireframe globe and a decorative three-tile overlay; removed unused pig coin styles. pnpm check passed; desktop/mobile and motion visual review remain pending.

## Coordinator reconciliation (2026-10-30)

- Reviewed actual app main at `06b8ef3`, its manifest, route tree, shared localStorage provider, and recent merge history. Updated the current-state summaries in all four coordination documents; older entries above remain historical evidence, not current branch status.
- Owner reports near-complete frontend. No new design approval, browser regression, deployment, or live backend verification is claimed by this review.
- Reran the existing demo fixture suite: 5/5 passed with `node --experimental-strip-types --test tests/demo.test.mjs`.
- `pnpm.cmd check` failed in lint; its chained TypeScript step therefore did not run. A separate `pnpm.cmd typecheck` also failed. Missing modules include lucide-react, Recharts, Base UI, d3-geo, and utility dependencies already listed in the manifest. Direct module-resolution checks confirm the main checkout's install is not synchronized. Do not infer a new frontend regression solely from the resulting unsafe-any/type-resolution errors.
- No dependency install, source fixes, production build, secret access, commit, merge, push, project-setting change, or workspace migration was performed in this coordinator review. Reconcile dependencies from the frozen lockfile and repeat checks before adding backend work.
- Git whitespace checks pass for the documentation edits. Browser lifecycle checks remain pending as described above.

## Private Alpaca adapter milestone (2026-11-02)

Review completion (2026-11-03): after timestamp/server-boundary/resource/cancellation fixes and the contradictory-inception regression, two focused independent Terra/high passes completed full adapter-source and test/tooling/evidence/diff coverage. No actionable findings remained within the offline candidate/caller-attestation contract. All nine frozen file hashes matched at both ends of each pass. Independent verification passed 39 tests, five mutation checks, lint/TypeScript, actual server-only client-import build rejection, cleared-environment private CLI rejection and a credential-free production build. The coordinator also completed a full source read and repeated these checks. Earlier partial-review reports did not grant acceptance. This completion note is a documentation update after review, not a source change.

Accepted scope is offline client/normalization and externally evidence-gated engine conversion only. Calendar/finality/inception/action completeness and normalized units still require real provider evidence; public/shared rights and cache/refresh costs remain separately gated. No authenticated calls, credentials, UI wiring, deployment or cache architecture belong in this PR.

Added a server-only, injected-transport candidate client with bounded paging, retries and timeouts; raw daily bar and corporate-action candidates; and an evidence-gated offline engine conversion. Synthetic fixtures cover traversal, failure handling and the conditional boundary. A private command refuses to run without explicit process configuration; no credentials or authenticated requests were used. The adapter is not integrated with the UI or Convex, and successful traversal does not establish action completeness or production readiness. See `alpaca-evidence.md` for source evidence and unresolved finality, inception, action and licensing gates. Next: independent review of this milestone and establish a separately justified provider-evidence process before any real-data engine conversion.

Verification for this milestone: 21 existing and 9 adapter tests passed; all five mutation checks passed after normalizing CRLF in the mutation harness. `pnpm check` passed. New source/test files passed Prettier; the repository-wide check reports pre-existing formatting differences. Credential-free production build and independent review are recorded in the handoff; provider and licensing verification remain open.

## Alpaca adapter review fixes (2026-11-02)

Independent review requested changes to timestamp validation, the client boundary, response budgets and retry cancellation. The revision validates timestamp components, uses Next's pinned `server-only` marker, caps streamed bytes/chunks and page/aggregate records, and aborts retries promptly. A disposable-project build confirms Next rejects a client import. The tests are synthetic; external proof records remain attestations and provider completeness remains unresolved. Verification: 21 existing and 17 adapter tests passed, five mutations passed, `pnpm check` passed, the isolated negative build failed for the expected server-only reason, and the credential-free production build passed. The private command rejected missing credentials. Next: coordinator-owned independent review of the frozen revision, followed by separately authorized provider evidence work if appropriate.
