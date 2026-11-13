# Synthetic local browser acceptance

Completed 2026-11-12 in the existing feature worktree. Verifier: gpt-6.1-terra,
medium reasoning effort, provider codex_cli, shared checkout. Final independent
verification:
<t3-thread://v2/b3918b4c-3341-4172-adf1-0832c59e4dff/thread:delegated-task:command%3Amcp%3Ab6d3ccf4-1d65-4d5f-bf96-52843fb8a480%3Adelegate-task%3Af6d7ae26-a728-4544-851a-e8e12f6b0083>.

## Boundary and fallback evidence

Preview status was checked first. Earlier preview automation made two snapshot
attempts, each returning `Preview automation snapshot timed out after 15000ms.`
The computer-use fallback returned `Browsers: Error: The browser access host is
unavailable.` Later preview status continued to report `available:false`.
These met the owner's explicit fallback conditions. Terra used installed Edge
through purpose-written Playwright browser control, with fresh isolated contexts
and no owner profile. This was a direct browser acceptance run, not a substitution
of the generic regression CLI. Both browser runs closed their contexts/browsers.

Only `http://127.0.0.1:43141` was used for final acceptance. The temporary server
copied explicit source paths without private env files, injected a deterministic
provider and fake durable backing, and used a credential-cleared environment.
Browser-local portfolios/history belonged to that isolated origin. No real
provider, owner portfolio, credential or deployed admission record was accessed.

The earlier final verifier was interrupted by provider usage limits; that failed
run was not treated as acceptance. After resumption the requested model/effort
was used again, without switching providers/models or implementation checkout.

## Observed cases

All 16 scripted cases passed in the final Terra run, with actual browser actions,
network/storage assertions and six screenshots inspected.

| Group | Actual evidence |
| --- | --- |
| Comparisons | Three portfolios use active amount/shared dates; removal updates series; explicit 1Y survives reload |
| Amount and allocation | 12345.67 input, 50/25/25 manual allocation, zero/99-total blocks saving; equal weights 33.33/33.33/33.34 |
| Holdings | DDD overlap added, selected AAA remains a single holding, BBB removed, requested holdings agree |
| Naming/draft | New draft defaults 1W; empty/duplicate names rejected on Done; a changed name clears earlier submitted error; user-chosen unique name saved |
| Batch/ranges | Separate card amounts 10000/15000/20000; ten unique symbols including SPY once; cold 1W uses two synthetic provider pages; all five ranges; 5Y to 1W adds no provider work |
| Keyboard/touch | Keyboard timeframe/focus, real 390px mobile touch tooltip/editor, no horizontal overflow |
| Reduced motion | Actual loading class present with computed animationName none |
| IDB contents | Monthly history hints only, no result/credential/portfolio payloads; reload and actual second tab preserve provider count |
| Process loss | Intact IDB rehydrates against retained fake authoritative roots with no new provider calls |
| Forgery | Modified monthly payload with a correctly recomputed self-digest still fails authoritative asset-root validation |
| Storage denial/eviction | Initial denied-IDB operation works through server cache; after simultaneous process cache loss, missing/evicted hints fail closed without automatic source attempts |
| Offline | In-page range change does not accept unvalidated cached financial results |
| Corrections | Displayed change moves from +4.33 to +33.96; monthly revision and completed endpoint change |
| Stale result | Throttled next-cycle refresh retains only the unchanged dated result, as of 2026-11-10, with professional status copy |
| Expiry | Real browser expiry timer clears result; expired server evidence refuses result |
| Revocation | Cached hints cannot override refusal after range change, simulated restart or in a second tab; no additional provider work |

## Findings resolved

Terra identified small returns rounding every axis tick to 0%; the formatter now
retains meaningful fractional ticks. Its final screenshot review found clipping
of longer small-percentage labels. The implementation owner increased axis room
and independently checked all 15 percentage labels at 390, 768 and 1440 pixels:
all text bounding boxes remain inside their SVGs (minimum left inset 9.4375 px),
with no document overflow. Desktop/mobile screenshots were visually inspected.
No new delegate was started for this small visual fix.

Actual name interaction exposed a prior submitted-error state persisting while a
new name was composed. Changing the name now clears that state; empty and
nonunique names remain blocked on Done, and saving remains invalid until fixed.
The final Terra naming case and focused existing browser regressions passed.

## Evidence and limitations

Artifacts remain in system temp, not the repository:

- `tikr-targeted-report.json`: seven interaction results.
- `tikr-security-report.json`: nine cache/security results.
- `tikr-final-acceptance-summary.txt`: Terra's independent assessment.
- `tikr-targeted-editor.png`, `tikr-targeted-mobile.png`,
  `tikr-targeted-touch-tooltip.png`, `tikr-targeted-reduced-loading.png`,
  `tikr-security-stale.png`, `tikr-security-revoked.png`: inspected by Terra.
- `tikr-axis-final.json`, `tikr-axis-final-1440.png`,
  `tikr-axis-final-768.png`, `tikr-axis-final-390.png`: final axis-bound checks.

Process loss was simulated while retaining fake authoritative backing. Separate
Convex/module restart and local on-disk guard/receipt suites provide deterministic
integration evidence; this browser run is not a real multi-instance deployment or
live provider acceptance. Public caching/display rights, provider finality,
corporate-action completeness, paid capacity and deployed migration remain
separate gates. No publication/deployment is implied.
