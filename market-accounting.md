# Market accounting: controls, observations and uncertainty

## Diagnosis and implemented correction

The owner reported 750 MB exhausted in the approved November DEVELOPMENT local
ledger while Convex dashboard I/O was 118.88 MB. These are different metrics.
The old local `io` combined fixed 2 MiB provider reservations (retained for every
outcome), maximum-document database reservations, and conservative weighted
`chargedIo` estimates. `storageCharge` also estimates document/index headroom.
None is Convex billing, observed network traffic or an invoice.

The redesign preserves the same ledger, month, ceilings, attempts, policy and
revocation scopes. Historical units remain charged. No historical reservation is
retroactively refunded/reclassified; an exhausted legacy counter remains blocking
until a later explicitly approved allowance preflight. No live call was made to
measure savings.

For NEW provider attempts, reserve before transport and settle only a completely
consumed body to observed application-received bytes. Interrupted, rejected,
uncertain and failed transport outcomes retain their reservation. Local ledger
`scoped.provider` records new attempts, retained control units and completed-body
received bytes; `scoped.database` records new attempts/retained database units.
Old charges remain in aggregate `io` and are not invented into new scoped data.
Month rollover follows the existing rule; it does not clear revocations.

Hosted provider settlements require a newly recorded exact token and matching
month. A token can settle once; a missing/repeated token fails. The shared
provider reservation subtracts only its own unused new units, never historical
charges or attempt counters. Failed streams retain budget. Database outputs now
say `admissionUnits`; legacy `chargedIo` is decoded for deployed compatibility.
These remain conservative weighted controls, deliberately distinct from measured
read/write API values. Platform billing remains unknown.

## Separate measured dimensions

`provider-measurement.ts` counts initiated requests, responses, received body
bytes, completed bodies and interrupted bodies. Adapter pagination records each
HTTP page as a request/response, including action traversal. Received bytes are
post-fetch application body bytes; compression, headers and provider charging are
not inferred. Actual body/page/record bounds and two process provider slots remain
enforced independently of monetary assumptions.

`measure-market-redesign.mjs` instruments application storage gateway calls, keys,
returned/written records and serialized payload sizes. `hosted-matrix.test.ts`
additionally invokes actual market function handlers in local convex-test
transactions with an instrumented database API: query/get terminal calls,
documents returned, encoded returned values, write API calls and encoded write
arguments. Patch argument bytes are not the full rewritten document or index
bytes. Null/empty result envelope bytes remain part of that encoding measurement.
Admission-budget internal reads/writes are included. No synthetic metric is
presented as deployed transaction/billing usage.

The baseline uses the old durable monthly history/results path and unbatched
full-window provider loader. The new path uses authoritative roots plus disposable
history, request/provider batching and incremental correction windows. The same
independent engine regression oracles remain unchanged. The fixture contains three
portfolios, nine distinct holdings plus SPY, 5Y common coverage, deterministic
prices and a synthetic session calendar. Other fixtures independently cover
merger/split/dividend semantics. Actual HTTP batching/independent completion is
verified separately; this matrix drives the server calculation workload directly.

## Deterministic before/after matrix

The table below records actual local database API operations, not estimates.
`R` is terminal database read calls; `D` is documents returned; `W` is write API
calls. Bytes include encoded API values/arguments, not billed index/storage bytes.
The full generated JSON artifacts are under system temp and reproducible with
`pnpm.cmd exec vitest run tests/hosted-matrix.test.ts`.
| Mode / scenario | Provider requests | Received bytes | DB R / D / W | DB returned bytes | DB write argument bytes |
| --- | ---: | ---: | --- | ---: | ---: |
| before / cold | 20 | 497992 | 1415 / 174 / 754 | 180206 | 624913 |
| before / warm | 0 | 0 | 27 / 27 / 4 | 167890 | 612 |
| before / 1W | 0 | 0 | 44 / 50 / 13 | 64829 | 6037 |
| before / 1M | 0 | 0 | 44 / 51 / 13 | 65065 | 7833 |
| before / YTD | 0 | 0 | 46 / 52 / 15 | 65454 | 32237 |
| before / 1Y | 0 | 0 | 46 / 53 / 15 | 65692 | 34585 |
| before / amount-weights | 0 | 0 | 46 / 54 / 15 | 65930 | 35293 |
| before / overlap-add | 0 | 0 | 46 / 55 / 15 | 66166 | 34729 |
| before / remove-holding | 0 | 0 | 25 / 25 / 5 | 38487 | 765 |
| before / restart | 0 | 0 | 18 / 18 / 4 | 53880 | 612 |
| before / next-day | 20 | 498392 | 819 / 808 / 157 | 900766 | 203694 |
| after / cold | 3 | 497316 | 176 / 161 / 126 | 84310 | 37898 |
| after / warm | 0 | 0 | 12 / 12 / 2 | 20390 | 306 |
| after / 1W | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / 1M | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / YTD | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / 1Y | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / amount-weights | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / overlap-add | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / remove-holding | 0 | 0 | 33 / 33 / 6 | 55239 | 918 |
| after / restart | 0 | 0 | 36 / 36 / 6 | 61170 | 918 |
| after / next-day | 2 | 2160 | 166 / 156 / 126 | 132830 | 38288 |

Cold history reduces provider page requests from 20 to 3 while transferring nearly
the same required raw data; normalized durable asset/result writes drop from 633
to 10 in the gateway fixture. The next-cycle overlap refresh reduces 20 requests /
498,392 received bytes to 2 requests / 2,160 bytes. Warm range, amount, allocation,
overlap-add, removal and browser-assisted restart cases make no provider request.

The separate expansion sequence (1W ? 1M ? YTD ? 1Y ? 5Y) measures missing-prefix
work and overlap rechecks; it does not claim that every range change is free.
`tests/market-redesign.test.mjs` also drives simultaneous independent dashboard
requests, proving unique-symbol/SPY batching, pagination limits, partial responses,
throttles, unsupported actions, browser corruption/loss and restart behavior.

## Capacity and tradeoffs

There is no new advertised user/portfolio capacity or inferred free-tier fit.
Database checks still cost operations even on warm data. Short-result caching can
have different tradeoffs from history validation: removing durable portfolio
results saves writes/storage while some recalculations still read asset roots
more than once to enforce revision fencing. Browser transfers, server compute,
object overhead, cold-start calendar calls, multi-instance cache loss, corporate
action density and platform pricing must be measured under a separately approved
bounded live preflight. The removed `capacityModel` extrapolation is not used to
justify limits or activation.

The legacy ledger's nearly exhausted allowance remains a real operational block,
even though its units were not billed bytes. Synthetic passing results do not
resolve public display/cache licensing, provider finality or paid access. See
`market-deployed-cleanup.md` for approval gates; never delete/reset a ledger,
guard, revocation or lease to make the redesign appear to fit.

### Missing-coverage expansion measurements

These rows count application storage gateway calls/records/payloads, distinct
from the actual database API table above. The sequence starts cold at 1W, then
expands the same ten unique assets; required earlier history is fetched rather
than fabricated or silently shortened.

| Mode / expansion | Provider requests | Received bytes | Gateway read calls | Written records | Write payload bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| before / expand-1W | 20 | 3270 | 22 | 22 | 13904 |
| before / expand-1M | 20 | 9332 | 22 | 32 | 21539 |
| before / expand-YTD | 20 | 86878 | 22 | 114 | 109692 |
| before / expand-1Y | 20 | 101310 | 22 | 34 | 54372 |
| before / expand-5Y | 20 | 497992 | 22 | 513 | 507731 |
| after / expand-1W | 2 | 2550 | 23 | 10 | 6730 |
| after / expand-1M | 4 | 8372 | 23 | 10 | 6950 |
| after / expand-YTD | 4 | 79856 | 23 | 10 | 8930 |
| after / expand-1Y | 4 | 16742 | 23 | 10 | 9370 |
| after / expand-5Y | 4 | 398992 | 23 | 10 | 19930 |


## Bounded real-development observation, November12 local

After owner-approved total6 provider requests, actual native server-runtime cold SPY/MSFT50/50 1W used3 Alpaca calls/164,364 received bytes and33 Convex API calls/200,767 received bytes in6,232ms; warm reopen used0 provider calls/bytes and1Convex API call/4,269 bytes in153ms. Cold/warm retained admission-unit increases1,323,566/26,342. Fresh legacy SPY history reused; MSFT refreshed with calendar/bars/actions and retained wider legacy history. These counts include actual API transports, not server-side document counts or billing.

Entire trial including earlier failures/preflight:5Alpaca calls/491,768received bytes,37Convex API calls/283,570received bytes,1,889,108retained admission-unit increase; final November ledger751,860,648units/4,516calls. Caps6/8MiB/50 respected. One small live case is not a capacity forecast, public-license authorization or replacement for synthetic database-operation instrumentation.
