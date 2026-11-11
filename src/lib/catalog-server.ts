import "server-only";
import { marketFailure, type MarketFailureCode } from "./market-errors.ts";
import {
  catalogShard,
  packCatalogShard,
  validateCatalog,
  validateShard,
  validTicker,
  type CatalogAsset,
} from "./asset-catalog.ts";
import { convexStorage, revision } from "./market-storage.ts";
import { providerCredentials } from "./market-diagnostics.ts";
import { localAdmission } from "./market-admission.ts";
import { createAdmittedTransport } from "./alpaca/personal-loader.ts";
import { freshnessCycle } from "./market-cache.ts";
import { control, hosted } from "./market-hosted.ts";
import type { Config } from "./alpaca/adapter.ts";
const scope = "0".repeat(64);
export function catalogStorage() {
  const url = process.env.TIKR_CONVEX_URL;
  const key = process.env.TIKR_CONVEX_ADMIN_KEY;
  if (
    !hosted() &&
    (!url ||
      !key ||
      process.env.TIKR_PERSONAL_DATA_ENABLED !== "explicit" ||
      process.env.NODE_ENV === "production")
  )
    throw Error("CATALOG_UNAVAILABLE");
  if (hosted() && process.env.TIKR_HOSTED_DATA_ENABLED !== "explicit")
    throw Error("CATALOG_UNAVAILABLE");
  return convexStorage(
    url ?? "https://hosted.convex.cloud",
    hosted() ? "gateway" : key!,
    scope,
  );
}
async function readDurableCatalog(symbols?: string[]) {
  const shards = symbols
    ? [...new Set(symbols.map(catalogShard))]
    : Array.from({ length: 32 }, (_, i) => i);
  const keys = shards.map((i) => `catalog:${i}`);
  const rows = await catalogStorage().read(keys);
  // A remote mutation timestamp may lead the local host by a few milliseconds.
  // Bound skew explicitly; freshness still expires from the original timestamp.
  if (
    rows.length !== keys.length ||
    new Set(rows.map((r) => r.key)).size !== keys.length ||
    rows.some((r) => !keys.includes(r.key)) ||
    rows.some(
      (r) =>
        !Number.isFinite(r.checkedAt) ||
        r.checkedAt > Date.now() + 5000 ||
        Date.now() - r.checkedAt > 7 * 86400000,
    ) ||
    new Set(rows.map((r) => r.revision)).size !== 1
  )
    throw Error("CATALOG_UNAVAILABLE");
  const assets = rows.flatMap((r) =>
    validateShard(JSON.parse(r.payload), Number(r.key.split(":")[1])),
  );
  if (assets.length > 30000 || !assets.some((a) => a.ticker === "SPY"))
    throw Error("INVALID_CATALOG");
  return symbols ? assets.filter((a) => symbols.includes(a.ticker)) : assets;
}
// Memoized only for a minute; admission/guards remain independently enforced.
let memo: { key: string; until: number; rows: CatalogAsset[] } | undefined;
let reading: { key: string; promise: Promise<CatalogAsset[]> } | undefined;
function memoKey() {
  return `${hosted()}:${process.env.TIKR_CONVEX_URL}:${process.env.TIKR_CONVEX_SITE_URL}:${process.env.TIKR_PERSONAL_DATA_ENABLED}:${process.env.TIKR_HOSTED_DATA_ENABLED}`;
}
const selectedMemos = new Map<
  string,
  { until: number; rows: CatalogAsset[] }
>();
const selectedReads = new Map<string, Promise<CatalogAsset[]>>();
export async function readCatalog(selected?: string[]) {
  catalogStorage(); // Never reuse a memo after activation is disabled.
  const key = memoKey();
  if (
    selected &&
    (selected.length > 19 || selected.some((s) => !validTicker(s)))
  )
    throw Error("INVALID_CATALOG");
  const symbols = selected
    ? [...new Set(["SPY", ...selected])].sort()
    : undefined;
  const pick = (rows: CatalogAsset[]) =>
    symbols ? rows.filter((a) => symbols.includes(a.ticker)) : rows;
  if (memo?.key === key && memo.until > Date.now()) return pick(memo.rows);
  if (reading?.key === key) return reading.promise.then(pick);
  if (symbols) {
    const selectedKey = `${key}:${symbols.join(",")}`;
    const saved = selectedMemos.get(selectedKey);
    if (saved && saved.until > Date.now()) return saved.rows;
    const pending = selectedReads.get(selectedKey);
    if (pending) return pending;
    // History needs membership for its holdings, not a scan of all 32 catalog shards.
    // Keep the same freshness, shard validation, revision and provider-admission rules.
    const promise = readDurableCatalog(symbols)
      .then((rows) => {
        if (selectedMemos.size >= 32)
          selectedMemos.delete(selectedMemos.keys().next().value!);
        selectedMemos.set(selectedKey, { until: Date.now() + 60000, rows });
        return rows;
      })
      .finally(() => {
        selectedReads.delete(selectedKey);
      });
    selectedReads.set(selectedKey, promise);
    return promise;
  }
  const promise = readDurableCatalog()
    .then((rows) => {
      memo = { key, until: Date.now() + 60000, rows };
      return rows;
    })
    .finally(() => {
      if (reading?.promise === promise) reading = undefined;
    });
  reading = { key, promise };
  return promise;
}
// Shared admitted refresh: durable lease serializes imports without failed-attempt lockout.
export async function refreshCatalog(config: Config, cycle: string) {
  try {
    return await readCatalog();
  } catch {
    /* bounded durable lease below */
  }
  const storage = catalogStorage(),
    key = "catalog:refresh";
  let stage: CatalogStage = "admission";
  let bytes = 0,
    count = 0,
    status = 0;
  const token = await storage.acquire(key, cycle, true).catch((error) => {
    catalogDiagnostic("admission", 0, 0, 0);
    throw error;
  });
  if (!token) {
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const head = (await storage.read(["catalog:0"])).find(
        (r) => r.key === "catalog:0",
      );
      if (head && Date.now() - head.checkedAt <= 7 * 86400000) {
        try {
          return await readCatalog();
        } catch {
          /* wait for the atomic revision */
        }
      }
    }
    throw Error("CATALOG_UNAVAILABLE");
  }
  try {
    stage = "provider";
    const response = await (config.transport ?? fetch)(
      "https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity",
      {
        headers: {
          "APCA-API-KEY-ID": config.keyId,
          "APCA-API-SECRET-KEY": config.secret,
        },
        signal: AbortSignal.timeout(10000),
        redirect: "error",
        cache: "no-store",
      },
    );
    status = response.status;
    if (!response.ok || !response.body) {
      void response.body?.cancel().catch(() => undefined);
      throw Error("CATALOG_UNAVAILABLE");
    }
    stage = "stream";
    const reader = response.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        bytes = size;
        if (size > 16 * 1024 * 1024) {
          stage = "size";
          await reader.cancel().catch(() => undefined);
          throw Error("CATALOG_LIMIT");
        }
        parts.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    stage = "decode";
    const decoded: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)),
    );
    count = Array.isArray(decoded) ? decoded.length : 0;
    stage = "validation";
    const rows = validateCatalog(decoded);
    const rev = revision(rows);
    const entries = Array.from({ length: 32 }, (_, i) => ({
      key: `catalog:${i}`,
      payload: JSON.stringify(
        packCatalogShard(rows.filter((a) => catalogShard(a.ticker) === i)),
      ),
      revision: rev,
      dependencies: [],
    }));
    stage = "size";
    if (
      entries.some((e) => Buffer.byteLength(e.payload) > 50000) ||
      Buffer.byteLength(JSON.stringify(entries)) > 900000
    )
      throw Error("CATALOG_LIMIT");
    stage = "storage";
    await storage.write(key, token, entries);
    memo = { key: memoKey(), until: Date.now() + 60000, rows };
    return rows;
  } catch (error) {
    const failure = marketFailure(error);
    catalogDiagnostic(stage, status, bytes, count, failure?.code);
    if (failure && !failure.code.startsWith("CATALOG_")) throw failure;
    if (stage === "admission") throw error;
    if (stage === "provider" || stage === "stream")
      throw Error("CATALOG_PROVIDER");
    if (stage === "decode" || stage === "validation")
      throw Error("CATALOG_INVALID");
    if (stage === "size") throw Error("CATALOG_LIMIT");
    throw error;
  } finally {
    await storage.release(key, token).catch(() => undefined);
  }
}

let loading: Promise<CatalogAsset[]> | undefined;
export async function availableCatalog(symbols?: string[]) {
  try {
    return await readCatalog(symbols);
  } catch {
    /* one durable admitted refresh */
  }
  if (!loading) {
    const { keyId, secret } = providerCredentials();
    const transport = createAdmittedTransport(async () => {
      if (hosted()) {
        for (let i = 0; i < 8; i++) await control("provider", scope);
      } else await (await localAdmission()).reserve(16 * 1024 * 1024);
    });
    loading = refreshCatalog(
      { keyId, secret, transport },
      freshnessCycle(new Date()),
    ).finally(() => {
      loading = undefined;
    });
  }
  const rows = await loading;
  return symbols
    ? rows.filter((a) => a.ticker === "SPY" || symbols.includes(a.ticker))
    : rows;
}

type CatalogStage =
  | "admission"
  | "provider"
  | "stream"
  | "decode"
  | "validation"
  | "size"
  | "storage";
function catalogDiagnostic(
  stage: CatalogStage,
  status: number,
  bytes: number,
  rows: number,
  code?: MarketFailureCode,
) {
  console.error(
    JSON.stringify({
      event: "catalog_failure",
      stage,
      status,
      bytes,
      rows,
      code,
    }),
  );
}
