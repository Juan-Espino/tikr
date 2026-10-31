<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Repository guidance

## Read first

- `product.md` owns audience, scope, behavior, and open product decisions.
- `design.md` owns approved visual rules, components, and references.
- `plan.md` owns evidence-backed progress, dependencies, and the next task.

Keep confirmed requirements distinct from assistant proposals. Explicit owner decisions override older documentation; reconcile the affected documents. A v0 prompt does not prove implementation exists.

## Application baseline (2026-10-30)

Correct repository: `C:\Users\JuanE\Code\React Projects\tikr`, branch `main`. This is a runnable-app source tree, not the unrelated outer repository with an unmapped gitlink.

Verified source: the portfolio demo frontend and App Router refactor are merged into `main` at `06b8ef3`. Landing, dashboard, sign-in, and portfolio pages share a browser-local portfolio/draft provider. The UI includes Manrope, charts, Base UI-backed component foundations, and the wireframe globe. The existing Convex provider remains, but portfolio persistence still uses localStorage. Better Auth, Groq, licensed market history, and server-enforced portfolio ownership are not implemented. Frontend completion is not production readiness.

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
- SPY is the explicitly named ETF benchmark, replacing VOO by owner decision on 2026-10-30. Compared series share dates, starting amount, and methodology.
- Equal weights by default; manual weights must be positive and total exactly 100% before finalization/backtesting. Handle rounding deterministically.
- Never omit missing holdings/history silently or invent earlier prices. Statistics must agree with charts.
- Google-only authentication; preserve guest drafts and enforce portfolio ownership server-side.
- Pin portfolios, but do not add manual ordering or drag-and-drop.
- Matte near-black surfaces, Manrope, stone-white text/charts; no pastel dashboard cards. The bright login panel is intentional.
- Groq interprets category queries; a verified catalog supplies supported assets. No unchecked model tickers, personalized buy/sell advice, or AI forecasts.
- Enforce input size, per-user, concurrency, and shared request/token limits server-side. Exact proposed limits in `product.md` are not yet approved.
- AI exhaustion must not block normal asset search or portfolio operations. No automatic paid fallback.
- Market data must be free and permitted for intended public use. Verify licensing and methodology before integration.
- Label mock data and demo authentication honestly.

## Actual commands and verification

Commands below are taken from the inspected manifest; their availability is not proof that they passed:

- `pnpm dev`: Next.js development server with Turbo.
- `pnpm build`: production build; requires valid environment/configuration.
- `pnpm typecheck`: TypeScript check without emitting output.
- `pnpm lint`: configured Next.js lint command.
- `pnpm check`: configured lint plus TypeScript check.
- `pnpm format:check`: configured Prettier check for TS/TSX/JS/JSX/MDX; it does not include plain Markdown files.

No test script is defined in package.json, but the existing fixture suite is run with `node --experimental-strip-types --test tests/demo.test.mjs`. It validates demo calculations and storage rules, not a licensed historical-data integration. Do not invent passing checks or silently add a broad test framework. Report failures without fixing unrelated code under a documentation-only request. Convex connectivity, real authentication, and deployment need separate verification.

For Markdown changes, check whitespace, final newlines, document references, and confirmed/proposed labels. Run `git diff --check`; inspect untracked files directly before staging because normal Git diff omits them. Inspect final status for unrelated changes.

For application changes, start with focused existing checks, then appropriate configured checks. Follow established test patterns for allocation precision, return math, dividends/splits, common dates, missing history, ownership, draft handoff, and atomic quotas. Review desktop/mobile, focus, touch tooltips, contrast, reduced motion, and loading/error/quota states. Keep financial fixtures deterministic and sample data labeled. Validate data licensing separately from UI correctness. Report commands/results and gaps honestly.

## Coordination

Update `plan.md` with evidence-backed status and the next task. Update `product.md` for approved scope changes and `design.md` for approved visual changes. Do not convert deferred ideas or assistant suggestions into launch commitments.
