PR preparation verification: final132Vitest/26files, lint/bothTS and cleared optimized auth/AI build passed (temp tikr-cleared-build-Ukpnp0). Desktop/mobile hover+focus keep dialog width and allocation scrollWidth fixed (tikr-search-motion-j6Z2A4); autosave browser confirms no visible Saved label (tikr-autosave-dFpPDS). Main worktree observed clean; no backend/financial/provider/auth callback source changes outside new AI modules/schema. Remaining live-AI production gates documented in release-readiness.md.

## PR preparation and final editor corrections - 2026-11-16

Owner authorizes PR preparation/publication of this feature branch; no merge or
production access/configuration/deployment is authorized by this request. This
supersedes earlier no-publication checkpoints for this preparation only. Main stays
untouched. Review PR remains draft because live AI production activation/capacity,
production catalog and real signed-in smoke checks are not verified. Defaults are
inactive; actual production env values were not inspected. See release-readiness.md.

Latest UI corrections: allocation rows reserve4px trailing space and truncate their
flexible labels; horizontal allocation overflow is suppressed. Hover/focus at desktop
and mobile retain dialog width and produce no horizontal scroll. Routine Saved
status is removed from visible DOM; pending and error/conflict feedback remain.
Focused autosave browser and motion checks pass. Full branch release checks recorded
below when complete. No financial/provider/calendar/production configuration change.

Final autosave handoff checks: formatting/diff/final-newline/private-pattern checks passed across48 changed/untracked files; no credential patterns found. Focused demo/name/auth-return/trial Node checks passed. All owner-requested review findings resolved; no remaining known failing test.

## Account autosave implemented and verified - 2026-11-16

Owner approved replacing manual Save to cloud for existing account portfolios with
500ms debounced, serialized autosave and quiet Saving/Saved/Changes not saved status.
New portfolios use explicit Create in account; login alone still does not save a
guest trial. Invalid weights/names remain in memory; existing cloud state is preserved.
Latest edits survive older acknowledgements; uncertain transport results reconcile
against expected revision/content before retry. Three bounded retries (1/2/4s),
reconnect resume, conflict/reload/Duplicate, session fences and private no-localStorage
policy implemented. Done flushes without stopping the provider coordinator. Confirmed
delete supersedes unsent edits, waits/reconciles in-flight work and retires queued work;
failed delete retains edits and Retry delete semantics. Reload/sign-out guards added.
Landing renders real hero during initialization with no skeleton, including its account
control; removed permanent account/manual-save notice. Full details: portfolio-autosave.md.

Checks: full Vitest132/26 files, including18autosave cases, passed. Autosave browser
fault suite, four mobile deletion cases, cloud10groups, guest9groups and AI regression
passed. Lint/bothTS, changed-file formatting, diff and credential-cleared build passed.
Latest build temp tikr-cleared-build-g46pki. See runbook for artifacts and coverage.

Owner-requested Terra medium browser reviews: first found blocked conflict Duplicate;
fixed with guarded explicit copy intent. Reviewer then independently proved persistent
transport failure/exhaustion/manual retry and held-create UI blocking. Final targeted
Terra review passed all4 mobile delete cases, no actionable finding. It does not claim
exhaustive network proof or new real Google login. Full suite also caught the earlier
pending-avatar identity regression; restored strict pending identity hiding. Unit clock
advances5additional minutes after retry exhaustion and confirms no more automatic writes.

Frontend only for this autosave change: existing Convex ownership/revision/name/delete
contracts reused unchanged. No backend deployment, live AI/market request, owner-data
mutation, production access/config change, dependency, commit/push/PR/merge. Owner's
live preview/profile left untouched; own landing-check tab closed. Crash/forced-close
recovery of unsaved private memory remains inherently unproven/not guaranteed.

Final skeleton/navigation checks: changed-file formatting, diff/newlines and credential-pattern scan passed; cleared optimized build passed at temp tikr-cleared-build-Gjx2Ua. No new dependency or backend deployment.

## Landing navigation, methodology and tailored skeletons - 2026-11-16

Owner approved shared-style Portfolios control in place of bare Explore, dedicated
/methodology, removal of landing #method section, and page/component-shaped shadcn
Skeleton loading. No dependencies added. Static methodology summarizes current
backtest-methodology.md: USD lump sum, default equal/manual positive100%, drifting
buy-and-hold/fractions, SPY shared period/min2completed sessions, payment-date
reinvestment/ex-date receivables/splits, decimal/unrounded metrics, reported-cash
withholding, omitted trading costs and unsupported/gap limitations. No engine,
financial contract, auth callback or data-source behavior changed. Static methodology
can render without waiting for account/session portfolio fetch; no private context
is consumed on this route.

Skeleton primitive uses existing cn/Tailwind conventions, data-slot=skeleton,
aria-hidden blocks and motion-reduce:animate-none. PageSkeleton matches landing
headline/CTAs/globe, dashboard cards, portfolio metric/chart/holdings layout, and
existing bright sign-in form/dark globe composition. Initial auth/provider/cloud
readiness and app route loading use route-aware shapes. Account avatar initial
session load uses round shape; existing account data remains visible on refresh.
MarketSkeleton replaces only the existing !main + refreshing branch. Loaded charts,
metrics and date-switch pulse remain untouched; no range-change skeleton when a
series exists. SearchRowsSkeleton has distinct grid ordinary-search and inline AI
rows, only while no result rows are available. AI allowance initial query has a
small labeled bar, scoped to session and cleared on success/failure. Prior results,
saves, OAuth handoff and existing globe fallback stay visible rather than resetting
to placeholders. Errors/empty states remain distinct from loading.

Evidence: pnpm check lint/bothTS passed; loading browser checks at1440/390 pass all
page shapes, no horizontal overflow, reduced-motion static, initial market loader,
then retained chart plus pulse during refreshing. Screenshots inspected: temp
 tikr-loading-ui-5vvwoq. Existing AI suite passed tikr-ai-ui-GNxYoL; search motion
passed tikr-search-motion-95t9Jm; cloud10 groups passed tikr-cloud-ui-UGQj19; guest9
passed tikr-guest-ui-CL98lA, preserving legacy hash. Vite's first new-module import
caused one optimizer navigation/context reset; repeat on optimized module passed.
Integrated own incognito tab verified Methodology title/seven sections/no overflow,
then landing Portfolios shared button/link /methodology and no #method. Own tab
closed; owner tab/data untouched. Credential-cleared optimized auth/AI build passed;
final build evidence recorded separately below. No backend deploy/provider calls,
owner portfolio changes, production access or Git publication in this update.

## Search result motion and low allowance - 2026-11-16

Owner approved React/Tailwind-native motion and coral remaining count at <=5.
New animated-search-results.tsx uses native Web Animations, ResizeObserver and one
requestAnimationFrame measurement batch. Height reads actual content and editor
chrome, retaining the shared dialog's existing 90dvh cap; current displayed height
is captured before cancelling/replacing an in-flight animation. No animation library,
permanent will-change or layout polling loop. Sibling allocation controls can scroll
in their own bounded region on short screens; input and Done remain fixed.

SEARCH_MOTION centralized values: height200ms ease-out; entry200ms ease-out with5px
upward travel;30ms stagger first6 newly entering keys only; beyond6 immediate;
exit100ms fade only. Exiting snapshots are absolute, inert and aria-hidden so they
cannot affect layout/tab order. Stable ticker keys preserve existing nodes/focus.
Reduced motion disables entry/translate, hides exits and updates height instantly.
Normal/AI results retain old rows during pending replacement and cancellation,
with AI previous-prompt notice; no automatic requests. Normal results clear for an
empty query. No backend/AI/provider/configuration change or live test call here.

Remaining count alone uses shared --ai-rim (#a84943) at5,4,3,2,1,0; other allowance
text remains muted. Scope editor-only flex/capped scroll, compact mobile spacing
and side-by-side name/amount leave usable results/allocation space; field104px and
control sizes preserved. Normal buttons remain full-width; clarification chips wrap.

Checks: pnpm check lint/bothTS passed; qa-search-motion.mjs passes0/1/5/24 rows,
retargeting, retained keys, beyond-six entry, exit presence/removal, focus, reduced
motion, threshold6/5/0, actual editor maxcap/scroll/input position/Done at1440and390.
Artifacts: temp tikr-search-motion-2GBr9U. Existing AI browser regression passed:
tikr-ai-ui-I1w4LO. Credential-cleared auth/AI build passed: tikr-cleared-build-yIjy6i.
Visual mobile artifact inspected; fixture-only/actual-editor synthetic data, no owner
portfolio writes. Own integrated fixture tab opened/closed; owner live tab untouched.
Two test refinements caught actual issues: scrollHeight included decorative overflow,
so cap now measures geometry; mobile stacked form left12px for results, fixed with
scoped compact chrome. Exit assertion now observes mutation insertion to avoid a
100ms sampling race. Existing cancellation oracle updated for retained stale rows.

Files this update: src/components/animated-search-results.tsx,
src/components/ai-asset-search.tsx, portfolio-editor.tsx, portfolio-page.tsx,
src/styles/globals.css, tests/cloud-ui/search-motion.tsx,
scripts/qa-search-motion.mjs, scripts/qa-ai-discovery.mjs, design.md and plan.md.
No commit/push/PR/merge or backend deployment in this UI update.

## Previous-prompt notice hierarchy - 2026-11-16

Owner requested visual separation between current result/question and the stale
prompt notice. The notice now uses muted 12px italic text; main response stays
14px normal. Text/status semantics and backend behavior unchanged. Clarification
questions/chips are model-generated, not a fixed list or guaranteed for every input;
clear discovery should yield tickers, unrelated input should yield empty. The
observed general-person clarification is not proof of intended asset-only behavior.

## Ticker-only signed-in DEV trial - 2026-11-16

Owner approved implementation and real signed-in integrated-browser testing.
Supersedes the earlier mocked-only/no-deployment checkpoint for this DEV trial;
production, Git publication, paid upgrades and Alpaca activation remain excluded.

Implemented GPT-OSS120B/low, max six symbols. Model output is strict
{kind, summary, tickers, question, answers}; successful results require summary,
question and answers empty. No model company names or per-stock explanations.
Server normalizes/deduplicates symbols, rejects invalid/unsupported entries against
existing fresh cached catalog, and returns canonical ticker/name rows with fixed
AI-suggested/relevance-unverified copy. Name matcher removed because no model names
are accepted. No-match and focused clarification stay inline; chips fill/refine,
never auto-submit. Existing auth/session/quota/cancel/weights behavior remains.

Target confirmed from canonical public DEV bindings and CLI: dev:stoic-corgi-586.
convex dev --once succeeded and generated real API types; added two discovery table
indexes. Securely supplied Groq key and explicit enable flag set on this DEV target
only. Existing SITE_URL confirmed http://localhost:5000; Google config unchanged.
Port 5000 was free; isolated feature Next server started there (PID2368 at startup).
Ignored feature .env.local contains only three public DEV bindings and public AI flag.
No main configuration edits or private market/auth credential copies. Next process
inherited no APCA/Alpaca keys: market-performance/ordinary search remain labeled sample
mode. AI result membership uses actual existing DEV cached catalog; no catalog refresh,
Alpaca request or public/production market-data activation was performed.

Live bounded probes using current transport plus existing internal DEV catalog lookup:
- give me ai stocks -> NVDA, GOOG, MSFT, AMD, IBM, META; all six supported.
- Semiconductor equipment companies -> AMAT, LRCX, KLAC, TER, ENTG; all five supported.
- Companies involved with chips -> focused semiconductor-versus-snack clarification.
These direct probes do not prove live signed-in action/session settlement; no account
quota charged by direct probes. Relevance is not independently verified.

Verification: pnpm check passed (lint/both TS); full Vitest 113 passed/25 files;
then one additional strict ticker-only shape test added, focused discovery 20 passed.
AI browser desktop/mobile suite passed at temp tikr-ai-ui-aaxHcl. Credential-cleared
optimized auth/AI build passed at temp tikr-cleared-build-SF3onI. No owner cloud
portfolio created/edited/deleted by assistant. Public preview opened successfully at
http://localhost:5000/sign-in (Tikr title). Two subsequent snapshot attempts each
failed: Preview automation snapshot timed out after 15000ms. Native CUA fallback
unavailable: failed to connect native pipe (os error 2). Real Google sign-in and
signed-in end-to-end search remain owner verification; no login success claimed.

Review: http://localhost:5000/sign-in. Sign in, create a new unsaved portfolio,
toggle AI, enter a theme, submit, then Add returned cached assets. Save stays an
explicit owner action. Server flags/key remain DEV-only for this authorized trial.
Rollback trial: stop this owned feature server and disable TIKR_AI_DISCOVERY_ENABLED
on stoic-corgi-586; keep quota receipts/cloud data intact. No commit/push/PR/merge.

## Names-only 120B experiment - 2026-11-16

Owner approved one focused names/tickers-only experiment. Six direct live public
sample requests, once each, used 120B/low/1024 cap/max six. Trial-only transpiled
schema, instructions and runtime validator removed candidate why fields; source
app contract/UI and configured model are unchanged. No deploy/activation, catalog
fetch, quota/account writes or portfolio/account data transmission. Exact request
instructions/schema and responses: ai-discovery-trial-names-only.md.

All six shape-valid; four suggestion lists, one clarification, one forecast refusal.
Semiconductor list now uses TER/Teradyne, but data-center list includes CONE/CyrusOne
(acquired/delisting requested in 2022) and CDAY/Co-Diagnostics (issuer says CODX).
Renewables list pairs PE with Pattern Energy, whose historical symbol was PEGI and
which was taken private in 2020. Factual reliability remains unresolved. No current
supported-catalog pass count is claimed; no live catalog was accessed. Exact full-name
normalization also rejects common legitimate abbreviations (Corp vs Corporation), a
false-negative concern for owner review before app integration. Do not silently relax
identity checking or claim that deleting explanations establishes relevance.

No source-code checks rerun: source app code unchanged; git diff whitespace check
passed for documentation. Next: owner reviews bounded experiment before integration
or additional model/settings work. No permanent UI removal or model switch made.

## GPT-OSS120B bounded direct trial - 2026-11-16

Owner approved the 120B comparison. Six exact public sample prompts ran once each
through the current transport with a trial-only model override (120B, low reasoning,
1024 completion cap, six candidates). No source model switch, catalog/provider-data
fetch, deployment, activation, quota write or portfolio/account data transmission.
All six passed runtime shape validation. Four suggestion responses, one clarification,
one forecast refusal. Not a controlled model-only comparison to previous 20B run:
the earlier run capped three, while this owner-approved baseline caps six.
Exact instructions/schema/user prompts/response contents are in ai-discovery-trial-120b.md.

Still not quality-ready: TEL/Teradyne and AVNT/AVANTAGE are mismatched identities.
Official Avient FAQ identifies AVNT as Avient; Nasdaq issuer listing identifies
Teradyne as TER. Raw outputs are preserved; these are not catalog-validated UI results.
Do not infer thematic accuracy from a matching name/ticker or schema-valid response.
Code was not changed for this trial; prior 19 focused tests remain the latest checks.
Next: owner review of responses before choosing further prompt/model experiments.

## Six-result discovery baseline - 2026-11-16

Owner approved model comparison, supported-catalog/name validation and fewer than
six matches when uncertain; verified-description enrichment is excluded for now.
Restored candidate cap to six in contract/schema/instructions, preserving rejection
of unsupported or name-mismatched tickers and existing portfolio max-six behavior.
Model remains GPT-OSS20B until owner selects the comparison model. Proposed next
comparison: Groq openai/gpt-oss-120b using the same prompts/settings initially.
No provider call, deployment or model activation in this change.

## Three-candidate live trial - 2026-11-16

Owner approved clearer discovery-vs-advice instructions, at most three high-confidence
candidates, and company names for conservative catalog identity matching. Implemented
case/punctuation-insensitive full-name equality; differing abbreviations may be dropped
rather than guessed. This does not verify theme/business relevance. No schema tables,
deployment, config activation or provider/model switch was performed.

Six live direct requests (no retries) all passed runtime validation. Exact system/user
prompts and completion contents are recorded in ai-discovery-trial.md at owner request;
these public sample prompts are a bounded review artifact, not application prompt logs.
No reasoning or key is recorded. AI stocks returns examples, chips asks clarification,
forecast redirects. Factual quality remains unacceptable: NTES was called Netech and
CNNE CyrusOne; issuer sources identify NetEase and Cannae respectively:
https://ir.netease.com/shareholder-services/investor-faqs
https://cannae.gcs-web.com/ir-resources/investor-faqs
No live catalog was fetched for this direct test. New identity filter was verified
synthetically; it was not applied to these raw model completions.

Focused discovery suite: 19 passed; pnpm check (lint/both TS), changed-code formatting
and diff check passed. App remains disabled. Next model/settings evaluation requires
owner direction; no stronger-model or paid fallback was silently introduced.

## Bounded direct Groq trial - 2026-11-16

Owner supplied a key through secure entry and authorized testing prompts. Seven
sequential direct transport requests used the existing GPT-OSS20B/low/schema;
no deployment, environment activation, live catalog/market access or account quota
write occurred. Key was read only inside the trial command, never printed/copied
into source/config. Temporary transpilation is ignored under .next/ai-live-trial.

Four HTTP 200 responses, three HTTP 400 responses. One 200 failed application
cross-field validation; the first 400 body was not retained, the other two codes
were output_parse_failed and json_validate_failed. No automatic retry exists;
two manual diagnostic repeats of the semiconductor test are included in the seven.
Three responses passed runtime validation but contained serious ticker/business
mismatches. Renewable results called PUMP Albemarle and NTR NextEra; data-center
results called LTC a data-center REIT. Official issuer pages establish PUMP is
ProPetro, NTR is Nutrien and LTC focuses on seniors housing/health care:
https://ir.propetroservices.com/
https://www.nutrien.com/investors/shareholder-information
https://www.ltcreit.com/

Four returned usage records total 2,638 tokens (605-736/request); unsuccessful
requests without usage are excluded, so this is not full billed usage or a monthly
capacity estimate. Timed valid responses were 0.47 and 0.67 seconds; initial
invalid-shape HTTP200 was 1.05 seconds. Tiny sample, no reliability guarantee.

Decision pending owner: current configuration fails quality/structured-output
readiness. Catalog identity validation cannot establish thematic relevance or fix
wrong-business explanations. Keep app disabled; evaluate prompt/schema/settings
before another bounded trial, without silently changing model or paid plan.

## Whole-field input focus - 2026-11-16

Owner requested the entire asset-search box accept clicks. Empty field space now focuses the active ticker input or AI textarea, without intercepting native text selection or button actions. Focused AI browser suite passed including lower-field clicks in both modes; shared preview confirmed ticker focus. No backend or provider change.

Final mocked-backend review: changed-file Prettier, final newlines and git diff --check passed. Credential-pattern scan found no matches in the 29 changed/untracked files; cleared client static bundles contained no Groq endpoint/key markers. No live request, deployment or Git publication was performed.

## AI backend mocked milestone complete - 2026-11-15

Implemented authenticated Convex discovery action, own-account usage query, private
atomic reserve/finish/retire mutations, 2-day metadata-only receipts, cached catalog
validation and the production client adapter. GPT-OSS20B/low,1024 completion tokens,
15s provider deadline;20 completed searches/account/UTC day,500 UTF-16-unit prompt
bound. One pending30s lease/account/day, date-prefixed idempotency IDs, server session
fences before admission/completion. No prompt/result/reasoning persistence/logging.

All112 Vitest cases passed (18 new discovery cases); Node20 passed; AI browser suite
including production client adapter against synthetic RPC passed. Guest9/cloud10
browser groups passed. pnpm check passed lint/both TS. Credential-cleared configured
AI/auth optimized build passed (temp tikr-cleared-build-PkBvjH). Browser artifacts:
AI tikr-ai-ui-jukjfP; guest tikr-guest-ui-NjjIaA; cloud tikr-cloud-ui-EMNm6L.
An initial motion assertion sampled after a240ms fade had ended under concurrent
checks; intermediate sampling moved earlier, then the full suite passed. Guest
suite now accepts TIKR_QA_URL so it can use the owned5010 review server instead of
requiring5177. Existing stored bytes, cloud security and all market contracts remain.

Generated API declarations refreshed offline through installed Convex template via
scripts/codegen-offline.mjs. No live deployment/codegen/config/credential access.
Full deployment validation is outstanding by the owner's mocked-first boundary.
New functionality is disabled by default; no live provider, production or paid
service actions. No commit/push/PR. Existing UI edits and main remain untouched.

Review runbook: ai-discovery.md. Next: owner code review, then separately approve
identified development deployment/configuration and bounded live Groq trial with
secure key entry. No backend deployment or live quality/capacity claim is made.

Model recommendation revised after owner raised size/usage concerns: propose
GPT-OSS20B with low reasoning effort and bounded completion tokens for initial
evaluation, replacing the earlier120B suggestion. Neither model is approved yet.
Current public Groq rate-limit table gives20B and120B identical free-tier request
and token allowances; parameter count alone does not determine quota consumption.
Reasoning tokens are part of model output; user prompt length is not a bound on
total request tokens. Actual ticker accuracy, latency and token use remain
unmeasured; no authenticated inference or credential access performed.
Sources: https://console.groq.com/docs/rate-limits
https://console.groq.com/docs/reasoning
https://console.groq.com/docs/model/openai/gpt-oss-20b

## AI usage accepted; model selection next - 2026-11-15

Owner accepted proposed defaults: 500-character prompts, 20 completed searches per
account per UTC day, local-time reset display, remaining count; completed
clarification/no-match/refinement responses count, failures/invalid inputs/toggles
do not. product.md records this scope; daily accounting remains unimplemented.

Public Groq documentation reviewed for the next model choice:
https://console.groq.com/docs/models
https://console.groq.com/docs/structured-outputs
Both GPT-OSS20B and120B are listed production models supporting strict JSON Schema.
GPT-OSS120B is a proposed initial candidate, not an owner-selected model or a
measured ticker-accuracy result. Strict output shape does not establish ticker
existence or thematic correctness; catalog validation remains required. No live
inference, credentials or account-specific entitlement check performed.
Next: agree model, then scope authenticated backend and quota integration.

Sign-in gate verification: pnpm check passed (lint and both TS projects). Updated
isolated Edge suite passed at temp tikr-ai-ui-aArQrF: guest toggle shows exact toast,
keeps aria-pressed=false, query and draft unchanged; mocked account A enables AI
and all prior submit/selection/cancellation/motion/mobile checks pass. Default
signed-in unavailable behavior remains fixture-tested. Formatting/diff checks pass.

## Signed-in AI gate - owner-approved UI implementation, 2026-11-15

AI discovery is signed-in only. PortfolioEditor passes existing account collection
state to AiAssetSearch; no additional auth request/route/config. Guest entry and
submission checks show exactly "You must be signed in." via existing Sonner toast
with deduplicated ID and no manual-dismiss control. Guest click keeps mode/query/
draft. Account loss aborts pending fixture completion and exits AI. The future
backend must verify server authentication; client gating is not API authorization.
No backend/credentials/live AI/provider/publication changes were made.

Next product choices: usage limits and Groq model, before separately scoped backend
implementation. Guest access is now settled; earlier unapproved-access notes below
are historical. Full browser fixture uses simulated account A for signed-in AI
and explicitly verifies guest toast/refusal/query+draft preservation.

## AI discovery approach settled - next product decision, 2026-11-15

Owner finished UI iteration and approved AI-generated candidate tickers followed by
validation against the existing supported catalog. No separate sector/industry/theme
metadata source is required for this MVP. Results must distinguish AI-suggested
relevance from supported catalog membership; canonical identity comes from catalog.
Unknown/unsupported/duplicate candidates are removed. Historical checks and user-led
Add/save behavior remain. product.md records the superseding scope decision.

Next: settle who may submit AI prompts (guest access versus signed-in only), then
model/request-budget decisions and explicitly scoped backend implementation. No
quota values or access gate selected. No Groq credential, live provider request,
backend/configuration/deployment, paid service or publication action performed.
Earlier alternative-metadata research next steps below are superseded by this choice.

## AI metadata research - Alpaca public documentation, 2026-11-15

Owner requests research first, assuming "backup subscription" means Alpaca. No
backend implementation, credentials, account dashboard or authenticated provider
request used. Repository does not establish the current account's exact tier.

Finding: no documented general sector/industry/theme classification or company
business-description service in the standard Basic/Algo Trader Plus offerings.
Current subscription comparison covers feed breadth, stream symbols, history and
request limits; it does not list company classification metadata:
https://docs.alpaca.markets/us/docs/about-market-data-api
Current official Asset model includes identifiers, name/exchange/class and trading
capabilities, but no sector/industry/theme/business description:
https://alpaca.markets/sdks/python/api_reference/trading/models.html#asset
Asset master list reference:
https://docs.alpaca.markets/us/reference/get-v2-assets-1
Cross-checked through Context7's Alpaca US documentation and public docs index.

Historical corroboration only: Alpaca's June 2022 comparison explicitly excludes
fundamentals from its free and premium plans; staff reiterated this in July 2023:
https://alpaca.markets/learn/the-top-3-differences-between-polygon-and-alpaca-data-plans
https://forum.alpaca.markets/t/how-to-get-daily-fundamental-indicators-like-pe-roe-for-each-stock/12667
These older statements alone are not current entitlement evidence. Current docs
and model support treating metadata as a separate unresolved dependency. A custom
contract/add-on cannot be ruled out without account-specific confirmation.

Next discussion: separately sourced, evidenced classification/descriptions or a
bounded curated set; provider choice, terms and implementation remain unapproved.
No metadata enrichment, service signup, paid action or code change performed.

Placeholder/submit fade revision: persistent ticker and AI text layers crossfade
at 240ms; persistent submit wrapper fades on the same timing. Inactive layers use
inert/aria-hidden immediately, preserve separate query/prompt state, and cannot
receive focus or clicks. Geometry stays fixed and reduced motion is immediate.
pnpm check passed; isolated Edge suite passed (temp tikr-ai-ui-l6F48N), including
new intermediate submit-opacity checks on entry/exit and inactive-layer inert
checks on desktop and mobile, plus prior geometry/reverse-ring/focus/selection
coverage. Formatting and diff checks pass. No backend/publication actions.

Smooth mode-switch correction: persistent shared field/toggle, empty normal grid
and empty AI status wrapper removed, input-only full-field focus cue (no toggle
flash), reversible 850ms electric perimeter/fade. Modal remains content-sized.
Verification: pnpm check passed; full isolated Edge suite passed at temp
 tikr-ai-ui-eS7pXW. Added meaningful desktop 1280x1000/mobile390x844 regression
checks: identical idle field/dialog bounds before/after toggle in both directions,
entry/retraction offsets strictly between endpoints while active, partial opacity
during exit, and no white container outline after switching off. Existing reduced
motion, ordinary search, IME, selection, manual/max-six, cancellation and privacy
fixture checks also pass. Default-unavailable check now submits explicitly, matching
owner removal of the initial note. Formatting and git diff --check pass.

Owner correction: removed the assistant-added fixed 90dvh editor height. The modal
returns to its original content-driven sizing and existing max-height constraint.
Both search fields retain identical 104px full-width geometry; no extra modal space
is reserved to compensate for mode changes. Earlier fixed-height geometry evidence
below is historical and does not describe the final modal sizing.

Search geometry/entrance revision verification: pnpm check passed. Fresh isolated
Edge measurement: both modes 622x104, dialog 672x765 at the identical x/y (1280x850
viewport). Stroke reveal advanced from 62.0341 to 0 dash offset, confirming a single
perimeter draw followed by the complete electric ring. Placeholder inset is 10px.
Review server restarted detached on loopback 5010 so it survives shell completion.
No backend/publication action. Owner visual review remains next.

Default search field update: ordinary ticker search now uses the same 104px full-width
geometry, plain border and embedded AI toggle. Instant search results remain below.
AI mode is 104px and has the same 58x36px toggle/submit controls with 16px vertical
gap. `node scripts/qa-ai-discovery.mjs` passes desktop/mobile and existing interaction
coverage (temp tikr-ai-ui-Yej5i4); pnpm check, formatting and diff checks pass.

AI field control layout revision: AI mode uses the full available field width with
AI toggle above submit inside the right edge. Both controls are fixed 58x36px.
Normal search keeps AI toggle alongside the search input. Mode switch focuses the
textarea. Isolated browser suite passes after layout change (temp tikr-ai-ui-XLuIoX).

Electric revision checks: pnpm check passed; isolated Edge interaction suite
passed (temp tikr-ai-ui-BH9EOn), including static reduced motion. Separate real
browser check confirmed animated SVG offset values change over time. Screenshot
reviewed at temp tikr-electric-border.png. Small 2px red halo is field-local.

## Electric border reference revision - 2026-11-15

Owner replaced the two-shimmer direction with Balint Ferenczy's electric border:
https://codepen.io/BalintFerenczy/pen/KwdoyEN
Adapted border-only SVG turbulence, animated offsets and displacement to the same
#a84943 red field. Native SVG, three noise octaves, no dependency or JS frame loop.
Text/control geometry remains stable. Reduced motion uses only the static red rim.
No backend/publication change; visual approval remains pending.

## AI rim animation owner revision - 2026-11-15

Replaced the wide coral sweep with two short silver reflective dashes, half a
perimeter apart on one SVG path. Red remains #a84943; rim and shimmer are both
2px on the same centerline. Silver shading is local to strokes, no panel glow.
Reduced motion stays static. Idle/processing speeds remain 9s/1.6s. Owner review
pending; frontend prototype only, no backend/publication scope change.

Standalone review follow-up: the test-only harness intercepts ordinary /api/assets
search with the existing six labeled local sample symbols when ?ai-preview is set.
No production source/API behavior changes. ?network-qa lets the Playwright script
exercise the original request contract with its isolated response stubs instead.

### Stage 1 verification and visual review

Final pnpm check passed (lint, app TS, Convex TS); optimized credential-cleared
configured-auth build passed at temp tikr-cleared-build-5E4s6c. Changed-file Prettier
and git diff --check pass. New component/fixture contain no fetch, endpoint, storage,
environment access or prompt logs. No secrets/config were read or copied.

scripts/qa-ai-discovery.mjs passes real isolated Edge interaction checks: ordinary
instant search, no typing/chip auto-submit, blank disabled, Enter/Shift+Enter/IME,
mode text preservation/focus, Add/Added retention, manual weight preservation with
new zero weight, six-holding refusal, read-only examples, all fixture states,
clarification refinement, stale results, supersession, cancellation/mode fencing,
reduced-motion static outline, mobile touch/focus and no horizontal overflow.
Screenshots under system temp tikr-ai-ui-yhjFiw (later runs create new temp paths).
Desktop/mobile screenshots were opened and reviewed. Final UI keeps results in the
existing scrollable dialog; phone requires scrolling to reach rows/allocation.

Design-taste lint: zero failures/warnings. Shell inspector at 1440/768/390:
zero failures, three warnings (development server, existing dashboard empty space
and below-fold blocks). Inspector measures the initial shell, not the opened editor;
interactive editor checks/screenshots supply scoped evidence. Existing shell layout
is outside scope. Critique: clear shared-field mode and Add actions, consistent
matte palette, bounded coral emphasis; fixed cramped Choose assets header. Motion
and fixture copy still require owner review. No final visual approval claimed.
The harness omits Next font loading; production compiles existing Manrope setup.
No live OAuth, semantic AI correctness, verified metadata or provider evidence.
Backend stage remains blocked on owner UI approval, not automatically authorized.

## AI discovery interaction prototype - 2026-11-15

Uncommitted stage 1 frontend only in dedicated t3/ai-asset-discovery at merged PR25
2279d49f4967bdf75db106058873702c0421d5df. Main unchanged. No publication,
credentials, backend, deployment, live AI or market-provider access authorized.

Contract: DiscoveryAdapter receives {prompt, signal}, returns typed results
(summary + ticker/name/illustrative why), clarification (question + answers),
empty/error/unavailable/limit. No account/portfolio payload or raw prompt logging.
UI owns loading, submitted-prompt snapshot, AbortController fencing on edit/mode/
unmount, stale-results labels, explicit refinement submission and Add/Added.
Default adapter is absent. Only tests/cloud-ui supplies deterministic fixtures
outside app routes. Backend not implemented; metadata/auth policy/quotas unapproved.

Review command: $env:TIKR_QA_PORT='5010'; node scripts/serve-guest-qa.mjs
Review URL: http://127.0.0.1:5010/?ai-preview in a fresh isolated browser profile.
Open example, Try your own mix, AI. Prompt energy gives clarification; error,
no match, unavailable and limit preview their named states. slow uses 1800ms;
other fixtures use 650ms. Other prompts show the same illustrative sample rows,
not semantic interpretation or catalog verification. Existing synthetic auth/cloud/
market substitutes prevent provider calls. No production route or configuration.

pnpm 10.11.0 frozen install, pnpm check and credential-cleared configured-auth
optimized build passed (temp tikr-cleared-build-Y262Jn). T3 preview opened the URL
but two snapshots failed: Preview automation snapshot timed out after 15000ms.
Fresh Edge Playwright context used instead; browser/final evidence follows.
Next: owner reviews UI; backend stage waits for explicit owner UI approval.
Historical evidence/deferred polish below is preserved.

## PR25 opened - production preparation complete, 2026-11-15

Published [PR25](https://github.com/Juan-Espino/tikr/pull/25), targeting main from
`t3/guest-examples-signin-save`. Feature commit: 45739ab7cc13f5265bc936cad335587ee1843756.
All94 Vitest, focused Node20, guest9/cloud10 browser groups, lint/both TypeScript,
configured-auth credential-cleared production build, changed formatting/diff and
private-value scans pass. Final fixture build: system temp tikr-cleared-build-ruaJzn;
guest report tikr-guest-ui-2ptTSs; cloud report tikr-cloud-ui-t9bAyJ. Recovery-race
and browser-storage-unavailable cloud opening are covered. CI snapshot at opening:
mergeable, Vercel preview pending, Vercel Preview Comments succeeded; no review yet.
The GitHub connector returned404, so the existing authenticated gh CLI created PR25;
T3 PR linking succeeded. Worktree publication contains no env files or credentials.

Next: review PR/remote checks, then obtain separate approval before merge or release.
No main edit, production service/config/data access or deployment was performed.
Existing canonical localhost5000 review server is unchanged; synthetic harness stopped.
Fresh real production Google/cloud smoke and real B remain explicitly unverified.

## PR readiness preparation - owner authorized 2026-11-15

Final readiness evidence: configured-auth credential-cleared optimized build
passed (`tikr-cleared-build-ruaJzn`), all94 Vitest/24files, focused Node20,
synthetic guest9 and cloud10 scenario groups passed. Guest report/screenshots:
system temp `tikr-guest-ui-2ptTSs`; cloud report `tikr-cloud-ui-t9bAyJ`.
Acceptance includes no toast close/manual dismissal, destructive centered delete,
absent dashboard nav/visible collection heading and the replacement-race refusal.
Private exact-value scan and source/browser assets passed with zero matches; no
env file is a publication candidate. Final check/format/diff verified before commit.

Owner requests production preparation and PR publication. Commit/push/PR are now
authorized for the existing branch; main, merge and production config/data/deploy
remain untouched. No extra agents, chats or worktrees. Fetched origin/main remains
b18a87d8c3bc41cd9696812ef2b35da43c0bf29b (merged PR24); no backend diff.

Release review fixed one cloud replacement race: a recovery draft changed while
its confirmation is open is now preserved and the stale replacement refused.
Synthetic acceptance exercises that interleaving. Cloud opening also remains usable
when browser recovery storage is unavailable; the fixture asserts that case. The synthetic mutation transport
now mirrors existing create-retry idempotency; real server logic is unchanged.
`build-cleared.mjs --auth-fixture` uses non-live public Convex URL fixtures to compile
the configured production auth/provider path with credentials removed.

Current evidence: pnpm check and all94 Vitest cases (24files, serial) pass; focused
Node20 checks pass; auth-configured optimized fixture build passes. Existing cloud
browser10 groups pass; updated guest suite includes race, dashboard navigation,
centered destructive delete and automatic non-dismissible toast assertions. Final
acceptance/format/private scan and PR details are recorded at completion.

No production service was read or changed and no live OAuth/market-provider request was made for
these checks. Fresh live Google/full-page production smoke and real B remain gaps;
real second account is unavailable. Keep approved production binding/callbacks and
release steps in cloud-portfolios.md/accounts-signin.md. No engine contracts changed,
so broad offline engine/mutation suites were not repeated. Next: finish final checks,
commit/push this branch, open/link PR for review; do not merge or deploy.

## Dashboard navigation - owner correction 2026-11-15

Hide the header Portfolios button on the dashboard itself; retain it on other
app pages. This is explicit dashboard shell state, with no route or data changes.

## Portfolio terminology and destructive delete - owner approved 2026-11-15

Use Portfolios in navigation, All portfolios for the detail back link and View
portfolios for return actions. Remove the visible dashboard collection heading;
retain a screen-reader-only Portfolio dashboard heading. Guest copy invites users
to build their own portfolio; signed-in empty state names saved portfolios.
Delete and Delete portfolio use the existing destructive button variant. Centered
confirmation actions and automatic, non-dismissible toast behavior are retained.
No data/backend/publication changes. Focused checks recorded in the owner response.

## Toast and confirmation alignment - owner correction 2026-11-15

Center confirmation dialog action buttons. Remove the Sonner toast close button
and disable user dismissal; notifications expire automatically. Dialog close/
Cancel behavior remains unchanged. Focused formatting and TypeScript verification
recorded in the owner response. No data, backend or publication changes.

## Owner review corrections - implemented 2026-11-15

Final verification: `pnpm.cmd check` (lint and both TS checks), 20 focused Node
checks, nine Vitest checks, nine updated guest UI groups and ten existing cloud
UI groups pass. `node scripts/build-cleared.mjs` passes, with `/legacy` absent
from the route output. The initial production check caught an unhandled async
Duplicate return introduced by promise-based confirmation; fixed explicitly and
rechecked. Changed-file Prettier, git diff/newlines and exact-private scan pass
(zero matches across 29 changed/new files and 30 production browser assets).
Final screenshots/reports: system temp `tikr-guest-ui-SZyEW1` and
`tikr-cloud-ui-KHsURg`; desktop delete and mobile discard screenshots inspected.
Synthetic harness stopped; canonical localhost5000 remains running.


Solo follow-up in the same uncommitted worktree; main unchanged. Owner approved
removing the older-browser page/link/copy (stored bytes remain untouched), hiding
Examples for signed-in dashboards, showing Resume only for actual unsaved work,
shadcn Sonner notifications, aligned portfolio actions, and shared shadcn/Base UI
confirmations for replacement/discard/delete. Current decisions supersede the
previous compatibility/signed-in-examples behavior recorded below.

Implemented shared unsaved-definition detection for dashboard and landing; no
backend/ownership/math changes. Added only sonner2.0.8, the dependency used by
shadcn's Sonner component, with fixed dark styling and no new theme provider.
Transient toast notifications clear when the account/session changes. Actionable
cloud errors/conflicts/pending feedback stays inline. Native confirm dialogs are
replaced with the existing account-dialog composition; cancellation preserves work,
focus returns, and replacement checks for intervening recovery changes.

Verification: updated synthetic guest suite passes nine groups, existing cloud
suite passes ten groups; Node suite now includes saved-vs-unsaved resume detection.
Dialog delete/cancel, replacement/cancel, mobile discard/cancel/focus return,
aligned actions, guest-only examples, absent legacy UI, and unchanged stored-byte
hash are exercised. Integrated preview DOM checked; two screenshot timeouts
permitted disposable synthetic browser fallback. Owner browser data/session not
modified. Screenshots/reports under system temp (latest paths in final report).
Final lint/both TS, focused Node/Vitest, credential-cleared build, formatting and
private-value scans recorded in final report. Real Google flow/provider calls and
second real Google account remain unverified in this follow-up. No extra agents,
commit/push/PR, production action or backend deployment. Canonical localhost5000
review server remains this worktree's existing server.

## Guest/examples simplification - owner review, 2026-11-15

Solo source implementation in this existing worktree:
`C:/Users/JuanE/.t3/worktrees/tikr/t3-guest-examples-signi-4e76e6adcbee8001`, branch
`t3/guest-examples-signin-save`, clean base `b18a87d8c3bc41cd9696812ef2b35da43c0bf29b`
(merged PR24). Main stays unchanged. No extra agents/chats/worktrees, commit/push/
PR/merge, production access/config/deploy, paid service or destructive cleanup.
Earlier publication permissions below do not authorize this branch.

Implemented stable read-only examples for both auth states, separate cloud-only
account collection, central original mutation refusal, Try your own mix, one
versioned temporary recovery draft, explicit replacement/discard, safe specific
sign-in/cancel return, explicit post-login cloud Save, account-bound recovery after
signed-in edits, exact acknowledgement settlement and same-ID cloud conflicts.
Legacy `tikr-demo-v1` is never written/deleted/migrated/imported. `/legacy` provides
read-only holdings/amount/period/results, including the older draft; existing
compatibility interpretation changes no stored bytes. This minimal compatibility
path intentionally adds no editing/import/export wizard. No backend or financial
engine changes, collection-import surface, quota, Groq or deferred polish.

Evidence: 19 focused Node checks and nine Vitest checks pass (including existing
A/B+guest owner transactions). Ten existing cloud UI browser groups and nine new
guest/example groups pass: validation, reload, second-tab recovery fencing, mocked
explicit login/save/collision/offline/pending/retry/expiry/A-B isolation, differing
same-ID recovery, central mutation refusal, mobile keyboard/discard/legacy access,
and malformed legacy preservation. Legacy bytes before/after have SHA256
`e9d519a69267f0fc9d7042221df5297930bafe7eeb6570a71e6f60c9cf9ebe7b`.
Screenshots/reports: system temp `tikr-guest-ui-kArAho`, `tikr-cloud-ui-35xiuh`.
Desktop/mobile screenshots were inspected. Integrated preview passed guest checks
in an empty incognito synthetic origin; two snapshot timeouts allowed disposable
headless Chrome fallback. No owner browser storage was read/seeded/changed.
Harness market transport is a labeled stub, not proof of live charts/provider data.
Changed-file formatting, diff/newline/reference checks and exact-private-value scan pass (zero matches).
Lint/both TypeScript and credential-cleared production build pass; final repeats,
format/diff/private scans are recorded in the owner report. Broad engine tests were
not run because engine contracts are unchanged. pnpm10.11.0 frozen install changed
neither manifest nor lockfile.

Only three public DEV bindings copied privately from main's authorized ignored
.env.local, verified stoic-corgi-586. No secrets, provider activation or production
file copied. Port5000 had no listener. This checkout's loopback server runs:
`pnpm.cmd dev --hostname localhost --port 5000`; review http://localhost:5000.
Google callback/config unchanged. Synthetic checks can be repeated with
`node scripts/serve-guest-qa.mjs`, then `node scripts/qa-guest-examples.mjs`.
`node scripts/qa-cloud-portfolios.mjs` starts its own disposable server.

Next: owner source/DEV review; source remains uncommitted. Real Google full-page
cancel/return/save was not repeated in this run; historical auth evidence and mock
checks do not prove this run's token exchange. Second real Google account remains
unavailable; do not request it again. No real DEV cloud writes/provider calls were
needed. Retention/privacy decisions, market rights and four deferred polish items
remain separate. No PR until requested.

## Account cloud portfolios - PR publication authorized (2026-11-15)

Owner removed browser-to-cloud collection import completely, reports testing the
other features, and authorizes commit/push/PR. Merge, production configuration/
deployment/data access and paid services remain unauthorized. No additional agents,
chats or worktrees. Earlier no-publication/import-scope checkpoints are historical
where superseded by this decision.

Final scope: verified-owner cloud definitions with CRUD/rename/duplicate/pin/delete,
exact financial/name/range validation, atomic unique names, revision/session fences,
privacy across account/session changes, scrubbed deletion receipts and truthful
cloud pending/error/retry/conflict states. Guest portfolios/drafts stay local and
preserved; sign-in alone never saves them. All collection-import UI/API/schema/
index/provider logic is removed. Its manual acceptance gap is withdrawn. Automated
checks assert the control is absent and stale transfer arguments are rejected.

The existing feature branch was rebased onto merged main PR23 at416ce07, preserving
the calendar fix and all auth/market/globe work without touching the main checkout.
Only a plan.md prepend conflict needed resolution; both status entries and all
historical content were preserved. The feature diff does not change main's
financial engine, calendar/provider behavior or dependency versions.

Final automated evidence on the combined source: 94 Vitest tests in24 files pass
serially, 13 guest/name/allocation/return-path Node checks pass, and ten synthetic
browser scenario groups pass. Seven portfolio transaction cases retain A/B+guest
ownership, session, naming, concurrency, delete, financial/range and idempotency
coverage. A final ID validation alignment (80 characters, reserved SPY ID refused)
passes focused portfolio tests. Lint/both TypeScript and credential-cleared build
pass. Focused formatting, diff/newline and exact-private-value/pattern scans pass;
unrelated repository formatting remains outside scope. Synthetic screenshots stay
in system temp. No new live provider probe was needed for this removal.

Compatible backend validation pushed only to classified DEV stoic-corgi-586.
Removed source-ID field/index required no deployed record cleanup; auth/market/
portfolio records and correctness guards/counters were preserved. Existing DEV
market connection and canonical localhost5000 auth callback are unchanged. No
production credentials, configuration, records or deployment were accessed.

Real assistant observations and owner confirmations are separate: prior DEV CRUD,
independent same-account persistence, logout/private-ID refusal, local preservation,
two-tab conflicts and market availability passed. Owner now confirms testing the
other features. A second real Google account is unavailable; real cross-account
browser verification remains a stated gap with automated A/B tests as distinct
evidence. Do not ask the owner for another account again. Retention/privacy choices
remain open; no account-delete/profile/sharing feature is added.

Next: review the published PR and its checks, then obtain separate merge/production
rollout authorization. The PR uses existing production auth/market configuration;
DEV ignored environment files/secrets are excluded. Rollback and rollout notes:
[cloud-portfolios.md](cloud-portfolios.md). Four deferred Post-MVP polish items,
reported-USD dividend assumption and public market rights remain unchanged.

## Owner follow-up: DEV market connected (2026-11-14)

Owner explicitly requested connecting this feature worktree to the existing DEV
market. Target verified as `dev:stoic-corgi-586`: both market URL and private admin
key match that deployment. Copied only six required server-side variables from
main's ignored DEV `.env.local`: TIKR_CONVEX_URL, TIKR_CONVEX_ADMIN_KEY,
TIKR_PERSONAL_DATA_ENABLED, TIKR_MARKET_MODE and the existing APCA credential pair.
Auth's three public bindings stayed unchanged. No production backup/key was read,
no secret rotated, no hosted mode/gateway enabled, no service provisioned or backend
deployed. The ignored file remains ignored; exact private-value scan of tracked/
untracked source and Next browser assets found zero matches.

Restarted only the verified feature checkout's hidden server on canonical
http://localhost:5000. Existing local admission ledger and both revocation markers
were retained; no locks/guards/counters were removed or reset. One SPY 1W route
probe returned HTTP200/ready, personal-provisional, six points for portfolio and
SPY, 2026-11-06 through 2026-11-13. Logs observed three provider HTTP200 responses:
one calendar, one bars, one actions. Local admission counters moved calls4981->5002
and io773219198->774205324; those are existing conservative control units, not an
exact Convex HTTP/DB-operation/billing total. No full financial suite or build was
needed for this local configuration-only connection. All feature source remains
uncommitted, main/prod untouched. Earlier credential-free review statements below
record the preceding authentication/cloud acceptance phase.

Next: owner can reload the existing portfolio to review real DEV history together
with cloud saving. The unavailable real second-account and fresh-profile import
acceptance gaps remain explicit; no release/publication authorization is implied.

## Stage 2 account cloud portfolios - source ready, manual acceptance gaps (2026-11-14)

Owner approved stage 2 after confirming production Google login/reload/logout and
local preservation. Work is solo in existing sidebar-visible
`t3-account-cloud-portfolios`, starting at clean
`7f6e47e93a4f3ed44add4d976d8efa66b023fadf` (merged PR22). Main is untouched. No
extra agents/chats/worktrees, Git publication, production access/configuration/
deployment, paid service or destructive cleanup. Older stage 1/preparation
checkpoints below are historical where superseded.

Implemented: additive owner-indexed definitions; verified live Better Auth
ownership; strict server financial/name/range bounds; atomic unique names/import
source IDs; revision/session fences; scrubbed deletion receipts; account/session/
cache separation and server-tagged query privacy; signed-in cloud actions with
in-tab failure/retry/conflict states; explicit selected import preserving originals.
Pin saves only pin state, preserving other unsaved edits. Guest actions and shared
market pipeline remain; no profile table or derived-result storage. Exact contracts,
retention decisions, rollback and gated rollout: [cloud-portfolios.md](cloud-portfolios.md).

Backend deployed only to classified/announced DEV `stoic-corgi-586`; SITE_URL remains
`http://localhost:5000`. Three validated DEV public bindings copied into ignored
`.env.local`; no secrets/market activation. Existing auth/market configuration,
records/counters and installed package versions/lockfile are preserved.

Final checks before the landing-copy follow-up: all 94 Vitest cases pass with `--maxWorkers 1`; the earlier parallel
run hit the unchanged hosted-runtime 5s timeout, which passed alone and serially.
Eight portfolio transaction cases prove two mocked component identities + guest,
wrong-owner/impersonation/session refusal, atomic name/import races/idempotency,
revision/delete/session fencing and financial/range bounds. 13 Node guest/name/
allocation/auth-return cases pass. Ten synthetic browser groups pass, including
StrictMode import/local-byte preservation, failure/offline/pending, pin-only writes,
conflicts/deletion, failed session-refresh recovery, expiry/account/JWT transition
privacy, mobile and focus. These mocks do not prove real cross-owner auth.

`pnpm.cmd check` and the current credential-cleared build pass. The landing footer
now distinguishes guest/local storage from account saving; its guest copy was
verified in the integrated browser. No backend/financial behavior changed. Focused formatting and new import UI taste lint pass. Repository-
wide `format:check` flags 99 unchanged baseline files; no unrelated formatting was
applied. `git diff --check`, final-newline checks and changed-file credential-pattern
scan pass. Ignored env contains only the three allowed DEV binding names. Engine
contract unchanged, so full financial/mutation suites were not repeated.

Real integrated DEV evidence: owner signed in; QA create/reload/rename/amount/pin,
two-tab stale-write refusal and explicit conflict reload, unsaved duplicate/new
name/save and confirmed delete pass. Fresh page shows the original QA portfolio
and no deleted duplicate. Existing local storage hash remains unchanged. Six
successful portfolio writes plus one refused stale update were driven; total auth,
reactive/component/DB operations and billing were not measured. No live Alpaca
calls or production access. History is truthfully unavailable without market
activation; financial fixture checks are separate.

Real independent-session follow-up: owner completed a fresh Google login in the
Default integrated profile. The original QA portfolio appeared, with name, amount
12345.67, pinned state and SPY allocation 100.00 matching the first session. After
sign-out, navigating directly to that private ID shows Portfolio not found and no
account avatar/private name. Default local hash remained
`b5bbefa0367fd191d96c2b8a4630ddb6ae5e1d50d4446bc0094860f4a691d907`.
No cloud record was written during this follow-up. The first handoff returned a
generic OAuth error; retrying a fresh flow succeeded. Expired OAuth state is a
possible explanation, not an established root cause. No auth configuration changed.

Owner confirmed no second Google account is available. Real cross-account browser
isolation remains unverified; do not request another account again or substitute
mocked identities as real evidence. Two-identity + guest transaction tests prove the
automated ownership/refusal paths; real same-account independent-session persistence
and logout/private-state clearance passed separately.

Real selected import remains a manual acceptance gap: available integrated profiles
contain existing local state, so no originals were seeded/replaced to manufacture
import evidence. Synthetic UI and transaction import/idempotency/race checks pass.
The rejected native Edge helper is removed; human login uses the integrated browser.
Source is ready for owner review with these explicit acceptance gaps. Everything
stays uncommitted; production rollout and any new verification setup need separate
scope/authorization where applicable.

Review server: http://localhost:5000, launched from this feature checkout only.
Command: `pnpm.cmd dev --hostname localhost --port 5000`. A hidden detached instance
of the equivalent Next command keeps the canonical callback available at handoff;
its output is under system temp. Do not kill a stage 1/other checkout server blindly.

Account/auth/receipt retention decisions remain open. Reported-USD dividends,
public market rights and the four deferred Post-MVP polish items remain unchanged.

## Weekend/holiday calendar fix - local review ready (2026-11-15)

Owner-approved narrow implementation in the dedicated calendar worktree, based on
PR22 merged `7f6e47e93a4f3ed44add4d976d8efa66b023fadf`. Main was clean at that
same commit before and after the work. No other worktree, port 5000, DEV auth,
production, credentials, configuration, provider service or deployment was used.
Owner subsequently authorized commit, feature-branch push and PR creation. Merge,
production access/configuration and deployment remain unauthorized. Four Post-MVP
polish items below remain deferred; durable calendar/SPY infrastructure is outside this fix.

Confirmed source defect: the personal calendar loader returned its last eligible
session as `through`, while consumers required checked calendar-day coverage.
Thus a complete query through Sunday could incorrectly fail on Friday metadata.
The actual hosted endpoint regression fails HTTP 503 when the original assignment
is temporarily restored and passes with queried coverage. Production HTTP 200
calendar logs followed by CALENDAR_UNAVAILABLE correlate with this defect; the
original production body was not inspected, so full incident attribution remains
unproven. This is locally verified source, not a production repair.

Implementation retains `from`/`through` as inclusive checked query coverage and
derives the latest eligible actual session from `sessions`. Shared New York
next-calendar-day 09:00 eligibility/coverage validation is DST aware; no holiday
list or weekend arithmetic selects trading sessions. Durable result revisions bind
relevant sessions/effective end, without query-bound/provenance churn. Existing
legacy metadata is never expanded or upgraded into new evidence. Strict bounded
HTTP 200 parsing, date/order/bounds and optional session-time validation reject
malformed/truncated/oversized input; backend-only allowlisted rejection reasons
preserve public errors. Missing closes/actions, roots, hints, guards, leases,
revocations, evidence policies and financial calculations remain enforced.

Verification (deterministic synthetic data; no live provider calls):

- 177 focused Node tests pass (calendar coverage, loader, cache, durable storage,
  verified loader, redesign, admission, adapter, engine and demo suites).
- 87 local Convex/hosted/auth Vitest tests pass with `--testTimeout=20000`.
  Initial concurrent run hit one existing runtime test's default 5-second timeout;
  the full rerun passes without changing test configuration.
- `pnpm.cmd check` passes lint and both TypeScript projects; five financial
  mutation probes are killed. Credential-cleared production build passes.
- New tests cover weekend/holiday/closure, next-day cutoff, DST/leap/year boundary,
  two-session minimum, all five approved presets, two portfolios plus SPY,
  malformed/insufficient coverage, missing closes, stable/corrected revisions,
  actual initial/settled endpoint, process promise reuse/rejection/restart.
  Existing authoritative-root/stale-hint rejection suites also pass.
- Browser acceptance: T3 preview opened, but two snapshots timed out at 15000ms;
  allowed Edge/Playwright fallback used a fresh context and blocked external
  requests. Two Sunday charts end November 13; two holiday charts end April 2,
  with synthetic labels and SPY. Screenshots stay under system temp.

Review file inventory: `src/lib/market-calendar.ts`, `src/lib/market-cache.ts`,
`src/lib/durable-market.ts`, `src/lib/alpaca/personal-loader.ts`,
`src/lib/alpaca/verified-loader.ts`, `src/lib/backtest.ts` (contract comment only);
`tests/calendar-coverage.test.mjs`, `tests/hosted-calendar.test.ts`,
`tests/support/calendar-fixture.mjs`; `scripts/qa-market-redesign.mjs`,
`scripts/qa-calendar-browser.mjs`; `plan.md`, `on-demand-cache.md`,
`market-data-integration.md`, `backtest-methodology.md`.

Reproduce browser fixture: `$env:TIKR_QA_PORT='43149'; node scripts/qa-market-redesign.mjs --calendar`,
then `node scripts/qa-calendar-browser.mjs`. Review seed URL:
`http://127.0.0.1:43149/qa-fixture/seed` (isolated local data; last scenario holiday).
Next task: PR review. Merge, deployment and any real-provider or production
verification require separate owner authorization. Provider omission
inside an otherwise valid response cannot independently prove exhaustive calendar
truth; provisional labels and reported-USD dividend interpretation are unchanged.

## Production auth prepared - owner authorized 2026-11-14

Owner authorized production preparation after PR22. Verified existing Vercel project
juan-espinos-projects/tikr and canonical tikr-lovat.vercel.app. Latest successful
production build logs and Convex production selector agree on warmhearted-tapir-205;
the earlier failed build's determined-anteater-923 host is not used as production.
Set SITE_URL and owner-supplied production Google credentials plus a new independent
BETTER_AUTH_SECRET on warmhearted-tapir-205, with private readback matching. Values
remain out of source/logs; ignored .env.auth-production.local is a private backup.
Added NEXT_PUBLIC_CONVEX_URL and NEXT_PUBLIC_CONVEX_SITE_URL to Vercel Production
only. Existing production market settings and all DEV settings remain unchanged.

A production-origin regression confirms the exact HTTPS app proxy callback and
rejects localhost. All 21 focused cases pass. No merge or production deployment was
performed: Vercel production currently remains at pre-auth base 4f81e3a. After release,
verify Google Console publishing/callback settings and real production login/reload/
logout/draft return/two-user behavior. Earlier production-not-authorized statements
below describe their historical checkpoints; preparation is now authorized, release
remains separate. See accounts-signin.md for exact nonsecret bindings.

## Auth module-analysis correction - 2026-11-14

Owner reported start_push failing on determined-anteater-923 because eager auth
route registration constructed Better Auth while SITE_URL was absent/invalid.
Use the component's documented registerRoutesLazy so module analysis registers HTTP
routes without creating auth. Request-time validation remains strict; no fallback
secret/origin, production env access/configuration or production deployment.
A regression imports http.ts with all auth settings empty and confirms auth and
market routes remain registered; existing missing-config and configured-auth tests
pass. DEV stoic-corgi-586 push, pnpm check, all 20 focused cases and a
credential-cleared production build pass. Production sign-in still requires
separately approved production configuration.

## PR preparation - owner authorized 2026-11-14

Owner now authorizes a commit, feature-branch push and PR for stage 1 plus the
approved avatar/dialog/button-motion/sign-out refinements. This supersedes the
prior no-commit/no-PR constraint below; merge and production configuration/deploy
remain unauthorized. Main remains unchanged at base `4f81e3a`.

Real Google DEV login succeeded in Chrome (owner confirmation) and the integrated
browser (authenticated session/avatar checked directly). Actual profile image,
account dialog, keyboard focus return and mobile fit were verified. Signed-cookie
reload/logout/revocation and two-user isolation pass synthetic tests. A real second
Google account, full real-session reload/logout-to-landing and local-draft roundtrip
remain manual verification gaps; do not infer them from synthetic tests.

Before public auth rollout: separately configure/verify production OAuth + Convex
auth, resolve privacy/terms and account-retention/deletion decisions. Cloud portfolios
and explicit local import remain a later stage, not missing stage 1 implementation.
Market rights and explicitly deferred reliability polish are unchanged.
Final PR checks: pnpm check, 19 focused Vitest cases, two Node return-path cases,
credential-cleared production build and staged whitespace/secret checks pass.
The staged patch contains no private auth-secret matches; .env.local stays ignored. Found and
removed remaining preview-era editor/save labels during final review.

### Sign-out landing return - 2026-11-14

Successful Better Auth sign-out now replaces the current browser location with `/`,
returning to the landing page and discarding in-memory authenticated state. Local
portfolio/draft storage is untouched. Failure keeps the existing retry behavior.
Focused UI/proxy checks and lint verify this small frontend change; no backend push.

### App-wide button lift - 2026-11-14

Applied owner-approved lift/click compression centrally to native/shared app buttons,
including the annotated landing actions. Removed the shared Button's conflicting
old active translation. Profile-specific lift stays single; shimmer stays exclusive
to the profile. Disabled and reduced-motion controls are excluded. Timeframe options
have extra clipping clearance. Browser confirms both marked landing buttons use
1.05 scale / -1px translate without shimmer. Lint/both TypeScript and whitespace
checks recorded for this CSS/UI change; no auth/backend/deploy change.

### Profile gentle lift - 2026-11-14

Added owner-approved hover/focus lift (5% scale, 1px rise) and brief click compression.
The existing shimmer remains; reduced motion keeps static feedback. CSS formatting
and diff whitespace checks pass. No auth/backend changes or deployment.

### Profile shimmer - 2026-11-14

Added owner-requested avatar hover shimmer, matching keyboard focus feedback and
a static reduced-motion outline. CSS-only feedback; no auth/session/backend change.
Prettier and lint checked. No new browser verification claimed for this small edit.

### Account UI customization - 2026-11-14

Owner requested the shadcn Base UI avatar and dialog: header avatar uses the verified
Google session image, with a fallback for missing/failed images. Clicking it opens
an account dialog with the existing app-styled Sign out button. Shared portfolio
editor dialog defaults are preserved. No dependency/backend changes or deployment.
Six focused UI/proxy tests and lint/both TypeScript checks pass. In the isolated
authenticated DEV browser, the loaded avatar URL matches the verified Google session
image. The dialog opens, Tab reaches the shared Sign out button, and Escape returns
focus to the avatar after dismissal. Mobile fit is checked at 390px. Real sign-out
is left for owner review so this customization does not end their session.

## Stage 1 Google sign-in — feature implementation 2026-11-14

Owner-approved scope: Google-only Better Auth authentication with Convex, while
all ordinary guest operations and browser-local portfolios/drafts remain available.
This feature worktree starts at `4f81e3a`, including merged PR21 globe connections
and the earlier history/fencing fixes. Main is unchanged. No commit, push, PR,
production configuration or production deployment is authorized or performed.

Implemented: Better Auth 1.7.25 with @convex-dev/better-auth 0.13.0, component-owned
auth records, Next.js same-origin proxy, exact app callback, explicit trusted origin,
verified-session account identity, Google account selection, session/loading/error
states and sign-out. No app profile or cloud portfolio table, import, Groq or market
policy change. Local definitions stay local across sign-in/sign-out; no cloud-save claim.

DEV target `stoic-corgi-586` was verified against the main ignored DEV binding and
public connection hosts before private credential transfer. Auth variables were set
only on that DEV deployment; the component deployment succeeded. No market secrets
were copied or live Alpaca requests made. Actual Google authorization was opened in
an isolated preview and reached Google's Tikr login with the exact localhost:5000
callback. The owner completed real DEV Google login in Chrome and confirmed
the account menu with name/email and local-only disclosure. Integrated-browser
login/reload/logout verification is in progress; a second real account is not yet
verified. No personal account values are included in this record.

Evidence: 19 focused Vitest cases and two Node return-path cases pass.
Auth HTTP/session tests cover exact redirect/basic scopes,
untrusted origins/external callbacks, missing configuration, signed-session repeated
requests, tampered cookies, logout/revocation, two synthetic accounts and denied
callback draft return. Mocked Convex tests reject guest identity and client userId
impersonation and require a live session. Focused guest market route tests pass.
Final DEV push, credential-cleared production build and lint/both TypeScript
projects pass. Private source/public-asset scan found zero auth-secret matches.
UI tests also cover hidden cached identity during loading/errors and accessible
pending/error/guest states. Mobile error view fits 390px. No broad financial suite rerun.

Integrated-browser regression found during owner retry: adding no-store directly
mutated immutable upstream OAuth headers and converted success to 503. The Next
proxy now copies headers into a new response. An immutable-response regression test
passes, the actual DEV social endpoint returns 200 with a Google authorization URL,
and clicking Continue in the integrated browser reaches Google again. No backend
configuration or deployment was needed for this proxy fix.

Next: finish real Google owner handoff, reload/sign-out and account-switch review;
see `accounts-signin.md`. Cloud saving/import remains a separately approved future
stage. Existing deferred post-MVP reliability polish remains deferred.

## Current project status - reconciled 2026-11-14

This summary supersedes historical uncommitted/no-PR/DEV-only checkpoints below.

- Main at reconciliation start: `7172173045b8aff5541522105b6fc236f2a57387`, clean.
  [PR 19](https://github.com/Juan-Espino/tikr/pull/19) merged November 14 04:03:57 UTC
  (history recovery/general dividend handling); [PR 20](https://github.com/Juan-Espino/tikr/pull/20)
  merged November 14 16:37:46 UTC (fenced guard creation/recovery inventory).
  Prevention hardening is on main, not pending another source PR.
- PR 20 Vercel and Preview Comments checks succeeded. These are PR checks, not
  independent post-merge frontend/backend version verification. The owner reports
  production working. This doc pass made no live request or deployment.
- Owner-approved production AMZN repair succeeded before PR 20 merged: exact legacy
  CAS, replacement refresh, six shared AMZN/SPY sessions November 6-13, stored content,
  completed lease and settled guard. Other guards/revocations preserved. The original
  worker interruption remains unknown. See production-history-recovery.md.
- Implemented: real provisional Alpaca history/catalog through the server, durable
  normalized monthly payloads/fenced heads in Convex, disposable IndexedDB/process
  accelerators, local portfolios/drafts, allocations, SPY and comparisons.
  Not implemented: real Google authentication, profiles/cloud portfolios or Groq.
- General dividend assumption: reported cash rate is USD per traded share/ADR,
  retain embedded withholding, no extra FX/ADR-ratio/gross-up. Missing currency or
  foreign flags do not alone block normalization. This is the owner's application
  assumption, not an established provider-wide guarantee. Financial validation stays.
- Operational app rate/budget/daily/cooldown enforcement, owner usage monitor and
  DEV native call cutoff were removed by later owner decision. Keep counters,
  guards/revocations, ownership/fencing and input/serialization/provider-concurrency
  bounds. Older quota/DEV-relief/monitor entries do not describe active controls.
- Recorded acceptance: dividend checkpoint 207 Node/68 Convex-runtime cases; later
  guard hardening 69 Convex-runtime cases, focused 12 and lint/types/build passed.
  Counts describe their own checkpoints, not a new combined test run. Next-day
  live check 6 remains explicitly skipped; licensing and exhaustive provider
  finality/correction/action evidence remain unresolved. No fresh tests claimed here.

### Landing globe connections - 2026-11-14

Implemented in isolated `t3/globe-city-signal-lines` worktree from main `eb54d5d`:
slow elevated red/green arcs connect the existing five trading hubs, with coordinated
departure/arrival pulses, a traveling tip, brief hold and 1.4-second fade. At most
two routes use distinct endpoints. Far-side routes are occluded by the sphere;
rendering follows requestAnimationFrame without the old 30fps cap. Animation time
pauses while dragging, hidden, offscreen or under reduced motion. Static reduced-
motion city accents, keyboard/drag rotation and failed-asset fallback remain.

Verification: frozen-lockfile dependency install, `pnpm check` (lint and both
TypeScript projects) pass. Headless installed Edge observes both route colors,
at most two routes, static reduced motion, keyboard rotation, mobile viewport fit,
drag completion and failed-map fallback with no page errors. Desktop/tablet/mobile
inspection screenshots and focused QA artifacts are under system temp. The generic
design inspector flags existing page typography, numbering, body size and picture
count; these are outside this globe change and the approved visual system remains.
No backend/provider calls, deployment, commit or publication.

Next: owner visual review of arc speed/glow before any publication. Broader project
recommendations below remain separate from this completed implementation.

### Next project milestone - recommendation, not implementation approval

Google-only Better Auth sign-in and owner-scoped cloud portfolio saving. Preserve
public guest experimentation and local portfolios/drafts. Offer explicit idempotent
local-to-account import, retain local copies, require user resolution of duplicate
names (no silent renaming), and enforce ownership on every server read/write.
Verify sign-out/account switching, two independent users and cross-device/reload
persistence. Design account deletion/retention and OAuth configuration before rollout.
No credentials, provisioning or deployment is authorized by this recommendation.

Then: catalog-grounded Groq theme discovery with separately approved AI quotas;
then a broader-release pass for data display/cache rights, privacy/terms, honest
landing/sign-in copy and deliberate abuse/cost protection under a newly approved
policy. No removed limits are silently reinstated. The four Post-MVP polish items
below remain explicitly deferred; preserve the scoped incident fixes already merged.

### Historical implementation evidence

Entries below describe their dated checkpoints. Later owner decisions, merges and
this summary take precedence; old no-publication/DEV-only statements are not the
current source status or blanket authorization for future operations.

## Production AMZN repair completed - 2026-11-14

Owner authorized exact legacy-guard CAS and one replacement refresh. Preflight
backed up metadata and found no live hosted owner. CAS succeeded; public AMZN 1W
returned 200 ready with AMZN/SPY on six shared dates November 6-13. Readback confirms
replacement history, completed lease and settled AMZN guard; other guards and
revocations unchanged. Three direct Convex HTTP calls plus one public market call;
internal Convex/provider counts unknown (not zero). No prod deployment/env change.
See production-history-recovery.md. This repair preceded PR20; prevention
hardening has subsequently merged into main (see current summary).

## Guard recovery hardening - 2026-11-14

Owner approved this incident follow-up, superseding the deferral only for the
scoped recovery changes here. New refresh begin requires one symbol and a live,
matching lease; token-only guards cannot be created. Active owners are rechecked
at most eight times over two seconds without provider work. Expired modern guards
use existing automatic reclaim; legacy guards still require operator CAS.
Added internal recoveryMetadata query (symbols + explicit asOf) returning only
exact guard/head/lease metadata. It is not exposed by the HTTP gateway.
Original HEAD accepts the lease-less regression; hardened source rejects it.
69 Convex/runtime tests pass; focused 12 pass after explicit-time query review fix.
Lint and both TypeScript checks pass. Final DEV-only backend deploy succeeded, including the query correction. No production writes or provider calls.
See production-history-recovery.md for deployment/drain/migration approval gates.

## Production AMZN incident - 2026-11-14

Authorized read-only inspection confirms the retained token-only v5 AMZN guard,
expired incomplete lease, and no recovery observation. This explains the current
guard block; the original interruption remains unknown. Two production metadata
queries, zero provider requests/writes/deployments. Exact head inspection and CAS
recovery remain pending. See production-history-recovery.md. No guard cleared.

## Latest completed change ? general Alpaca dividend acceptance (2026-11-13)

Implemented uniformly for all tickers under the owner-approved assumption below.
Foreign/currency metadata no longer blocks cash normalization. Old interpretation
failures revalidate using a separate cache revision, preserving authoritative guards
and revocations. Final207Node/68Convex tests, lint/types/build pass; SolLowreviewpass.
Terra fullAI1Y/5Y/reloadready; no currencyerror/publicreference. RealQA recorded17
providercalls againstplanned12: overrunexplicitlydocumented, no furtherlivechecks.
This checkpoint preceded PR19; source is now on main. Four reliability items
remain **Post-MVP polish**, deferred. See mvp-history-readiness.md finalsection.

## Current owner direction ? 2026-11-13

Accept Alpaca reported USD cash dividends across all tickers under the assumption
in backtest-methodology.md, retaining embedded withholding and applying no second
conversion or gross-up. Earlier missing-currency blockers are superseded by this
approved interpretation; prior empirical findings remain historical evidence.

### Post-MVP polish ? explicitly deferred by owner

These are follow-up improvements, not work to implement in this dividend task:

- Refresh recovery without repeated reloads: safely recover failed/interrupted work
  without leaving a portfolio guarded. Preserve existing safe reload recovery.
- Calendar and SPY reliability: persist validated shared data so restarts and temporary
  provider failures do not prevent cached portfolios from loading.
- Period changes/cache coverage: strengthen 1W/1Y/5Y end-to-end coverage, retain every
  holding and never present an older chart as the completed new period.
- Temporary provider/data failures: improve bounded retries, precise messages and
  continued use of the last validated result where still trustworthy.

No production rollout, commit, push or PR is authorized. Current implementation and
verification evidence are in mvp-history-readiness.md.

## Hosted retained-policy fix - source verification (2026-11-12)

Implementation remains uncommitted in the dedicated `t3/fix-hosted-history-revoked-lineage`
checkout at base `4f02383`. No main edits, live calls, credentials, production reads,
production mutations, deploy, push or PR are part of this task. Prior publication
and live-development approvals below are historical and do not authorize this fix.

Shared exact v3/v4 -> v5 policy/scope classification now covers hosted control and
local flags. Authenticated server policy identity handles zero-scope enter/provider
without bypassing unknown/current revocations. Old BA guard is retained; current
AMZN and unknown guards block. Normal accounting and active ownership remain.

Evidence: complete supplied production global payload seeded into the actual hosted
runtime test, synthetic gateway/Convex/provider only; SPY/BA/RTX/LMT fresh validation,
AMZN blocked, retained markers/counters, mismatched policy/scope, current/unknown
revocations, overlapping begin ownership, nonowner finish, normal ledger charges,
gateway authentication and HTTP-200 blocked NDJSON are covered. Guard-wait timeout
was traced to AMZN's existing 30 x 400ms polling with Date-only fakes; explicit timer
advancement fixes the fixture without changing runtime timeouts or increasing the
test timeout. See `market-data-integration.md` for recovery evidence and rollout.

Checks: full Vitest suite 14 files / 47 tests passed; Node evidence/durable/admission
command 44 tests passed; `pnpm check` passed (lint and both TypeScript projects);
`node scripts/build-cleared.mjs` passed in system temp without private configuration.
Final additional focused assertions passed (three files / six tests); formatting
and final local admission regressions (15 tests) also passed.

Current source status: interrupted-refresh recovery is now implemented (see the
2026-11-12 recovery entry below), including operator-only legacy CAS conversion.
Production remains unverified. Next is source review, then separately approved
read-only inventory, backup, deployment/drain and exact AMZN conversion. No old-token
manual finish, cleanup or live budget bypass is authorized. Historical test counts
above describe the compatibility checkpoint; current verification is recorded below.

## PR publication authorized (2026-11-12)

Owner approved committing/pushing this feature branch and opening its PR against main after source explanation, synthetic/Terra acceptance and the bounded real development cold/cache test. No automatic merge, production deployment or deployed cleanup is authorized. Private configuration remains ignored. Earlier no-publication statements below describe their historical checkpoints.

## Owner manual development testing configuration (2026-11-12)

Owner reported catalog admission refusal while testing. Read-only preflight confirmed this worktree omitted the development allowance variables: the running server therefore used the 500M default although retained November usage is 751,860,648 units. Saved the previously approved November-only 770M ceiling to this worktree ignored .env.local for owner manual testing; 18,139,352 retained admission units remained at inspection. No ledger/guard/reset, production setting, main configuration or additional live API request was changed/made. Restart the owner dev server to load the private settings. This is not a new allowance increase or provider billing measurement.

## Final bounded real-development acceptance ? passed (2026-11-12 local)

Owner explicitly increased cumulative Alpaca request cap4?6; all other original caps unchanged. Ran normal openMarket server runtime with existing development Convex SDK and actual Alpaca transports, no injected data/normalization, policy change, guard cleanup or retry. UTC timestamps fall November13 while local acceptance date is November12. Journal preserves all earlier attempts/preflight nested, cumulative request counters persisted before every transport and byte counts during consumption. Final result passed; no further calls needed.

| Operation | Provider requests | Provider received bytes | Convex API requests | Convex received bytes | Admission-unit increase | Elapsed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Cold process open | 3 | 164,364 | 33 | 200,767 | 1,323,566 | 6,232ms |
| Cached reopen | 0 | 0 | 1 | 4,269 | 26,342 | 153ms |
| Cumulative entire trial including failures/preflight | 5/6 | 491,768/8,388,608 | 37/50 | 283,570 | 1,889,108 | ? |

Cold history source: existing matching-v5 legacy normalized monthly manifests/payloads; fresh SPY reused, stale MSFT refreshed by actual bars/actions following actual calendar fetch. No SPY bars/actions fetched. Cold process used no browser storage; response carried123 history chunks. Same-process cached reopen passed those returned history hints through normal request validation and returned identical results with zero provider work; one normal Convex authority read remained. This validates server-runtime warm reuse, not a real browser IndexedDB restart/multi-instance acceptance. Existing independent Terra synthetic browser acceptance covers those browser behaviors.

SPY/MSFT50/50, amount10,000, explicit1W: both ready, no issues, shared period2026-11-04?2026-11-11, six common completed sessions (Nov4,5,6,9,10,11), unchanged shared starting amounts, finite values, SPY benchmark present, endpoint/period/ending arithmetic passed. Portfolio ending9,642.42 /-3.58%; SPY9,908.71 /-0.91%. Offline final report check confirmed cold/warm output equality, rounded return arithmetic and caps. Data checked2026-11-13T02:48:23.202Z; no forecast/execution/fabricated price or shortened range.

Final ledger751,860,648 units /4,516 calls; original trial baseline749,971,540 /4,474. These are retained control units, not billing. Remaining approved caps: one provider request,7,896,840 provider bytes,13 Convex requests; unused allowance is not permission for broader browsing. Final report/runner under system temp tikr-live-smoke-20261112-report.json/.mjs; previous failed reports remain nested. Final15 admission/29 recovery tests, lint/both typechecks, cleared build and prior Terra16-case acceptance remain applicable; no new application source change in this final trial. Ready for owner source review BEFORE PR; no commit/push/PR or further deployment. Licensing, public hosting, actual billed capacity, deployed cleanup and live multi-instance behavior remain separate gates. Earlier pending/blocker entries below are chronological evidence superseded by this success.

## Final real-data cap preflight ? cannot fit remaining allowance (2026-11-12)

Inspected the native freshness/reuse path and existing development manifests before any further provider attempt. One admitted Convex metadata read, no Alpaca calls: source scope695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7 matches reviewed v5. Both are legacy monthly-v2 manifests without disposable-content markers, so retained normalized monthly documents remain eligible for ordinary validated reads. SPY: checked2026-11-12T20:14:39.415Z, coverage2021-11-10 through2026-11-11,61 chunks, current cycle. MSFT: checked2026-11-11T19:52:46.988Z, coverage2021-10-25 through2026-11-10,62 chunks, stale cycle. This corrects the assumption that MSFT was already freshly validated through November11. Metadata inspection is not full payload validation or acceptance.

Native runtime must fetch calendar once in a cold process. Stale MSFT requires at least one bars and one corporate-actions request (adapter.ts separately traverses both endpoints); retained wider history reduces coverage fetched, not these freshness obligations. Thus the minimum is THREE additional provider requests before pagination, versus TWO remaining. No provider attempt was started, no stale result served as fresh, and no provider response replayed. Initial-ready and cached reopen remain unverified live for this redesign. This is a hard cumulative-cap blocker, not a need for generic permission to resume.

Cumulative trial: Alpaca2/4 requests,327,404/8,388,608 received bytes; Convex3/50 requests,78,534 received bytes. Remaining: Alpaca2 requests,8,061,204 provider bytes,Convex47 requests. Ledger750,510,740 units /4,479 calls (preflight added26,312 retained units/one call). The temp runner journals cumulative counters before transport and received bytes during consumption, nests every previous report, and stopped at TRIAL_HISTORY_PREFLIGHT_BLOCKED. Existing guard records, charges, backend and main remain unchanged except normal admitted read accounting. No new source behavior changed in this preflight; prior final15 admission/29 recovery checks, lint/types and cleared build apply. No PR/commit/push/deployment performed. Reviewable source is ready; real-data acceptance is explicitly incomplete until sufficient bounded provider allowance is separately approved (at least one more request beyond the remaining two, with pagination uncertainty).

## Bounded continuation stopped; live acceptance remains pending (2026-11-12)

Implemented an exact server-side lineage compatibility rule for the two canonical v3/v4 scopes already superseded by PR16's reviewed v5 transition. Under literal current v5 only, these global file markers and their old-policy refresh guards do not reject a fresh v5 validation. They remain on disk unchanged. Asset-specific flags, unknown scope guards/globals, current v5 markers and every ledger revocation remain blocking; no new policy, namespace, receipt, reset or cleanup is used. Marker contents do not establish the original triggering reasons. Focused admission tests pass15/15, including canonical historical hash proof and negative current/unknown/global/asset/ledger cases. The earlier combined admission/durable suite passed42/42 before the final guard-lineage adjustment; unchanged receipt/recovery machinery is retained. Final lint and both TypeScript projects pass. Final durable recovery suite29/29 and credential-cleared production build pass after the final source change.

The first compatibility patch exempted global marker scanning but still re-entered the same old global gate through historical refresh guards. One continuation trial therefore failed EVIDENCE_REVOKED; it is not live-price acceptance. The follow-up handles that exact reviewed lineage consistently and has not been retried live, honoring stop-on-failure. Cumulative trial totals: 2/4 Alpaca HTTP requests, 327,404/8,388,608 received provider bytes, 2/50 Convex requests. Ledger now 750,484,428 units /4,478 calls. Remaining original caps are two Alpaca requests, 8,061,204 provider bytes and48 Convex requests; no allowance reset is implied. Runner retains the original failed report nested in the accumulated report and rejects unexpected prior counters before any transport. No further deployment or record cleanup occurred. This stop was subsequently superseded by standing owner direction to continue when feasible within the original caps; the precise cap preflight below now owns the remaining blocker.

## Approved bounded live smoke test (2026-11-12)

Owner approved a November development-only ceiling of 770,000,000 admission units, preserving all previous charges and production defaults, and a SPY/MSFT 50/50 1W smoke with at most four Alpaca requests, 8 MiB received provider bodies and 50 Convex API requests. Updated the local allowance validator and upper-bound regression; both focused tests passed. Applied allowance variables only to the test process, not persistent shared environment files. The real server runtime test stopped on EVIDENCE_REVOKED before any portfolio result: one Alpaca HTTP 200 (163,702 received bytes), one Convex HTTP 200 (37,141 received bytes), 256,444 retained-unit increase / two ledger calls. Ledger advanced from 749,971,540 to 750,227,984 units; no reset/refund of historical charges. No warm reopen or automatic retry occurred. Read-only guard metadata found two global revocation flag files and no ledger-revoked scopes (confirmed with Node; the earlier PowerShell count was a null-array artifact); no SPY/MSFT-specific revocation flags. No marker or guard was cleared. This is not live-price acceptance or a provider-capacity claim. Sanitized report is in system temp tikr-live-smoke-20261112-report.json. Next: investigate and propose explicit reconciliation for the existing global revocations before another separately bounded trial.

## Authorized development backend rollout (2026-11-12)

Owner explicitly approved updating development stoic-corgi-586 only. Ran pnpm.cmd exec convex dev --once --typecheck enable --tail-logs disable successfully; functions ready on the same verified existing development hostname. CLI refreshed ignored local public connection fields and generated bindings. A copied deployment-binding comment was normalized with Node parseEnv before deployment. No provider request, configure/reset mutation, deployed-data cleanup or production deployment was performed. Local allowance remains blocking; next step is a concrete bounded live-test allowance review/preflight, not an automatic increase.

## Development configuration preflight (2026-11-12)

Owner authorized secure local setup for real-data acceptance. Confirmed main settings bind explicitly to development stoic-corgi-586: direct URL/public URL/site URL agree, and the admin key binding matches. Consolidated existing Alpaca fallback settings into main ignored .env.local and copied only required direct-development settings into this feature worktree ignored .env.local; values never printed. No credentials/deployment keys added to tracked files. No live request, deployment, configure mutation or ledger write occurred. Existing November ledger retained 749,971,540 admission units and 4,474 calls. No explicit development allowance variables were present; default is 500,000,000 units, and only 28,460 would remain under the historical approved 750,000,000 ceiling. These are control units, not billed bytes. Live acceptance remains blocked pending a concrete bounded allowance review and separately authorized compatible development backend rollout. No counter/reset/policy bypass.

## PR update and completed automation (2026-11-12)

Owner authorized committing/pushing the completed acceptance follow-up, reconciling latest main and updating existing PR #16. The completed next-cycle automation was deleted. Main's approved branding/setup changes and this branch's approved history/name behavior are both retained. Functional next-cycle acceptance passed; subsequent ordinary browsing exhausted the local 750 MB accounting gate. Owner's Convex dashboard reported only 118.88 MB actual database I/O, so local ledger usage is not provider billing and prior ledger-based capacity extrapolations are not a production capacity finding. Budget accounting and sustainable browsing remain unresolved. The proposed Alpaca batching/lightweight browser/server cache redesign is separate follow-up work; no redesign is included here. No production deployment or merge is authorized.
## November 12 acceptance completed

The real next-day API and Terra Medium isolated Edge browser checks passed. Twelve total direct API requests were used: the eleven core/range/comparison checks above plus one Six 1W diagnostic, which returned ready through November 11. All four QA dashboard charts ultimately completed ready; initial Six unavailable was not reproduced in completed final responses. The exact original transient response cause was not captured, so no causal fix is claimed for that observation. War's exact detail route showed its saved 1Y chart, switched to 1W with six points, and the actual All experiments button returned to four ready dashboard charts. No page/console errors were observed. Earlier automation failures targeted a collapsed range option, assumed initial 1W despite saved 1Y, or searched for a link where the app uses a button; corrected checks passed without app changes.

Final browser evidence: `%TEMP%/tikr-final-navigation.json` (detail 1Y/1W) and `%TEMP%/tikr-dashboard-return-final.json` (successful button return/all four ready). Screenshots use the same prefixes. Prior full acceptance remains applicable; the last missing actual daily-cycle observation is now complete. Twelve focused allowance/admission tests, lint and both TypeScript checks passed after the approved 750 MB cap change; diff whitespace check passed. The branch is ready for final PR review for personal development scope, with production/licensing limitations unchanged. PR #16 remains draft; this continuation leaves the allowance source/test and acceptance-document follow-up local and uncommitted, honoring the continuation's no-commit/no-push restriction. No deployment or merge was performed. The local November-only allowance remains configured at the approved 750 MB; restoring 500 MB would block further November operations because retained usage already exceeds it. Server 5001 remains running.
Final retained ledger: 4382 calls / 731332374 bytes; remaining below 750 MB: 18667626 bytes. No counters or evidence guards were reset.

## November 12 next-cycle API acceptance — passed; browser confirmation in progress

Owner approved extending the November local development ceiling to 750,000,000 bytes to finish acceptance. The bounded validator and ignored local setting now permit that ceiling only in November 2026 development/nonhosted mode; ordinary, production, hosted and other-month limits remain 500 MB. Twelve allowance/admission tests passed, including rejection above 750 MB and retained safety guards. No ledger or marker was reset.

Eleven bounded live API requests passed on November 12: SPY, War (PLTR/RTX/BA), Income (SCHD/SPY), each at 1W/1Y/5Y, plus two- and three-portfolio 1W comparisons. All were HTTP200 ready, checked November 12, with the completed endpoint November 11; 1W/1Y/5Y had 6/252/1255 common points. Shared dates, starting amount, endpoint, finite values, ending value/return arithmetic and SPY equality passed. No retry loop or policy change was used. Local I/O increased by 30,021,944 bytes, from 691,380,666 to 721,402,610, leaving 28,597,390 bytes. Evidence: `%TEMP%/tikr-market-matrix-NIUXEG/summary.json` and response files. This supersedes the earlier budget blocker and pending API observation. Terra Medium browser confirmation is in progress. Server 5001 remains running; main5000 remains untouched.
## November 12 next-cycle preflight — blocked

The scheduled continuation inspected retained nonsecret ledger metadata before provider/API work: November usage is 691,380,666 bytes across 4,105 calls, leaving 8,619,334 bytes below the owner-approved 700,000,000-byte development ceiling. The planned fresh core-ticker validation was estimated at 20–30 MB, so the complete bounded matrix cannot fit in the remaining allowance. No live API requests, backend synchronization, marker/ledger resets or browser market requests were performed in this continuation. Port 5001 was not listening at preflight; the authorized loopback server was started and left running without issuing acceptance requests. Actual next-cycle freshness remains unverified; draft PR #16 should remain draft. Existing November usage increased since the earlier allowance activation; this preflight does not establish which intervening operations consumed it. Next step requires an explicit owner decision on additional development allowance or a separately reviewed lower-I/O acceptance approach. No commit or push was performed in this continuation.
## Portfolio name creation flow (2026-11-11)

Owner asks that a new portfolio preview use ?New portfolio? while the name field remains blank. No duplicate error should appear until Done is pressed; a blank or duplicate name then keeps the editor open, shows inline feedback and prevents saving. Existing unique-name enforcement and browser-local records remain. Implemented with a blank model name, placeholder and creation-dialog title, submit-time validation, and disabled saving until the name is valid. Two focused Playwright flows passed (new draft and duplicate copy, conflict timing, correction and save); name/storage Node tests passed 11/11; lint and both TypeScript checks passed. The Terra Medium preview snapshot timed out twice, so the isolated Playwright browser flows provided verification instead.

## Market-history repair and acceptance in progress (2026-11-11)

Current source is the general live personal-provisional Alpaca path on http://127.0.0.1:5001, backed by existing development Convex stoic-corgi-586. The rejected four-ticker/1W snapshot implementation and its activation were removed; no snapshot is used to serve results. Main checkout and its server/configuration remain untouched. No commit, push, PR, merge, provisioning or production deployment is authorized in this task.

Confirmed defects and evidence:

- Valid BA stock-merger rows identify BA as acquirer and SPR as acquiree, without a generic symbol field. The old parser rejected these HTTP200 rows; with prior BA evidence the loader escalated the parse error to EVIDENCE_CHANGED and globally revoked the shared scope. Exact received BA/SPY 1Y responses reproduce this mechanism offline. Original initiating request was not recorded, so historical causality is strong rather than definitive. Credentials authenticated successfully; the reproduced defect is response interpretation, not a holiday or authentication failure.
- IBIT's valid acquiree-only cash-merger row likewise lacked an acquirer field. Accepting that response shape lets the loader report missing requested 5Y prices without revoking intact shorter history. No earlier prices or inception claim are invented.
- Concurrent local writes reserved 64 MB each. Retained usage plus simultaneous reservations can reject a received expansion before commit, leaving conservative guards. The owner's SPY/PLTR partial expansion matches this mechanism; absent historical write-stage logs, the exact incident is not proven. Local storage operations now serialize through admission/settlement, use conservative operation-shaped reservations and bounded read batches, and log sanitized failure stages. Source copies have a bounded revision-keyed immutable memory cache after durable checks.

The substantive v5 policy is personal-provisional-sip-v5-acquiree-only-mergers; its parser change received independent review. Old v3/v4 global revocation markers remain unchanged. Development backend synchronization was explicitly classified and performed only against stoic-corgi-586. A literal reviewed-policy transition permits one fresh validation without resetting old attempts or shared usage. Existing active leases/cooldowns remain enforced. Genuine corrections now persist an affected-asset revocation locally; affected requests remain blocked after restart while unrelated SPY requests remain available. Hosted revocation remains scope-wide. New personal corrections additionally bind to a stable reviewed-policy revocation scope, so a monthly date-window change cannot restore a revoked asset; a dedicated no-network storage regression proves reads, refresh and confirmation stay blocked across window changes. A source-policy transition still requires separate evidence-backed review.

Abandoned refresh recovery requires explicit retry, freshly validated input, atomic commit, matching readback and an exact head-revision receipt. Original flags and dead-process sentinels remain intact; an active observer or real revocation cannot be acknowledged away. Recovery does not show old results while it is incomplete. Known period limitations are cached only for exact bounds/cycle/policy, avoiding repeated impossible requests without suppressing new cycles or explicit retries. Wider coverage is retained and clamped when the supported calendar window changes.

Owner approved a November 2026 development-only local I/O ceiling of 700,000,000 bytes, extending the prior650 MB decision. Applied this checkout's ignored allowance setting and bounded validator; the allowance cannot extend to another month by configuration. Ignored local settings activate it only in development, nonhosted mode and the matching month; ordinary/production/hosted limit remains 500,000,000 bytes. No counters, locks, guards or markers were reset. The last completed matrix used 19,352,268 admitted local I/O bytes (not a platform billing measurement).

Verification so far: 87/87 live API matrix checks (90 bounded requests) passed across SPY/SCHD/PLTR/RTX/BA/MSFT/AAPL/NVDA and all five ranges; mixed portfolios, two/three-way comparisons, IBIT 5Y limitation/shorter-period recovery, SPY isolation, and concurrent warm requests passed. Nine live malformed/foreign/oversized requests were rejected before provider work. Full Node suite passed 177/177; Convex transaction suite 39/39; five financial mutation probes were killed; lint and both TypeScript projects passed. Credential-cleared browser regression passed 40/40. Terra created four portfolios through the actual live editor and observed real 1W results. Production build from a credential-cleared source mirror passed; actual worktree restart returned identical ready SPY series. Terra verified live ranges/comparisons, explicit 1Y reload, four ready dashboard cards and mobile/tablet overflow. Terra also completed live edit/CRUD and IBIT missing-history/reload/1Y recovery with SPY still available. Only actual next daily-cycle observation remains pending; do not call the branch complete or PR-ready yet. See market-history-acceptance.md for the current test ledger. History membership now reads only selected catalog shards with unchanged freshness/revision checks; full search remains unchanged. Selective-read/coalescing and malformed/mixed/stale/future/shard tests pass. Two live War1Y probes were ready and charged379,326bytes total. Owner explicitly approved700 MB. Applied the November-only development allowance with byte-identical retained ledger at648,652,082bytes /3,667calls, leaving51,347,918bytes. Twelve focused allowance/admission tests pass; production/hosted/default/other-month limits remain500 MB, and700,000,001bytes is rejected. No guards, counters or revocations were reset. The scheduled continuation must still preflight remaining allowance before fresh provider requests. The actual next-cycle continuation is scheduled in this thread for 2026-11-12 14:05 UTC (06:05 Pacific / 09:05 New York); it has not yet run.

Frontend owner decision: operational history failures use concise professional app copy; raw guard/recovery instructions belong in backend diagnostics. Ticker-specific history limitations remain explicit. Existing approved supporting typography/layout remain unchanged. Legacy unmarked 1Y portfolios/drafts migrate to 1W with an ambiguity notice; future explicit choices survive reload.

## Dashboard block: retained development cache evidence (2026-11-11)

Owner reported the actual `war` portfolio as PLTR/RTX/BA on dashboard 1W. Read-only Convex data inspection was explicitly pinned to dev `stoic-corgi-586`; it did not call market functions, change database records, fetch provider history, serve revoked cache values or modify local admission files. Initial CLI-output decoding failed on Windows cp1252; UTF-8 byte parsing succeeded. Inspected bounded recent/old entry pages and 20 lease rows; only sanitized metadata was emitted.

New evidence: cached SPY, PLTR, BA and NOC heads all carry the current v3 scope and covered 2026-11-03 through 2026-11-10. Their checkedAt values are approximately 2026-11-11 17:48:55?57 UTC, just before local revocation at 17:49:05 UTC. PLTR/BA/NOC leases record a second attempted refresh with completed=false. This establishes successful current-policy 1W cache population followed shortly by a failed refresh; it rules out an explanation based solely on leftover pre-v3 heads for those four symbols. It does not establish the second requested period, which symbol initiated revocation, whether an upstream response was malformed, or whether received in-scope data truly changed. All observed asset heads remained ordinary manifests rather than explanatory tombstones; the local revoke occurs before the attempted tombstone write, whose normal storage path is then blocked by the durable marker. Thus retained cache metadata does not recover the original error. No safety check was removed and no recovery was attempted.

## Authorized live worktree development setup (2026-11-11)

Owner subsequently authorized selective local development configuration, frozen dependencies and bounded real requests. Main `.env.local` and legacy `.env` were parsed programmatically only; no secret values were printed or read into model context. The ignored worktree `.env.local` received only CONVEX_DEPLOYMENT, TIKR_CONVEX_URL, TIKR_CONVEX_ADMIN_KEY, TIKR_MARKET_MODE, TIKR_PERSONAL_DATA_ENABLED and canonical Alpaca credentials from the existing settings. Deployment class, URL identity and admin key development-prefix identity all matched `stoic-corgi-586`. No production/deploy/auth secrets were transferred. Backend source matches main's already-synced Convex code; no additional synchronization or provisioning was needed.

Replaced only the verified worktree dependency junction with a real `pnpm install --frozen-lockfile` installation; manifest and lockfile unchanged. Turbopack now starts normally. Server left running on loopback port 5001 using `pnpm.cmd dev --hostname 127.0.0.1 --port 5001`; startup loads `.env.local` without validation bypass. Main checkout/server was not changed or stopped. Port 5000 was not listening at the final check; no claim that main is currently running.

Actual live evidence: one SPY 1W market POST returned HTTP 503 EVIDENCE_REVOKED. A separate incognito-only PLTR/BA/NOC portfolio (33.33/33.33/33.34, $10,000, 1W, SPY benchmark) also returned 503; browser DOM confirmed Timeframe: 1W and the explicit scope-recovery message. Real Alpaca calendar initialization completed before reaching the scope gate (a calendar error would abort earlier); no price/action refresh was reached. Personal catalog search returned HTTP 200 with the exact validated SPY name/exchange. One malformed catalog probe was rejected at the origin/content-type boundary with 403 before storage/provider work; the corrected request succeeded. No history retries or scope expansion were attempted. T3 snapshot timed out; DOM inspection succeeded through preview_evaluate. The isolated test tab was closed; user portfolio storage was untouched.

The same original revoked marker and four refresh guards remain byte/timestamp unchanged. November local ledger advanced normally from 1,135 calls / 301,651,984 I/O bytes to 1,138 / 306,186,876 during the admitted calendar/catalog checks; no counter reset or guard cleanup. This worktree shares the development backend and local admission scope with main. Separate frontend port/storage is not a separate evidence scope. The live server is configured and usable for portfolio editing/search, but live graphs remain blocked; no ready-history claim is made.

Next task remains evidence-backed recovery review: obtain original 17:49 UTC triggering diagnostics/source observations to distinguish a real contradiction from a code/policy defect. Existing zero-byte marker metadata cannot prove that cause. No arbitrary revision bump, marker bypass, DB reset, commit, push, PR, merge, production write or agents.

## Portfolio default and local revocation follow-up (2026-11-11)

Implemented locally in `fix-portfolio-range-revocation`; this supersedes the prior no-migration decision below. Unmarked legacy 1Y portfolios/drafts migrate once to 1W with an honest notice: v1 cannot distinguish the old default from an explicit choice. Future picker changes persist `rangeChoice=explicit`; other periods and Max-to-5Y remain intact. Dashboard/detail/new editor defaults and comparison requests are covered by Edge fixtures. EVIDENCE_REVOKED now explains scope revocation, ineffective retries/shorter periods and required operator review.

Read-only local evidence: zero-byte revoked marker `5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7`, created 2026-11-11 17:49:05.9027108 UTC, matches the current v3 requested-period policy with historyStart 2021-10-25. Retained BA/NOC/PLTR/SPY guards were created immediately before it. Ledger records 1,135 calls and 301,651,984 I/O bytes for November. No marker, guard, lock or ledger was changed. Main configuration and dirty files were untouched; no private credential file was read.

High confidence: repeated runtime EVIDENCE_REVOKED 503s are caused by the durable scope gate, which blocks affected storage calls before their Convex transport even after restart. Calendar/catalog initialization occurs earlier in runtime setup, so this does not prove all initialization is network-free. Trigger confidence is limited: the zero-byte marker contains no ticker, originating error, prior window or observed data. The personal loader can raise EVIDENCE_CHANGED for received invalid/missing overlapping data or malformed responses with a previous asset; durable orchestration then revokes the entire policy/window scope. Request-range changes share this scope, so selecting 1W cannot recover it. The marker is not for an older policy. Existing deterministic expansion tests pass: an older-only gap preserves intact narrow evidence; an overlapping gap or changed price revokes. No concrete false-revocation defect was established; no loader, revision or safety guard was changed.

Verification: 49 Node demo/personal-loader/durable/admission tests passed; 3 focused installed-Edge browser tests passed, including serialized legacy hydration/reload, explicit 1Y reload, new route/editor/comparison defaults and revocation copy at 390/1440px. `pnpm check` passed (lint and both TypeScript projects). Credential-cleared fixture server used port 43127 and was stopped; localhost:5000 was left running. A live-page T3 snapshot timed out, so no successful live-page visual check is claimed. Worktree dependencies reuse the existing main node_modules via a junction; Turbopack rejects that layout, so fixture verification used Next's webpack dev server. Credential-cleared production build and `git diff --check` passed.

Next task: separately review evidence-backed recovery using the original pre-revocation diagnostics and source observations (not available in marker metadata). Determine whether data truly contradicts cached evidence and which ticker/window failed before authorizing any migration or recovery. Never reset markers/ledger, bump revision to escape, or serve revoked results. No deployment, DB mutation, live provider request, commit, push, PR or agents were used.

## Approved bear branding integration (2026-11-11, main exception)

Integrated the approved 27-frame bear turn into shared TikrLogo using a CSS sprite and no new dependency/client component. The 13.39-second cycle includes the turn, one-second right hold, return and ten-second final rest; reduced motion is static. Replaced the browser favicon (16/32/48/64 PNG-backed ICO) and touch icon with the static bear head; metadata uses a versioned favicon URL to avoid the old cached mark. Prior environment/generated-type edits and owner-approved unused-asset deletions are preserved. Preview artwork remains outside the app; only the 57 KB header sprite and static icon exports are shipped. Verification: pnpm check passed lint and both TypeScript projects; focused Prettier and git diff --check passed (existing line-ending warnings only). Asset inspection confirmed a 56,988-byte sprite, 10,578-byte touch PNG and 5,104-byte ICO. Removed the superseded 1.2 MB bear-aviator asset after confirming no source references remain. No new dependencies. No application browser or production-build verification was performed. Next: owner local review; no commit, push or deployment authorized.

## Local environment setup (2026-11-11)

Owner authorized main local environment setup and example documentation. Private T3 input populated the development Convex URL/admin key in ignored `.env.local`; enabled local personal-provisional mode with hosted origin unset. Existing Alpaca fallback credentials are retained. Saved gateway settings are inactive in local mode. Updated `.env.example` with placeholders and local/hosted guidance. No secret values are recorded. No deployment, live calls, commit or push performed. Next: restart dev server and verify connectivity; development target identity, admission review and live history remain unverified.

## Owner-approved history UX and requested periods (2026-11-10)

Implemented in the bound `feat-history-period-limitations` worktree from a clean status. Main was not touched. No agents, credentials, live provider requests, deployment/provisioning, commits, pushes, PRs, merges or ledger/guard cleanup were used. Historical publication/activation permissions below do not authorize them for this task.

New dashboard sessions, portfolios, examples and drafts default to 1W; comparisons inherit the active period/amount. Audited production 1Y occurrences: the dashboard and newPortfolio were defaults; the remaining preset/enum/sample-anchor occurrences are supported-range definitions. All saved ranges remain intact. Storage v1 cannot distinguish old explicit 1Y choices from implicit defaults, so no guessed migration is performed; existing Max-to-5Y migration remains.

Selected-period source loads replace unconditional five-year asset loads. Calendar coverage still establishes the supported ceiling, latest eligible session and clamped preset anchor. Personal provisional inputs explicitly assert window coverage without claiming lifetime inception. Confirmed later first availability blocks the whole requested portfolio/comparison period; it never shortens or omits holdings. Missing leading/interior bars remain missing data, not inferred inception. SPY, two completed sessions, shared dates, decimal/drifting-weight/split/ex-date receivable/payment-date reinvestment rules remain.

Durable cache reuse checks actual from/through, evidence revision, pending-tail boundaries and asset/chunk dependencies. Revised result policy prevents reuse of historical shortening behavior. Full windows serve narrow requests; partial windows require new scope work. Symbol locks still serialize concurrent requests/expansions; the write transaction records successful completion/from on its existing lease, avoiding a new unbudgeted source-head read. Optional per-scope attempt counts preserve total attempt counters and retain one explicit retry/cooldown after a failed expansion. Guards, abandoned-refresh refusal, revocations, shared storage/I/O/provider budgets and active hosted slots remain. Failure outside a previously cached narrow scope does not falsely revoke that intact scope; a received in-scope contradiction still revokes.

UI exposes each affected ticker with accessible destructive-red reason text: established short-history start/shorter-period suggestion, missing bars, unsupported corporate action, source failure/unknown cause, and operational limits. Both NDJSON and HTTP retry/error paths retain issues. The allocation editor now says ?Allocation is valid. History is checked separately.? BA/RTX synthetic cases demonstrate distinguishable missing-bar, unsupported-action and source paths, including exclusion of dated out-of-period events. No real BA/RTX failure cause was established; underlying reported cause remains unknown.

Verification completed: frozen-lockfile dependency install (no manifest/lockfile change); 153/153 full Node tests passed; 34/34 Vitest tests across 10 files passed; all five financial mutation probes killed. Full installed-Edge browser suite passed 38/38 on the credential-cleared loopback server. It covers 1W defaults/new portfolio/comparison and preserved saved 1Y, ticker-specific HTTP error copy/color/semantics at 390/1440px, existing keyboard/touch/focus/loading/stale/retry/reduced-motion/overflow behavior. Reviewed mobile/desktop screenshots under system temp `tikr-history-browser`; the test server is stopped. After the final overlap-correction hardening, all 16 focused personal-loader tests passed again. Final pnpm check passed lint and both TypeScript projects with no lint warnings/errors; credential-cleared SKIP_ENV_VALIDATION=1 pnpm build passed compilation, type/lint validation, static generation and traces. Changed TS/TSX Prettier and git diff --check passed. Only .env.example was present by filename; no private configuration was read. One mutation selector and several browser locators were updated for renamed tests/new default; earlier failed/interrupted runs are superseded by these completed results. The final diagnostics formatting pass changed whitespace only.

Next: owner review of the local implementation. Separately authorized real-provider evidence, public rights, deployed multihost behavior and sustained budget/platform measurements remain unresolved. No synthetic success authorizes activation, cleanup or deployment.

Owner follow-up (2026-11-10): after local completion, commit/push this dedicated branch and open a PR against main. Merge, deployment, live calls and credentials remain unauthorized. No reviewer agents requested.

## Owner-testing limiter removal (2026-11-10)

Implemented locally in the dedicated worktree: remove visitor/global browsing rates and visitor registry admission; retain four in-flight hosted resource slots and shared budgets. Catalog leases ignore historical attempt/cooldown lockout while retaining busy/token ownership checks and attempt records. Search failure waits for explicit Retry search. No persistent ledgers or guards reset; no main changes, credentials, live calls, deployment or publication.

Release checklist:
- [ ] Final broader-release task: reinstate appropriate server-side request limits and verify retry/error behavior, shared budgets and platform protections.
- [ ] Separately authorize and verify coordinated Next/Convex deployment, preserving existing state and compatible readers; local checks do not prove deployed behavior.
- [ ] Resolve public display/caching rights and separately authorize live verification/activation as applicable.

Verification: frozen-lockfile install completed without manifest/lockfile changes. Full Vitest suite passed (33 tests/10 files), including retries after two failed imports, one provider import for overlapping callers, old attempt-record compatibility, lease ownership, browsing beyond former rates/cardinality, and existing budgets/guards/revocations. Focused Node admission/durable/catalog suites passed (29 tests). `pnpm check` passed (lint plus app and Convex TypeScript); `pnpm build` passed. Four focused Edge Playwright tests passed, including error/retry states at 390px and 1440px and no new search request on typing after failure. Browser artifacts use system temp; the credential-cleared loopback verification server was stopped. `git diff --check` passed. No live/deployed verification is claimed.

Compatibility: retain the mounted limiter and legacy expiry callback for already-scheduled work, plus optional visitor/bucket arguments and historical state fields. New requests neither create visitor records nor call the limiter. Existing `TIKR_BROWSE_CONCURRENCY` remains a resource bound (default four; 1?16). For a separately authorized rollout, deploy compatible Convex control/acquire code before Next: old Next callers may still send visitor hashes, while new Next callers omit them. Do not reset budgets, attempts, leases or guards. Next task is owner review of the local diff; deployment and broader-release limiting remain pending.

## PR publication authorized (2026-11-10)

Owner authorized committing/pushing this bound feature branch and opening a PR to main after the market-history clarification. Scope is catalog import/search and diagnostics; price/action/history validation and production deployment remain separate. Reuse the recorded successful local checks and one live development catalog trial; do not issue another provider request or run another review agent. Keep private .env.local and secret-tool files out of Git. Main remains unchanged. Earlier no-publication/no-activation statements below record their historical checkpoints, not the current authorization/state.

Deployment note for eventual review: both the Next server and Convex hosted membership functions must use the updated shared shard decoder before hosted traffic writes packed catalogs. New readers accept old plain arrays, but old readers cannot decode the new packed shape. No deployment is part of this PR-publication authorization.

## One authorized live catalog trial (2026-11-10)

Owner supplied dev deployment `stoic-corgi-586`; a replacement deployment key was delivered through private secret-file entry after a key was pasted into chat. No key value was logged or committed. Privately loaded existing main-checkout Alpaca credentials for one request only. No production target, service provisioning, deploy, budget reconfiguration, counter/lease/guard reset or publication occurred.

Actual normally admitted request to the fixed paper /v2/assets endpoint: HTTP 200, 6,495,597 received bytes. Imported 13,181 eligible assets into 32 durable shards, one revision. Stored payloads decode with PLTR and SPY present. Old uncompressed serialized entries for these actual normalized assets require 1,327,123 bytes (largest shard 40,826 bytes), exceeding the old 900,000-byte atomic-write ceiling. New packed entries require 582,492 bytes. This proves a full-live-catalog write-size defect in the old code for the catalog fetched today; it does not establish which stage failed in the earlier production incident. Today's raw response fits the original 8 MiB response cap, so that cap is not the blocker for this payload.

The first immediate cold read failed CATALOG_UNAVAILABLE; later metadata inspection showed 32 valid, unexpired shards with one revision and later cold reads succeeded without another import. This is consistent with the remote write timestamp briefly leading the local clock, but the exact transient value was not captured. Local reads now allow at most five seconds of future clock skew; they still reject larger future timestamps and expire based on the original checkedAt. Synthetic tests prove +1s acceptance and +6s rejection. This tolerance does not change evidence/correction/revocation guards or extend the freshness window from read time.

All follow-up inspection/cached reads made zero provider requests; the inspection runner explicitly refuses provider access. Live catalog lookup finds PLTR for pala/palantir/palanti/PLTR. Broad p/pa queries can legitimately omit PLTR from the bounded top 20; exact PLTR ranks first. The actual UI on an isolated dev server used the real durable catalog (no intercepted response): Palantir returned one match; PLTR returned 14 matches with PLTR first. Selection assigned 100% and Save locally returned the portfolio list showing one asset PLTR. No price/history verification was performed; provider access was explicitly blocked and history remained unavailable.

Wrote private ignored worktree .env.local with the development storage URL/key and explicit personal activation, WITHOUT any Alpaca credential. Main checkout/configuration is unchanged. The owner's port-5000 process had been `next start` (production), which is incompatible with the intentionally development-only personal integration and was returning 500. Restarted this worktree's identified local process using pnpm dev on localhost:5000. Final actual endpoint checks: GET reports personal; POST Palantir returns 200/personal/one row/PLTR; POST PLTR returns 200/personal/14 rows/PLTR. The local server remains running for owner review. Imported catalog search now works; a future refresh will require separately configured provider access and must not silently fall back to demo. Historical data is still not enabled/verified.

Verification after the skew fix: focused catalog test passed, full Vitest suite 32 tests/10 files passed, pnpm check passed, production build passed. The manual actual-catalog browser flow passed using T3 preview actions; snapshot calls timed out twice, so DOM reads through preview_evaluate were used with grounded preview_act selectors. Test preview tab closed; isolated 43127 server stopped. The intended owner localhost:5000 dev server remains running. No further agents were used. Production deployment and production search remain unverified and unauthorized.

## Authorized bounded live-trial preparation (2026-11-10)

Owner authorized private local configuration and at most one normally admitted live Alpaca catalog import, followed by search/cache verification. Publication, deployment and production activation remain unauthorized. Presence-only inspection found existing legacy Alpaca credential names in the main checkout .env, but neither the worktree nor agent process has TIKR_CONVEX_URL / TIKR_CONVEX_ADMIN_KEY. Main .env.local declares a dev Convex deployment and a public provider URL; those do not supply the server admin credential. No credential value was printed or copied, and no market endpoint/provider request was made during this preparation.

Requested existing non-production storage URL/admin configuration through the private secret-entry tool; the request timed out without delivery. Consequently no live trial was attempted, no counters/leases/guards were changed, and no new live-provider evidence exists. Do not provision/deploy a storage backend or alter budget review to bypass this missing prerequisite. Next: supply the existing non-production TIKR_CONVEX_URL and TIKR_CONVEX_ADMIN_KEY privately, confirm target classification, then use normal admission for the single bounded trial. Existing Alpaca credentials may be loaded privately from the main environment file under this authorization; main source/configuration must remain unchanged.

## Local sample-versus-live diagnosis follow-up (2026-11-10)

Confirmed the running localhost:5000 worktree server reports sample mode using a new read-only `GET /api/assets` that does no storage/provider work. Environment inspection was limited to names/presence; no actual secret values were inspected. This checkout has only .env.example; the agent shell has no relevant market variables. That shell observation alone does not prove another process's environment; the server mode result and Terra browser reproduction establish the inspected server's sample source. Sample has no PLTR, explaining the local empty 200 symptom independently of earlier production 429/import failures. No live request/import was needed or performed.

Implemented explicit mode detection and response source headers, sample-scope empty feedback, configured-but-not-enabled failure instead of silent sample fallback, and malformed-200 response validation. Relevant market settings present without explicit activation now fail closed. No credentials or activation were added. Hosted-operation.md documents the actual source, required future personal settings and remaining storage/admission prerequisites; full live catalog fit and production cause remain unverified.

The additional owner-authorized read-only Codex gpt-6.1-terra / medium shared-checkout browser verifier completed: actual Palantir typing showed sample source/empty feedback; intercepted activation failure showed no sample substitution; synthetic PLTR could be selected (100%) and saved locally, then appeared in the portfolio list. Unavailable synthetic history showed no estimated returns. It closed its preview tab and changed no source. No additional agent/reviewer was run. Earlier Luna review remains complete.

Follow-up verification: full Vitest suite passed 32 tests in 10 files; the final focused route rerun passed both tests after adding source/mode cases. Five asset-catalog Node tests passed, including synthetic Palantir normalization and p/pa/pala/palantir/palanti/PLTR lookup. Six installed-Edge catalog tests passed against the credential-cleared final production build, including literal PLTR sample-empty and malformed-200 behavior. `pnpm check`, final production build, focused Prettier and Git whitespace checks passed. One intermediate check raced build-generated .next types; rerunning check after the completed build passed. One browser test initially expected old empty copy; neutral copy for an unknown response source was restored, then all six passed. The temporary 43127 server is stopped; the owner's existing 5000 server was not stopped or reconfigured. Browser artifacts remain in system temp. No additional upstream calls, credential access, activation, publication, deployment or worktree changes occurred.

Next: review the local diff and authorize/configure the intended data mode separately if live local search is desired. Existing local server currently has only sample results. Do not treat synthetic PLTR selection as live import/history verification. No additional review is pending.

## Full catalog import repair (2026-11-10)

Implemented locally in the bound `fix-alpaca-catalog-import` worktree from a clean status; main unchanged. Owner-reported production 503/cooldown does not establish cause. No credentials, live provider calls, deployment, provisioning, commits, pushes, PRs or cleanup were authorized/performed. The supplied evidence cannot distinguish provider HTTP/decode/validation/size/storage/admission failure. Local fixtures reproduce pre-filter validation rejection and uncompressed write-size rejection; these are plausible code defects, not a proven production diagnosis.

Explicit eligibility now precedes supported ticker/name validation; excluded instruments are not subject to supported-symbol syntax. Structurally malformed input and malformed eligible assets still fail. Names remain lossless up to 1,024 characters. Versioned bounded LZW tuple shards fit a 15,001-row long-name mixed metadata fixture within unchanged 50 KB shard / 900 KB atomic write ceilings. Old plain shard reads remain compatible. A near-30,000-row varied high-entropy fixture demonstrates that arbitrary metadata can still exceed the bounded write envelope: actual full-provider fit remains unverified. No truncated catalog is published. All 32 shards use one existing transaction; transaction tests demonstrate old revision preservation on invalid final document and storage-capacity refusal.

Raw response allowance is 16 MiB with eight existing hosted 2 MiB reservations or one local 16 MiB reservation. Shared budgets/counters, daily attempts/cooldowns, correction/revocation and abandoned guards remain intact. Increased per-import reservation consumes more existing quota; no quota increase/reset/refund. Fixed-stage catalog diagnostics expose only HTTP status, byte/row counts and allowlisted codes. Provider/stream, decode/validation, size, storage capacity and admission failures have safe distinct feedback; cooldown still reports its actual deadline. See hosted-operation.md for limits/cost reasoning and a concrete separately authorized one-import live procedure.

One user-authorized Codex gpt-6-luna / reasoningEffort max read-only shared-checkout review completed. No DeepSeek review was started. Fixed its stream-versus-size classification and storage-capacity classification findings locally; reconciled old ceilings and added the near-limit fixture. No second reviewer was used.

Final verification: 69 Node tests across asset-catalog, market-storage, durable-market, personal-loader, market-admission and market-cache passed with react-server/strip-types flags. Full `pnpm exec vitest run`: 31 tests in 10 files passed, including 32-shard atomic rejection. Five installed-Edge Playwright catalog tests against credential-cleared loopback production server passed, including new 390/1440px failure-copy checks, debounce/supersession/keyboard/equal weights, touch demo and six-holding/retry behavior. Screenshots/test artifacts are under system temp; server stopped. `pnpm check` and production build passed; build used SKIP_ENV_VALIDATION=1 without activation. Focused Prettier and Git whitespace checks passed. No live-provider compatibility, multihost/platform billing or production verification is claimed.

Next: owner review of this local diff. Any publication/deployment/credentials/live verification needs separate authorization. A live trial must use existing legitimate admission without resetting leases/counters/guards; stop after one bounded failed import and inspect safe stage evidence. Public display/caching rights and current team/platform headroom remain separately gated.

# Tikr delivery plan

## Asset catalog search (2026-11-10, feature worktree)

Implemented validated durable Alpaca catalog shards, bounded server-only refresh under existing leases/admission budgets, deterministic ticker/name ranking and 180 ms editor search with superseded-response rejection and native keyboard/touch result buttons. Browser-local parsing preserves valid ticker syntax; current catalog eligibility gates new historical-source work. Six holdings per portfolio, duplicate prevention, equal-weight precision, missing-history/action failures and correction/revocation guards remain. Three compared portfolios plus SPY may require nineteen distinct control symbols. Search shows provider names/tickers without inventing ETF classification. The unconfigured demo retains a clearly labeled sample picker; enabled real-data failure never silently falls back to sample search.

The authorized single independent read-only review used opencode/deepseek-v4.1-flash-free, high. It identified excessive repeated full-catalog reads, catalog availability blocking cached historical results, loss of demo editing, and recovery/validation/error-reporting gaps. Addressed with a 60-second coalesced read memo; catalog membership checks on begin-refresh while cached reads retain correction/revocation/expiry enforcement; a labeled credential-free sample path; two admitted attempts/cycle with sixty-second cooldown; twelve-second cold-reader joining via a single-shard probe; shard shape/shard-membership/duplicate validation; explicit route runtime/deadline; safe 429/503 codes and retry timing; resilient post-write release; server-side 400 for uncatalogued new requests with admission release; visible six-holding feedback and search retry. Tightened ticker separators. A real browser test exposed that Next can supply an empty POST body stream: the route now accepts empty streams and rejects nonempty bodies. Final fixes were verified locally; no second independent review is claimed.

Evidence: frozen-lockfile install; all 140 deterministic Node tests and all 30 local Vitest/Convex tests passed. After the final timestamp-validation/test-typing refinement, the affected catalog/hosted/route suites passed 10/10. All 33 installed-Edge browser tests passed on the credential-cleared loopback server, including search race/keyboard behavior, labeled demo touch selection, 429 timing/retry and six-holding limits. Existing desktop/mobile widths and reduced-motion cases pass. Five engine mutation probes were killed. Final lint plus application/Convex TypeScript checks passed; final credential-cleared `SKIP_ENV_VALIDATION=1 pnpm build` passed compilation, lint/types, page generation and traces with only `.env.example` present by filename. Browser artifacts remain under system temp/tikr-catalog-browser; the dev server was stopped.

Synthetic tests include 9,001 catalog assets, deterministic ranking, malformed/duplicate/oversized input and shards, missing/mixed revisions, size-cap rejection, preserved old shards after bad refresh, memo reuse, lease contention, a new catalog ticker reaching the real synthetic history pipeline, unknown ticker rejection, catalog-outage reuse of intact history, and guard/revocation behavior. The runtime integration uses real local convex-test storage/leases and injected provider JSON. Existing fixtures still prove missing leading/interior prices and missing/unsupported actions fail. No provider credentials, live requests, provisioning, deployment, commits/push/PR/merge, ledger/guard resets, or main-checkout changes were used.

Deliberate limits/next task: provider response/shard/write ceilings remain protective, not real-provider fit evidence. A catalog exceeding the existing 900 KB gateway-write bound fails closed. No live sizing, response compatibility, subtype completeness, exhaustive corporate-action history, public display/caching rights or sustained multihost cost is established. Keep shared budgets intact; memoization mitigates catalog I/O but does not guarantee anonymous search can never exhaust them. Two failed refresh attempts can leave new-source/search work unavailable until the next cycle; no hour-long recovery promise is made. The suggested exact-only search was not adopted because owner approval requires exact-first ranking. Cached history remains subject to existing evidence expiry, budgets and revocations. Owner authorized focused commit, push and PR to main in this feature chat on 2026-11-10. Next is PR review and separately authorized real-provider sizing/coverage/cost verification; merge and live activation remain unauthorized.

## PR #11 Convex module-name fix (2026-11-10)

Owner-reported Vercel build failure: Convex deployment rejected `market-limits.js` with `InvalidConfig` because module path components allow only alphanumeric characters, underscores and periods. Renamed the helper to `convex/market_limits.ts` and updated its sole application import in `convex/hosted.ts`. Inspected every Convex file introduced by this PR: `convex.config.ts` is valid configuration and excluded from function entry points; the new `market-admission.test.ts` is excluded by the installed bundler's multiple-dot rule, but was also renamed to `market_admission.test.ts` for consistent valid spelling. Existing `market-integration.test.ts` predates this PR and is likewise excluded. Test globs/configuration already match the renamed test; no generated files or runtime behavior changed.

Added `tests/convex-module-paths.test.mjs`: rejects the exact hyphenated regression and checks all repository Convex entry-point paths against the reported server restriction, using exclusions inspected in installed Convex 1.46.0 bundler source. Two naming tests, all 26 Vitest/Convex/hosted tests, `pnpm check` (lint plus application and Convex TypeScript), focused Prettier and `git diff --check` passed. This naming guard is an offline source check, not the deployment validator. Direct import of the installed CLI's internal bundler was unavailable because its published internal module import requires an absent `@babel/parser`; no dependency was installed to bypass this. No Convex deployment/codegen, credentials, live provider access, preview changes or agents were used. The prior Next production build did not validate server-side Convex module-path acceptance; only a subsequent remote build can confirm the reported deployment failure is resolved or reveal another one. Earlier financial/browser evidence remains unchanged; no rerun of those suites is claimed for these renames.

Next: push the authorized focused fix to existing PR [#11](https://github.com/Juan-Espino/tikr/pull/11), link it to this feature chat immediately, and report a single checks/reviews snapshot without waiting, watching or merging.

## Market admission implementation (2026-11-10)

PR preparation authorization (2026-11-10): owner explicitly authorized committing, pushing and opening a PR to main from this bound feature chat. Preview setup is deferred and unchanged. Reuse the completed local verification above/below with its recorded limits; no new agents, merge, deployment, credentials or live provider requests are authorized. Next: review the opened PR; no check watching or waiting is part of this task. The no-commit/no-push statement below records the preceding implementation checkpoint.

Implemented in the bound `C:/Users/JuanE/.t3/worktrees/tikr/feat-market-admission` checkout from a clean starting status. Main remains untouched. Owner-approved scope supersedes the old ten-per-128-IP-bucket / 100-global daily caps: short-term configurable token buckets default to 60 opens/minute per full visitor HMAC and 240 global admission attempts/minute, with four active request slots. The existing daily counters remain stored and are no longer enforced or reset. Visitor state is capped at 256 hashes and expires after ten minutes using scheduled/entry expiry; only ephemeral limiter state is removed. No raw IP persistence/logging or collision-prone bucket projection remains. Installed `@convex-dev/rate-limiter` 0.4.3 and mounted its component; generated application files were not edited. The typed component reference is local source pending separately authorized deployment/code generation.

Cached requests continue through shared Convex budget, calendar/dependency, guard and revocation checks. Missing/stale sources retain existing durable leases and cross-host coalescing. Manual source retries have server-enforced cooldowns and bounded daily attempts, with 60-second or next New York 09:00 deadlines (DST covered). Calculation-slot contention skips persistence rather than throttling fresh-source calculations. Safe errors now distinguish browsing rate limits, refresh cooldown, shared budget exhaustion, expired budget review and missing history. Gateway/pre-stream failures expose appropriate 429/503 and known `Retry-After`; later stream failures use safe NDJSON codes/deadlines. Dated stale results and their explanation remain visible. Trusted pre-network provider admission failures survive adapter sanitization and cannot falsely revoke a scope; the local SDK also preserves the safe budget-review error. No financial methodology changes.

Instrumented actual route/runtime/gateway functions against local convex-test, the actual limiter component and injected synthetic six-asset data (1,280 weekday sessions; no corporate actions; 5Y). Fresh: 13 provider requests, 63 gateway requests, 65 admission increments, 31,610,292 estimated admission I/O bytes. Cold-host cached reopen: zero provider requests, eight gateway requests, 11 admission increments, 569,618 estimated admission I/O bytes. Exact JSON byte counts, operation breakdown, reproduction command and limits are in [hosted-operation.md](hosted-operation.md). These are application counters/serialized bytes, not platform billing or live telemetry. Existing 100 MB / 500 MB / 250,000 caps are unchanged. Synthetic reservations imply fewer than 16 full six-asset refresh cycles in 500 MB before cached traffic; sustained monthly capacity is not accepted. HTTP action/component/expiry/OCC/Vercel costs still need actual platform measurements. No provider reservation refunds were inferred from synthetic payload sizes.

Local verification: 136 Node tests; 26 Vitest/convex-test/route/runtime tests; 30 installed-Edge browser tests against the credential-cleared production build; five backtest mutation checks; `pnpm check`; production build; focused Prettier and Git whitespace checks. All passed. The final full Node log is under system temp (`tikr-admission-node-final.txt`); browser output is under system temp (`tikr-admission-browser-final`). Browser verification covers the final UI; the later provider/SDK error-only fixes were verified by Node/Vitest and the final build. Browser tests cover distinct HTTP errors at 390/1440px, known retry timing, dated stale budget failure, existing loading/expiry/revalidation/reduced-motion behavior and 390/768/1440px overflow. Transaction tests cover overlapping admission/guards, >100 ordinary opens with historical counters preserved, independent full hashes, registry bounds/expiry, token refill/config validation, overlapping manual retries, atomic provider reservations and correction/revocation. Runtime tests perform more calculations than the sixteen result slots without additional provider calls. Provider/SDK negative tests prove zero provider access on admission refusal and no false correction revocation. Synthetic fixtures do not establish live provider completeness or cloud concurrency/billing.

Next: owner review in this feature chat. Any commit/PR/merge must originate here per the owner's preference so T3 can associate the worktree. Deployment, component binding verification, credentials/configuration, current team/platform measurement, data rights and live trials require separate authorization. No agents, commits, pushes, PRs, provisioning, deployment, actual credentials, live provider access, main changes or worktree cleanup occurred. Existing real ledgers, abandoned guards, leases and revocation markers were never read/reset/deleted to bypass gates. Temporary test servers are stopped after verification; test artifacts stay under system temp.

The favicon and Apple touch icon metadata now point to the owner-selected bear-aviator PNG. Next: verify the favicon in a browser when reviewing the app.

## Hosted review follow-up (2026-11-06)

Independent Sol Low review found no confirmed production-blocking defect, passed 133 Node tests and 12 Convex/route tests, and identified integration/concurrency test gaps. Added a full hosted runtime test using the real Convex gateway against convex-test with synthetic provider transport: cold module instances reuse durable calendar/results, the next freshness cycle refreshes both, and revocation during a held cached-result read rejects the in-flight request. A local-admission mock throws if hosted execution uses the filesystem ledger. Added simultaneous admission and refresh-guard races: at most four requests enter and one guard writer wins. All 14 Convex/route/runtime tests now pass; lint and both TypeScript projects pass. These additions exercise simulated concurrency and real application paths, not deployed cloud timing or live market data. No deployment, credential access or public activation. Next: owner review of hosted configuration/runbook, followed by separately authorized deployment and hosted verification.


## Hosted production preparation (2026-11-06)

Owner-approved release direction is open unauthenticated Vercel access with browser-local portfolio definitions; the Google restriction is superseded. Prepared in `C:/Users/JuanE/.t3/worktrees/tikr/t3-a65802e1` from `2269d0d15f2c462a90442403416b4dd3bc344e64`. No branch/worktree creation, commits, deployment, provisioning, credential handling or live provider requests were performed.

Implemented configured canonical hosted-origin validation and production runtime enablement behind explicit disabled-by-default flags. Hosted storage uses a private bearer HTTP gateway restricted to cache/control operations, never a deploy/admin key. Convex holds bounded atomic anonymous admission, concurrent request slots, provider reservations, durable refresh guards/revocations and shared calendar cache/leases. Existing asset leases, budget caps, mathematical engine, SPY/shared dates and provisional UI remain intact. Local filesystem admission remains only for the compatible local path; no existing ledger or guard was reset. See [hosted-operation.md](hosted-operation.md) for exact configuration, target classification, deployment sequence, disable/rollback and budget review.

Verified: 130 deterministic Node tests across the two recorded invocations; 12 local Convex/route tests, all five mutation probes, final lint and both TypeScript projects, focused formatting/whitespace, and credential-cleared production build passed. Tests prove production-origin anonymous route streaming, origin rejection and input bounds, shared admission/concurrency, persistent guard ownership/revocation, storage failure sanitization, HTTP authentication and operator-function rejection; existing transactional integration tests cover independent coordinators coalescing SPY. Initial browser run found a loopback oversized-body regression (403 versus 413); fixed and rebuilt. Final installed-Edge browser rerun against the credential-cleared production build passed all 28 tests; output is under system temp (`tikr-hosted-browser-final`). The temporary loopback server was stopped.

Remaining activation requirements: separately resolve public Alpaca display/caching rights and obtain deployment/live activation authorization; privately configure the matching gateway key, provider entitlements, canonical Vercel origin and exact Convex target; review actual team headroom and platform firewall/spend controls; then perform a bounded deployed two-instance/live trial. Offline tests do not establish those results. The 100 daily global opens, 10 per hash bucket and four concurrent request slots are conservative implementation defaults, not owner-approved product quotas. Platform HTTP/action/Vercel costs remain outside the existing database admission estimate. No paid fallback or budget increase was added.
## PR preparation (2026-11-05)

Final combined revision passed 130 Node tests, 7 local Convex tests, all five backtest mutation probes, lint and both TypeScript projects, a production build, and 28 installed-Edge browser tests. The build and browser test server had personal market requests disabled. A focused independent Sol Low review found no blocking defect and passed 35 focused tests; it did not independently rerun the full suite. Live local SPY verification is recorded below; NVDA's failure, public/shared licensing and sustained team budget remain unresolved. The owner requested PR creation; no production activation is implied.

## Input error and timeframe follow-up (2026-11-05)

Portfolio name conflicts now use the existing destructive token for an invalid border/ring and error text, following shadcn's accessible invalid-field pattern. Max is removed from both timeframe pickers; legacy saved Max portfolio/draft values migrate to 5Y. Existing simulation and server contracts retain Max for compatibility. Three focused Node tests, two Edge browser tests, lint and both TypeScript checks passed. Next: owner review in the local feature worktree.

## Portfolio naming and card identity (2026-11-05)

Inspected the owner's dashboard state: two separate saved portfolios shared the name New portfolio, one NVDA and one SPY; SPY already had results while the NVDA card was blocked. The annotation did not establish a stale-response defect. Cards now show holding tickers; a browser regression confirms that saving an NVDA-to-SPY edit refreshes the correct card and removes the NVDA error.

Saved names are unique ignoring case and surrounding whitespace, checked both in the editor and save operation. Conflicts show an inline suggestion without changing user input; self-renames remain valid. Duplicate creates an unsaved draft with the original name, requiring an explicit unique name before saving. Existing duplicates are preserved and require correction when edited. Eight name/demo Node tests, two focused Edge browser tests and lint/app/Convex TypeScript checks passed. No main checkout changes, credentials changes, deployment, commit or push for this follow-up. Next: owner review of the updated cards and naming flow; the separate NVDA data failure still needs investigation.


## Live personal configuration (2026-11-05)

Configured the existing development deployment and synced backend functions with Convex typechecking enabled. Private ignored worktree configuration uses existing local Alpaca credentials and a development-only deploy key; its Windows ACL permits the owner and SYSTEM. Main configuration was not changed. Personal provisional mode is enabled on the loopback dev server, port 43127.

Live calendar, raw SIP bars and corporate-action requests succeeded. The first full-history request exposed a process-date/ex-date boundary bug: SPY returned a valid dividend with entitlement before the investment window but payment inside it. The personal loader now validates supported actions before filtering by ex/effective date; unsupported terms still fail. Policy revision v2 identifies this changed normalization; no admission ledger, lock, guard or revocation marker was deleted or reset. Ten loader regressions pass, including the boundary and malformed-action revocation cases; lint and both TypeScript projects pass.

A live one-month SPY portfolio reached ready with 23 points per portfolio/benchmark, October 5 through November 4. Subsequent opens returned ready cached data. Installed Edge at 1440px and 390px rendered matching backend ending values, a 23-day accessible table and provisional disclosure without horizontal overflow. Convex inspection found 62 monthly price records, one asset head and two result records. Reported development usage after the checks was 40 function calls and about 0.000169 GB database I/O; reporting may lag and does not establish monthly fit.

The operator reports Tikr is the only team project in use. Other-project usage was configured as zero on that basis, with a 24-hour review expiry; team-wide plan/storage totals were not independently established. Reassess that configuration before expiry to maintain availability. Credentials, market payloads and the deploy key remain outside tracked files. No production deployment, commit or push. Next: owner review of the live local app, then integration review; sustained budget fit and public access remain separate.

## Personal provisional implementation (2026-11-05)

Implemented in `C:\Users\JuanE\.t3\worktrees\tikr\t3-7a02e9bc`: explicit server-only personal provisional mode bypasses the manual evidence bundle, obtains bounded exchange calendar/raw SIP bars/actions, and uses the existing durable storage/cache and decimal engine. Results carry a provisional quality marker visible in workspace and compact dashboard. Reviewed replay remains available. Provider requests reserve durable local budget before transport; missing history and unsupported/ambiguous actions fail, including revocation when received data contradicts an old scope. No engine methodology or Convex function/schema changes.

Verification: all 125 Node tests, eight focused personal-loader regressions included, passed. Seven local Convex tests, all five mutation checks, lint/typecheck and 25 browser tests passed. Browser checks used an allowlisted credential-cleared loopback server and synthetic fixtures; output is under system temp (`tikr-personal-browser`). The final production build passed in an allowlisted credential-cleared environment with SKIP_ENV_VALIDATION=1. Focused Prettier and Git whitespace checks passed. The temporary dev server was stopped. Restored frozen-lockfile dependencies with no manifest/lock changes. An initial browser/build attempt collided in the shared Next output directory and failed; sequential verification supersedes that attempt.

Next task: separately authorize private configuration, verify Convex team headroom/configuration and deployment prerequisites, then run a bounded live Alpaca trial for endpoint/account compatibility and corrections. No credentials were accessed, authenticated requests made, services provisioned, deployment performed, commit created or push made. Public/shared licensing and real account ownership/authentication remain separate. The saved historical evidence captures remain unaccepted as independently verified data; the owner decision authorizes labeled provisional use, not rewritten historical findings.

Owner decision (2026-11-05): personal local Alpaca results may use provisional live data without manual evidence approval. Label results clearly as subject to corrections; this does not establish provider finality or exhaustive action completeness. Raw SIP closes, the next-day 09:00 New York cutoff, payment-date reinvestment, decimal arithmetic, shared periods and missing/unsupported-action failures remain required. Public/shared licensing, credentials/configuration, live requests and deployment require separate authorization. Earlier manual-review requirements below remain applicable to reviewed replay and historical evidence acceptance; they no longer gate this personal provisional mode.

## Alpaca evidence request draft (2026-11-05)

Prepared `alpaca-evidence-request.md` with specific close, correction, action-coverage and unit questions. Massive is a documented trade-rule comparison lead, not a verified equivalent or approved data source; entitlement and permitted validation use remain unknown. No inquiry sent, account created, paid access, credentials or live requests. Next: owner review and authorization before sending the draft; resolve source equivalence and rights before accepting captures.

## Alpaca evidence assessment (2026-11-05)

Reviewed current Alpaca primary documentation against the six-case findings. Engine acceptance remains no-go: independent matching SIP-close semantics, historical correction detection, and exhaustive action coverage/units are unproven. The documented action event stream is a lead, not established completeness evidence. Acceptance criteria and exact provider questions are in `alpaca-real-data-review.md`. No new capture, private replay, credentials, activation or deployment. Next: obtain authoritative answers and a permitted matching reference before issuing proofs or replaying into the engine; provider contact needs separate authorization.

## T3 handoff verification (2026-11-04 Pacific / 2026-11-05 UTC)

PR [#6](https://github.com/Juan-Espino/tikr/pull/6) is merged at `d776f9c96c957acb4a6030b762106d7f6b2b5508` (2026-11-05 00:32:24 UTC). The GitHub CLI independently confirmed both Vercel and Vercel Preview Comments checks succeeded on head `da7706094adcf9ec9467eaf7b32e49535d7e76de`; the connected GitHub API returned 404 and was not used as evidence. The app checkout at `C:\Users\JuanE\Code\React Projects\tikr` was already clean at this merge when inspected. Its origin is `https://github.com/Juan-Espino/tikr.git`; a fresh fetch confirmed main and origin/main have zero commits of divergence. No fast-forward was necessary.

Validation runs in the existing T3 task worktree at the same merge, with dependencies restored using `pnpm.cmd install --frozen-lockfile` (10.11.0; manifest/lock unchanged). Child processes use an allowlisted, credential-cleared environment with `SKIP_ENV_VALIDATION=1`; only `.env.example` is present by filename. Fresh results: 117/117 Node tests (`--conditions=react-server --experimental-strip-types --test tests/*.test.mjs`), 7/7 local Convex tests, all five mutation probes, and all three components of `pnpm check` (Next lint, app TypeScript, Convex TypeScript) passed. A fresh production build passed on the merged final UI. These checks do not accept real-provider evidence or prove deployed Convex behavior. Private opt-in scripts were inspected separately; live capture was not run.

The installed-Edge Playwright suite also passed 24/24 tests against a credential-cleared loopback server on port 43127, including responsive overflow, evidence expiry, final-only snapshots, dashboard bounded waits, comparison exits, reduced motion and marked-synthetic versus live revalidation behavior. Browser outputs are under system temp (`tikr-handoff-browser-results`); these synthetic fixtures do not validate Alpaca. The test server was stopped after verification.

Next task: assess matching raw SIP close semantics, finality/corrections and exhaustive corporate-action completeness/units against the saved capture evidence in `alpaca-real-data-review.md`. Keep all six captures unaccepted until independently supported; never manufacture verified flags. Actual Convex team headroom and separately authorized deployment/configuration and bounded live trial remain later activation gates. Public/shared data rights, real Google authentication and portfolio ownership remain separate. Historical research documents must be reconciled individually if supplied; no historical worktree content was copied over merged documents.

This checkpoint supersedes older statements below that PR #6 changes are uncommitted or isolated from main. Older validation records remain historical. Application main and its local environment were preserved; no commit, push, deployment, live-data activation or worktree cleanup was performed.

Current local integration status (2026-11-04): an expiring evidence-gated replay loader, internal Convex storage/leases and budget admission, and real-result UI states are implemented in the isolated feature worktree. Production/public access is disabled; actual provider evidence, Convex deployment/team usage acceptance and live activation remain incomplete. No demo series are substituted in portfolio results. Guest definitions remain browser-local and sign-in remains a preview. See `market-data-integration.md`; earlier unimplemented summaries below are historical baseline statements.

## On-demand refresh section (implementation)

Owner-approved policy is recorded in product/methodology docs. Implemented a server-only single-process coordinator in `src/lib/market-cache.ts`: shared asset refreshes including SPY, 09:00 New York freshness cycles, stale verified snapshots, bounded retries, revision-based invalidation and fail-closed calculations. Twenty-two new synthetic regressions pass, including review fixes for calendar/effective-end dependencies, cold/mixed pending newest-session coverage, and global invalidation before calendar-outage fallbacks. Source is isolated in the current feature worktree; no main checkout, live calls, credentials, scheduler, UI, deployment or dependency changes. `tsconfig.json` enables explicit TypeScript imports under noEmit for native source tests. See `on-demand-cache.md`. Verification completed: all 86 offline tests pass, the five existing engine mutations were killed, lint/typecheck and the credential-cleared production build pass, and focused formatting/Git whitespace checks pass. Independent review accepted the revised single-process core after 22/22 cache tests and its own adversarial calendar-outage reproduction; four frozen source/test/config/doc hashes matched at both ends. Documentation completion notes were added after that review. No merge, commit, push or live-data acceptance is claimed. Durable/distributed storage, an evidence-validating real-data loader and UI wiring remain integration work; provider completeness is still unverified.

## Owner decisions after live review

Approved Alpaca raw SIP daily close for holdings and SPY, completed-session endpoints, and eligibility no earlier than 09:00 America/New_York on the following calendar day after required checks. Recheck the previous five trading sessions during each daily refresh; invalidate/recalculate affected cached results when prices/actions change, preserve revisions and display as-of dates. Defer an unverified newest endpoint without concealing interior gaps. Recorded in `product.md` and `backtest-methodology.md`. This is an operational policy, not a provider finality guarantee or implemented cache/refresh process. Broader reconciliation of older corrections remains open. Next: resolve corporate-action completeness/reconciliation and independent matching-close semantics, then validate the readiness/correction implementation. Documentation only; main checkout and implementation remain unchanged.

## Six-case Alpaca evidence review (2026-11-03 local)

All six prepared cases were captured and assessed using 12 total data-only requests, 53 daily bars and two expected actions. Saved snapshots passed offline replay/integrity checks. Independent numerical comparisons agree for all 53 closes at the documented source precision; issuer, exchange, inception and DST evidence was checked. Full methodology acceptance remains blocked by matching close/feed semantics, a completed-bar/correction policy and exhaustive corporate-action coverage. No live engine calculation, integration or methodology change. See `alpaca-real-data-review.md` for the completed investigation, source evidence and exact remaining work. This supersedes the earlier single-sample checkpoint below. Next: establish and review the provider evidence policy, then replay the saved samples without inventing verified proofs.

## First authorized Alpaca sample (2026-11-03 local)

The owner-approved `nvda-split` SIP capture used 2 data-only requests (1,061 response bytes), returning three NVDA bars, three SPY bars and the expected 10-for-1 split effective 2024-06-10. Numeric fidelity, proposed session coverage and event/scope checks passed; saved snapshot integrity, offline replay and protected local output ACL were verified. Overall result remains unresolved: independent prices and finality/calendar/action/inception/access evidence are pending, and the engine was not run. See `alpaca-validation.md`. Next: review the existing capture against independent references and establish the remaining evidence, without treating successful traversal as completeness. Main checkout and credential files were unchanged.

## Private Alpaca validation harness (2026-11-03)

Implementation is isolated on `feat/alpaca-real-data-validation` from main `a55bbcc`. New private CLI supports bounded raw-response capture, credential-free digest-checked replay, per-case observations/evidence reporting, numeric-token fidelity checks and an exact BigInt closed-form oracle. Six seeded cases cover SPY distributions, NVIDIA's split, Reddit inception, NYSE holiday/half-day/DST boundaries. Case facts and calendars require a dated review bound to the exact snapshot before engine execution.

Local verification passed 64 tests (25 new harness/oracle checks), all five engine mutation probes, lint/typecheck, focused formatting/whitespace and a credential-free production build. Independent revised review accepted the bounded offline harness after full source coverage and 25/25 independent synthetic checks, including effective Windows directory/file ACL inspection. Local outputs use protected owner/SYSTEM-only ACLs under LocalAppData; capture requires an owner no-sync acknowledgment. The credential-free tests use synthetic responses. Live account validation remains pending: the process has no supplied Alpaca credentials and automatic approval review rejected reading the protected app environment files. No authenticated call has run in this task. Reference assertions, action completeness, bar finality, provider corrections and public/shared rights remain open; repeated observations cannot establish a universal guarantee. Run results and independent review will be recorded in `alpaca-validation.md`.

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


## Personal data integration checkpoint (2026-11-04)

Local implementation exists in the isolated `feat/alpaca-real-data-validation` worktree, after commit `bf84f26`. This new batch remains uncommitted; no PR, push, merge, provisioning or deployment was performed. The main app checkout remains clean at `a55bbcc` and the engine source is unchanged.

- Implemented expiring, revision-bound, raw-SIP analyst-evidence replay loader; unknown finality/actions/inception/units still fail closed. Its optional live-fetch interface is not enabled by the runtime. Replayed all six existing private captures with global network disabled: integrity passed, 53 bars total, evidence/engine acceptance remains unresolved. No credentials or new authenticated provider requests were used.
- Implemented internal Convex storage, monthly price/action chunks with compact manifests, compressed result slots, dependency/lease comparisons and atomic attempts. Persistent local admission budgets count pre-network reservations, including failed/unknown calls. Write-ahead refresh guards and independent revocation markers stop known corrections from escaping after errors, lock contention, in-flight reads or restart. Active guards provide bounded loading/coalescing; abandoned guards block rather than serving old data.
- Connected existing dashboard/detail UI to the typed local-only stream. Loading, ready, refreshing with dated results, stale, blocked, retry, evidence expiry and shared portfolio/SPY periods are exercised. Metrics, exact tooltips, asset returns and table use engine values; no synthetic series are substituted. Guest portfolio storage and sign-in preview remain honestly labeled. Production market access is disabled.
- Reproducible sizing now uses actual engine-result payloads and Convex serialized document sizes. Six assets / 1,300 sessions / one user / ten opens daily / 31 days / 30% cache misses: representative ~17.5 MB storage and ~322 MB monthly I/O; stress ~12.6 MB and ~358 MB. Local action compute is in Next.js, with zero Convex actions. These are forecasts, not deployed billing measurements. Initial 250 MB monthly I/O proposal was raised to 500 MB, half the free allowance; storage cap stays100 MB and calls250,000. Five- and twenty-user models fail the budget check. Actual team usage, account plan, other deployments and post-activation measurements remain unverified prerequisites.

Verification after final source changes: 117/117 Node tests passed;7/7 official convex-test edge-runtime tests passed;14/14 installed-Edge browser tests passed (independently rerun); five engine mutants killed; `pnpm check`, focused Prettier and `git diff --check` passed. Credential-cleared production build passed with validation skipped and only `.env.example` present by filename. The test server was stopped afterward. Screenshots reviewed at mobile/desktop with overflow checks at390/768/1440px. A temporary Python stdout encoding error hid an earlier suite summary; the complete suite was rerun with safe output and reported117/117, exit0.

Independent review reached bounded acceptance after correction/expiry/admission/coalescing and UI retry/card fixes. Complete source/diff coverage was accumulated across bounded passes, with final reviewed source hashes matching at start/end. The final integration follow-up independently passed17 durable tests and14 browser tests. The three additional SDK transport/sanitization tests were run by the coordinator afterward without changing reviewed production source. No universal numerical-error, provider-completeness or billing certification is claimed.

Next task is activation evidence, not another UI implementation: assess and document eligible-close semantics and exhaustive action/revision reconstruction, produce reviewed private artifacts without inventing verified flags, inspect the actual Convex Free TEAM usage/headroom, then separately authorize deployment/configuration and a bounded real end-to-end trial. Do not deploy, enable public/shared market access, use paid fallback or loosen methodology just to remove a blocked state. See `market-data-integration.md` for configuration and limits.


## UI review follow-up (2026-11-04)

Implemented the owner-requested dashboard chart sizing and axes, concise card status, accessible daily table, comparison placement, and stable chart while changing timeframes or comparisons. Browser review uses synthetic data; live provider verification and production readiness remain separate. Follow with owner review and independent validation before any commit or merge.


Owner follow-up: coordinated dashboard loading, targeted pulses, and portfolio comparison color/exit animation are implemented for synthetic review. Verify behavior and retain the live-data evidence gates before merge.


UI follow-up: final-only snapshot swaps and comparison exit timing implemented. The review proxy explicitly marks synthetic responses for an eight-entry, 30-second in-memory cache; unmarked data is never served from this client cache. Live provider correctness and server-side cache validity remain separate gates.


Owner authorized commit, push and PR preparation on 2026-11-04 after UI review. Next: review the combined PR and CI; merge/main-checkout update requires the owner's next instruction. The synthetic-only browser cache does not bypass live server revocation checks.


PR #6 preview follow-up: reproduced six TS5097 errors from the separate Convex TypeScript project. Enabled explicit TypeScript import extensions in its existing no-emit/bundler configuration and added the Convex project check to pnpm check. The reported temporary-filesystem warning was not the build failure.

## Focused six-asset reliability (2026-11-05)

Independent Sol Low review inspected the three-file diff and passed 70 focused synthetic tests. It found no confirmed calculation defect, but qualified live retry reliability, provider ex-date semantics and incomplete negative-case coverage. Its one concrete finding was accidental encoding changes in three historical passages; those passages were restored byte-for-text from the base revision. The review did not independently verify live results, account telemetry, browser tests or the production build.

Implementation worktree: `C:\Users\JuanE\.t3\worktrees\tikr\t3-1a020605`, clean base `e46f2cf`. Main and the old worktree were not edited. Owner authorized private configuration transfer and bounded personal live diagnostics; the copied ignored file has an explicit current-user Windows ACL. No deployment, provision, commit, push, PR, budget increase or ledger/guard reset was performed.

Live diagnosis started with NVDA. Calendar and raw SIP bars succeeded (1,263 closes over the bounded source window), then provisional conversion failed with `UNSUPPORTED_ACTION`: the adapter rejected any split due-bill date, including NVDA's redemption on its split ex-date. AMZN also reports later due-bill settlement. Ordinary splits now retain the reported ratio at ex-date when redemption is on/after ex-date; invalid/earlier dates and symbol changes fail. Same-day ambiguous split/dividend cases still fail. The engine and its decimal/payment-date rules were not modified. API field definitions: https://docs.alpaca.markets/us/reference/corporateactions-1 . Settlement metadata does not shift the raw ex-date split price/share transformation.

MSFT and AMZN had another observed failure, `MALFORMED` during action decoding: cash-merger records use acquiree/acquirer symbols instead of `symbol`. The adapter validates and excludes an acquirer-only cash-consideration record because it does not transform the held acquirer shares. An included acquiree is normalized using its effective date and remains an explicit unsupported action. Unrelated/unknown/malformed shapes are not accepted. Regression fixtures use synthetic prices and independent arithmetic: one share at 100 becomes ten shares, a payment-close dividend contributes ten dollars, and ending value at 12 is exactly 130. Negative fixtures cover acquiree events, invalid dates, earlier due bills and symbol changes.

Live local API: SPY, NVDA, MSFT, AAPL, AMZN and SCHD each returned ready for 1Y with 252 shared points ending 2026-11-04. SPY self-comparison matched. Equal 20% NVDA/MSFT/AAPL/AMZN/SCHD plus separate SPY returned ready for 1W (6 points), 1M (23), YTD (212), 1Y (252) and 5Y (1,255), with identical portfolio/benchmark boundaries. Reopening the 5Y calculation returned identical output. The live browser displayed that mixed 5Y result, the provisional/correction disclosure and as-of date, and retained the result after reload without horizontal overflow. One early automatic NVDA attempt and one explicit mixed 5Y retry returned REFRESH_FAILED; bounded explicit retry/normal cached reopen subsequently succeeded. No marker was cleared to obtain success. This is not proof of flawless retry behavior, provider finality or exhaustive action history.

Budget evidence: preserved local November ledger began at 409 calls / 82,879,016 reserved bytes and reached 864 calls / 207,104,598 bytes after diagnostics and browser reload. Those counters include provider reservations and Convex traffic, with successful storage reservation refunds; they are not provider-only counts or billing telemetry. Every live provider call used the existing 2 MiB admission reservation, zero automatic retries, eight-page/8 MiB/1,300-bar/1,000-action caps. The configured admission review was accepting the trial. No sustained monthly fit is claimed.

Owner-supplied team screenshot reports 380/1M function calls, 522.71 KB/512 MB database storage, 5.23 MB/1 GB database I/O, 0/20 GB-hours action compute and 5/40 deployments; other shown storage/egress/search totals are zero. The screenshot has no plan name or billing-period header. The owner reports these as current November team figures and says Tikr is the only project. They are owner-supplied evidence, not independently authenticated telemetry or named-plan confirmation. The browser dashboard redirected to sign-in, so independent team usage remains unverified.

Owner subsequently authorized extending the development review through November without increasing caps. After reading the deployment guard, private configuration independently matched `dev:stoic-corgi-586` and its HTTPS storage endpoint; the dev target was announced before mutation. `market:configure` succeeded with `otherStorage=1000000`, `otherIo=6000000`, `otherCalls=400`, and `reviewedThrough=1796083199999` (`2026-11-30T23:59:59.999Z`). These rounded reservations conservatively count all supplied team usage as other usage, including Tikr. Together with the existing app caps, 101 MB storage, 506 MB I/O and 250,400 calls remain below the existing 75% admission thresholds. The existing configure handler patches review fields while preserving existing counters; no reset or cap increase occurred. The single configuration mutation retained a 32,768-byte local reservation, leaving the observed ledger at 865 calls / 207,137,366 bytes. No additional Alpaca requests were made after final live verification. Usage must be reassessed before December or material workload changes; named-plan/billing-period confirmation and sustained monthly capacity remain limits.

Final verification:
- `node --conditions=react-server --experimental-strip-types --test tests/*.test.mjs`: 133/133 passed, including the final negative fixture. Output retained under system temp as `tikr-six-asset-node.txt`.
- `pnpm exec vitest run`: 7/7 local Convex transaction tests passed.
- `pnpm check`: lint, application TypeScript and Convex TypeScript passed. `node tests/backtest-mutations.mjs`: all five targeted mutants killed.
- `pnpm exec playwright test`: 28/28 installed-Edge tests passed against the credential-cleared loopback server, covering visible errors, expiry, retry, comparison periods, loading, mobile widths and provisional disclosure. Artifacts are under system temp `tikr-six-asset-browser`. This is synthetic UI evidence, separate from the live browser result/reload described above.
- Focused Prettier on the adapter and personal-loader tests passed; `git diff --check` passed.
- Sequential credential-cleared `SKIP_ENV_VALIDATION=1 pnpm build`: passed compilation, lint/type validity, static generation and build traces. The interrupted build's exit status was not available, so a fresh nonconcurrent build supplied the final evidence. The dev server was stopped before building. Private configuration was excluded from Next's recognized filenames throughout synthetic browser/build checks, then restored to ignored `.env.local` with its private ACL retained.

Only `src/lib/alpaca/adapter.ts`, `tests/personal-loader.test.mjs` and this plan changed. No new agents/worktrees, commits, pushes, PRs, deployments, service provisioning, paid fallback, or deletion/reset of ledgers/locks/guards/revocations occurred. Remaining limits: transient REFRESH_FAILED behavior was observed and not independently root-caused; subsequent retries and cached opens succeeded. Provider finality/action completeness, older corrections and sustained monthly fit are not established. Next: review this focused diff and independently investigate transient retry behavior if it recurs; reassess actual team usage before the review expires.


## Hosted 503 diagnostics (2026-11-06)

Implementation worktree: `C:\Users\JuanE\.t3\worktrees\tikr\t3-ae95b9ed`, fast-forwarded from `2269d0d` to origin/main PR9 merge `82a67178f2b5f0b6e687caeb0a65639adc59218b` before edits. Main and its unrelated dirty `.env.example` were not touched. Added server-only exact-allowlist diagnostics for origin/admission/config/calendar/runtime/stream failures, including settled blocked results and release failures. Raw exceptions and request/provider data are never serialized. Client responses remain generic and guards/quotas remain enforced.

Evidence: canonical-only credential lookup rejected legacy APCA configuration before calendar/provider fetch. Canonical-first per-field fallback now supports the legacy names; empty canonical values still fail closed. Missing trusted visitor header and malformed gateway config independently reproduce zero-fetch failures. No demonstrated header defect justified replacing the trusted Vercel header or relaxing checks. Current production root cause after the reported credential correction remains unknown. Updated feature `.env.example` to blank/commented server-only configuration and documented fallback/diagnostic/deploy interpretation.

Verification: frozen-lockfile dependency install; six focused synthetic Vitest tests across hosted diagnostics, route and full runtime passed; `pnpm check` passed lint and both TypeScript projects after narrowing the helper environment type. Tests use injected transport and synthetic credentials, including complete hosted calendar/cache/results, missing credentials/no fetch, missing visitor/no fetch, malformed config/no fetch and log sanitization. No live provider requests, secrets access, deployment, commit, push, PR, extra agents or worktrees. No production build or deployed header/config/entitlement verification claimed. Next: review this patch, deploy Vercel only with authorization, inspect fixed stage/code logs and verify canonical environment scopes, matching gateway activation and existing admission review without resetting counters/guards. Public rights and live activation remain separately gated.

## 2026-11-12 Alpaca/Convex redesign - local implementation complete

Dedicated worktree base contains merged PR #16 (`1354187`); parent main remains
clean at that merge. No implementation checkout/model switch, commit, push, PR,
merge, credentials/live requests, deployment, paid changes or deployed cleanup.

Implemented authoritative asset-root manifests with IndexedDB/browser and bounded
process monthly history, server validation of every operation, request/provider
batching, independent completion streaming, wider coverage reuse and missing-prefix
plus five-session corrections. Browser definitions/drafts remain local. Legacy
revocations, fences, receipts, attempts, counters and durable namespaces remain
authoritative. No production schema change or record deletion/reset occurred.

Removed new durable history/result/calendar writes, unused browser Convex
connectivity, template task/quote implementations and obsolete capacity equations.
Accounting separates observed received provider bodies and synthetic actual
DB API operations from conservative admission controls. Only newly recorded
completed-body reservations settle; historical charges remain intact.

Verification consolidated without replaying unchanged successful suites:

- Node: 187/187; five financial fault mutations killed.
- Vitest: 43/43 across 13 files, including actual local database-operation matrix,
  hosted integration, exact-token settlement and independently streamed batches.
  The six-asset harness timeout was extended from15 to30 seconds for concurrent
  synthetic test load; no application/resource limit was raised.
- Existing Edge regression: 40/41, then corrected input-limit case passed; final
  selected three naming/legacy cases passed after the submit-time name fix.
- Required Terra Medium independent actual browser: 16/16 (seven interaction,
  nine security/cache), all six screenshots inspected, fresh isolated Edge
  fallback after the documented preview/CUA failures. See
  `market-browser-acceptance.md` for exact fallback evidence and simulation limits.
- Final axis finding fixed locally; 15 labels remain inside SVG bounds at
  390/768/1440px, no overflow; screenshots inspected.
- Final `pnpm.cmd check`: lint and both TypeScript projects pass. Final
  credential-cleared production build passes. All41 changed code/script files
  pass focused Prettier. Repository-wide format check still reports existing
  warnings in 54 untouched/generated files; these were not reformatted.
- `git diff --check`, document references/final-newline inspection and final
  status/base checks pass in final delivery reconciliation.

Architecture: `market-redesign-checkpoint.md`; measurements/uncertainty:
`market-accounting.md`; exhaustive source/resource inventory:
`market-source-inventory.md`; exact approval-gated cleanup/backup/rollback:
`market-deployed-cleanup.md`. Existing local allowance remains nearly exhausted
and is not equated with Convex dashboard billing. No historical units refunded,
ceiling raised, guard removed or policy changed to bypass admission.

PR readiness: locally implemented and reviewable as a separate uncommitted change
from PR16. No automatic publication or merge. Next external task, only if the
owner separately authorizes it: named-target read-only deployment preflight,
backup/rehearsal and compatible rollout proposal. Public rights, actual billed
capacity and a bounded live allowance remain unresolved operational gates.

## 2026-11-12 hosted interrupted-refresh recovery

Implemented in the existing uncommitted compatibility worktree: lease-bound hosted
observations, expired-observation Retry discovery, dual-token publication fencing,
and atomic validated head publication/exact guard settlement. Legacy token-only
records remain unreadable until the operator-only current-v5 CAS conversion and a
successful normal refresh. No policy bump or broader lineage exception. All old
revocations, guards, admission/attempt counters and unrelated records are retained.

Synthetic retained-state hosted runtime now proves AMZN blocks before conversion
and becomes ready after approved-fixture conversion plus a restarted-host Retry.
Transaction tests exercise expiry, concurrent reclaim, stale finish/write, invalid
head rollback and crash-after-commit settlement; existing action/correction suites
remain in scope. Next task is owner-approved rollout/preflight and exact retained
record reconciliation per `market-deployed-cleanup.md`, subject to unchanged exhausted
live allowance and independent provider authorization. No production access,
credential access, deploy, commit, push or PR was performed. `market-policy.md` is
absent in this checkout; policy source is `src/lib/market-policy.ts`.

Final source verification (synthetic, no live requests): Vitest 15 files / 49 tests
passed; Node demo/backtest/evidence/durable/admission/cache suites 93/93 passed;
all five financial mutation probes killed. `pnpm check` passed lint and both TS
projects. Final changed-file formatting and `git diff --check` passed. A system-temp
source mirror with an allowlisted child environment, no env files, and a synthetic
public Convex URL is used for final lint/both TS projects/production build. Live
rollout, legacy-record conversion and real-provider readback remain separately gated.
Final credential-cleared mirror verification completed successfully: lint, app
TypeScript, Convex TypeScript and optimized Next production build all passed.
Source is ready for owner review/PR preparation; no PR was created. Final status
contains only the preserved compatibility patch and the focused recovery changes.

Owner authorized commit, push and PR creation for the verified recovery source in
this sidebar chat on 2026-11-12. This supersedes earlier no-publication statements
for this source change only; merge, deployment, production inspection/mutations,
legacy conversion and real provider requests remain unauthorized.


## November13 development history-refresh reproduction and repair

Work stays in `t3-dev-history-refresh-recovery`, base `a4038e7` (merged PR18).
Implementation was performed by Sol Low; only mandated browser QA used Terra Medium.
No commit, push, PR, merge or production mutation was performed. Main is still clean
at `a4038e7`. Current source was inspected rather than replaying the superseded task.

Confirmed and reproduced: guard rejection consumed a claim attempt; begin/settlement
errors could skip lease cleanup; a final guard check hid the initiating source error;
fresh metadata was mistaken for available disposable content; Retry needlessly
refreshed healthy SPY; and lost wider payload could shrink a replacement cache to a
narrow requested window. Focused regressions failed before their corresponding fixes.
The exact reviewed v3/v4-to-v5 lineage exceptions and financial engine/oracles remain
unchanged. Source now preserves bounded original failure/trace/timestamp, active vs
abandoned status and known retry time, staged hosted attempt accounting, bounded
progress, atomic fenced publication/readback/settlement and root-validated legacy
rehydration. See `history-refresh-journal.md` for precise reproductions and matrix.

Owner-authorized compatible DEV backend rollout completed on `stoic-corgi-586`.
Current team-review fields and its previously absent bearer gateway configuration
were set only on DEV. Counter/cap continuity was verified. No legacy conversion,
manual guard settlement/deletion or manufactured deployed fixture was used.
The actual tech runtime first reproduced generic cache failure with HTTP200 provider
responses. A subsequent task-harness phase refusal interrupted three DEV observations;
normal restarted Retry recovered AAPL/MSFT/NVDA with real provider validation and
six common portfolio/SPY sessions November5?12. Warm reopen used zero provider calls.
This is distinct from the unknown original production cause.

Final checks: Node194/194, Vitest66/66, all five engine mutation probes,
`pnpm.cmd check`, focused formatting and a credential-cleared production build pass.
All42 browser regressions pass across the configured and disabled fixture modes;
Terra independently passes10 dashboard error-state cases, with its narrower scope
recorded in the task journal. Exact task
cost after compatible rollout/preflight:32 provider HTTP /1,840,165 received bytes;
329 Convex HTTP /5,085,219 received bytes;30,104,947 additional conservative backend
admission units. No local/backend allowance extension or historical refund/reset.
Actual deployed DB operations/billing, independent subscription verification,
provider finality/action completeness and public rights remain unverified.

Next: owner review of this uncommitted source and the explicitly synthetic
loopback review at`http://127.0.0.1:43139/qa-fixture/seed`, launched from this
worktree with`node scripts/qa-market-redesign.mjs`. Production rollout and exact legacy
CAS/drain/backup/rehearsal remain separate approvals. If all disposable and matching
legacy history is lost after the existing source allowance is exhausted, preserve
that limit and report its real retry time; do not bypass it to claim availability.

### November13 release rehearsal: RED

Owner-authorized checks1-5 and7 ran; next-day check6 skipped. Fresh check/build,
194 Node tests,66 Convex/runtime cases and five financial mutation checks passed.
All16 real DEV portfolio/range cases failed availability; restored browser storage
after server restart also returned CACHE_CONTENT_UNAVAILABLE and daily cooldown.
Two DEV market:read OCC conflicts were observed, without attributing all storage
errors. See dev-release-rehearsal.md for evidence, exact cost and limitations.
Next: fix/reproduce payload-loss recovery and contention, then rerun real acceptance.
No production rollout is recommended; no Git publication or production mutation.

## November13 implementation follow-up in progress

Owner authorizes continued DEV implementation/testing and temporary DEV refresh
relief, bounded service spending and preservation of future free-tier capacity.
A new failing-before regression isolates head-only writes in market-history-storage:
monthly data was omitted, so browser/process loss plus exhausted admission blocked
loads. Monthly payloads now commit atomically with the fenced authoritative head.
Malformed hints fall back to durable data; whole-root forgery/revocation checks stay.
Gateway mutations serialize through the bounded process write queue to reduce
self-contention on shared budget state. No claim of cross-instance contention cure.

DEV-only flag TIKR_DEV_REFRESH_RELIEF=explicit is bound to the platform URL
stoic-corgi-586, bypassing source daily/cooldown lockouts while retaining counters,
leases, guards and all spending caps. It cannot activate on production. Compatible
DEV backend deployed; no production mutation. Owner authorization persists until
further notice; removal before release is an explicit checklist item.

One fixed task transport allocation is now1500 cumulative Convex HTTP (additional
500), provider100 HTTP/64MiB unchanged; preflight360,865,884 estimated admission
units plus134MB conservatively reserved other usage. No automatic extension.
Normal production-limit regression proves fresh browser/process + different amount
can calculate from durable data without another bars request. Final live acceptance
and exact measurements will be appended; no readiness claim yet.

Publication follow-up: real QA trace71637e78-b00f-478f-9351-fe1ee8e3064c reached
HTTP200 bars/actions but failed storage-write. Sanitized DEV logs established
argument validation involving checkedAt. The initial durable-write correction
had forwarded unchanged monthly read rows including their database-only checkedAt.
The new actual-Convex-validator regression failed before projection and passes
after explicit key/payload/revision/dependencies projection. This was a defect
in the new correction caught before release, not attributed to original production.
The original retained guard/lease state is preserved for normal explicit Retry.

## Final November13 follow-up: DEV history acceptance PASS

See dev-release-rehearsal.md final section for exact changes, before/after failures,
acceptance matrix/cost, QA harness limitations and production rollout requirements.
All196 Node/70 Convex tests,5 mutants, check/build and42 correctly scoped browser
regressions pass. Real16-case route matrix passes; fresh process/browser allfour
portfolios pass with DEV relief OFF and spent attempts. UI create/add/equalweights/
startingcash/save/reload/secondtab passes; partial collector report and screenshots
preserved after canceled-body collector hung. Latest300 DEV log entries show no
function errors; inspected leases completed/released, guards/failure summaries empty.

Final cumulative84 provider HTTP/4,828,799 bytes,1452 Convex HTTP/22,603,067 bytes;
retained interrupted-body reservations6,291,456 units. Admission estimate414,788,683,
tracked calls9989/storage8,392,896 bytes/788 entries. No backend budget increase.
DEV relief restored until owner notice. Production normal policy remains unchanged.
No commit/push/PR/production mutation. Main clean. Real loopback review43201 running
with fixed remaining48 Convex calls; source command in rehearsal report.

Next: owner source review, then separately approved production-compatible rollout
and exact old-head/guard/counter recovery plan. Original production trigger remains
unknown; DEV passing is evidence for reproduced defects, not production certification.
Next-day live boundary test6 skipped as requested; landing demo copy debt remains.

Local certificate follow-up: owner browser could not trust loopback TLS. A loopback-
only HTTP adapter now serves http://127.0.0.1:43202 with host/origin checks and
private-control blocking, preserving underlying metering/backend configuration.
Verified page/JS200, invalid input400, foreign writes/private controls403. No
certificate installation, production change or remote service calls. Run from this
worktree: node scripts/dev-review-http.mjs; underlying43201 must also be running.

## Source-readiness continuation complete

Collector lifecycle fixed with bounded/deadline/sealed summaries and storageState
before body drain. Isolated browser run restores2portfolios/55IndexedDBchunks and
75/25 edited holdings; covers YTD/comparison/remove/add/manualweights/cancellation.
This is synthetic. Retained real four-case capture independently asserts personal-
provisional quality and zero synthetic labels; no fresh real export/provider call.
Focused7market+5collector/adapterNode,11Convexaudit,3browser cases and dedicated
persistence run pass. No blanket suite/build rerun for scripts/tests/docs changes.

Review adapter normalized-origin/path gap corrected and tested; owner HTTP43202
usable, private controls blocked. Task harness refuses missing journal/allocation;
no counters recreated. No QA endpoints in production app routes, production cannot
enable DEV relief, bounded allowlisted failure summaries preserved. No backend or
application source changed in this continuation; no deploy/PR/commit/push/newagents.

Production-history-recovery.md now provides specific classification, exact CAS
preconditions, snapshot/drain/rehearsal, bounded admitted refresh, preserved counters/
revocations and rollback/stop criteria. Cleanup excludes ALL referenced monthly
chunks, including content:true heads. Source ready for owner review; actual production
inventory/rollout/recovery still needs separate approval. Original cause unknown.

Budget unchanged84provider/1452Convex,48Convexcalls remain at handoff snapshot;
no extra provider/deployed Convex calls, extension/reset/refund. Nextdaylivecheck6
still skipped; Terra coverage partial. Details/artifacts: dev-release-rehearsal.md.

Owner-requested review cap increase:1750 cumulative Convex HTTP (+250), prior1500
preserved; provider/backend limits unchanged. Persistent journal records authority
and scope. Review remains http://127.0.0.1:43202. No production change.

## Monthly usage implementation (supersedes small DEV review task cap)

Owner approved35/45/50 actual-usage policy and production usage-only credential
access through private entry. DEV native monthly call stop207,902 installed and
verified. Retired local1,750callcap for review only after native protection readback;
cumulative journal retained. Existing conservative I/O guard/provider limits intact.
No production mutation. Production peer permits only authorized usage GET; key
server-only/ignored and absent from public build. Shared configured totals12560calls/
0.1614449434GB now live; other team deployments not yet inventoried, so no false
whole-team completeness. Refresh15min; private owner banner on HTTP43202.

Important: fractional0.2694GB native I/O stop rejected400BadJsonBody; installedCLI
requires positive integer limits. No1GB substitute or claim of hard50%teamI/O.
Local wrapper's periodic shared stop is not enforcement for all production functions.
Production native call limit/IOstrategy still need review. See convex-usage-monitoring.md.

Seven focused synthetic tests, lint/types/build, isolated UI real-incomplete and
simulated35/45/50/mobile checks pass; zero history/Alpaca calls for acceptance.
No fullmatrix repeated, nextday6 stillskipped. Source uncommitted; noPR/push/commit.

Final monthlymonitoring source/handoff status: DEV+productionusage-onlyGETconnected;
DEVmonthlycall207902 verified, oldtaskcap retired for allDEVworkflow modes.7focused
syntheticchecks andrealpartial/simulatedbannerstates/mobile/check/build pass without
history/providerwork. Native50%IOstop remainsunsupported and cannot be certified;
existingI/Oguardretained, prodsettingsunchanged, teaminventoryunverified. Exact
native/read-onlyscope, monitor-lifetime/freshness and nextapproval requirements are
in convex-usage-monitoring.md. NoPR/commit/push orproductionmutation.

Owner UI correction (2026-11-13): removed the routine provisional-source disclosure from DataStatus; compact ready cards render no status text, while refresh/history failures and synthetic QA identification remain. Source only; existing review build requires rebuild to display this correction.

## 2026-11-13 corporate-action/dashboard follow-up � incomplete acceptance

Owner reports d1fd1eaa-69a9-430a-9ee5-3bcec63f3a0b and
433c396d-4e67-4841-84e4-52f3e496bcc6 for NVDA/AMD/ASML/TSM.
The actual rejected corporate-action record has NOT been recovered. Foreign
USD/ADR dividend rejection is a source-backed hypothesis, not a proven cause.
Persistent task journal reports providerHttp=100 and PROVIDER_PHASE_100 refusal;
no new provider request or allowance extension is authorized by this continuation.

Implemented: dashboard Retry button is a sibling of the card navigation button
(no nested controls); guarded/cooldown feedback preserves supported original
financial failure explanations; unsupported-action copy no longer implies a
shorter period is always a solution. Personal-loader rejection logs include an
allowlisted reason, supported event family, ticker and request trace, excluding
amounts, upstream IDs, free-text issues and raw bodies. No financial normalization,
revocation, lease settlement or guard bypass was changed without evidence.

Verification: existing personal-loader/durable suites 53/53; personal-loader with
new bounded diagnostic regression 19/19. These are synthetic. No new live check,
production mutation, commit, push or PR. Dashboard browser acceptance and exact
TSM/ASML correction remain outstanding. Existing same-day ambiguity tests still
intentionally block unverified dividend unit basis; passing tests do not establish
support for foreign currency, ADR fees, spin-offs or merger exchanges.

PR readiness remains BLOCKED for the requested complete fix: obtain the actual
rejected normalized event under a newly bounded allowance or sanitized retained
fixture, establish its units/currency and terms, reproduce and correct it, verify
reload/retry in an isolated browser, then run affected acceptance. Earlier claims
of broad source readiness do not certify this newly reported case. Next-day live
check 6 remains skipped. Full shared production usage stop also remains incomplete
as documented in convex-usage-monitoring.md.

Owner decision (2026-11-13): retire the local DEV harness 100-request task count
cap. This supersedes the request-count blocker above, not the financial acceptance
status. Cumulative journal and historical allocations/refusals remain intact;
64 MiB provider body/reservation ceiling, pacing, monthly checks and backend
admission/guards remain. No production setting or application quota was changed.

## Terra live DEV matrix findings (2026-11-13)

Native Edge fallback followed two built-in snapshot timeouts and unavailable
computer-use host. Early Terra runs were incomplete harness checks, not passes.
Final response-matched checks reproduced AI NVDA/AMD/ASML/TSM guarded for 1W,
1Y and 5Y (b154359f-c44c-4d48-9b5d-87078a6d5b0e,
657b821a-9fb1-40c5-b40d-385fa5c46b62,
7118a10a-ff2a-456e-b161-13236de7f13c). HTTP200 wraps a blocked result;
it does not mean history succeeded. DEV server retained source trace
2208d4bd-3855-46de-a052-634107c5218b confirms provider bars/actions200,
then ASML and TSM cash_dividends rejected with unverified_dividend_terms.
This establishes validator rejection, not which individual flag/amount/currency
or ADR basis was responsible; raw bodies were not retained. Subsequent requests
were rejected at hosted control before provider work. Do not attribute this to
missing history, original production cause, or the removed100call task cap.

War PLTR/RTX/BA and dividends SPY/SCHD/O/KO returned ready1W for
2026-11-05..2026-11-12, sixpoints per portfolio/SPY series. References
3d717fa5-e326-43dd-be28-ac8398589ec8 and
f7a45d79-0232-4606-982f-451c9b60ef92. These are UI/transport checks,
not independent financial calculation certification. Split/mixed, isolatedTSM/ASML,
persistence/retry/comparison/cashweights/mobile still untested in this matrix.
Actual cumulative113provider/5967836receivedbytes/6291456reservedbytes,
2127ConvexHTTP. Delegation baseline103 =>10provider and221ConvexHTTP;
sharedownertraffic included, not isolated billing. Initialbatch ceiling123 remains.
Next: distinguish exact safe dividend rejection flags, normalize only established
terms, preserve current revocations and use validated replacement/guard recovery;
complete missing deterministic/UI cases before PR readiness. No production action.

Chart display follow-up (2026-11-13): dashboard result/legend visible while plot
missing. Applied explicit full width and min-width zero through the compact result,
plot flex wrapper and HistoryChart root to avoid intrinsic percentage-width collapse
inside the card button. TypeScript passes; browser dimensional/path verification
required before declaring visual fix confirmed. No financial calculation changes.

## 2026-11-13 owner-directed MVP continuation

See mvp-history-readiness.md, which supersedes earlier quota/monitor plans. Removed
operational usage/daily/cooldown gates from sharedsource, deleted localusage monitor,
removedDEVnativecallcutoff(readbackempty), preserved historicalledgers. CompatibleDEV
backenddeployedstoic-corgi-586; no productionmutation/publication. Fixedexplicitchart
sizing; backend-onlyreferences; dashboardreloadrecovery; editorRetryretained.
206Node+68Convex tests pass. SolLowper-stepreviewsrecorded inreadinessdoc. Actualforeign
ASML/TSMrecordsconfirmed missingcurrency; safeUSDnormalization+independentfixtures
pass, but actual1Y/5Yacceptance remainsblockedbydenomination/unitproof, not quotas.
FinalTerraQAandreadinessreviewpending. Sourceuncommitted, noPR.

FinalTerra2026-11-13: graph confirmed desktop/mobile; realWAR1Wreloadready andfullAI1W
reloadrecoverystoready; noUIrefs/dashboardRetry. Combined42syntheticbrowserpass,
persistence/editingpass. ActualAI1YfailsASMLTSMUNSUPPORTED_ACTION, editorRetryclick
returns same. Finalnarrow8providerHTTP/116404providerbytes/93ConvexHTTP; cumulative128
provider. Exactfieldsforeigntruecurrencyabsentremainunverified, so task/PRreadiness
NOTcomplete. Do not spendmoreblind retries orrelaxfinancialvalidation. See
mvp-history-readiness.md finalTerraevidence and externaldata limitation.

TSMdenominationupdate2026-11-13: oneboundedissuercomparisonprovesfourcurrentTSM
provideramountsalreadyUSDNETperADR (matchissuer, notgross). Earliermissingcurrency
explanationwasincompleteforTHESEevents. Remaininggross/netmethodologymismatchand
blanketforeignrejectionaretheissue; donotconvertUSDagainorguessuniformtaxgrossup.
See mvp-history-readiness.md correctionandadditiveprobeaccounting1HTTP/1001B.
