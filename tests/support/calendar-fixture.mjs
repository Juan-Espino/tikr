import {
  fetchPersonalCalendar,
  createPersonalLoader,
} from "../../src/lib/alpaca/personal-loader.ts";
import { createDurableBacktests } from "../../src/lib/durable-market.ts";

// Isolated synthetic transport and revision-checked memory store; no remote access or owner state.
export function calendarFixture(
  dates,
  instant,
  start = dates[0],
  end = instant.slice(0, 10),
) {
  let now = new Date(instant),
    calendar,
    calls = 0,
    missing = false;
  const rows = new Map(),
    locks = new Set();
  const storage = {
    async assertReadable() {},
    async read(keys) {
      return keys
        .map((k) => rows.get(k))
        .filter(Boolean)
        .map((r) => structuredClone(r));
    },
    async acquire(key) {
      if (locks.has(key)) return null;
      locks.add(key);
      return "fixture";
    },
    async write(key, token, entries) {
      for (const e of entries) {
        if (
          e.dependencies.some((d) => rows.get(d.key)?.revision !== d.revision)
        )
          throw Error("REVISION_CHANGED");
        rows.set(e.key, { ...structuredClone(e), checkedAt: now.valueOf() });
      }
    },
    async release(key) {
      locks.delete(key);
    },
    async beginRefresh() {
      return async () => {};
    },
  };
  const config = {
    keyId: "synthetic",
    secret: "synthetic",
    retries: 0,
    transport: async (url) => {
      const u = new URL(url);
      if (u.pathname === "/v2/calendar")
        return Response.json(dates.map((date) => ({ date })));
      throw Error("Unexpected fixture destination");
    },
  };
  const candidates = async (_config, q) => {
    calls++;
    return {
      symbols: q.symbols,
      start: q.start,
      end: q.end,
      prices: Object.fromEntries(
        q.symbols.map((symbol) => [
          symbol,
          Object.fromEntries(
            dates
              .filter(
                (d) => d >= q.start && d <= q.end && !(missing && d === q.end),
              )
              .map((d, i) => [d, String(100 + i)]),
          ),
        ]),
      ),
      actions: [],
      evidence: { barsTraversal: "complete", actionsTraversal: "complete" },
    };
  };
  const options = () => ({
    storage,
    calendar: () => calendar,
    supportedSymbols: ["AAA", "BBB", "SPY"],
    historyStart: start,
    clock: () => now,
    evidenceValidUntil: () => now.valueOf() + 86400000,
    load: createPersonalLoader(config, calendar, candidates),
  });
  return {
    async calendar() {
      calendar = await fetchPersonalCalendar(config, start, end, now);
      return calendar;
    },
    run: async (request, range = "1W") =>
      createDurableBacktests(options())(request, range),
    calls: () => calls,
    rows,
    setCalendar: (value) => (calendar = value),
    setMissing: (value) => (missing = value),
    setNow: (value) => (now = new Date(value)),
  };
}
