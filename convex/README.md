# Convex market coordination

This app uses Convex for shared market coordination, not browser portfolios or a
primary historical-price store. Server credentials never enter the browser.

- `market.ts`: operator allowance review and internal read/acquire/write/release
  transactions; asset roots, catalog and limitations; atomic lease completion.
- `hosted.ts`: shared concurrency, provider reservation settlement, persistent
  guards/revocations and legacy visitor-expiry compatibility.
- `http.ts`: secret-protected, allowlisted server gateway. Its market reads are
  mutations that update admission counters, not read-only inspection tools.
- `schema.ts`: existing market tables/indexes retained. The unused template tasks
  table remains until an explicitly approved migration; its function
  implementations were removed. Generated bindings are not edited manually.
- `convex.config.ts` / `market_limits.ts`: retain the rate-limiter component only
  for already-scheduled legacy expiry callbacks; do not reset its records.

New monthly history, derived portfolio results and calendar caches are disposable
browser/process data. Durable asset roots, attempts, fences, receipts, admission
and revocations remain authoritative. Existing legacy manifests remain readable.

Read `../market-redesign-checkpoint.md`, `../market-source-inventory.md`,
`../market-accounting.md` and `../market-deployed-cleanup.md` for current behavior,
measured synthetic scope and approval gates. Source edits are not a deployed
migration. No deployment, destructive cleanup or live provider call is authorized
by passing local tests. Before Convex edits, read `_generated/ai/guidelines.md`.
