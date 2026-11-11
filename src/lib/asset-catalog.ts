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
      typeof row.name !== "string" ||
      typeof row.exchange !== "string" ||
      row.exchange.length > 32 ||
      typeof row.tradable !== "boolean" ||
      typeof row.status !== "string" ||
      typeof row.class !== "string"
    )
      throw Error("INVALID_CATALOG");
    // Eligibility is explicit: non-tradable, inactive, non-US-equity and
    // unlisted/OTC instruments are outside the supported history universe.
    if (
      row.status !== "active" ||
      row.class !== "us_equity" ||
      !row.tradable ||
      !["NYSE", "NASDAQ", "AMEX", "ARCA", "BATS", "NYSEARCA"].includes(
        row.exchange,
      )
    )
      continue;
    if (!validTicker(row.symbol) || !row.name.trim() || row.name.length > 1024)
      throw Error("INVALID_CATALOG");
    if (seen.has(row.symbol)) throw Error("INVALID_CATALOG");
    seen.add(row.symbol);
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
  input = unpackCatalogShard(input);
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
      a.name.length > 1024 ||
      !["NYSE", "NASDAQ", "AMEX", "ARCA", "BATS", "NYSEARCA"].includes(
        a.exchange,
      )
    )
      throw Error("INVALID_CATALOG");
    seen.add(a.ticker);
  }
  return input as CatalogAsset[];
}

// Lossless bounded LZW over JSON tuples. Codes avoid surrogate code points;
// no platform compression APIs or dependencies are needed in Convex.
export function packCatalogShard(rows: CatalogAsset[]) {
  const text = JSON.stringify(rows.map((a) => [a.ticker, a.name, a.exchange]));
  const dictionary = new Map<string, number>();
  let next = 256,
    word = "",
    packed = "";
  const emit = (w: string) => {
    const code = w.length === 1 ? w.charCodeAt(0) : dictionary.get(w)!;
    packed += String.fromCharCode(code + 256);
  };
  // Encode UTF-8 as byte characters so all literal codes fit in one byte.
  const bytes = new TextEncoder().encode(text);
  for (const byte of bytes) {
    const char = String.fromCharCode(byte),
      combined = word + char;
    if (!word || dictionary.has(combined)) word = combined;
    else {
      emit(word);
      if (next < 55000) dictionary.set(combined, next++);
      word = char;
    }
  }
  if (word) emit(word);
  return { encoding: "lzw-tuples-v1", data: packed };
}
function unpackCatalogShard(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const packed = input as { encoding?: unknown; data?: unknown };
  if (
    packed.encoding !== "lzw-tuples-v1" ||
    typeof packed.data !== "string" ||
    packed.data.length > 50000
  )
    throw Error("INVALID_CATALOG");
  const dictionary: string[] = Array.from({ length: 256 }, (_, i) =>
    String.fromCharCode(i),
  );
  let word = "",
    output = "";
  for (const char of packed.data) {
    const code = char.charCodeAt(0) - 256;
    const entry =
      dictionary[code] ??
      (code === dictionary.length && word ? word + word[0] : undefined);
    if (entry === undefined) throw Error("INVALID_CATALOG");
    output += entry;
    if (output.length > 2_000_000) throw Error("INVALID_CATALOG");
    if (word && dictionary.length < 55000) dictionary.push(word + entry[0]);
    word = entry;
  }
  const parsed: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(output, (c) => c.charCodeAt(0)),
    ),
  );
  if (!Array.isArray(parsed)) throw Error("INVALID_CATALOG");
  return parsed.map((a: unknown) => {
    if (!Array.isArray(a) || a.length !== 3) throw Error("INVALID_CATALOG");
    const tuple: unknown[] = a;
    return { ticker: tuple[0], name: tuple[1], exchange: tuple[2] };
  });
}
