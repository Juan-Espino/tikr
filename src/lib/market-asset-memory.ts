import type { Asset } from "./backtest.ts";

// Immutable source copies are reused only after the durable head is checked.
// Atomic monthly/head writes and guard/revocation checks remain authoritative.
const limit = 24 * 1024 * 1024;
const entries = new Map<
  string,
  { revision: string; asset: Asset; bytes: number }
>();
let total = 0;
export function cachedAsset(
  namespace: string,
  symbol: string,
  revision: string,
): Asset | undefined {
  const key = `${namespace}:${symbol}`,
    entry = entries.get(key);
  if (entry?.revision !== revision) return;
  entries.delete(key);
  entries.set(key, entry);
  return structuredClone(entry.asset);
}
export function rememberAsset(
  namespace: string,
  symbol: string,
  revision: string,
  asset: Asset,
) {
  const key = `${namespace}:${symbol}`,
    bytes = Buffer.byteLength(JSON.stringify(asset));
  if (bytes > limit) return;
  const old = entries.get(key);
  if (old) {
    total -= old.bytes;
    entries.delete(key);
  }
  while (entries.size >= 50 || total + bytes > limit) {
    const first = entries.keys().next().value;
    if (first === undefined) break;
    total -= entries.get(first)!.bytes;
    entries.delete(first);
  }
  entries.set(key, { revision, asset: structuredClone(asset), bytes });
  total += bytes;
}
