# Google sign-in DEV runbook

Stage 1 uses `@convex-dev/better-auth@0.13.0` and `better-auth@1.7.25`.
The component declares Better Auth `>=1.7.16 <1.8.0` compatibility. Existing
application dependencies were retained. Official references:
[Convex Next.js guide](https://labs.convex.dev/better-auth/framework-guides/next),
[Better Auth Google](https://www.better-auth.com/docs/authentication/google).

## Run owner review

From this feature checkout (base `4f81e3a`, including PR21), run:

```powershell
pnpm install --frozen-lockfile
pnpm dev --hostname localhost --port 5000
```

Open http://localhost:5000/sign-in in an isolated Chrome profile/incognito window.
The review server is loopback-only. No market credentials or enable flags are
needed for authentication; keep financial verification synthetic/unconfigured.
The ordinary guest portfolio, draft, catalog and history contracts are unchanged.

## Configuration

The ignored feature `.env.local` contains the existing DEV deployment binding
`dev:stoic-corgi-586`, `NEXT_PUBLIC_CONVEX_URL` pointing to its `.convex.cloud`
endpoint, and `NEXT_PUBLIC_CONVEX_SITE_URL` pointing to its `.convex.site` endpoint.
These public connection URLs are not credentials. Do not copy market/prod keys.

On **DEV stoic-corgi-586 only**, privately set `SITE_URL=http://localhost:5000`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a strong `BETTER_AUTH_SECRET`.
An ignored local backup may retain these server secrets; never use NEXT_PUBLIC
names for them. Preserve an existing secret rather than rotating it unnecessarily.
Use the CLI's stdin or `--from-file` secret support, not secret command arguments.
Verify target metadata and announce classification before each configuration/push.
The initial DEV auth component deployment and private configuration succeeded.

HTTP routes use the component's documented `registerRoutesLazy` so deployment
module analysis succeeds before auth variables are configured. Auth initialization
and strict configuration validation occur at request time; this does not enable
production sign-in or supply fallback credentials.

The Google DEV web client must authorize exactly:
`http://localhost:5000/api/auth/callback/google`.
The actual generated redirect was checked and matches. `baseURL` is the app origin,
not the Convex site URL. Next's `/api/auth/[...all]` proxies to Convex; the existing
`/market-gateway` HTTP route remains mounted. Trusted origins contain only SITE_URL;
origin/CSRF checks remain enabled and external callbacks are rejected. Provider
scopes are only openid/profile/email with explicit account selection. No passwords,
passkeys, Workspace restriction or Google API permissions are configured.

Production client configuration/credentials, production env changes and production
deployment are outside this stage's authorization. Do not automatically deploy this
feature to production. No native cap, quota or deployment target was created.

## Identity and local data

Better Auth owns its isolated component users/accounts/sessions/JWKS/verification
records. There is no app profile or portfolio table. `auth.currentAccount` accepts
no user identifier, derives identity from the verified Convex session, checks the
component's live session and returns only name/email (null for guests). The app
uses documented HttpOnly session cookies through the same-origin proxy and the
Convex Better Auth provider. Auth responses are not cacheable. The Next proxy copies upstream headers rather
than mutating immutable fetch responses; this preserves OAuth responses and cookies. Next development
request logging omits auth URLs so callback authorization codes are not logged;
Better Auth diagnostic logging is disabled. Never dump auth records or cookies.

The header avatar uses the Google session profile image, with initials as fallback.
It opens a Base UI account dialog with the shared app Sign out button.
The account UI reads the server-verified session, hides identity while loading or
on errors, and signs out through Better Auth. Successful logout replaces the current location with the landing page (`/`)
to discard in-memory identity/query state. Local portfolios/drafts remain in their
existing browser store. Signing in never imports or cloud-saves them. People sharing
one browser profile share those local records; use separate profiles for privacy.

Return paths reject external URLs, protocol-relative/backslash/control-character
paths and auth/API loops. Explicit safe return paths preserve query/hash; opening
sign-in directly resumes the existing local draft or dashboard. A browser back/
forward restore clears a stale Connecting state. Cancellation/error remains
retryable and guest use stays available.

## Verification

```powershell
pnpm exec vitest run convex/auth.test.ts convex/auth-http.test.ts tests/auth-ui.test.ts tests/auth-proxy.test.ts tests/hosted-assets-route.test.ts tests/hosted-route.test.ts
node --experimental-strip-types --test tests/auth-return.test.mjs
pnpm check
node scripts/build-cleared.mjs
```

Synthetic tests cover guest/verified identity, rejected client impersonation,
revocation, signed cookie repeated requests/logout/tampering, two isolated users,
exact Google redirect/scopes, origin and callback rejection, missing configuration,
and canceled callbacks returning safely to drafts. They do not prove Google token
exchange. Owner completed the real DEV Chrome flow and reported the account menu
with name/email and the local-only storage disclosure. Real reload/logout and
second-account status are recorded in plan.md after the owner verification handoff.

Before broader rollout, review account retention/deletion and privacy/terms.
Cloud saving/import, server ownership and cross-device portfolio persistence are
separate future scope; market licensing and deferred reliability polish remain
unchanged. Do not expose private harness routes or publish test PII.
