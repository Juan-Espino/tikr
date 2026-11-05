// Case facts are fixed before fetching prices. Every case still requires an
// analyst review of the source and proposed calendar before engine execution.
const nyse =
  "https://www.nyse.com/publicdocs/ICE_NYSE_2024_Yearly_Trading_Calendar.pdf";
function weekdays(start, end, holidays = []) {
  const result = [];
  for (
    let day = new Date(start + "T12:00:00Z");
    day.toISOString().slice(0, 10) <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const value = day.toISOString().slice(0, 10);
    if (![0, 6].includes(day.getUTCDay()) && !holidays.includes(value))
      result.push(value);
  }
  return result;
}
export const cases = [
  {
    id: "spy-distribution",
    holding: "SPY",
    start: "2026-09-17",
    end: "2026-10-30",
    sessions: weekdays("2026-09-17", "2026-10-30"),
    references: [
      "https://www.ssga.com/us/en/individual/resources/documents/etf-dividend-distributions",
    ],
    referenceNote:
      "Seed from issuer distribution table; reviewer must reopen the current table and independently verify the 2026 exchange calendar. Proposed weekday sessions are not calendar evidence.",
    expectedActions: [
      {
        symbol: "SPY",
        kind: "cash_dividends",
        date: "2026-09-18",
        paymentDate: "2026-10-30",
        amount: "1.888834",
      },
    ],
  },
  {
    id: "nvda-split",
    holding: "NVDA",
    start: "2024-06-06",
    end: "2024-06-10",
    sessions: ["2024-06-06", "2024-06-07", "2024-06-10"],
    references: [
      nyse,
      "https://s201.q4cdn.com/141608511/files/doc_downloads/2024/05/NVIDIA-2024-Stock-Split-FAQ.pdf",
    ],
    referenceNote:
      "Issuer FAQ specifies ten-for-one after June 7 close and June 10 post-split trading. Confirm effective-date normalization against actual provider observations.",
    expectedActions: [
      {
        symbol: "NVDA",
        kind: "forward_splits",
        date: "2024-06-10",
        numerator: "10",
        denominator: "1",
      },
    ],
  },
  {
    id: "rddt-inception",
    holding: "RDDT",
    start: "2024-03-20",
    end: "2024-03-25",
    sessions: ["2024-03-20", "2024-03-21", "2024-03-22", "2024-03-25"],
    firstAvailable: { RDDT: "2024-03-21" },
    references: [
      nyse,
      "https://redditinc.com/news/reddit-is-now-a-publicly-traded-company-on-the-new-york-stock-exchange",
    ],
    referenceNote:
      "Issuer announcement on March 21 states trading has begun. An empty Alpaca response cannot establish inception or access.",
    expectedActions: [],
  },
  {
    id: "nyse-holiday",
    holding: "SPY",
    start: "2024-05-24",
    end: "2024-05-29",
    sessions: ["2024-05-24", "2024-05-28", "2024-05-29"],
    references: [nyse],
    referenceNote: "Memorial Day May 27 is a non-session.",
    expectedActions: [],
  },
  {
    id: "nyse-half-day",
    holding: "SPY",
    start: "2024-11-27",
    end: "2024-12-02",
    sessions: ["2024-11-27", "2024-11-29", "2024-12-02"],
    references: [nyse],
    referenceNote:
      "Thanksgiving November 28 is closed; November 29 is an early close. Session membership does not prove provider bar finality.",
    expectedActions: [],
  },
  {
    id: "nyse-dst",
    holding: "SPY",
    start: "2024-03-08",
    end: "2024-03-11",
    sessions: ["2024-03-08", "2024-03-11"],
    references: [nyse, "https://docs.alpaca.markets/us/docs/market-data-faq"],
    referenceNote:
      "New York day mapping crosses the DST transition. Verify bar timestamps and eligible close semantics separately.",
    expectedActions: [],
  },
].map((c) => ({
  ...c,
  symbols: [...new Set([c.holding, "SPY"])].sort(),
  amount: "10000",
}));
export function getCase(id) {
  const result = cases.find((c) => c.id === id);
  if (!result) throw new Error("Unknown validation case");
  return structuredClone(result);
}
