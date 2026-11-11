import { getDocumentSize } from "convex/values";
import { MARKET_BUDGET } from "./market-budget.ts";

// Stored documents add IDs/timestamps/cost to the bounded input document.
const maximumStored = MARKET_BUDGET.maxDocumentBytes + 2048;
export function storageReservation(
  name: string,
  args: Record<string, unknown>,
): number {
  if (name === "read") {
    const keys = args.keys as unknown[];
    if (!Array.isArray(keys) || keys.length > 80) throw Error("READ_LIMIT");
    return 32768 + keys.length * (2 * maximumStored + 1024);
  }
  if (name !== "write") return 32768;
  const entries = args.entries as {
    key: string;
    dependencies: { key: string }[];
  }[];
  if (!Array.isArray(entries) || !entries.length || entries.length > 80)
    throw Error("WRITE_LIMIT");
  const staged = new Set(entries.map((e) => e.key));
  let bound = 32768;
  for (const entry of entries) {
    if (
      getDocumentSize(entry) > MARKET_BUDGET.maxDocumentBytes ||
      entry.dependencies.length > 51
    )
      throw Error("DOCUMENT_LIMIT");
    bound +=
      4 * getDocumentSize({ ...entry, checkedAt: 0, cost: 0 }) +
      2 * maximumStored;
    bound +=
      entry.dependencies.filter((d) => !staged.has(d.key)).length *
      2 *
      maximumStored;
  }
  return bound;
}
