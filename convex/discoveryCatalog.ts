import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  catalogShard,
  validTicker,
  validateShard,
  type CatalogAsset,
} from "../src/lib/asset-catalog";
import { DISCOVERY } from "../src/lib/ai-discovery";

export const lookup = internalMutation({
  args: { tickers: v.array(v.string()) },
  returns: v.array(
    v.object({ ticker: v.string(), name: v.string(), exchange: v.string() }),
  ),
  handler: async (ctx, { tickers }): Promise<CatalogAsset[]> => {
    if (
      tickers.length > DISCOVERY.maxCandidates ||
      tickers.some((t) => !validTicker(t))
    )
      throw Error("INVALID_CATALOG_REQUEST");
    const symbols = [...new Set(["SPY", ...tickers])];
    const keys = [...new Set(symbols.map((t) => `catalog:${catalogShard(t)}`))];
    // Reuse existing bounded read/accounting. Never import/refresh or call Alpaca.
    const { rows } = await ctx.runMutation(internal.market.read, { keys });
    const now = Date.now();
    if (
      rows.length !== keys.length ||
      new Set(rows.map((r) => r.key)).size !== keys.length ||
      rows.some(
        (r) =>
          !keys.includes(r.key) ||
          !Number.isFinite(r.checkedAt) ||
          r.checkedAt > now + 5000 ||
          now - r.checkedAt > 7 * 86_400_000,
      ) ||
      new Set(rows.map((r) => r.revision)).size !== 1
    )
      throw Error("CATALOG_UNAVAILABLE");
    const assets = rows.flatMap((r) =>
      validateShard(JSON.parse(r.payload), Number(r.key.split(":")[1])),
    );
    if (!assets.some((a) => a.ticker === "SPY"))
      throw Error("CATALOG_UNAVAILABLE");
    return assets.filter((a) => tickers.includes(a.ticker));
  },
});
