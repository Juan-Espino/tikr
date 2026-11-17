## Automatic creation and local review - owner approved 2026-11-16

Supersedes earlier explicit Create in account / sign-in-never-saves requirements.
A signed-in portfolio with a nonblank valid name, at least one holding, valid
allocation and amount is created automatically after 500ms; name-only/empty work
remains temporary. The active guest/example-copy draft recovers through sign-in
and saves automatically to that account when valid. Originals remain read-only.
No legacy collection import or cross-account recovery is added. Creation and
updates share one serialized coordinator, stable client ID, revision fences,
bounded retries, and exact idempotent replay of uncertain creates. Newer edits
remain editable during creation. No cloud save acknowledgement is implied by login.
Name conflicts require correction; invalid edits keep the last valid cloud state.
Private account work remains in memory; temporary guest recovery is account-bound
before creation and settled only after acknowledgement without deleting newer work.
Normal route navigation retains the provider queue; forced closure/crash recovery
of private unsent edits is not guaranteed. This round is local owner review only:
no new commit, push, PR, merge, production deployment or production configuration.

## Guest/examples release preparation - approved 2026-11-15

Owner now authorizes production readiness preparation plus commit/push/PR for this
feature. Merge, production access/configuration/deployment and paid services remain
separate. This supersedes earlier no-publication checkpoints below.

Final behavior: guest read-only examples and one temporary recovery draft; explicit
Sign in to save, safe OAuth return, then explicit account Save. Signed-in dashboards
show only account portfolios, omit Examples and the redundant Portfolios nav button,
and have no visible collection heading. Resume appears only for actual unsaved
work. Navigation uses Portfolios / All portfolios / View portfolios. Centered shared
dialogs confirm replace/discard/delete; deletion uses destructive buttons. Sonner
notifications expire without a close or manual-dismiss control. Existing browser
collection bytes are preserved but have no legacy/import UI. Private cloud edits
never become guest recovery content; account-bound recovery is isolated in the UI.

No Convex/schema, auth route/config, market engine/provider, calendar, production
binding, quota or deferred-polish change is included. Only Sonner is added to the
locked frontend dependencies. Current source is based on merged PR24 at b18a87d.
Production rollout reuses existing auth/cloud CRUD and existing production public
cloud/site bindings; no new secret/env/provider activation is required. Never copy
DEV ignored configuration into a release. The configured Vercel build already has
a Convex-deploy step; its eventual execution is part of the separately approved
release, not this preparation. Backend definitions are unchanged by this PR.

Release checks include all local Vitest cases, focused guest/name/auth-return/trial
Node checks, both synthetic browser suites, lint/both TS, changed-file formatting,
diff/newlines/private scans, and an optimized credential-cleared build with synthetic
public auth bindings (`node scripts/build-cleared.mjs --auth-fixture`). The fixture
build compiles the configured auth/provider path without real deployment access.
It does not prove live OAuth exchange, production cloud availability or market rights.
No real second Google account is available; mocked A/B coverage is distinct.

After an approved release: smoke-test guest example/reload, draft->Google safe
return->explicit Save, save/reload, name collision, logout/private-ID refusal and
unchanged existing account definitions. Production smoke verification is outstanding
until that release is authorized. Roll back frontend source if needed while keeping
cloud rows/deletion receipts and both browser keys intact; no data reset/migration.
A rollback to older frontend code does not understand the temporary trial key.

## Owner review corrections - approved 2026-11-15

Supersedes the earlier compatibility UI and signed-in example visibility decisions
below: remove the older-browser entry, route and user-facing old-workflow copy.
Leave all existing browser data bytes untouched; no migration/deletion/import.
Examples are displayed to guests only. Account dashboards show only account work.
Resume draft appears only for a new unsaved draft or changed saved definition,
never an acknowledged unchanged save. Landing resume uses the same rule.

Use shadcn Sonner for transient notifications, retaining actionable inline save
errors/conflicts/pending states. Use the existing shadcn/Base UI account-dialog
composition for discard, replacement and deletion confirmations: title, explanation,
Cancel and explicit action, keyboard dismissal/focus return. Portfolio action
buttons share one aligned row with consistent spacing. No backend/financial changes,
production access/deploy or Git publication are authorized by these corrections.

## Simplified examples and temporary drafts - owner approved 2026-11-15

This decision supersedes older editable-example, persistent guest-library and
single-draft handoff restrictions below. Collection import remains excluded.
Examples are stable read-only originals available to guests and signed-in users,
separate from the authenticated cloud collection. Try your own mix creates a new
unsaved copy; examples never become saved originals. Guest results/search remain
open, with Sign in to save followed by an explicit cloud Save after login.

One bounded versioned temporary trial uses `tikr-trial-v1` as a reload/OAuth recovery
bridge, not a library or cloud sync. Replacement/discard is explicit. Once edited
in a signed-in session its recovery is bound to that account; guest/other-account
sessions cannot restore it. Private saved cloud definitions/edits stay in memory.
The legacy `tikr-demo-v1` collection is never written, migrated, deleted or imported.
Older browser portfolios provides separate read-only inspection, including its old
draft, using existing compatibility interpretation without changing stored bytes.
Malformed records fail visibly without overwrite. This minimal compatibility path
adds no export wizard or import API/schema/index.

Cloud ownership, atomic names, client-ID idempotency, session/revision fences and
deletion receipts remain unchanged. Same-ID recovery with different cloud contents
retains edits and requires explicit conflict resolution. No backend change/deploy,
financial-engine change, operational quota, Groq feature or deferred polish is added.
Source is in the isolated guest/examples worktree at merged PR24 base
`b18a87d8c3bc41cd9696812ef2b35da43c0bf29b`; no commit/push/PR/merge or production
access/configuration/deployment is authorized for this task. Earlier publication
permissions below describe previous work and do not authorize this branch.

# Google sign-in configuration runbook

## Current account scope - 2026-11-15

Owner confirmed real production login/reload/logout/local preservation after PR22,
and has now tested the account cloud features and authorized PR creation. Account
saves use the verified owner's collection; guests stay local. Sign-in itself does
not save local work. Browser-to-cloud collection import was removed by explicit
owner decision; it is not a deferred acceptance test. See
[cloud-portfolios.md](cloud-portfolios.md) for ownership, concurrency and rollout.

Google-only Better Auth configuration and callback remain unchanged. DEV is
stoic-corgi-586 with canonical origin http://localhost:5000; existing DEV market
settings are connected privately. This PR does not authorize merge, production
configuration/deployment or production data access. Use the integrated browser for
human Google interaction; no password/token/cookie exports. Older stage 1 and
production-preparation statements below are historical checkpoints.

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

## Production preparation - owner authorized 2026-11-14

Production configuration is now prepared. The existing successful Vercel production
build and the Convex project's production selector both identify
`warmhearted-tapir-205`; do not infer production from a failed preview build's host.
Vercel project is `juan-espinos-projects/tikr`, production branch `main`, canonical
origin `https://tikr-lovat.vercel.app`.

Configured and privately read back on Convex production:

- `SITE_URL=https://tikr-lovat.vercel.app`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: owner-supplied production client,
  validated distinct from DEV.
- `BETTER_AUTH_SECRET`: separately generated strong production secret.

A private backup is in ignored `.env.auth-production.local`; do not load it into the
localhost DEV server or commit it. Existing market/provider variables are untouched.

Configured in **Vercel Production only**:

- `NEXT_PUBLIC_CONVEX_URL=https://warmhearted-tapir-205.convex.cloud`
- `NEXT_PUBLIC_CONVEX_SITE_URL=https://warmhearted-tapir-205.convex.site`

The existing Vercel build command deploys Convex and injects the cloud URL into the
Next build. Google production callback must exactly match
`https://tikr-lovat.vercel.app/api/auth/callback/google` (owner reported creating this
client). A synthetic production-origin regression confirms this generated callback
and rejection of the localhost origin. Google Console callback/publishing/test-user
settings and actual production token exchange remain to be verified at release.

Preparation does not merge PR22 or publish a production deployment. Current production
still serves pre-auth code. After separately authorized release, verify real login,
reload, logout-to-landing, safe local draft return and a second Google account.
Keep preview environments separate: production trusted origins do not include preview
URLs or localhost. No native cap, quota, paid service or deployment target was created.

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
