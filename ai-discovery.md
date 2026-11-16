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
