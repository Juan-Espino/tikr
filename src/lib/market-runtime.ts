import "server-only";
import { open } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { createDurableBacktests } from "./durable-market.ts";
import { revision, convexStorage } from "./market-storage.ts";
import { createVerifiedLoader } from "./alpaca/verified-loader.ts";
import type { ReviewedAsset } from "./alpaca/verified-loader.ts";
import type { Calendar } from "./backtest.ts";
import { display, percent } from "./backtest.ts";
import Decimal from "decimal.js";
import type { MarketRequest, MarketResponse } from "./market-contract";
import type { CacheView } from "./market-cache.ts";
import { assets } from "./demo";
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
  // Local personal-use only. Production/public access requires separate rights and authentication work.
  if (
    process.env.TIKR_PERSONAL_DATA_ENABLED !== "explicit" ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("PERSONAL_DATA_DISABLED");
  const data = await bundle();
  const url = process.env.TIKR_CONVEX_URL,
    key = process.env.TIKR_CONVEX_ADMIN_KEY;
  if (!url || !key) throw new Error("STORAGE_NOT_CONFIGURED");
  const load = createVerifiedLoader({
    review: async (symbol) => data.reviews[symbol],
  });
  const run = createDurableBacktests({
    storage: convexStorage(url, key, revision(data)),
    calendar: () => data.calendar,
    historyStart: data.historyStart,
    evidenceRevision: revision(data),
    evidenceValidUntil: () =>
      Math.min(
        ...Object.values(data.reviews).map((r) => Date.parse(r.expiresAt)),
      ),
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
      evidenceExpiresAt: new Date(
        Math.min(
          ...Object.values(data.reviews).map((r) => Date.parse(r.expiresAt)),
        ),
      ).toISOString(),
    },
    settled: job.settled.then((v) => ({
      ...publicView(v, request.amount),
      evidenceExpiresAt: new Date(
        Math.min(
          ...Object.values(data.reviews).map((r) => Date.parse(r.expiresAt)),
        ),
      ).toISOString(),
    })),
  };
}
