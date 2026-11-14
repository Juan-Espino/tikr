import "server-only";
import { revision, type MarketStorage, type Stored } from "./market-storage.ts";
import { HISTORY_PROTOCOL, type HistoryChunk } from "./market-history-wire.ts";
type Head = {
  format?: string;
  prices?: string[];
  content?: true;
};
const memory = new Map<string, { row: Stored; expires: number }>();
const LIMIT = 8_000_000,
  TTL = 86400000;
const price = (key: string) => /^price:[A-Z0-9.-]+:\d{4}-\d{2}$/.test(key);
const size = (row: Stored) => Buffer.byteLength(JSON.stringify(row));
function prune(now: number) {
  let bytes = 0;
  for (const [key, value] of memory) {
    if (value.expires <= now) memory.delete(key);
    else bytes += size(value.row);
  }
  for (const [key, value] of memory) {
    if (bytes <= LIMIT) break;
    memory.delete(key);
    bytes -= size(value.row);
  }
}
export function withDisposableHistory(
  storage: MarketStorage,
  hints: HistoryChunk[] = [],
  clock = Date.now,
) {
  const namespace = `${storage.namespace ?? "isolated"}:${HISTORY_PROTOCOL}:`;
  const roots = new Map<string, string>(),
    modern = new Set<string>(),
    legacy = new Set<string>(),
    staged = new Map<string, Stored>(),
    used = new Map<string, HistoryChunk>();
  const incoming = new Map(hints.map((row) => [row.key, row]));
  for (const [key, row] of incoming) {
    try {
      if (revision(JSON.parse(row.payload)) !== row.revision)
        incoming.delete(key);
    } catch {
      incoming.delete(key);
    }
  }
  const publish = (row: Stored, root: string) => {
    const key = namespace + row.key + root;
    memory.delete(key);
    memory.set(key, { row: structuredClone(row), expires: clock() + TTL });
    used.set(row.key, {
      key: row.key,
      payload: row.payload,
      revision: row.revision,
    });
    prune(clock());
  };
  const observe = (row: Stored) => {
    if (price(row.key)) {
      staged.set(row.key, row);
      return;
    }
    if (!row.key.startsWith("asset:")) return;
    const head = JSON.parse(row.payload) as Head;
    if (head.format !== "monthly-v2") return;
    for (const key of head.prices ?? []) {
      roots.set(key, row.revision);
      if (head.content) {
        modern.add(key);
        legacy.delete(key);
      } else legacy.add(key);
    }
  };
  const wrapper: MarketStorage = {
    ...storage,
    // Whole-asset validation below publishes monthly content; no second asset cache.
    namespace: undefined,
    async confirmRead(symbol, root) {
      for (const [key, row] of staged)
        if (key.startsWith(`price:${symbol}:`) && roots.get(key) === root)
          publish(row, root);
      await storage.confirmRead?.(symbol, root);
    },
    async read(keys) {
      prune(clock());
      const durable = keys.filter((key) => !price(key) || legacy.has(key));
      const rows = durable.length ? await storage.read(durable) : [];
      rows.forEach(observe);
      // During the compatibility window, retained legacy chunks may reconstruct
      // lost disposable content. They remain hints: loadAsset must validate the
      // entire reconstructed asset against the CURRENT authoritative head root.
      const missing = keys.filter(
        (key) =>
          price(key) &&
          modern.has(key) &&
          !memory.has(namespace + key + roots.get(key)) &&
          !incoming.has(key),
      );
      const retained = missing.length ? await storage.read(missing) : [];
      for (const key of keys.filter((key) => price(key) && modern.has(key))) {
        const root = roots.get(key);
        const candidate =
          (root && memory.get(namespace + key + root)?.row) ??
          incoming.get(key) ??
          retained.find((row) => row.key === key);
        if (!root || !candidate) continue;
        try {
          if (revision(JSON.parse(candidate.payload)) !== candidate.revision)
            continue;
          const row: Stored = {
            ...candidate,
            dependencies: [],
            checkedAt: clock(),
          };
          staged.set(key, row);
          rows.push(row);
        } catch {
          /* Untrusted hints are only cache misses. */
        }
      }
      return rows;
    },
    async write(key, token, rows) {
      const head = rows.find(
        (row) => row.key === key && key.startsWith("asset:"),
      );
      if (!head || (JSON.parse(head.payload) as Head).format !== "monthly-v2")
        return storage.write(key, token, rows);
      const data = JSON.parse(head.payload) as Head;
      const chunks = (data.prices ?? []).map(
        (chunkKey) =>
          rows.find((row) => row.key === chunkKey) ??
          staged.get(chunkKey) ??
          memory.get(namespace + chunkKey + roots.get(chunkKey))?.row,
      );
      if (chunks.some((row) => !row)) throw Error("REVISION_CHANGED");
      // Persist payload and head in the SAME fenced transaction. Browser/process
      // copies accelerate reads; losing them must not require provider admission.
      // The existing asset root still authenticates every price and action.
      const updated = {
        ...head,
        payload: JSON.stringify({ ...data, content: true }),
      };
      await storage.write(key, token, [
        ...rows.filter((row) => !price(row.key) && row !== head),
        ...chunks
          .filter((row): row is Stored => row !== undefined)
          .map(({ key, payload, revision, dependencies }) => ({
            key,
            payload,
            revision,
            dependencies,
          })),
        updated,
      ]);
      observe({ ...updated, checkedAt: clock() });
      for (const row of chunks) {
        if (!row) throw Error("REVISION_CHANGED");
        publish({ ...row, checkedAt: clock() }, head.revision);
      }
    },
  };
  return { storage: wrapper, exported: () => [...used.values()] };
}
