import { diagnose, providerCredentials } from "./market-diagnostics.ts";
import "server-only";
import { hosted, control } from "./market-hosted.ts";
import { open } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { createDurableBacktests } from "./durable-market.ts";
import {
  revision,
  convexStorage,
  chunks,
  readValue,
} from "./market-storage.ts";
import { createVerifiedLoader } from "./alpaca/verified-loader.ts";
import type { ReviewedAsset } from "./alpaca/verified-loader.ts";
import type { Calendar } from "./backtest.ts";
import { display, percent } from "./backtest.ts";
import Decimal from "decimal.js";
import type { MarketRequest, MarketResponse } from "./market-contract";
import type { CacheView } from "./market-cache.ts";
import { assets } from "./demo";
import { localAdmission } from "./market-admission.ts";
import {
  createAdmittedTransport,
  createPersonalLoader,
  fetchPersonalCalendar,
  PROVISIONAL_POLICY,
} from "./alpaca/personal-loader.ts";
import { freshnessCycle } from "./market-cache.ts";
import type { Config } from "./alpaca/adapter.ts";
let personalCalendar: { key: string; value: Promise<Calendar> } | undefined;
async function personalSource() {
  const { keyId, secret } = (() => {
    try {
      return providerCredentials();
    } catch (error) {
      diagnose("config", error);
      throw error;
    }
  })();
  // Retain reservations for all provider outcomes, pages and retries.
  const transport = createAdmittedTransport(async () => {
    if (hosted()) {
      await control("provider", "0".repeat(64));
      return;
    }
    await (await localAdmission()).reserve(2 * 1024 * 1024);
  });
  const config: Config = {
    keyId,
    secret,
    transport,
    retries: 0,
    maxPages: 8,
    maxTotalBytes: 8 * 1024 * 1024,
    maxTotalBars: 1300,
    maxTotalActions: 1000,
  };
  const now = new Date(),
    cycle = freshnessCycle(now);
  // Month-aligned five-year window keeps cache scopes stable within a month.
  const monthStart = `${Number(cycle.slice(0, 4)) - 5}${cycle.slice(4, 7)}-01`;
  // Include a boundary buffer when the latest completed session is in the prior month.
  const start = new Date(Date.parse(monthStart) - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const key = `${start}:${cycle}`;
  if (personalCalendar?.key !== key) {
    const value = (async () => {
      if (!hosted()) return fetchPersonalCalendar(config, start, cycle, now);
      const storage = convexStorage(
        "https://hosted.convex.cloud",
        "gateway",
        "0".repeat(64),
      );
      const cacheKey = "calendar:shared";
      const read = async () => {
        const head = (await storage.read([cacheKey]))[0];
        if (!head) return undefined;
        const saved = await readValue<{ key: string; calendar: Calendar }>(
          storage,
          head,
        );
        return saved.key === key ? saved.calendar : undefined;
      };
      const saved = await read();
      if (saved) return saved;
      const token = await storage.acquire(cacheKey, cycle, false);
      if (!token) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 400));
          const found = await read();
          if (found) return found;
        }
        throw Error("CALENDAR_BUSY");
      }
      try {
        const calendar = await fetchPersonalCalendar(config, start, cycle, now);
        await storage.write(
          cacheKey,
          token,
          chunks(cacheKey, { key, calendar }),
        );
        return calendar;
      } finally {
        await storage.release(cacheKey, token);
      }
    })();
    personalCalendar = { key, value };
    void value.catch(() => {
      if (personalCalendar?.value === value) personalCalendar = undefined;
    });
  }
  const calendar = await personalCalendar.value.catch((error: unknown) => {
    diagnose("calendar", error);
    throw error;
  });
  return {
    calendar,
    historyStart: start,
    load: createPersonalLoader(config, calendar),
    revision: revision({ policy: PROVISIONAL_POLICY, start }),
    expires: now.valueOf() + 24 * 60 * 60 * 1000,
  };
}
const Precise = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN,
});
type Bundle = {
  version: 1;
  calendar: Calendar;
  historyStart: string;
  reviews: Record<string, ReviewedAsset>;
};
async function bundle(): Promise<Bundle> {
  const file = process.env.TIKR_MARKET_EVIDENCE_FILE,
    expected = process.env.TIKR_MARKET_EVIDENCE_SHA256;
  if (
    !file ||
    !isAbsolute(file) ||
    !expected ||
    !/^[a-f0-9]{64}$/.test(expected)
  )
    throw new Error("EVIDENCE_REQUIRED");
  const handle = await open(
    file,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > 8_000_000)
      throw new Error("EVIDENCE_REQUIRED");
    const parts: Buffer[] = [];
    let total = 0;
    while (true) {
      const chunk = Buffer.alloc(64 * 1024);
      const read = await handle.read(chunk, 0, chunk.length, null);
      if (!read.bytesRead) break;
      total += read.bytesRead;
      if (total > 8_000_000) throw new Error("EVIDENCE_REQUIRED");
      parts.push(chunk.subarray(0, read.bytesRead));
    }
    const bytes = Buffer.concat(parts);
    if (
      bytes.length > 8_000_000 ||
      createHash("sha256").update(bytes).digest("hex") !== expected
    )
      throw new Error("EVIDENCE_CHANGED");
    const value = JSON.parse(bytes.toString("utf8")) as Bundle;
    if (
      value.version !== 1 ||
      !value.calendar ||
      !value.reviews ||
      Object.keys(value.reviews).length > 50
    )
      throw new Error("EVIDENCE_REQUIRED");
    return value;
  } finally {
    await handle.close();
  }
}
export function publicView(view: CacheView, amount: string): MarketResponse {
  const result = view.result;
  return {
    status: view.status,
    code: view.code,
    retryAt: view.retryAt,
    asOf: view.asOf,
    assetReturns: view.assetReturns
      ? Object.fromEntries(
          Object.entries(view.assetReturns).map(([s, r]) => [s, percent(r)]),
        )
      : undefined,
    dataCheckedAt: view.dataCheckedAt,
    requested: view.requested,
    issues: view.issues,
    period: result?.actual,
    shortenedBy: result?.shortenedBy,
    series: result
      ? [...result.portfolios, result.benchmark].map((s) => ({
          id: s.id,
          ending: display(s.ending),
          change: display(new Precise(s.ending).minus(amount).toFixed()),
          totalReturn: percent(s.totalReturn),
          drawdown: percent(s.drawdown),
          difference:
            "benchmarkDifference" in s &&
            typeof s.benchmarkDifference === "string"
              ? percent(s.benchmarkDifference)
              : undefined,
          points: s.points.map((p) => {
            const plotted = Number(p.value);
            if (!Number.isFinite(plotted)) throw new Error("NUMERIC_LIMIT");
            return {
              date: p.date,
              value: plotted,
              dollars: display(p.value),
              growth: percent(
                new Precise(p.value).div(amount).minus(1).toFixed(),
              ),
            };
          }),
        }))
      : undefined,
  };
}
export async function openMarket(request: MarketRequest) {
  try {
    return await openConfiguredMarket(request);
  } catch (error) {
    diagnose("runtime", error);
    throw error;
  }
}
async function openConfiguredMarket(request: MarketRequest) {
  // Hosted activation is explicit and separate from the compatible local path.
  if (
    hosted()
      ? process.env.TIKR_HOSTED_DATA_ENABLED !== "explicit" ||
        process.env.TIKR_MARKET_MODE !== "personal-provisional"
      : process.env.TIKR_PERSONAL_DATA_ENABLED !== "explicit" ||
        process.env.NODE_ENV === "production"
  ) {
    diagnose("config", "PERSONAL_DATA_DISABLED");
    throw new Error("PERSONAL_DATA_DISABLED");
  }
  const url = process.env.TIKR_CONVEX_URL ?? "https://hosted.convex.cloud",
    key = hosted() ? "gateway" : process.env.TIKR_CONVEX_ADMIN_KEY;
  if (!url || !key) throw new Error("STORAGE_NOT_CONFIGURED");
  const provisional = process.env.TIKR_MARKET_MODE === "personal-provisional";
  const data = provisional ? undefined : await bundle();
  const source = data
    ? {
        calendar: data.calendar,
        historyStart: data.historyStart,
        load: createVerifiedLoader({
          review: async (symbol) => data.reviews[symbol],
        }),
        revision: revision(data),
        expires: Math.min(
          ...Object.values(data.reviews).map((r) => Date.parse(r.expiresAt)),
        ),
      }
    : await personalSource();
  const { load } = source;
  const run = createDurableBacktests({
    storage: convexStorage(url, key, source.revision),
    calendar: () => source.calendar,
    historyStart: source.historyStart,
    evidenceRevision: source.revision,
    evidenceValidUntil: () => source.expires,
    supportedSymbols: assets.map((a) => a.ticker),
    load,
  });
  const job = await run(
    { portfolios: request.portfolios, amount: request.amount },
    request.range,
    request.retry,
  );
  return {
    initial: {
      ...publicView(job.initial, request.amount),
      dataQuality: provisional ? "personal-provisional" : "reviewed",
      evidenceExpiresAt: new Date(source.expires).toISOString(),
    },
    settled: job.settled.then((v) => ({
      ...publicView(v, request.amount),
      dataQuality: provisional ? "personal-provisional" : "reviewed",
      evidenceExpiresAt: new Date(source.expires).toISOString(),
    })),
  };
}
