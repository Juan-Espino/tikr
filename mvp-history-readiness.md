## Owner-approved Alpaca dividend interpretation (2026-11-13)

For all tickers in the personal Alpaca integration, treat the provider's reported
cash-dividend `rate` as USD cash per traded share/ADR. Accept foreign, missing-currency
and other currency metadata without converting or multiplying that rate. Retain any
withholding already reflected in the provider amount; apply no additional FX, ADR
ratio, tax gross-up or tax deduction. This is an owner-approved application assumption,
not an independently established provider guarantee for every record. It supersedes
the earlier blanket foreign-dividend rejection and the claim that all results exclude
source withholding. Positive amounts, interpretable ex/payment dates, payment-date
reinvestment, split/dividend ordering, shared periods and complete holdings remain.

Current status: owner-approved general dividend change implemented, reviewed and verified in DEV. Earlier missing-currency blockers below are historical and superseded by this decision; they are not claims of provider-wide empirical verification.

# MVP history follow-up — 2026-11-13

## Owner decision and scope

Operational rate, daily-attempt, cooldown, hosted-slot and aggregate monthly usage
cutoffs are removed from shared application code for DEV and a future production
release. The loopback owner usage banner/monitor and DEV-only allowance overrides
are deleted. Dashboard Retry and visible error references are removed. Editor Retry
remains; a dashboard reload can recover an expired observation. Credentials, origin
checks, platform document/request serialization bounds, finite operation deadlines,
financial input validation, cache eviction, lease fencing and authoritative revocations
remain correctness requirements. These are not reinstated usage quotas.

DEV native function-call cutoff207902 was deleted and readback returned no native
limits. Existing ledgers and historical counters were preserved, not reset/refunded.
Compatible DEV backend deployed to stoic-corgi-586. No production settings, data,
deployment, commit, push or PR changed. Source is uncommitted in the existing worktree.

## Confirmed causes

- The former local100-provider task cap caused calendar refusals disguised as UPSTREAM.
- The separate weighted500m admission-unit application budget later blocked both
  portfolios despite actual account usage far below those units. These are not billing
  bytes; the two measures must never be equated. That enforcement is now removed.
- Trace2208d4bd-3855-46de-a052-634107c5218b identified ASML/TSM cash-dividend validation
  rejection. One bounded DEV inspection (request115 cumulative) returned nine relevant
  rows: foreign=true, special=false, ordinary cash, payment/ex-date and positive rate
  present, no due bills, currency absent. Pagination complete. Only categorical
  diagnostics were retained; no credentials/raw financial bodies/amounts were logged.
- The old rule rejected foreign flags regardless of denomination. New normalization
  supports explicit USD foreign/special cash and interest/return-of-capital cash flows
  without guessed FX, ADR multiplication, fee deduction or changing reinvestment timing.

## Remaining substantive data blocker

The actual foreign records above do not establish USD or per-ADR gross cash amounts.
Alpaca's current official schema explicitly says empty currency can mean USD OR
unknown; a foreign flag cannot resolve that. TSM's issuer publishes distinct NT$ per
ordinary-share, USD gross per ADR and USD net amounts; ASML publishes EUR ordinary
amounts and separately fixed USD conversion for NY shares. Guessing among those would
violate the approved calculation method. The actual missing-currency records therefore
still fail safely. This work does NOT certify ASML/TSM1Y/5Y or full PR readiness.
A verified event-specific denomination/unit/gross-cash source is needed to resolve
these records. No policy bump, revocation deletion, adjusted-price substitution or
fabricated amount was used to conceal this blocker.

Sources:
- https://raw.githubusercontent.com/alpacahq/cli/main/api/specs/market-data-api.json
- https://investor.tsmc.com/english/dividends/1q26
- https://investor.asml.com/investor-resources/capital-return-and-financing

## Implementation and verification

Chart width is explicit through compact flex wrappers. Plot heights are numeric
176/288px, avoiding percent-height cycles in auto-sized card buttons. Visual QA is
required to confirm line geometry, not just a legend/percentage.

Backend-only traces remain in structured logs and bounded failure summaries. Browser
route payloads strip references/original diagnostic records and no longer send the
trace header. Safe failure explanations remain. Automatic recovery only admits expired
matching observations; current/unknown revocations, active owners and stale-worker
fences remain. Successful head/chunk publication and exact guard settlement stay atomic.

- Node synthetic suite206/206; Convex/runtime suite68/68.
- Personal-loader21/21 includes synthetic ASML/TSM USD fixtures and actual-shape
  missing-currency negative fixture. Independent four-session oracle:100entry,
  99ex+1receivable=100,110payment,220nextclose =>222reinvested vs221cash.
- Same positive USD fixture fails against HEAD adapter; saved failure-before evidence
  under TEMP/tikr-dividend-failing-before.txt. Transient source copies removed.
- Synthetic fullAI1W/1Y/5Y independently checks1000/1000.5/1000.5 endings, shared SPY
  dates, split preservation and warm reuse. Synthetic weekday calendar is NOT an
  exchange-calendar or live-data certification.
- Sol6.1Low reviews: graph pass; quota removal one finding fixed/re-reviewed; exact
  diagnostics pass; normalization pass with explicit real-data limitation; fixtures
  payment-day caveat fixed/re-reviewed; recovery pass; editor/UI traces pass.
- Final browser and readiness review results are appended after completion.

Earlier live evidence: WAR and SPY/SCHD/O/KO1W were ready2026-11-05..12. Earlier
incomplete Terra runs are not passes. Next-day live check6 remains skipped. Original
production failure cannot be reconstructed from retained production logs.

## Final Terra evidence — 2026-11-13

- Combined synthetic browser runs:36configured passes, corrected corporate-action
  wording case1pass,5unconfigured cases pass against their separate credential-cleared
  environment. This is42passed across separate runs, not a single clean rerun.
- Persistence script passes comparisons, add/remove, manual75/25weights and a fresh
  storageState-restored context. Synthetic graph SVG342x176desktop1440 and308x176mobile390,
  two finite nonempty paths each. No horizontal overflow.
- RealWAR1W HTTP200ready2026-11-05..12; SVG342x176twofinitepaths. Mobile nooverflow;
  savedchart remainsready afterreload. NoUIreference/dashboardRetry.
- RealfullAI1W initiallyguarded, reloadautomaticallyrecoverstoready2026-11-05..12.
- ExactrealAI1Y request:HTTP200blockedUNSUPPORTED_ACTION ASMLandTSM. EditorRetryvisible,
  clickedonce:HTTP503sameblockedissue. Noerrorreferencevisible. This is a definite
  failedacceptancecase, not a picker/testharness timeout.5Ylivewasnotrepeated; synthetic
  5Ypreset/mathpassesdoNOTsubstituteforactualforeigncashcurrencyproof.
- Finalnarrowrunprovider120->128(+8),bytes6298995->6415399(+116404),
  ConvexHTTP2616->2709(+93). Earlierfinalrealchecks115->120(+5provider).
  Totalfinalrealchecks115->128(+13provider) spanseparatelyboundedruns. Ownerreviewtraffic
  is included in cumulativejournal; these are measuredHTTP/bodycounts, NOT billing.
  ConvexCLIdeploymentmanagementHTTP/DBoperationswerenotinstrumented; no exacttotal
  for those is asserted.
- New bounded response-matched parent test script completed without executionerror.
  Evidence:TEMP/tikr-final-period-rVtZjM/report.json. WARscreenshots:
  TEMP/tikr-final-terra-recheck/war-desktop.png andwar-mobile.png.
- Erroneouslywrittenrepositorytest-results/undefinedartifactswereinspectedandmoved
  toTEMP/tikr-final-terra-artifacts-7ba2b80b229742abb3a1defa0e64abff. Noownerdataremoved.

The requested fullyfunctional/no-corporate-action-failure outcome is NOT achieved.
No PR or complete/certified status is appropriate until an authoritative denomination,
per-traded-share/ADR basis and gross cash source resolves the actualforeignrecords.
Neither retries nor deleting validation can establish those facts. No additional
provider retries are useful for the already-confirmedmissingfields. Source stays
uncommitted, production unchanged, ownerreview http://127.0.0.1:43202/dashboard.

## Denomination correction — direct issuer comparison, 2026-11-13

A further one-request TSM comparison resolves the ambiguity for FOUR SPECIFIC events,
not all historical or foreign distributions. Alpaca rates for ex-dates2025-12-11,
2026-03-17,2026-06-11,2026-09-16 match the issuer's USD NET perADR amounts within
0.00001USD, and do not match the published gross amounts. Payment dates match.
Thus these returned rates are already converted; a fresh FX conversion would be wrong.
The remaining issue is the blanket foreign rejection AND provider net-of-withholding
versus the approved tax-excluded (gross) simulation. This corrects the earlier broader
missing-denomination explanation for these events. No general gross-up or uniform
withholding rate may be inferred for other events/tickers. No calculation changed.

Comparison sources: issuer /english/dividends/2q25, /3q25, /4q25, /1q26.
Actual cost:1providerHTTP/1001receivedbytes. A separate additive probe journal stores
only dates, categorical currency/match booleans and cost; no raw bodies or credentials.
Canonical active review journal remains128; additive actual total129. The probe journal
also preserves one pre-network configuration refusal separately from actualHTTPcount.
Path:%LOCALAPPDATA%/Tikr/task-journals/dividend-denomination-probe-2026-11-13.json.
Do not count that refusal as an actual providerHTTP or overwrite the active process's
cumulative journal. Read both journals until a controlled merge under its lock.

General-dividend cache correction: Terra's first post-policy1Y request returned the
old cached UNSUPPORTED_ACTION with only a calendar HTTP. Added a server-owned loader
interpretation revision to cached limitations and calculation identities. Old/missing
interpretation tags now revalidate; matching tags retain normal negative-cache reuse.
Authoritative evidence scope/guards/revocations are unchanged. Regression36/36durable
passes; SolLowreviewpasses. No ledger, guard or revocation was deleted/reset.


## General dividend acceptance completed ? 2026-11-13

The owner-approved reported-USD-cash assumption now applies to ALL tickers, including
foreign=true and missing/other currency metadata. No ticker/country exceptions, second
FX conversion, ADR-ratio multiplication or withholding gross-up. Date/positive-amount,
unknown-event and ambiguous combined-event validation remains. The four reliability
items in plan.md are explicitly deferred Post-MVP polish, not newly implemented work.

Sol6.1Low review passed the general rule and negative-cache interpretation correction.
Final full Node207/207 and Convex/runtime68/68 pass; lint/types and cleared build pass.
Terra real fullNVDA/AMD/ASML/TSM requests returned HTTP200ready:
-1Y:2025-11-12..2026-11-12;
-5Y:2021-11-12..2026-11-12;
-5Yreload:sameperiodreadywithzeroadditionalproviderrequests.
No currency error or public error reference. The script selected all4holdings; its
report did not retain seriesIDs/point-boundary/SVGgeometry measurements, so this run
is not independent numerical or full visual certification. Earlier graph sizing and
browser editing/persistence checks remain separate evidence.

Report:TEMP/tikr-final-period-YOUHn4/report.json; screenshot:period.png inthatsamedir.
Final realQA cost exceeded its planned12requestallocation:148->165(+17)providerHTTP,
6873024->7324657(+451633)providerbodybytes,3049->3182(+133)harnessConvexHTTP.
The script began5Yafter9calls andthatrequestadded8; pre-startcount alone didnotreserve
worst-casecost. This is a QA execution-budget overrun, not a restored runtimequota.
No further live provider checks were made. Counters include concurrent ownertraffic.
Persistent taskjournal has165providerHTTP/7324657receivedproviderbytes; retained
6291456reservedbytes were not erased/refunded. The additiveTSMprobe is merged exactly
once under the main journal lock (actual1HTTP/1001B; pre-network refusal retained).

Review remains at http://127.0.0.1:43202/dashboard. Source is ready for owner review
under this explicitly approved assumption, not a provider guarantee or production
certification. No commit/push/PR/production mutation. Main clean at a4038e7.
