# Private Alpaca validation harness

Implementation branch is `feat/alpaca-real-data-validation`, based on app main `a55bbcc`. The harness evaluates bounded samples against the existing adapter and approved offline backtest contract.

## Completed six-case investigation (2026-11-03 local)

All prepared cases were captured and reviewed within 12 total authenticated data-only requests. The 53 closes agree numerically with independent references at their documented precision; exact event fields, session sets, IPO boundary and DST mapping were checked. Full methodology acceptance remains blocked and the engine was withheld. See `alpaca-real-data-review.md` for the verdict and provider evidence requirements. The issuer workbook now independently confirms the previously provisional SPY distribution seed; matching feed semantics and the other acceptance gates remain separate. Earlier implementation-stage and first-sample notes below are historical.

## First authorized live sample (2026-11-03 local)

Owner authorized privately loading the existing Alpaca credentials and one bounded data-only sample, with outputs outside synced storage. `nvda-split` captured at `2026-11-04T03:31:19.312Z` using SIP raw history. It used **2 requests**, received 1,061 response bytes, and returned three daily bars each for NVDA and SPY plus one NVIDIA 10-for-1 split effective 2024-06-10. Numeric fidelity, proposed session coverage, reference-event matching and bounded action scope passed. Saved snapshot integrity and offline replay passed; protected local output ACL was independently checked. Credentials were not displayed or saved in reports, source or commands. No trading endpoints were used.

Overall result is **unresolved**, not accepted market data. Independent price references, analyst review, calendar/finality and per-symbol completeness/inception/access evidence are still missing. The engine calculation was withheld. Next: independently assess these recorded observations and provider evidence before another capture or engine execution. No further authenticated requests were made. This live checkpoint supersedes the earlier no-authenticated-requests statements below, which describe the implementation stage.

## Commands

Run from this worktree after a frozen-lockfile dependency install.

```powershell
node --conditions=react-server --experimental-strip-types scripts/validate-alpaca-data.mjs list
node --conditions=react-server --experimental-strip-types scripts/validate-alpaca-data.mjs capture --case=nvda-split
node --conditions=react-server --experimental-strip-types scripts/validate-alpaca-data.mjs replay --case=nvda-split --snapshot=C:\private\snapshot.json
node --conditions=react-server --experimental-strip-types scripts/validate-alpaca-data.mjs replay --case=nvda-split --snapshot=C:\private\snapshot.json --review=C:\private\review.json
```

Capture requires owner-authorized process configuration: `ALPACA_PRIVATE_VALIDATION=explicit`, `ALPACA_KEY_ID`, `ALPACA_SECRET_KEY`, an explicit `ALPACA_FEED=sip` or `iex`, and `ALPACA_PRIVATE_STORAGE_ACK=local-private-no-sync`. The storage acknowledgment confirms that this local output location is excluded from cloud synchronization and shared backup policies. Inject secrets through a private local process configuration. The CLI does not load dotenv files. Keep credentials out of commands, chat, source, fixtures and logs. Access to the protected app environment files needs the owner's specific authorization.

Exit codes are 0 for a passed bounded sample with reviewed evidence, 1 for failure/invalid input and 2 for unresolved evidence or absent private configuration. Console output contains status summaries and an output path. Arbitrary exceptions, provider error bodies and credential headers are excluded.

## Capture and replay

Each run writes a UUID directory under `%LOCALAPPDATA%\Tikr\alpaca-validation`, outside the checkout and ordinary OneDrive roots, with `report.json` and incomplete `review-template.json`. Capture additionally writes `snapshot.json`. This Windows-only output helper protects each new directory with an inheritance-disabled ACL granting the current account and SYSTEM full control, verifies the resulting rules, and runs before authenticated capture. Files inherit that ACL and are written exclusively. Replay performs no network requests. Known OneDrive roots and reparse/symlink ancestors are rejected. A credential-free child process applies permissions. Administrators can take ownership, and arbitrary backup/sync software cannot be detected by this helper; the capture acknowledgment is an owner attestation about that policy, not a technical guarantee against all copying. Failed permission setup stops the run; an empty UUID directory may remain for diagnosis.

Snapshots preserve exact UTF-8 response bodies, hashes, fixed-host request URLs, query/case identity, retrieval time and actual request/byte counts. Credentials are excluded. Successful responses echoing supplied credentials are rejected before recording; HTTP error bodies are discarded. Invalid UTF-8 or a lossy round trip fails. Replay rejects changed bodies, invalid/future timestamps, inconsistent counters, unexpected URL/query/order, missing or unused pages, and different case hashes.

Hard limits per invocation are 12 requests, 2 MiB per response, 8 MiB aggregate bytes, 16,384 chunks per response and six pages per endpoint, with adapter retries disabled. Existing adapter record limits apply. Cancellation interrupts stalled reads without waiting for uncooperative stream cancellation. Local JSON inputs are bounded to 64 MiB before parsing. These are per-run bounds; an account-wide daily budget remains separate. Injected transports are trusted server code and receive credential headers.

## Cases and sources

Case definitions in `scripts/lib/alpaca-cases.mjs` precede provider capture. Every case requires a dated analyst review of its sources, price basis and proposed sessions.

| Case               | Seed/reference check                                           | Source and remaining review                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spy-distribution` | Ex-date 2026-09-18, payment 2026-10-30, USD 1.888834 per share | [Issuer distribution table](https://www.ssga.com/us/en/individual/resources/documents/etf-dividend-distributions). This dynamic-table seed requires reinspection. The proposed weekday sessions are not verified 2026 exchange-calendar evidence.       |
| `nvda-split`       | Ten-for-one split, post-split session 2024-06-10               | [Issuer FAQ](https://s201.q4cdn.com/141608511/files/doc_downloads/2024/05/NVIDIA-2024-Stock-Split-FAQ.pdf), pages 1 and 2, distinguishes after-close effectiveness on June 7 from the post-split June 10 session. Verify actual provider normalization. |
| `rddt-inception`   | First trading date 2024-03-21                                  | [Issuer actual-trading announcement](https://redditinc.com/news/reddit-is-now-a-publicly-traded-company-on-the-new-york-stock-exchange). An empty provider response cannot establish inception or access.                                               |
| `nyse-holiday`     | May 27, 2024 closed                                            | [NYSE 2024 calendar](https://www.nyse.com/publicdocs/ICE_NYSE_2024_Yearly_Trading_Calendar.pdf). Verify all proposed sessions and provider coverage.                                                                                                    |
| `nyse-half-day`    | November 28 closed; November 29 early close                    | Same exchange calendar. Provider close/finality evidence is separate.                                                                                                                                                                                   |
| `nyse-dst`         | March 8 and March 11 session mapping                           | Same calendar and [Alpaca aggregation rules](https://docs.alpaca.markets/us/docs/market-data-faq). Check actual UTC timestamps and eligible close semantics.                                                                                            |

Bounded oracles support one 100%-weighted holding and a same-amount SPY benchmark, at most one dividend per asset, and ordinary splits. Extra, unsupported or out-of-period actions require investigation and are not dropped. These samples do not certify arbitrary portfolios or five-year history.

## Evidence and price review

The report distinguishes observed matches from unresolved evidence. Matching proposed sessions is an observation, not independent calendar proof. Complete pagination establishes traversal. [Alpaca corporate actions](https://docs.alpaca.markets/us/reference/corporateactions-1) are selected by process date and may arrive late. A backtest window may omit relevant process dates or later corrections. Missing reference events fail that bounded sample; investigate query scope before concluding that the provider lacks the event.

Review the raw snapshot, issuer/exchange references, calendar, close semantics and independent prices. Complete the generated review record with the supplied `caseHash` and `snapshotHash`, reviewer identity, canonical ISO UTC `reviewedAt`, and the verified source URLs. Review of one capture cannot unblock another capture.

`comparisonPrices` supplies a record for every observed symbol/date. Each entry contains positive decimal-string `price`, independent HTTPS `source`, matching `feed`, `basis: raw-matching-feed-close`, and canonical ISO UTC `checkedAt`. Alpaca-hosted sources, absent records, mixed feeds and mismatched bases remain unresolved. Numerical disagreements fail and appear as private discrepancy rows. Comparisons are exact at supplied decimal precision. Resolve rounding/publication and close-definition differences explicitly instead of widening tolerance. Source authenticity and matching close semantics are assessed by the reviewer. Comparing engine and oracle using the same Alpaca price cannot validate that price, hence this separate requirement.

`evidence` follows the existing adapter shape. Global `calendar`/`finality` and per-symbol `actions`, `inception`, `prices`, `access`, and required `dividendUnits` proofs need verified status, source, method, and covering `from`/`through` dates. Inception includes genuine `firstAvailable`; dividend units specify `basis: postSplit`. Explain the independent evidence in source/method text. The template deliberately contains empty entries; never label unknown evidence verified to bypass a blocker.

Evidence records are trusted reviewer attestations, not digitally authenticated issuer proof. Code checks shape, consistency and snapshot binding; it cannot establish their truth. Finality needs a defensible provider rule and correction policy. Repeated identical responses demonstrate observed stability only. Public/shared rights, retention, cache budgets and production integration keep separate gates. Keep raw observations and derived reports in the protected local output location; share synthetic fixtures unless redistribution is established.

## Independent calculation

The oracle uses reduced BigInt fractions; the application engine uses decimal.js. Prewritten oracle tests preceded harness comparisons. Closed-form shares combine initial shares, entitlement-date split factors, fixed cash entitlement, payment-close price and subsequent split factors, independently of the engine's mutable receivable loop.

The synthetic payment example begins with one share at 100, accrues 2 at an ex-date close of 101 and settles at payment close 110. Exact expected values are 100, 103, 112; final shares 56/55; return 3/25. Further fixtures cover unpaid entitlement, ex-date entry, non-session settlement, simultaneous split/dividend, neutral forward/reverse splits and signed drawdown.

The report compares every daily value and receivable, final shares, ending value, total return, signed drawdown and SPY return difference. Private daily comparison rows show expected exact fractions and actual decimals. Calculation tolerance is 1e-30 absolute plus 1e-32 times expected magnitude for these bounded cases, not a universal error bound. Exact lexical JSON numbers are compared with JavaScript Number's decimal representation before calculation; precision changes fail.

## Verification and remaining live work

Local checks passed 64 tests, including 25 new harness/oracle checks. All five existing engine mutation probes were killed. Lint/typecheck, focused formatting/whitespace and a production build passed. The build used an allowlisted environment with SKIP_ENV_VALIDATION=1 and only .env.example present by filename. Initial independent review required stronger Windows output protection. Outputs now use local storage with verified Windows ACLs; revised independent review accepted the bounded offline harness with no remaining blocking findings. The reviewer independently passed all 25 new tests, including directory/file ACL inspection and synthetic CLI replay, with all nine frozen hashes matching at both ends. The reviewer completed revised-source coverage and rechecked unchanged previously reviewed modules. This completion note and the plan checkpoint are documentation-only updates after that source review.

The private capture command blocks in a cleared environment. No authenticated provider request has run. Automatic approval review rejected inspecting the protected app environment files under its credential-access rule. Loading those credentials for bounded data-only requests requires owner approval. Actual provider price comparisons, completed-bar semantics and action completeness therefore remain unresolved.
