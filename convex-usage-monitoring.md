# Superseded for MVP ? 2026-11-13

Owner-directed quota removal deleted the usage monitor and all application usage cutoffs. DEV native limits read back empty. The material below is historical evidence, not active policy. See [current readiness](mvp-history-readiness.md).

# Monthly Convex usage protection

Owner-approved policy: warn at35%, urgent at45%, target stop at50% of the dashboard's
included1M function calls/1GB database I/O. These are actual platform resources,
not the existing weighted admission units. No Alpaca quota or financial methodology
changes. This document supersedes the small cumulative DEV task-call workflow.

## Active now

-DEV stoic-corgi-586 has an enabled native MONTHLY function-call disable threshold
 of207,902: measured7,902 plus200,000 additional development calls. Created and
 read back through the platform API. Historical usage is preserved.
-The local review harness retires its1,750-call cap ONLY after reading back that
 native monthly call protection. Its persistent cumulative journal keeps counting;
 it is not reset or discarded. Other DEV operator modes verify the same monthly
 call protection at startup instead of inheriting the retired small call cap.
-Background usage checks run every15minutes while the review server is running;
 the owner banner reads the local sanitized snapshot every minute. No per-portfolio
 platform poll, paid service, new cloud function or scheduled deployment was added.
-Production usage access was separately authorized through private entry. The new
 CONVEX_USAGE_DEPLOY_KEY is ignored/server-only. Only GET
 https://warmhearted-tapir-205.convex.cloud/api/v1/get_current_usage is allowed for
 that peer. No production setting, deployment, function or record was changed.
-The monitor sums actual DEV and production metrics. Latest hookup observation:
 12,560calls and0.1614449434GB I/O, or1.256% and16.1445% respectively. These are
 deployment-API units; do not equate them with admission counters or assume the
 dashboard's displayed MB are decimal bytes.
-Account data is available only through the loopback review adapter43202. The
 public app never requests the usage endpoint; no key is in the client bundle.
 Owner review: http://127.0.0.1:43202.

## Important API limitation: the native I/O stop is NOT active

The API accepted the integer call threshold but returned400 BadJsonBody for the
 fractional0.2694144823GB I/O threshold. Installed Convex1.46 CLI also validates
 limit amounts as positive integers, even though usage is reported in fractional
 GB. Thus this version cannot provide a native stop below1GB through this API.
 No1GB limit was substituted, and no claim of a native team-wide50% I/O stop is made.

The existing conservative application I/O admission guard remains unchanged and
can stop work before actual usage reaches the warning percentages. It is a distinct
resource guard, not measured database billing. Production's existing guards are also
unchanged. The local DEV review wrapper stops new Convex work if its collected shared
usage reaches50%, but that is periodic, potentially delayed platform data and only
gates that wrapper. It is NOT a hard guarantee for every production/background
function or unknown deployment. Native deployment disable limits stop reads too.

Production native call limits and a genuinely team-wide sub-GB I/O enforcement
strategy require a separate review/approval. Proposed remaining production call
allocation is250,000 additional calls after a fresh baseline. With the hookup's
4,658 production baseline that would be254,658, but this has NOT been installed.
DEV207,902 + proposed production254,658 leaves37,440 of the500,000-call target for
other usage/recovery. Do not execute a stale proposal or silently expand protection.

## Coverage, freshness and rollover

The default inventory names DEV and production. Both currently return complete
backfill data. The entire team's other deployments/projects have not been freshly
inventoried, so inventoryComplete remains false: the banner labels this as configured
deployment usage, not a certified whole-team total. Known lower-bound usage can
still trigger warnings/stop; missing data never becomes a healthy zero.

Only seedStatus complete is treated as complete accounting. Unknown metric units,
malformed values, duplicate deployment IDs, missing/partial/stale samples and future
timestamps do not become complete/healthy totals. Samples expire after15minutes;
the UI reports unavailable/incomplete on failures without forwarding exception text.
Platform reporting may lag beyond the poll interval. This is not a billing forecast.

All windows are UTC calendar months. Old-month samples are excluded, not rewritten
to zero. Native monthly counters reset through Convex's normal window rollover;
the cumulative task journal and revocations never reset. A previous month's shared
stop does not block the new month. Invalid/stale peer inventory falls back to verified
DEV-only data; it does not invalidate DEV's independently verified call limit.

If native DEV call protection disappears or cannot be verified, the review wrapper
fails with TEAM_BUDGET_UNVERIFIED until verification succeeds. It does not secretly
reinstate the tiny task cap as a monthly budget. Inspection endpoints remain usable
for re-verification. Provider100-request/64MiB bounds are unchanged.

## Private configuration

The ignored worktree .env.local contains existing DEV bindings plus:

```dotenv
CONVEX_USAGE_DEPLOY_KEY=<private production credential, never commit>
TIKR_USAGE_ALLOW_PEER_READS=explicit
TIKR_USAGE_INVENTORY_FILE=<absolute private inventory JSON path>
```

The credential may be deployment-capable; the usage monitor does not turn it into
a least-privilege token. Code permits only the authorized usage GET, rejects other
peer URLs/methods/paths, denies redirects, never exposes the key and never changes
production configuration. Do not put it in NEXT_PUBLIC variables, process arguments,
logs or public JSON. It is not CONVEX_DEPLOY_KEY and does not change CLI deploy target.

Inventory format (no credentials in this file):

```json
{
  "version": 1,
  "reviewedMonth": "2026-11",
  "inventoryComplete": false,
  "expected": ["dev", "production"],
  "peers": [{
    "id": "production",
    "url": "https://warmhearted-tapir-205.convex.cloud",
    "keyEnv": "CONVEX_USAGE_DEPLOY_KEY"
  }]
}
```

Only mark inventoryComplete true after verifying every team deployment/project
is represented, including previews/other developers. Add separately authorized
usage-only peers and environment key references; never infer absent usage is zero.
Review the inventory each month. Samples are saved atomically at
%LOCALAPPDATA%/Tikr/usage/snapshot.json with no credentials or financial bodies.

## Verification and current limits

Seven focused synthetic Node tests cover exact35/45/50 boundaries, metric independence,
aggregation, UTC rollover, duplicates, incomplete/stale/backfill/unit validation,
native-call versus fractional-I/O protection, private peer opt-in, sanitized persistence,
and strict peer method/path restrictions. Lint/types and credential-cleared production
build pass. The actual private endpoint reports native calls protected and native
fractional I/O unprotected, rather than claiming both.

Isolated browser checks pass for the real coverage state and simulated warning,
urgent and stop states, plus390px overflow. No portfolio history request or Alpaca
request was used. Production credentials were not found in public static bundles;
the credential-cleared build contains no .env.local. Artifacts:
%TEMP%/tikr-usage-ui-check.json and tikr-usage-banner-mobile.png.

The earlier financial/recovery acceptance is separate. No full live matrix was
repeated. Next-day live test6 stays skipped. No commit/push/PR or production mutation.
Source is ready for review, but the50% native I/O and full-team enforcement claims
remain explicitly blocked by the platform/inventory limitations above.

References checked against installed CLI and official docs:
[usage limits](https://docs.convex.dev/production/usage-limits),
[current usage API](https://docs.convex.dev/deployment-api/get-current-usage),
[CLI usage limit settings](https://docs.convex.dev/cli/reference/deployment).
