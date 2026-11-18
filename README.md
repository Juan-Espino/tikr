# Tikr

Historical stock and ETF portfolio lab built with Next.js, TypeScript, Convex, Better Auth, Alpaca, and Groq.

## Overview

Tikr lets you build a portfolio, choose a historical period, and compare its hypothetical performance against SPY. Start with an example, choose your own stocks and ETFs, or describe a category to discover supported assets with AI.

The project combines an interactive portfolio editor with server-side market data, a decimal-based simulation engine, Google authentication, and account-owned cloud portfolios. It models historical investments; it does not predict prices, recommend trades, or execute orders.

## Live App

[tikr-lovat.vercel.app](https://tikr-lovat.vercel.app)

## Features

- Read-only example portfolios and a temporary guest draft, with no account required to explore
- Google sign-in through Better Auth
- Automatic account portfolio creation and autosave once the name, holdings, amount, and allocation are valid
- Account-owned portfolios with rename, duplicate, pin, and delete actions
- Permanent account deletion with confirmation and fresh-session verification
- Ticker and company-name search backed by an Alpaca asset catalog
- Optional AI category search through Groq, with every suggested ticker checked against the catalog
- Up to six holdings, equal or manual allocations, and a configurable starting amount
- Explicit 1W, 1M, YTD, 1Y, and 5Y ranges, with 1W as the default
- SPY benchmark and comparisons with up to two additional portfolios
- Interactive performance charts, total return, drawdown, and per-asset returns
- Responsive layouts, keyboard interactions, and reduced-motion support
- Loading, missing-history, conflict, retry, and save-error states

## Tech Stack

- Next.js App Router and React
- TypeScript
- Tailwind CSS, shadcn-style components, Base UI, and Sonner
- Recharts
- Convex database and server functions
- Better Auth with Google OAuth
- Alpaca historical market data and asset catalog
- Groq with GPT-OSS for AI asset discovery
- Decimal.js for financial calculations
- Vitest, convex-test, Node's test runner, and Playwright
- Vercel

## How It Works

**Browser:** edits portfolio definitions, displays charts, and keeps one temporary guest recovery draft. Signed-in portfolios belong to the authenticated account. IndexedDB can reuse history, but browser data cannot override server validation or revoked evidence.

**Application server:** validates market requests, deduplicates overlapping tickers and SPY, coordinates refreshes, fetches Alpaca data with server-only credentials, and runs historical calculations. Process caches are bounded and disposable; hosted memory is not treated as shared or durable storage.

**Convex:** stores account portfolios and authentication state, coordinates shared market leases and revisions, and persists normalized market-history chunks. AI discovery runs server-side with catalog validation and a separate account allowance. Calculated portfolio results are not stored as a database row for every request.

**Providers:** Alpaca supplies historical prices, calendar sessions, corporate actions, and catalog records. Groq interprets submitted category queries; the catalog determines which returned tickers the app accepts.

## Historical Methodology

- Buy-and-hold allocations with fractional shares and drifting weights
- Decimal arithmetic, with display rounding separate from calculations
- Ex-date dividend receivables and payment-date reinvestment
- Supported ordinary split handling
- Shared dates and starting amount across portfolios and SPY
- At least two completed common trading sessions
- Missing required prices, unsupported actions, and insufficient history block results rather than silently dropping holdings or shortening the selected period

The personal Alpaca integration uses provisional data subject to corrections. Reported cash-dividend rates are treated as USD per traded share or ADR, retaining any withholding embedded in the source amount, without additional currency conversion or gross-up. That is an application assumption, not an independently verified guarantee about every provider record.

See [backtest-methodology.md](backtest-methodology.md) for the calculation contract and limitations. Historical results are hypothetical, exclude fees and additional taxes, and do not guarantee future returns.

## Project Structure

```text
src/app                 Landing, dashboard, editor, sign-in, methodology, and API routes
src/components          Portfolio editor, charts, account dialogs, and shared UI
src/providers           Account state, temporary drafts, and autosave coordination
src/lib                 Simulation engine, market adapters, caching, and validation
convex                  Authentication, owned portfolios, market storage, and AI discovery
tests                   Financial fixtures, cache, request, ownership, and regression tests
scripts                 Browser QA, fixture builds, and development/operator utilities
public                  Branding, favicon, illustrations, and decorative globe assets
```

## What This Project Shows

- A full-stack financial exploration app with a documented calculation model
- Authenticated ownership checks and revision-safe cloud editing
- Autosave coordination, idempotent creation, and recovery from uncertain responses
- Shared history caching, refresh coalescing, and cross-instance concurrency control
- AI output constrained by a canonical asset catalog
- Deterministic financial fixtures and browser-tested interaction flows
- Product design, implementation evidence, and operational documentation in one repository

## Running Locally

Use Node.js 22.18 or newer and the pinned pnpm version (`10.11.0`).

Install dependencies:

```sh
pnpm install --frozen-lockfile
```

Create your ignored local configuration:

```sh
cp .env.example .env.local
```

For authentication and cloud portfolios, configure **your own Convex development deployment** using [accounts-signin.md](accounts-signin.md). Set its public cloud and HTTP URLs in `.env.local`, and configure Google OAuth with the matching localhost callback. Keep Google credentials and the Better Auth secret on the server.

Run the frontend on the port used by the local auth setup:

```sh
pnpm dev --hostname localhost --port 5000
```

Open [localhost:5000](http://localhost:5000).

Real charts require a separately configured market integration; installing dependencies alone does not enable Alpaca access. AI discovery is optional and disabled unless its server and client configuration are enabled. Missing services are not replaced with fabricated market results.

## Environment Variables

Start with [.env.example](.env.example). It documents separate local and hosted configurations; they are not one set of interchangeable settings.

| Capability                | Configuration                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth and cloud connection | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`                                                                                               |
| Google authentication     | Server-side `SITE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET` on Convex                                                    |
| Market data               | Server-only Alpaca credentials and the local or hosted market bindings in [market-data-integration.md](market-data-integration.md)                    |
| Optional AI discovery     | `NEXT_PUBLIC_AI_DISCOVERY_ENABLED`, with server-side `GROQ_API_KEY` and `TIKR_AI_DISCOVERY_ENABLED` on Convex; see [ai-discovery.md](ai-discovery.md) |

Use separate development and production credentials. Never place private keys in `NEXT_PUBLIC_*` variables or commit a filled environment file. A clone does not include access to the project's deployed services or provider accounts.

## Checks and Tests

Lint and check both TypeScript projects:

```sh
pnpm check
```

Run the core deterministic financial tests and mutation checks:

```sh
node --conditions=react-server --experimental-strip-types --test tests/demo.test.mjs tests/backtest.test.mjs
node tests/backtest-mutations.mjs
```

Run the Convex, authentication, and hosted-runtime test suite:

```sh
pnpm exec vitest run --maxWorkers=1
```

Build the configured app with `pnpm build`. For a credential-cleared compile check using synthetic public auth bindings:

```sh
node scripts/build-cleared.mjs --auth-fixture
```

Synthetic tests do not establish live provider availability, Google OAuth completion, data licensing, or production capacity. Operator scripts under `scripts/` can contact services; they are not all offline tests.

## Further Documentation

- [Cloud portfolios and ownership](cloud-portfolios.md)
- [Autosave and creation coordination](portfolio-autosave.md)
- [Account deletion and retained-data inventory](account-deletion.md)
- [Market integration](market-data-integration.md)
- [Cache architecture](on-demand-cache.md)
- [AI asset discovery](ai-discovery.md)
- [Product scope](product.md) and [design decisions](design.md)

`plan.md` contains the current project summary followed by dated implementation history. Older checkpoints describe the state at the time, not necessarily the current app.

## Future Improvements

- Broader coverage of transient failures and recovery without reloads
- More durable calendar and shared-SPY reuse
- Stronger period-switching and cache-state UX coverage
- Clearer public privacy, infrastructure retention, and restore policies

## Source, Assets, and Market Data

No project-wide source license has been selected yet. Third-party dependencies and assets retain their own terms; the decorative globe's source is documented in [public/globe/README.md](public/globe/README.md).

Publishing this repository does not grant access to Alpaca or Groq, or establish permission to redistribute market data. Public display and caching rights remain a separate release requirement; free API access is not a redistribution license.
