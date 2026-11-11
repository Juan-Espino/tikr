import "server-only";
import {
  catalogShard,
  validateCatalog,
  validateShard,
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
async function readDurableCatalog() {
  const rows = await catalogStorage().read(
    Array.from({ length: 32 }, (_, i) => `catalog:${i}`),
  );
  if (
    rows.length !== 32 ||
    rows.some(
      (r) =>
        !Number.isFinite(r.checkedAt) ||
        r.checkedAt > Date.now() ||
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
  return assets;
}
// Memoized only for a minute; admission/guards remain independently enforced.
let memo: { key: string; until: number; rows: CatalogAsset[] } | undefined;
let reading: { key: string; promise: Promise<CatalogAsset[]> } | undefined;
function memoKey() {
  return `${hosted()}:${process.env.TIKR_CONVEX_URL}:${process.env.TIKR_CONVEX_SITE_URL}:${process.env.TIKR_PERSONAL_DATA_ENABLED}:${process.env.TIKR_HOSTED_DATA_ENABLED}`;
}
export async function readCatalog() {
  catalogStorage(); // Never reuse a memo after activation is disabled.
  const key = memoKey();
  if (memo?.key === key && memo.until > Date.now()) return memo.rows;
  if (reading?.key === key) return reading.promise;
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
// Shared admitted refresh: durable daily lease prevents per-keystroke provider calls.
export async function refreshCatalog(config: Config, cycle: string) {
  try {
    return await readCatalog();
  } catch {
    /* bounded durable lease below */
  }
  const storage = catalogStorage(),
    key = "catalog:refresh";
  const token = await storage.acquire(key, cycle, true);
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
    if (!response.ok || !response.body) {
      void response.body?.cancel().catch(() => undefined);
      throw Error("CATALOG_UNAVAILABLE");
    }
    const reader = response.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > 8 * 1024 * 1024) {
          await reader.cancel();
          throw Error("CATALOG_LIMIT");
        }
        parts.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }
    const rows = validateCatalog(
      JSON.parse(Buffer.concat(parts).toString("utf8")),
    );
    const rev = revision(rows);
    const entries = Array.from({ length: 32 }, (_, i) => ({
      key: `catalog:${i}`,
      payload: JSON.stringify(rows.filter((a) => catalogShard(a.ticker) === i)),
      revision: rev,
      dependencies: [],
    }));
    if (
      entries.some((e) => Buffer.byteLength(e.payload) > 50000) ||
      Buffer.byteLength(JSON.stringify(entries)) > 900000
    )
      throw Error("CATALOG_LIMIT");
    await storage.write(key, token, entries);
    memo = { key: memoKey(), until: Date.now() + 60000, rows };
    return rows;
  } finally {
    await storage.release(key, token).catch(() => undefined);
  }
}

let loading: Promise<CatalogAsset[]> | undefined;
export async function availableCatalog() {
  try {
    return await readCatalog();
  } catch {
    /* one durable admitted refresh */
  }
  if (!loading) {
    const { keyId, secret } = providerCredentials();
    const transport = createAdmittedTransport(async () => {
      if (hosted()) {
        for (let i = 0; i < 4; i++) await control("provider", scope);
      } else await (await localAdmission()).reserve(8 * 1024 * 1024);
    });
    loading = refreshCatalog(
      { keyId, secret, transport },
      freshnessCycle(new Date()),
    ).finally(() => {
      loading = undefined;
    });
  }
  return loading;
}
