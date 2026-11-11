export type CatalogAsset = { ticker: string; name: string; exchange: string };
export const validTicker = (s: string) =>
  s.length <= 16 && /^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)*$/.test(s);
export const catalogShard = (s: string) =>
  [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0) % 32;
export function validateCatalog(input: unknown): CatalogAsset[] {
  if (!Array.isArray(input) || !input.length || input.length > 30000)
    throw Error("INVALID_CATALOG");
  const seen = new Set<string>();
  const result: CatalogAsset[] = [];
  for (const row of input as Record<string, unknown>[]) {
    if (
      !row ||
      typeof row !== "object" ||
      typeof row.symbol !== "string" ||
      !validTicker(row.symbol) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length > 200 ||
      typeof row.exchange !== "string" ||
      row.exchange.length > 32 ||
      typeof row.tradable !== "boolean" ||
      typeof row.status !== "string" ||
      typeof row.class !== "string"
    )
      throw Error("INVALID_CATALOG");
    if (seen.has(row.symbol)) throw Error("INVALID_CATALOG");
    seen.add(row.symbol);
    if (
      row.status === "active" &&
      row.class === "us_equity" &&
      row.tradable &&
      ["NYSE", "NASDAQ", "AMEX", "ARCA", "BATS", "NYSEARCA"].includes(
        row.exchange,
      )
    )
      result.push({
        ticker: row.symbol,
        name: row.name.trim(),
        exchange: row.exchange,
      });
  }
  if (!result.some((a) => a.ticker === "SPY")) throw Error("INVALID_CATALOG");
  return result;
}
export function searchCatalog(rows: CatalogAsset[], query: string) {
  const q = query.trim().toUpperCase();
  if (!q || query.length > 100) return [];
  const rank = (a: CatalogAsset) =>
    a.ticker === q
      ? 0
      : a.ticker.startsWith(q)
        ? 1
        : a.name.toUpperCase().startsWith(q)
          ? 2
          : 3;
  return rows
    .filter((a) => a.ticker.includes(q) || a.name.toUpperCase().includes(q))
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0),
    )
    .slice(0, 20);
}

export function validateShard(input: unknown, shard: number): CatalogAsset[] {
  if (!Array.isArray(input) || input.length > 30000)
    throw Error("INVALID_CATALOG");
  const seen = new Set<string>();
  for (const a of input as CatalogAsset[]) {
    if (
      !a ||
      typeof a.ticker !== "string" ||
      !validTicker(a.ticker) ||
      catalogShard(a.ticker) !== shard ||
      seen.has(a.ticker) ||
      typeof a.name !== "string" ||
      !a.name.trim() ||
      a.name.length > 200 ||
      !["NYSE", "NASDAQ", "AMEX", "ARCA", "BATS", "NYSEARCA"].includes(
        a.exchange,
      )
    )
      throw Error("INVALID_CATALOG");
    seen.add(a.ticker);
  }
  return input as CatalogAsset[];
}
