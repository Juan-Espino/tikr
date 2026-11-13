import { getDocumentSize, type Value } from "convex/values";

// Application database API observations, not Convex transaction/billing metrics.
// Patch payload size is NOT the size of the rewritten stored document or indexes.
export type DbObservation = {
  readOperations: number;
  documentsReturned: number;
  returnedValueBytes: number;
  writeOperations: number;
  writeArgumentBytes: number;
};
export function observeDatabase<T extends object>(
  database: T,
  stats: DbObservation,
): T {
  const wrap = <O extends object>(target: O): O =>
    new Proxy(target, {
      get(object, key) {
        const value: unknown = Reflect.get(object, key, object);
        if (typeof value !== "function") return value;
        return (...args: unknown[]) => {
          const result: unknown = Reflect.apply(value, object, args);
          if (["insert", "patch", "replace", "delete"].includes(String(key))) {
            stats.writeOperations++;
            stats.writeArgumentBytes += getDocumentSize({
              arguments: args as Value[],
            });
          }
          if (
            ["get", "unique", "first", "take", "collect", "paginate"].includes(
              String(key),
            )
          ) {
            stats.readOperations++;
            return Promise.resolve(result).then((rows: unknown) => {
              const documents = Array.isArray(rows)
                ? rows
                : rows && typeof rows === "object" && "page" in rows
                  ? (rows as { page: unknown[] }).page
                  : rows
                    ? [rows]
                    : [];
              stats.documentsReturned += documents.length;
              stats.returnedValueBytes += getDocumentSize({
                documents: documents as Value[],
              });
              return rows;
            });
          }
          return result && typeof result === "object" ? wrap(result) : result;
        };
      },
    });
  return wrap(database);
}
