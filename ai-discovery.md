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

# AI asset discovery: mocked backend review

The owner approved implementation and mocked testing in the existing feature
worktree. This is not a live activation or release. No Groq credential was read,
no real model/Alpaca request was made, and no Convex deployment was changed.

## Behavior and contract

- Guests pressing AI receive “You must be signed in.” and remain in ticker search.
- Signed-in requests contain only `prompt`, `requestId` and `sessionFence`.
  The account comes from verified server authentication, never a supplied user ID.
- The server checks Better Auth's live session as well as the JWT and session fence,
  before admission and before returning a completed response.
- Requests use GPT-OSS 20B, low reasoning effort, strict structured JSON, at most
  six candidate tickers, a 1,024-token completion cap and a 15-second deadline.
  These are initial evaluation settings, not measured relevance/capacity evidence.
- The server removes duplicate/invalid/unsupported candidates and supplies names
  from the existing cached catalog. Match explanations remain AI suggestions.
- The catalog lookup uses existing bounded `market.read` accounting and existing
  shard decoding/validation, common revision, seven-day freshness and five-second
  clock-skew rules. It never imports, refreshes or requests Alpaca data. A missing,
  malformed, stale or mixed-revision cache produces unavailable feedback.
- The response is `{ result, usage }`. `result` supports matches, clarification,
  no matches, error, unavailable and limit. `usage` gives the limit, remaining
  available slots and next UTC reset timestamp. The client formats reset locally.

## Daily accounting

`discoveryUsage` holds one indexed account/day counter. `discoveryRequests` holds
short-lived request receipts. They do not alter portfolio/auth/market tables.
The central defaults in `src/lib/ai-discovery.ts` are 500 UTF-16 code units (matching
HTML `maxLength`) and 20 completed searches per account per UTC day.

An internal transaction reserves one slot before inference. One reservation per
account/day may be pending at a time, so multiple tabs cannot overspend the final
slot. Pending reservations have a 30-second lease; a later request can reclaim an
expired slot and a late completion cannot charge it. Completion converts the slot
to one used search; failures release it. Clarifications and valid no-match replies
count. Rejected inputs, guest requests and unavailable/failed provider/catalog
requests do not count.

The UTC bucket is chosen at admission. An admitted request spanning midnight is
settled against that original bucket; the returned allowance describes the current
day. IDs have a UTC date prefix and UUID, so old IDs cannot replay after receipt
retirement. Repeated IDs never invoke Groq or charge again; changed prompt content
with the same ID is refused. Completed response bodies are not persisted/replayed:
a lost response requires a new explicit search. There are no transparent retries.

The UI can cancel/ignore results, but it cannot undo a remote action already in
progress. A valid server completion still counts if the user cancels or disconnects;
a failed response does not. Results and allowance are scoped to the current session
and cannot appear after switching accounts. The client refreshes usage on focus and
at the UTC reset boundary.

Receipts contain account identifier, date, request ID, a SHA-256 prompt fingerprint,
status and timestamps. They contain no raw prompt, portfolio, response body or model
reasoning. Request receipts and old usage rows retire after approximately two days
through internal scheduled mutations. Application code does not log prompt or
provider response bodies. Groq's own processing/retention is a separate live-trial
review item.

## Source map

- `convex/discovery.ts`: authenticated public orchestration action.
- `convex/discoveryIdentity.ts`: verified identity/live-session fence.
- `convex/discoveryQuota.ts`: public own-usage query; private reserve, finish, retire.
- `convex/discoveryCatalog.ts`: private, bounded cached-catalog lookup.
- `src/lib/discovery-provider.ts`: dependency-injected fixed-origin Groq transport.
- `src/providers/discovery-provider.tsx`: authenticated client adapter and allowance.
- `src/components/ai-asset-search.tsx`: approved UI, guest toast, result lifecycle.
- `convex/discovery.test.ts`: mocked auth/provider/catalog transaction tests.

The owner-approved one-shot Groq flow uses a direct server transport. No agent/chat
thread component, stored conversation, paid AI gateway or extra dependency was added.

## Disabled by default

Live operation needs all of the following, none configured by this work:

1. The new functions/schema deployed to an explicitly identified development target.
2. `TIKR_AI_DISCOVERY_ENABLED=explicit` in that Convex deployment.
3. `GROQ_API_KEY` entered as a private Convex secret through secure entry.
4. `NEXT_PUBLIC_AI_DISCOVERY_ENABLED=true` in the intended development frontend.
   This flag is not a credential. It does not authorize a request on the server.
5. A valid cached catalog in that same deployment and separately authorized access
   to it. No production data/configuration should be copied into development.

The existing Google sign-in wiring/callbacks and cloud portfolio ownership stay in
place. The frontend provider is added beneath the existing auth provider. With the
AI flag unset, it makes no discovery queries/actions and the AI adapter is unavailable.
The backend independently checks its enable flag/key before reading catalog data or
calling Groq. There is no paid/model fallback.

## Local review and evidence

The review server is loopback only, in a fresh synthetic browser profile:

```powershell
$env:TIKR_QA_PORT='5010'
node scripts/serve-guest-qa.mjs
```

- `http://127.0.0.1:5010/?ai-preview`: original deterministic UI fixture adapter.
- `http://127.0.0.1:5010/?ai-backend`: production client adapter with synthetic RPC
  transport, auth and catalog/market UI. This is outside the app routes and is not
  published by the Next build. `window.__cloudQA.account("A")` simulates sign-in
  only inside this test harness; it is not a real Google session or production hook.
- `node scripts/qa-ai-discovery.mjs`: isolated Edge interaction, guest gate, signed-in
  adapter/allowance, logout, mobile/focus, cancellation and motion regressions.
- `pnpm.cmd exec vitest run --maxWorkers=1`: 112 passed, including 18 discovery cases.
- Focused demo/name/auth-return/trial Node checks: 20 passed.
- Guest suite: nine scenario groups; cloud suite: ten scenario groups passed.
- `pnpm.cmd check`: lint and both TypeScript projects passed.
- `node scripts/build-cleared.mjs --auth-fixture --ai-fixture`: optimized build passed
  with synthetic public bindings and the AI client branch enabled, no provider key.

Reports/screenshots are under system temp: `tikr-ai-ui-jukjfP`,
`tikr-guest-ui-NjjIaA`, `tikr-cloud-ui-EMNm6L`; cleared build `tikr-cleared-build-PkBvjH`.

The API declarations were regenerated offline by `scripts/codegen-offline.mjs` using
the installed Convex generator, retaining unchanged component declarations. This
does not load credentials or deploy. Full normal Convex codegen/deployment validation
remains part of a separately authorized development trial.

## Next stage

Review this code, then identify/announce the intended development deployment before
any deployment/configuration change. A bounded live trial needs separate authorization
and secure Groq key entry. It must verify real structured-output compatibility,
theme/ticker relevance, latency, token consumption, current account limits and
failure handling. Published rate limits and the earlier 6,000/month estimate are
not measured capacity or a guarantee. No paid activation is implied.

Production access/configuration/deployment and commit/push/PR/merge remain separate.
Existing market-data rights and deferred financial/reliability work are unchanged.
