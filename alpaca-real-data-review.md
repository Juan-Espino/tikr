# Alpaca real-data validation review

## Evidence assessment and acceptance gate (2026-11-05)

**Decision: no-go for engine acceptance.** The six existing captures remain unaccepted. Their prior integrity replay and numerical comparisons are useful bounded observations, not proof of matching feed semantics, finality, or exhaustive actions. No new private replay or provider request was performed in this assessment.

Current primary documentation narrows the remaining questions:

- [Alpaca's aggregation FAQ](https://docs.alpaca.markets/us/docs/market-data-faq) describes New York daily intervals and tape- and condition-dependent trade eligibility. The existing exact NVDA examples and cent-rounded comparisons do not establish that their reference feeds apply the same rules. Acceptance needs a documented equivalent independent SIP daily-close reference, including eligible trades and precision, or an independently reproducible reconstruction with appropriate licensed trade data.
- The [real-time data documentation](https://docs.alpaca.markets/us/v1.1/docs/real-time-stock-pricing-data) describes evolving daily bars and late-trade updates. It does not establish a historical-bar finality guarantee at 09:00. The approved next-day cutoff and five-session recheck remain operational minimums, not proof of finality; acceptance also needs a supported as-of and revision-detection procedure covering older corrections, half-days and DST.
- The [corporate-actions endpoint](https://docs.alpaca.markets/us/reference/corporateactions-1) filters by process date, supports `data_quality=all`, and explicitly disclaims creation-time guarantees. Exhausting pages within an ex-date-shaped window cannot prove exhaustive ex-date coverage. Its documented event types include unsupported actions that must block. A [corporate-action event stream](https://docs.alpaca.markets/us/reference/subscribetocorporateactionseventssse) describes updates and historical replay; its retention, completeness, correction/cancellation semantics, entitlement, and relationship to the endpoint have not been established. Do not assume it resolves the gap.

For each asset and requested interval, acceptance requires dated, source-bound evidence of identity and coverage, complete common sessions and eligible raw SIP closes, a defensible as-of/revision process, and exhaustive action discovery including late changes and unsupported events. Each supported action requires verified effective/ex/pay dates and units, including split/dividend ordering; ambiguous or missing evidence fails closed. Proof must bind to the captured revision and expire under the existing loader policy. The five-session recheck alone does not satisfy broader reconciliation.

Next: obtain authoritative provider clarification on matching-close reconstruction, historical correction discovery, action process-date coverage and event-stream retention/completeness, including concurrent split/dividend units. Identify an independently permitted matching reference. Review those answers against each capture before issuing any proof or running the engine oracle. Drafting or sending a provider inquiry requires separate authorization. Public/shared rights and Convex team headroom remain separate gates.

Reviewed 2026-11-03 local (captures and assessment dated 2026-11-04 UTC). **Full methodology acceptance remains blocked.** Six prepared live cases were exercised and their recorded evidence assessed. This is a completed bounded investigation with unresolved prerequisites, not a passing real-data engine result or production certification.

## Executed scope and results

The owner authorized private credential loading and full validation. Twelve total authenticated data-only requests were used across all six cases, including the original two-request NVIDIA capture. Responses totaled 7,056 bytes and contained 53 daily bars and two expected corporate actions. No trading endpoint, paid service, backend integration, commit, push or deployment was used. Main checkout and credential files were unchanged. Output directories and saved evidence files were checked for owner/SYSTEM-only Windows access, outside the repository and ordinary OneDrive storage.

| Case | Observed bars | Bounded observations |
| --- | ---: | --- |
| NVIDIA split | 6 | Three NVDA and three SPY sessions; 10-for-1 split effective for June 10, 2024 trading agrees with issuer facts. All three NVDA closes exactly match the independent vendor's published unadjusted examples. |
| SPY distribution | 32 | Captured ex-date, payment date and amount match the issuer workbook. All proposed session dates returned. This does not yet validate payment-date reinvestment by the engine. |
| Reddit inception | 7 | RDDT starts March 21, 2024, while SPY includes March 20; issuer confirms actual trading began March 21. The engine's common-start behavior was not exercised on live inputs. |
| NYSE holiday | 3 | May 27, 2024 absent; May 24, 28 and 29 present. |
| NYSE half-day | 3 | November 28 absent and November 29 present. A daily date alone does not establish the early closing time or bar finality. |
| DST | 2 | March 8 daily timestamp is 05:00 UTC; March 11 is 04:00 UTC, both New York midnight. |

All six snapshots passed integrity checks and credential-free replay. Numeric-token fidelity, proposed-session coverage, seeded-event matching and bounded action-scope checks passed. None was granted full engine-input acceptance.

Independent numerical observations cover all 53 closes: three NVDA closes matched exact decimal examples published by Massive; the other 50 agreed at USD cent precision with Yahoo's unadjusted quote-close series. Each Yahoo number equaled the float32 representation of the comparison cent price. This is an explicitly recorded representation check, not a widened engine tolerance or proof of identical full-precision SIP semantics. Exact decimal comparisons ignore trailing-zero formatting. Preliminary private string-comparison summaries falsely classified formatting differences; corrected reviewed summaries explicitly supersede them. No numerical disagreement remains in the reviewed comparisons.

## Primary-source checks

- [NVIDIA split FAQ](https://investor.nvidia.com/files/doc_downloads/2024/05/NVIDIA-2024-Stock-Split-FAQ.pdf): additional shares distributed after June 7 close and post-split trading June 10. Its next ex-dividend date is June 11, outside this split sample.
- [Independent vendor unadjusted examples](https://massive.com/blog/using-the-split-api-endpoint-to-handle-the-nvidia-stock-split): June 6, 7 and 10 NVDA closes compared exactly. This is finite example evidence, not certification of all vendor bars.
- [NYSE 2024 calendar](https://www.nyse.com/publicdocs/ICE_NYSE_2024_Yearly_Trading_Calendar.pdf) and [Nasdaq 2024 calendar](https://www.nasdaqtrader.com/content/technicalsupport/2024tradingcalendar.pdf) support the proposed schedule. [Nasdaq's 2026 holiday schedule](https://www.nasdaqtrader.com/Trader.aspx?id=Calendar) lists no closure within the SPY September 17–October 30 window. Calendar schedule and provider completion remain distinct.
- [Reddit actual-trading announcement](https://redditinc.com/news/reddit-is-now-a-publicly-traded-company-on-the-new-york-stock-exchange) confirms March 21, 2024. [NVIDIA issuer FAQ](https://investor.nvidia.com/investor-resources/faqs/) records its 1999 IPO. [NYSE/ICE's SPY anniversary](https://ir.theice.com/press/news-details/2013/NYSE-Euronext-Celebrates-20-Years-of-Exchange-Traded-Product-ETP-Listing-and-Trading/default.aspx) records January 29, 1993 inaugural listing, distinct from January 22 fund seeding. These do not prove Alpaca coverage back to inception.
- [State Street historical distributions workbook](https://www.ssga.com/library-content/products/fund-data/etfs/us/spdr-etf-historical-distributions.xlsx): downloaded read-only; sheet `dividend`, row 9191, columns B–I confirms SPY's September 18, 2026 ex-date, October 30 payment and seeded amount. Exact issuer/provider field comparisons passed. Workbook SHA256: `4add18439e505ba6c114bea5d352ac68b1ea5420bc99abdf2e21500dd6f1faa2`. Private source copy and cell-level comparison retained. This resolves the earlier provisional distribution seed for this capture.
- [Yahoo historical reference](https://finance.yahoo.com/quote/SPY/history/): public chart responses saved privately for all case dates and RDDT. Unadjusted quote.close was used, never adjusted close. Source binary representation and unverified feed equivalence are recorded. Public Nasdaq historical queries were also attempted; corrected ISO date requests returned no historical rows and were not treated as evidence of missing market history.

## Blocking acceptance requirements

1. **Matching close definition.** [Alpaca aggregation rules](https://docs.alpaca.markets/us/docs/market-data-faq) use SIP trade conditions. A listing-exchange official close, another vendor's eligible last sale, and a rounded public quote are not automatically identical. Numerical agreement is observed; the required matching-feed/eligible-close equivalence remains unverified.
2. **Completed bars and corrections.** Establish a defensible operational cutoff and correction/revision policy for normal sessions, half-days and DST. Historical age and matching values alone are insufficient. [Alpaca community guidance](https://forum.alpaca.markets/t/stockbarsrequest-updated-data/14032) discusses typical overnight finalization and later updates; it is not a validated application policy or guaranteed cutoff. Permanent immutability is not required: a justified as-of policy plus correction handling is needed.
3. **Corporate-action coverage.** [Alpaca corporate-action documentation](https://docs.alpaca.markets/us/reference/corporateactions-1) selects by process date and warns of ingestion/availability delays. Returned expected events, exhausted pagination and an issuer dividend list do not establish exhaustive ex-date coverage, late corrections/cancellations or every unsupported event type. Same-day split/dividend unit normalization also remains untested with live inputs.

The engine remains withheld rather than receiving invented verified proofs. Live payment-date reinvestment, common-period results and benchmark metrics are therefore **not accepted**. Five-year coverage, arbitrary portfolios, resource-limit numerical error bounds, cache/refresh costs and public/shared rights are outside this bounded run and remain unverified.

## Next concrete work

Obtain documented provider answers about eligible daily-close semantics, completed-bar timing/corrections, and reconstructing exhaustive ex-date action history from process-date queries. Reconcile the independent reference basis, define and review the resulting adapter evidence policy, and only then replay these existing snapshots through the evidence-gated engine and exact oracle. A second capture cannot substitute for those answers. Do not weaken the approved methodology or treat every historical revision as forbidden. No additional credentials, requests or policy changes are required merely to discuss these decisions.

Raw captures, source responses, issuer workbook, reviewed comparisons, hashes and blocked-assessment JSON remain in protected LocalAppData. This document intentionally omits raw captured prices, credentials and the private directory manifest.
