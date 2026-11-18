# Permanent account deletion: source implementation

Implementation and DEV review, 2026-11-17. Owner reports successful real DEV
account deletion followed by same-Google registration into a new empty account.
No production rollout or external-erasure verification occurred.
The account modal offers Cancel and Permanently delete account. Each confirmation
disables the permanent action for three seconds; this deliberation delay does not
replace server session freshness. Google itself is
not deleted. Subsequent registration gets a new identity; no portfolio email lookup
or recovery API exists.

## Actual retained-data inventory

| Store | Contents and deletion |
| --- | --- |
| Better Auth user | Name, email, verification flag, image, timestamps and optional identity fields; physically deleted last. |
| Better Auth account | Google provider/account IDs, scopes, OAuth credentials and expiry metadata; all userId-indexed links deleted in pages of 50. |
| Better Auth session | User ID, token, expiry/timestamps, optional IP/user agent; all userId-indexed sessions deleted in pages of 50. |
| Better Auth twoFactor | Not enabled; userId-indexed rows nevertheless drained. |
| portfolios | Definitions, names, client IDs, revisions and deleted/idempotency receipts; all deleted using owner prefix of by_ownerId_and_clientId, 50 per transaction. |
| discoveryUsage | Owner/day completed allowance and pending lease; owner prefix of by_ownerId_and_day, 50 per transaction. |
| discoveryRequests | Owner/request ID, prompt SHA-256, day, status and expiry/lease; owner prefix of by_ownerId_and_requestId, 50 per transaction. No raw prompt/output in these tables. |
| accountDeletions | Temporary user/owner/request capability and start time; removed with auth user at completion. No tombstone or user archive. |
| deletionCompletions | Random capability and expiry only, no identity/email/portfolio data. Ten-minute unlinked acknowledgement supports lost responses, then scheduled removal. Cannot recover an account. |
| Browser | Only the matching deleted account's versioned temporary trial is removed after completion. Legacy guest bytes and other-account trials remain. Private provider memory/queue is disposed after confirmation. |

Better Auth verification stores random OAuth state identifiers, PKCE and redirect
state. Ordinary Google sign-in state has no owner key. Email/password, email change,
email deletion verification and two-factor features are not enabled. Account linking
endpoints are explicitly refused so owner-bearing OAuth link state cannot be added.
Shared jwks and auth rate-limit state are not personal archives. No owner profile
table exists. Unowned tasks are unrelated demo data.

Shared marketEntries, marketLeases, marketBudget and marketHosted (including global
guards/revocations, catalogs, calendars, prices and counters) are preserved.

## Fences and transaction boundaries

The begin mutation accepts a session fence and random capability, never a victim ID
or email. It verifies the Better Auth live session, expiry and a five-minute
createdAt freshness window. This uses the same freshness basis as Better Auth's
deleteUser, narrowed from its default. Google reauthentication is user controlled.
A stale session returns reauth_required normally, without starting cleanup or
throwing an expected server error. The modal explains that nothing was deleted
and offers fresh sign-in. Only accepted or uncertain requests enter progress;
that recovery page has no new permanent-delete action.
The native unbounded deleteUser cascade remains disabled; cleanup uses supported
component adapter transactions. Existing cookie origin/CSRF checks remain enabled;
the mutation uses authenticated Convex JWT transport.

The begin transaction installs a deleting fence and schedules cleanup. Portfolio
reads/writes, AI usage/reservations/settlement and transactional auth session/account
create/update triggers reject the old identity. Triggers also require an existing
user after cleanup, preventing late provider/session writes without a permanent
tombstone. Each worker drains one bounded indexed batch and schedules continuation.
The user remains until sessions and links drain. The final parent mutation removes
the user and coordinator together; component calls are parent subtransactions.
Failures retain the fence and progress; the original random capability resumes work.
No client-selected identity is used for retries. Completion is never optimistic.
Fresh sign-in ends only the matching session and retains the deletion capability;
a pending/completed request cannot be abandoned via reauthentication. Returning
with a fresh session requires explicit confirmation and the original account ID.

## Privacy and operations: owner decisions needed

This inventory is not a final public privacy policy. Contact/controller details,
actual hosting logs, exports, backup settings and retention need owner confirmation.
Deleting live application rows cannot instantly purge external backups, provider logs
or legally retained infrastructure. No application recovery is offered. Operators
must establish a restore procedure that does not re-expose previously deleted users.

Groq receives discovery text and fixed instructions; account identity and portfolios
are not intentionally appended. [Official Groq data documentation](https://console.groq.com/docs/your-data)
describes retained usage metadata and possible reliability/abuse content logging.
Actual organization data controls were not inspected. [Service and model terms](https://console.groq.com/docs/legal/services-agreement)
apply; this is scoped research, not legal approval. [Convex backups](https://docs.convex.dev/database/backup-restore)
are separate snapshots; deleting live rows does not erase them. No project backup
or log infrastructure was accessed and no external-erasure guarantee is made.

The existing dividend assumption treats reported cash as USD per traded share/ADR,
retaining provider withholding without FX/ADR conversion or gross-up. This is an
owner assumption, not a provider guarantee. No financial engine, public market-data
rights, operational market quota, paid service or new abuse policy change is included.
AI remains limited to 20 completed searches/day with existing input/concurrency gates.

Synthetic A/B identity coverage is distinct from real Google testing. See plan.md
for executed checks and rollout gaps. Agents did not delete a real account. The
owner performed and confirmed DEV deletion and same-Google fresh empty registration;
no independent database-count assertion follows. Production actions require separate
approval.
