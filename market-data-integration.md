# Personal market-data integration

Current architecture: [market-redesign-checkpoint.md](market-redesign-checkpoint.md).
This replaces the earlier durable-history/result-cache integration description.

## Scope and activation gates

Alpaca credentials and normalization remain server-only. Portfolio definitions and
drafts remain browser-local; there is no auth/profile/cloud-portfolio scaffolding.
Hosted access is unauthenticated, but live public display and caching rights are
not established. No synthetic test or successful build authorizes activation,
credentials, deployment, paid use or live provider calls.

Personal provisional mode remains explicitly enabled through the existing server
configuration. It accepts provisional coverage under the owner policy and labels
results subject to corrections. Reviewed replay remains an expiring, hash-bound
private evidence-file alternative. Neither mode fabricates inception, prices,
missing actions or earlier common history. Read `backtest-methodology.md` before
engine changes and `alpaca-validation.md` for evidence/oracle procedures.

## Durable storage and refreshes

The server keeps only asset roots/metadata, shared admission/fencing/attempts,
revocations and validated catalog state in Convex. Monthly normalized history is
browser/process disposable content. New calendar and derived-result writes are
removed. Legacy monthly manifests remain readable; shared guards and historical
revocations are never bypassed by a new cache identity. Recovery still binds the
atomic committed head revision to readback receipts. Files/process memory are not
shared or durable on Vercel.

See `on-demand-cache.md` for restart, cache-loss and multitab behavior;
`market-accounting.md` for control units versus measurements; and
`market-deployed-cleanup.md` before any deployment or record cleanup. Source schema
is unchanged and deployed records have not been deleted or reset.

## Server configuration inventory

`ALPACA_API_KEY_ID` / `ALPACA_API_SECRET_KEY` (existing `APCA_API_KEY` /
`APCA_API_SECRET` aliases), activation flags, Convex server/gateway configuration,
reviewed evidence path/hash and development allowance settings are server-side.
The unused browser Convex provider and its public-URL consumer are removed.
Never copy/read private env or owner browser data for synthetic verification.
Names and consumer decisions are in `market-source-inventory.md`; no secret
values belong in documentation, browser storage or logs.

## Local verification

Use pnpm.cmd on Windows. Run `pnpm.cmd check`, the Node suites with
`--conditions=react-server --experimental-strip-types`, `pnpm.cmd exec vitest run`
and `node tests/backtest-mutations.mjs`. Run the deterministic cost matrix through
`scripts/measure-market-redesign.mjs`; the old measurement command is a compatible
alias and no longer extrapolates a fixed traffic capacity model.

`scripts/build-cleared.mjs` copies explicit source paths into system temp, excludes
env files and builds with a credential-cleared environment. The isolated browser
fixture script similarly copies source, injects deterministic server data and
listens on a unique loopback port. Its `--unconfigured` mode exercises the real
disabled integration. Use a fresh browser context and keep artifacts in temp.
Terra actual-browser verification is separate from optional Playwright regression.
