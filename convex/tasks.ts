import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const text = args.text.trim();
    if (!text) throw new Error("Task text is required");

    return await ctx.db.insert("tasks", {
      text,
      isCompleted: false,
    });
  },
});
