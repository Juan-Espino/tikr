import { v } from "convex/values";

export const usageValidator = v.object({
  limit: v.number(),
  remaining: v.number(),
  resetAt: v.number(),
});
export const resultValidator = v.union(
  v.object({
    kind: v.literal("results"),
    summary: v.string(),
    assets: v.array(v.object({ ticker: v.string(), name: v.string() })),
  }),
  v.object({
    kind: v.literal("clarification"),
    question: v.string(),
    answers: v.array(v.string()),
  }),
  v.object({
    kind: v.union(
      v.literal("empty"),
      v.literal("error"),
      v.literal("unavailable"),
      v.literal("limit"),
    ),
    message: v.string(),
  }),
);
export const responseValidator = v.object({
  result: resultValidator,
  usage: v.union(usageValidator, v.null()),
});
