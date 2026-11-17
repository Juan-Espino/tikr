import type { Config } from "../../src/lib/alpaca/adapter.ts";
import type { Portfolio, Calendar, Preset } from "../../src/lib/backtest.ts";
import type { BacktestRequest } from "../../src/lib/market-cache.ts";
import type { MarketStorage, Stored } from "../../src/lib/market-storage.ts";
import type { HistoryChunk } from "../../src/lib/market-history-wire.ts";
import { createDurableBacktests } from "../../src/lib/durable-market.ts";
import { withDisposableHistory } from "../../src/lib/market-history-storage.ts";
import { withProcessResults } from "../../src/lib/market-result-memory.ts";
import { fetchCandidates } from "../../src/lib/alpaca/adapter.ts";
import { createPersonalLoader } from "../../src/lib/alpaca/personal-loader.ts";
import { createBatchedPersonalLoader } from "../../src/lib/alpaca/batched-loader.ts";
import {
  createProviderMeasurement,
  measuredTransport,
} from "../../src/lib/provider-measurement.ts";
export const symbols = [
  "AAA",
  "BBB",
  "CCC",
  "DDD",
  "EEE",
  "FFF",
  "GGG",
  "HHH",
  "III",
  "SPY",
];
export const sessions: string[] = [];
let weekdays = 0;
for (
  let time = Date.parse("2021-10-25");
  time <= Date.parse("2026-11-11");
  time += 86400000
) {
  const day = new Date(time);
  if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
  if (++weekdays % 21 !== 0) sessions.push(day.toISOString().slice(0, 10));
}
export const portfolios: Portfolio[] = [0, 1, 2].map((i) => ({
  id: `fixture-${i}`,
  holdings: [0, 1, 2].map((j) => ({
    symbol: symbols[i * 3 + j]!,
    weight: j === 2 ? "33.34" : "33.33",
  })),
}));
export function createFixture(
  mode = "after",
  identifier = "fixture",
  settings: { symbols?: string[]; delayMs?: number } = {},
) {
  let evidenceUntil = Date.parse("2026-12-01");
  let now = new Date("2026-11-11T15:00:00Z"),
    epoch = 0,
    revision = 0;
  let revoked = false,
    fail: string | undefined,
    pageSize = 10000;
  const rows = new Map<string, Stored>(),
    leases = new Map<
      string,
      { active: boolean; cycle: string; from?: string; completed?: boolean }
    >(),
    guards = new Set();
  const provider = createProviderMeasurement();
  const database = {
    readCalls: 0,
    requestedKeys: 0,
    returnedDocuments: 0,
    readPayloadBytes: 0,
    writeCalls: 0,
    writtenDocuments: 0,
    writePayloadBytes: 0,
    leaseCalls: 0,
    guardChecks: 0,
  };
  const calendar: Calendar = {
    from: "2021-10-25",
    through: "2026-11-12",
    sessions,
    complete: true,
    finalityVerified: true,
    provenance: "DETERMINISTIC SYNTHETIC QA; not exchange evidence",
  };
  const config: Config = {
    keyId: "synthetic",
    secret: "synthetic",
    retries: 0,
    maxPages: 8,
    maxTotalBars: 1300,
    maxTotalBytes: 8 * 1024 * 1024,
    transport: measuredTransport(
      async (url) => {
        if (fail === "throttle") return new Response("{}", { status: 429 });
        const u = new URL(
          typeof url === "string"
            ? url
            : url instanceof URL
              ? url.href
              : url.url,
        );
        const requested = u.searchParams.get("symbols")!.split(",");
        if (settings.delayMs && requested.includes("SPY"))
          await new Promise((resolve) => setTimeout(resolve, settings.delayMs));
        const start = u.searchParams.get("start")!.slice(0, 10),
          end = u.searchParams.get("end")!.slice(0, 10);
        if (u.pathname.endsWith("/bars")) {
          const records = requested.flatMap((symbol) =>
            sessions
              .filter(
                (day) =>
                  day >= start &&
                  day <= end &&
                  !(fail === "partial" && symbol === "AAA" && day === start),
              )
              .map((day) => ({
                symbol,
                t: `${day}T05:00:00Z`,
                c:
                  100 +
                  symbols.indexOf(symbol) * 3 +
                  sessions.indexOf(day) * 0.01 +
                  (revision && symbol === "AAA" ? 1 : 0),
              })),
          );
          const offset = Number(u.searchParams.get("page_token") ?? 0);
          const page = records.slice(offset, offset + pageSize);
          const bars: Record<string, { t: string; c: number }[]> = {};
          for (const { symbol, ...bar } of page)
            (bars[symbol] ??= []).push(bar);
          return Response.json({
            bars,
            next_page_token:
              offset + pageSize < records.length
                ? String(offset + pageSize)
                : null,
          });
        }
        const corporate_actions =
          fail === "unsupported"
            ? {
                spin_offs: [
                  {
                    id: "unsupported",
                    symbol: "AAA",
                    ex_date: start,
                    process_date: start,
                  },
                ],
              }
            : {};
        return Response.json({ corporate_actions, next_page_token: null });
      },
      provider,
      async () => undefined,
    ),
  };
  const loader =
    mode === "before"
      ? createPersonalLoader(config, calendar, fetchCandidates, false)
      : createBatchedPersonalLoader(config, calendar);
  const store: MarketStorage = {
    namespace: identifier,
    async revoke() {
      revoked = true;
    },
    async assertReadable(selected) {
      database.guardChecks++;
      if (revoked) throw Error("EVIDENCE_REVOKED");
      if (selected.some((s) => guards.has(s))) throw Error("REFRESH_GUARDED");
    },
    async beginRefresh(symbol) {
      guards.add(symbol);
      return async () => {
        guards.delete(symbol);
      };
    },
    async read(keys) {
      database.readCalls++;
      database.requestedKeys += keys.length;
      const found = keys
        .map((k) => rows.get(k))
        .filter((row): row is Stored => row !== undefined)
        .map((row) => structuredClone(row));
      database.returnedDocuments += found.length;
      database.readPayloadBytes += Buffer.byteLength(JSON.stringify(found));
      return found;
    },
    async acquire(key, cycle, retry, from) {
      database.leaseCalls++;
      const old = leases.get(key);
      if (old?.active) return null;
      if (
        old?.cycle === cycle &&
        !retry &&
        !(old.completed && from && old.from && from < old.from)
      )
        return null;
      leases.set(key, { active: true, cycle, from });
      return "synthetic-token";
    },
    async write(key, token, values) {
      database.writeCalls++;
      database.writtenDocuments += values.length;
      database.writePayloadBytes += Buffer.byteLength(JSON.stringify(values));
      for (const row of values) {
        for (const dep of row.dependencies)
          if (rows.get(dep.key)?.revision !== dep.revision)
            throw Error("REVISION_CHANGED");
        rows.set(row.key, {
          ...structuredClone(row),
          checkedAt: now.valueOf(),
        });
      }
      const lease = leases.get(key);
      if (lease) {
        lease.active = false;
        lease.completed = true;
      }
    },
    async release(key) {
      const lease = leases.get(key);
      if (lease) lease.active = false;
    },
  };
  async function run(
    request: Omit<BacktestRequest, "start" | "end">,
    range: Preset = "1W",
    retry = false,
    hints: HistoryChunk[] = [],
  ) {
    const history =
      mode === "after"
        ? withDisposableHistory(
            { ...store, namespace: `${identifier}:process${epoch}` },
            hints,
            () => now.valueOf(),
          )
        : undefined;
    const storage = history
      ? withProcessResults(
          history.storage,
          `${identifier}:process${epoch}`,
          () => now.valueOf(),
        )
      : store;
    const job = await createDurableBacktests({
      storage,
      calendar: () => calendar,
      load: loader,
      supportedSymbols: settings.symbols ?? symbols,
      historyStart: calendar.from,
      clock: () => now,
      evidenceRevision: "synthetic-stable-policy",
      evidenceValidUntil: () => evidenceUntil,
    })(request, range, retry);
    const final = await job.settled;
    return { final, history: history?.exported() ?? [] };
  }
  return {
    run,
    rows,
    provider,
    database,
    store,
    calendar,
    expires: () => evidenceUntil,
    setEvidenceUntil(value: string) {
      evidenceUntil = Date.parse(value);
    },
    setNow(value: string) {
      now = new Date(value);
    },
    restart() {
      epoch++;
    },
    setFailure(value: string) {
      fail = value;
    },
    setPageSize(value: number) {
      pageSize = value;
    },
    correct() {
      revision++;
    },
    revoke() {
      revoked = true;
    },
  };
}
