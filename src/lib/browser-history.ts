import {
  HISTORY_PROTOCOL,
  HISTORY_TRANSFER_BYTES,
  type HistoryChunk,
} from "./market-history-wire";
type Row = HistoryChunk & { id: string; saved: number };
const DATABASE = "tikr-market-history";
const STORE = "chunks";
const TTL = 7 * 86400000;
const LIMIT = 8_000_000;
// Failure/denial/eviction is an ordinary cache miss. No financial result is
// published from this database without a new server request.
async function transaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore, resolve: (value: T) => void) => void,
): Promise<T | undefined> {
  return new Promise((resolve) => {
    let db: IDBDatabase | undefined, tx: IDBTransaction | undefined;
    let value: T | undefined;
    let finished = false;
    const finish = () => {
      finished = true;
      clearTimeout(timer);
      db?.close();
      resolve(value);
    };
    const timer = setTimeout(() => {
      try {
        tx?.abort();
      } catch {}
      finish();
    }, 700);
    try {
      const open = indexedDB.open(DATABASE, 1);
      open.onupgradeneeded = () =>
        open.result.createObjectStore(STORE, { keyPath: "id" });
      open.onerror = finish;
      open.onblocked = finish;
      open.onsuccess = () => {
        db = open.result;
        if (finished) {
          db.close();
          return;
        }
        db.onversionchange = () => db?.close();
        tx = db.transaction(STORE, mode);
        tx.oncomplete = finish;
        tx.onerror = () => {
          value = undefined;
          finish();
        };
        tx.onabort = () => {
          value = undefined;
          finish();
        };
        try {
          work(tx.objectStore(STORE), (result) => {
            value = result;
          });
        } catch {
          tx.abort();
        }
      };
    } catch {
      finish();
    }
  });
}
export async function readBrowserHistory(
  symbols: string[],
): Promise<HistoryChunk[]> {
  return (
    (await transaction<HistoryChunk[]>("readonly", (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let bytes = 0;
        const rows: HistoryChunk[] = [];
        for (const row of request.result as Row[]) {
          if (
            !row ||
            typeof row !== "object" ||
            !Number.isFinite(row.saved) ||
            typeof row.payload !== "string" ||
            typeof row.key !== "string" ||
            typeof row.revision !== "string" ||
            row.saved + TTL <= Date.now() ||
            row.id !== `${HISTORY_PROTOCOL}:${row.key}` ||
            !symbols.includes(row.key.split(":")[1]!)
          )
            continue;
          const size = new TextEncoder().encode(JSON.stringify(row)).length;
          if (bytes + size > HISTORY_TRANSFER_BYTES) break;
          bytes += size;
          rows.push({
            key: row.key,
            payload: row.payload,
            revision: row.revision,
          });
        }
        done(rows);
      };
    })) ?? []
  );
}
export async function saveBrowserHistory(chunks: HistoryChunk[]) {
  await transaction("readwrite", (store, done) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = new Map<string, Row>();
      for (const row of request.result as Row[]) {
        if (
          typeof row.key !== "string" ||
          typeof row.payload !== "string" ||
          typeof row.revision !== "string" ||
          !Number.isFinite(row.saved) ||
          row.id !== `${HISTORY_PROTOCOL}:${row.key}`
        ) {
          store.delete(row.id);
          continue;
        }
        rows.set(row.id, row);
      }
      for (const chunk of chunks) {
        const row = {
          ...chunk,
          id: `${HISTORY_PROTOCOL}:${chunk.key}`,
          saved: Date.now(),
        };
        rows.set(row.id, row);
      }
      let bytes = 0;
      const keep = new Set<string>();
      for (const row of [...rows.values()].sort((a, b) => b.saved - a.saved)) {
        const size = new TextEncoder().encode(JSON.stringify(row)).length;
        if (row.saved + TTL <= Date.now() || bytes + size > LIMIT) continue;
        keep.add(row.id);
        bytes += size;
        store.put(row);
      }
      for (const id of rows.keys()) if (!keep.has(id)) store.delete(id);
      done(true);
    };
  });
}
