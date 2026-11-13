import "server-only";
import type { MarketStorage, Stored } from "./market-storage.ts";

// Derived portfolio results are disposable. This is a process cache, never a
// shared lease or a replacement for the underlying revision/revocation checks.
const entries = new Map<string, Stored>();
const LIMIT = 4 * 1024 * 1024;
const TTL = 24 * 60 * 60 * 1000;
const size = (row: Stored) => Buffer.byteLength(JSON.stringify(row));
const resultKey = (key: string) => /^result:slot\d+(?::part\d+)?$/.test(key);

export function withProcessResults(
  storage: MarketStorage,
  namespace: string,
  clock: () => number = Date.now,
): MarketStorage {
  const prefix = `${namespace}:`;
  const prune = () => {
    let bytes = 0;
    for (const [key, row] of entries) {
      if (row.checkedAt + TTL <= clock()) entries.delete(key);
      else bytes += size(row);
    }
    for (const [key, row] of entries) {
      if (bytes <= LIMIT) break;
      entries.delete(key);
      bytes -= size(row);
    }
  };
  return {
    ...storage,
    async read(keys) {
      prune();
      const durable = keys.filter((key) => !resultKey(key));
      const rows = durable.length ? await storage.read(durable) : [];
      for (const key of keys.filter(resultKey)) {
        const row = entries.get(prefix + key);
        if (row) rows.push(structuredClone(row));
      }
      return rows;
    },
    async acquire(key, cycle, retry, from) {
      if (key.startsWith("job:result:slot")) return "process-result";
      return storage.acquire(key, cycle, retry, from);
    },
    async release(key, token) {
      if (!key.startsWith("job:result:slot")) await storage.release(key, token);
    },
    async write(key, token, rows) {
      if (!key.startsWith("job:result:slot"))
        return storage.write(key, token, rows);
      if (rows.some((row) => !resultKey(row.key)))
        throw Error("INVALID_MANIFEST");
      const dependencies = rows.flatMap((row) => row.dependencies);
      const current = dependencies.length
        ? await storage.read([...new Set(dependencies.map((d) => d.key))])
        : [];
      if (
        dependencies.some(
          (d) =>
            !current.some((r) => r.key === d.key && r.revision === d.revision),
        )
      )
        throw Error("REVISION_CHANGED");
      for (const row of rows) {
        entries.delete(prefix + row.key);
        entries.set(prefix + row.key, {
          ...structuredClone(row),
          checkedAt: clock(),
        });
      }
      prune();
    },
  };
}
