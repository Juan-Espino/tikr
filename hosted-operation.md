# Hosted operation (prepared, not activated)

Owner decision 2026-11-06: Vercel access is anonymous. No Google gate or cloud portfolio storage is required. Definitions remain in each browser. Public Alpaca display/caching rights are unresolved. **Do not activate live public data under this preparation authorization.** No deployment or credentials were exercised.

## Exact configuration

Vercel server environment, Production scope only after separate activation authorization:

| Variable | Value/purpose |
| --- | --- |
| `TIKR_MARKET_HOSTED_ORIGIN` | Exact canonical HTTPS origin, e.g. `https://tikr.example`, without slash/path. Preview domains are rejected. |
| `TIKR_HOSTED_DATA_ENABLED` | Leave unset now; `explicit` only after rights and activation approval. |
| `TIKR_MARKET_MODE` | `personal-provisional` (retains correction/completeness notices). |
| `TIKR_CONVEX_SITE_URL` | Selected deployment's `https://NAME.convex.site` HTTP endpoint. |
| `TIKR_MARKET_GATEWAY_KEY` | Private shared gateway bearer credential, minimum 32 characters. Enter through private environment UI after authorization; never in source, CLI history or public variables. |
| `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY` | Private server credentials with the required SIP/actions/paper-calendar entitlements; enter privately only after authorization. |

Convex environment on the exact same selected deployment: `TIKR_MARKET_GATEWAY_KEY` (matching private value) and `TIKR_HOSTED_DATA_ENABLED` (unset now; `explicit` only after approval). No Alpaca key belongs in Convex. No Convex deploy/admin credential belongs in Vercel runtime. No new `NEXT_PUBLIC_*` variables are needed by this gateway. Existing optional frontend Convex provider configuration is unrelated to market access.

Local development keeps `TIKR_MARKET_HOSTED_ORIGIN` unset and uses the existing local variables described in `market-data-integration.md`, including the private admin key and local ledger. Hosted flow bypasses evidence files, filesystem ledger and markers; importing local modules does not perform filesystem I/O. Hosted reviewed-file replay is deliberately unsupported.

## Deployment sequence (commands documented, not executed)

For automated Vercel deployment, use the build command `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "pnpm run build"`. Set `CONVEX_DEPLOY_KEY` to a production deploy key in Vercel's Production scope and a separate preview deploy key in Preview scope if previews deploy Convex. This key is consumed by deployment tooling; application code must use the narrower gateway credential instead. A build with neither deployment key nor self-hosted configuration fails before Next.js builds. Budget configuration below remains an operator action and is not renewed/reset by this build command.

1. Inspect target project/team/deployment and Vercel account in their consoles. Classify each target as dev, preview or production before running commands. Obtain separate explicit production deployment and public-data activation authorization. Review display/caching rights, Alpaca entitlement, provisional disclosure and budget first.
2. In this feature source tree run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm exec vitest run` and the Node/browser checks in `market-data-integration.md` sequentially with the Next build. Never copy main-checkout credentials.
3. For an authorized development target, `pnpm exec convex dev --once` pushes and regenerates function types. This can alter deployment bindings; verify the selected dev target first. For an authorized **production** target, `pnpm exec convex deploy` deploys schema/functions. This is not a read-only verification command. Do not put the deployment key in Vercel runtime.
4. Review actual team usage and call internal `market:configure` through the selected deployment's console with `otherStorage`, `otherIo`, `otherCalls` and `reviewedThrough` (epoch milliseconds, maximum 32 days ahead). Preserve counters. Console invocation is preferred to secret-bearing shell commands. The existing 100 MB storage, 500 MB monthly I/O and 250,000 calls remain unchanged; there is no paid fallback. Provider reservations retain 2 MiB per request; six-asset daily use can exhaust the monthly budget. New HTTP actions also consume platform invocation/compute/bandwidth outside these estimates.
5. Configure the Vercel build command above (or `pnpm build` only when Convex deployment is handled separately), and install command `pnpm install --frozen-lockfile`. Connect the reviewed source only after authorization; an authorized manual production deployment uses `vercel --prod`. Disable Vercel deployment authentication for the approved anonymous application. Set canonical domain and environment scopes deliberately; do not enable preview live data. Vercel must overwrite `x-vercel-forwarded-for`; do not expose this server through an arbitrary proxy that accepts that header from clients.
6. Keep both data-enable flags unset for the initial disabled deployment. After separate rights and activation approval, configure private values and both flags, redeploy Vercel, and perform a bounded live trial. Validate cross-instance cache hits, cold loading, correction revocation, quota/error behavior, expiry and actual team/Vercel usage. None of these live results is established by offline tests.

## Defaults and security limits

Implementation defaults, not owner-approved visitor quotas: 100 global opens/UTC day, 10 opens per 128-way hash bucket/UTC day, four active request slots for at most 120 seconds. Bucket collisions intentionally reduce availability; this is an abuse bound, not identity or ownership. No raw IP is persisted. Bodies remain capped at 12,000 bytes, three portfolios and six supported assets. Full origin/Host/content-type checks apply in production and reject missing Origin; these checks are not authentication against non-browser clients.

The HTTP gateway accepts only bearer-authenticated read/acquire/write/release/control operations; it cannot configure budgets or call arbitrary functions. Internal market functions remain internal. Existing cache lease tokens, one daily automatic refresh and bounded explicit retry are shared by every instance. The shared calendar also uses durable cache/lease admission. Revocations and symbol refresh guards reside in a bounded Convex control document and survive instances/restarts/month changes. An uncertain refresh leaves its guard indefinitely; expiry of a work lease never clears a guard. Wrong-token finish cannot clear another writer's guard. Storage errors block results; there is no filesystem fallback or alternate provider.

Application budgets cannot prevent the platform from charging for HTTP requests, rejected calls or transaction retries. Configure Vercel firewall/rate limits and platform spend alerts before public activation; direct anonymous floods and gateway abuse need platform enforcement. No free-tier or cost guarantee is claimed. The global control document intentionally trades throughput for serialized bounded admission at this small scale.

## Disable and rollback

Unset `TIKR_HOSTED_DATA_ENABLED` in Convex first to close the gateway immediately, then unset it in Vercel and redeploy. Cached browser results expire at their operational validity deadline; clients already holding a response cannot be remotely erased. For urgent known corrections disable access at Vercel too. Rotate the private gateway credential in both environments after any suspected disclosure, without logging it. Roll back Vercel source through its deployment console; retain additive Convex tables and counters. Never delete/reset local ledgers, durable budget rows, revocations, abandoned guards or leases to regain quota. Recovery from a retained guard/revoked policy requires operator investigation and a separately reviewed policy/scope revision. Budget review expiry fails closed; renew from actual team evidence, not a reset.

Preparation does not establish data rights, live API compatibility, deployed HTTP behavior, team headroom, firewall configuration or sustained capacity. These remain activation requirements.
