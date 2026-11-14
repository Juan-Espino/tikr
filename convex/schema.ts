import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { PERSONAL_SOURCE_POLICY } from "../src/lib/market-policy";

export default defineSchema({
  marketEntries: defineTable({
    key: v.string(),
    payload: v.string(),
    revision: v.string(),
    dependencies: v.array(v.object({ key: v.string(), revision: v.string() })),
    checkedAt: v.number(),
    cost: v.number(),
  }).index("by_key", ["key"]),
  marketLeases: defineTable({
    key: v.string(),
    token: v.string(),
    expires: v.number(),
    cycle: v.string(),
    attempts: v.number(),
    attemptedAt: v.number(),
    completed: v.optional(v.boolean()),
    completedFrom: v.optional(v.string()),
    scopeAttempts: v.optional(v.number()),
    reviewedPolicy: v.optional(v.literal(PERSONAL_SOURCE_POLICY)),
    pendingAttempt: v.optional(
      v.object({
        attempts: v.number(),
        scopeAttempts: v.number(),
        attemptedAt: v.number(),
        reviewedPolicy: v.optional(v.literal(PERSONAL_SOURCE_POLICY)),
      }),
    ),
  }).index("by_key", ["key"]),
  marketBudget: defineTable({
    key: v.string(),
    month: v.string(),
    io: v.number(),
    calls: v.number(),
    storage: v.number(),
    entries: v.number(),
    reviewedThrough: v.number(),
    otherStorage: v.number(),
    otherIo: v.number(),
    otherCalls: v.number(),
  }).index("by_key", ["key"]),
  marketHosted: defineTable({ key: v.string(), payload: v.string() }).index(
    "by_key",
    ["key"],
  ),
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }).index("by_isCompleted", ["isCompleted"]),
});
