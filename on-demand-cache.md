# On-demand market-data cache

Admission follow-up (2026-11-10): hosted opens use short-term browsing protection instead of daily open caps. All real cached reads still cross the durable budget/revision/guard boundary. Source cooldown/daily-attempt refusals retain safe codes and known retry deadlines; result-slot persistence contention does not throttle a calculation using fresh sources. The single-process factory remains insufficient to enforce cross-host budgets by itself. See hosted-operation.md for synthetic operation evidence, configuration and limits.

Hosted preparation update (2026-11-06): anonymous Vercel operation is implemented behind explicit activation configuration; see [hosted-operation.md](hosted-operation.md) for exact variables, limits, disable/rollback and unresolved public-data rights. Local-only/production-disabled descriptions below describe the original local path, which remains compatible. Public activation has not been authorized or performed.

## Approved behavior and implemented scope

Opening a portfolio invokes a shared server coordinator. Fresh verified data returns immediately. Stale data returns the last verified calculation with its market `asOf` date and `dataCheckedAt` timestamp while refreshing. Cold assets or a new calculation without a verified snapshot return a loading state. A failed refresh retains an existing dated result; otherwise the result is blocked. A known corrected dependency invalidates old calculations rather than serving them as an acceptable fallback.

`src/lib/market-cache.ts` implements this behavior with `createOnDemandBacktests`. It is server-only and has no default network transport, credentials, file storage or scheduled jobs. A shared instance deduplicates asset loads, including SPY, across simultaneous portfolio requests. Asset data revisions and results are retained **in memory in that one process**. Restarts lose cache entries and refresh counters. This is a personal single-process core, not a deployed or durable cache; separate Vercel instances do not share it. The demo UI is not wired to this module.

## Interface

The server supplies a supported symbol allowlist including SPY, an explicit supported-history start, a verified calendar, an injected clock when testing, and a trusted `load` function. A request contains portfolios, starting amount, start date and an end date or `latest`. `open` returns `initial` plus a `settled` promise with the final view. Status is `ready`, `refreshing`, `stale` or `blocked`. Result snapshots include asset revision hashes. Errors expose sanitized codes and affected holdings where known, never provider exception text.

The loader receives symbol, full supported `from`/`through`, `recheckFrom`, previous cached data and an abort signal. It must return normalized raw SIP data with independently established inception, price/action coverage, access and provenance. Cache flags are caller attestations, not independently authenticated evidence. Raw adapter candidates have unknown action completeness and cannot satisfy this boundary. If only the newest eligible session is pending, the loader may explicitly set `pendingSession` to that session and return fully verified data through the immediately preceding session. Unknown actions, access failures and interior gaps do not qualify. A cold or mixed-asset load then calculates through the shared earlier verified endpoint, labeled `stale`/`SESSION_PENDING` when the requested endpoint is later. A bounded explicit retry may advance it. An earlier historical request already covered by those records can be ready. Missing prices without that explicit pending-tail contract still fail. The coordinator also checks literal verification flags, prices, coverage and gaps; the existing backtest engine validates inputs again before any result is saved. It does not manufacture verification from timing, pagination or matching examples.

`recheckFrom` identifies the most recent five eligible sessions. It is a price-recheck hint, not permission to restrict corporate-action reconciliation to five days. Each returned asset must cover the configured supported history through its declared verified endpoint, with only the explicit newest-session pending exception described above. Establishing how Alpaca supplies complete processing-date/correction coverage remains an integration prerequisite.

## Freshness, concurrency and revisions

Use America/New_York, including DST. A session becomes eligible no earlier than 09:00 on the following calendar day. Calendar/finality evidence is still required. The daily freshness cycle runs from one New York 09:00 cutoff to the next, avoiding an 08:59 visit consuming the 09:00 refresh. On-demand checks occur only when the coordinator is opened; no weekly market-wide scan or background schedule is installed.

Allow one automatic refresh attempt per supported asset per cycle. Requests arriving during that attempt share its promise. An explicit retry is permitted once more in the same cycle, after a configurable cooldown (default 60 seconds). This is a protective implementation bound, not an approved account-wide API budget. One refresh may involve multiple provider pages: it is not a promise of one HTTP request. Uncooperative loaders time out (default 15 seconds) and receive an abort signal.

An unchanged refresh advances the data-check timestamp without recalculating. A changed normalized asset revision invalidates cached results using that symbol. Calculations also depend on the verified calendar over their effective period and effective end date; corrected interior sessions invalidate every affected saved result as soon as the correction is observed, including results next accessed during a calendar outage. Calendar extensions beyond an old result do not invalidate that correctly dated older period. Recalculation applies the existing dividend/split method and shared dates. Request identity includes holdings, weights, amount and requested dates; differing portfolios can share source data without sharing the wrong result. Original requested dates and actual calculation dates remain distinct. The verified calendar is retained through the eligible endpoint so an earlier requested end can reuse wider verified data safely.

The coordinator bounds the supported catalog to 50 assets, each normalized asset and calculation to 2 MiB, asset storage and result storage to 16 MiB each, and saved result count to 16. The engine's own numerical/input limits remain in force. These are local resource limits, not measured cloud-storage costs. Server routes must bound request bodies before calling this trusted server interface.

## Verification and remaining integration

Twenty-two synthetic tests in `tests/market-cache.test.mjs` exercise exact engine outcomes, concurrent coalescing, fresh hits, stale failures, price/action revision invalidation, narrow date ranges, date metadata, corrected calendars, cold/mixed pending-tail coverage, readiness/DST/weekends/half-days, five-session boundaries, unknown actions/gaps/feed rejection, retries, calendar outage and uncooperative-load timeout. Run:

```powershell
node --conditions=react-server --experimental-strip-types --test tests/market-cache.test.mjs
```

The TypeScript no-emit configuration permits explicit `.ts` imports so the same server source runs in native Node tests without rewritten imports. No dependency was added. Broader checks and review results are recorded in `plan.md`.

Before connecting the UI: resolve the provider evidence gates in `alpaca-real-data-review.md`; supply an evidence-validating loader; choose durable storage and atomic cross-instance leases for deployed use; enforce account-wide quotas; then connect the UI's dated stale/loading states. Do not expose this in-memory factory as a public credential-bearing endpoint or claim that it enforces global refresh limits. Existing demo data and authentication remain labeled as demo. Public/shared data rights remain separate.


Completion verification: all 86 offline tests, five engine mutation probes, lint/typecheck, focused formatting/whitespace and a credential-cleared production build passed. Independent review accepted the revised single-process scope after 22/22 cache tests and its own cross-request calendar-outage probe, with frozen hashes matching at start/end. This verification note is a documentation-only update after source review. Deployed, durable and real-provider acceptance remain outside that result.

## Durable integration follow-up (2026-11-04)

`src/lib/durable-market.ts`, the internal Convex store and local admission ledger extend this factory for a local personal server. `src/lib/market-cache.ts` remains the single-process calculation coordinator; its factory alone does not enforce durable quotas. See `market-data-integration.md` for evidence expiry/revocation, revisioned monthly source chunks, compressed result slots, account/team budget prerequisites and production-disabled UI integration. The new backend remains unactivated pending evidence and deployment review.
