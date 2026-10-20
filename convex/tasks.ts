import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_isCompleted", (q) => q.eq("isCompleted", false))
      .order("desc")
      .take(50);
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

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("tasks", args.id, {
      isCompleted: args.isCompleted,
    });
    return null;
  },
});

export const kanyeQuote = action({
  args: {},
  handler: async () => {
    const response = await fetch("https://api.kanye.rest");

    if (!response.ok) throw Error("No Ye :(");

    const data: { quote: string } = await response.json();
    return await data.quote;
  },
});
