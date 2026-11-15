import { v } from "convex/values";

export const definition = v.object({
  name: v.string(),
  holdings: v.array(v.object({ ticker: v.string(), weight: v.string() })),
  manual: v.boolean(),
  pinned: v.boolean(),
  amount: v.string(),
  range: v.union(
    v.literal("1W"),
    v.literal("1M"),
    v.literal("YTD"),
    v.literal("1Y"),
    v.literal("5Y"),
  ),
  rangeChoice: v.union(v.literal("default"), v.literal("explicit")),
});

export const portfolioFields = {
  ownerId: v.string(),
  clientId: v.string(),
  definition,
  normalizedName: v.string(),
  revision: v.number(),
  created: v.number(),
  updated: v.number(),
  deleted: v.boolean(),
};
