import { catalogShard } from "../src/lib/asset-catalog";
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
const ref = (name: string) => makeFunctionReference<"mutation">(name);

test("configurable global burst protection refills and invalid configuration fails closed", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.stubEnv("TIKR_BROWSE_GLOBAL_PER_MINUTE", "2");
  try {
    const f = await fixture();
    expect(await f.open("1".repeat(64))).toBeNull();
    expect(await f.open("2".repeat(64))).toBeNull();
    const denied = await f.open("3".repeat(64));
    expect(denied?.code).toBe("BROWSING_RATE_LIMIT");
    vi.setSystemTime(denied!.retryAt!);
    expect(await f.open("3".repeat(64))).toBeNull();
    vi.stubEnv("TIKR_BROWSE_GLOBAL_PER_MINUTE", "0");
    await expect(f.open()).rejects.toThrow("INVALID_ADMISSION_CONFIG");
  } finally {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  }
});

test("exhausted manual attempts report the next New York cutoff across DST", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    for (const [cycle, expected] of [
      ["2026-10-31", "2026-11-01T14:00:00Z"],
      ["2026-03-07", "2026-03-08T13:00:00Z"],
    ]) {
      vi.setSystemTime(new Date(cycle! + "T14:00:00Z"));
      const f = await fixture();
      const args = {
        key: "asset:SPY",
        cycle,
        token: crypto.randomUUID(),
        retry: false,
      };
      await f.t.mutation(ref("market:acquire"), args);
      await f.t.mutation(ref("market:release"), {
        key: args.key,
        token: args.token,
      });
      vi.setSystemTime(Date.now() + 60001);
      await f.t.mutation(ref("market:acquire"), { ...args, retry: true });
      await f.t.mutation(ref("market:release"), {
        key: args.key,
        token: args.token,
      });
      const denied = await f.t.mutation(ref("market:acquire"), {
        ...args,
        retry: true,
      });
      expect(denied.status).toBe("daily");
      expect(denied.retryAt).toBe(Date.parse(expected!));
    }
  } finally {
    vi.useRealTimers();
  }
});
async function fixture() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    for (const symbol of ["SPY", "AAPL", "MSFT", "AMZN", "SCHD", "NVDA"]) {
      const key = `catalog:${catalogShard(symbol)}`;
      const old = await ctx.db
        .query("marketEntries")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      const rows = old ? JSON.parse(old.payload) : [];
      rows.push({ ticker: symbol, name: symbol, exchange: "NASDAQ" });
      if (old) await ctx.db.patch(old._id, { payload: JSON.stringify(rows) });
      else
        await ctx.db.insert("marketEntries", {
          key,
          payload: JSON.stringify(rows),
          revision: "a".repeat(64),
          dependencies: [],
          checkedAt: Date.now(),
          cost: 1000,
        });
    }
  });
  rateLimiterTest.register(t);
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const call = (
    op: string,
    visitor = "a".repeat(64),
    token = crypto.randomUUID(),
    symbols: string[] = [],
  ) =>
    t.mutation(ref("hosted:control"), {
      op,
      visitor,
      token,
      symbols,
      scope: "b".repeat(64),
    });
  const open = async (visitor?: string) => {
    const token = crypto.randomUUID();
    const result = await call("enter", visitor, token);
    await call("leave", visitor, token);
    return result;
  };
  return { t, call, open };
}
test("ordinary browsing exceeds the former daily caps, refills, and retains historical counters", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const f = await fixture();
    await f.t.run((ctx) =>
      ctx.db.insert("marketHosted", {
        key: "global",
        payload: JSON.stringify({
          day: "2026-01-01",
          opens: 100,
          buckets: { 0: 10 },
          active: {},
          revoked: [],
          guards: {},
        }),
      }),
    );
    for (let i = 0; i < 120; i++) {
      expect(await f.open()).toBeNull();
      vi.setSystemTime(Date.now() + 1000);
    }
    const state = await f.t.run(async (ctx) =>
      JSON.parse((await ctx.db.query("marketHosted").first())!.payload),
    );
    expect(state.opens).toBe(100);
    expect(state.buckets).toEqual({ 0: 10 });
    expect(
      (await f.t.run((ctx) => ctx.db.query("marketBudget").first()))!.calls,
    ).toBeGreaterThanOrEqual(120);
  } finally {
    vi.useRealTimers();
  }
});
test("visitor burst limit is independent for full hashes and expires without touching guards or revocations", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const f = await fixture();
    for (let i = 0; i < 60; i++) expect(await f.open()).toBeNull();
    const denied = await f.open();
    expect(denied?.code).toBe("BROWSING_RATE_LIMIT");
    expect(denied?.retryAt).toBeGreaterThanOrEqual(Date.now() + 1001);
    expect(denied?.retryAt).toBeLessThanOrEqual(Date.now() + 1002);
    expect(await f.open("a".repeat(63) + "b")).toBeNull();
    vi.setSystemTime(denied!.retryAt!);
    expect(await f.open()).toBeNull();
    await f.call("begin", undefined, undefined, ["SPY"]);
    await f.call("revoke");
    const before = await f.t.run((ctx) => ctx.db.query("marketBudget").first());
    vi.setSystemTime(Date.now() + 600001);
    await f.t.mutation(ref("hosted:expireVisitors"), {});
    const state = await f.t.run(async (ctx) =>
      JSON.parse((await ctx.db.query("marketHosted").first())!.payload),
    );
    expect(state.visitors).toEqual({});
    expect(Object.keys(state.guards)).toHaveLength(1);
    expect(state.revoked).toEqual(["b".repeat(64)]);
    expect(
      await f.t.run((ctx) => ctx.db.query("marketBudget").first()),
    ).toEqual(before);
  } finally {
    vi.useRealTimers();
  }
});
test("visitor cardinality is bounded, with a timed refusal instead of hash collisions", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const f = await fixture();
    for (let i = 1; i <= 256; i++) {
      expect(await f.open(i.toString(16).padStart(64, "0"))).toBeNull();
      vi.setSystemTime(Date.now() + 250);
    }
    const denied = await f.open("f".repeat(64));
    expect(denied?.code).toBe("BROWSING_RATE_LIMIT");
    expect(denied?.retryAt).toBeGreaterThan(Date.now());
  } finally {
    vi.useRealTimers();
  }
});
test("manual retries share durable cooldown and atomic monthly admission across callers", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-10T14:00:00Z"));
  try {
    const f = await fixture();
    const args = {
      key: "asset:SPY",
      cycle: "2026-11-10",
      token: crypto.randomUUID(),
      retry: false,
    };
    expect((await f.t.mutation(ref("market:acquire"), args)).status).toBe(
      "acquired",
    );
    await f.t.mutation(ref("market:release"), {
      key: args.key,
      token: args.token,
    });
    const cooldown = await f.t.mutation(ref("market:acquire"), {
      ...args,
      retry: true,
    });
    expect(cooldown.status).toBe("cooldown");
    const lease = await f.t.run((ctx) =>
      ctx.db
        .query("marketLeases")
        .withIndex("by_key", (q) => q.eq("key", args.key))
        .unique(),
    );
    expect(cooldown.retryAt).toBe(lease!.attemptedAt + 60000);
    vi.setSystemTime(cooldown.retryAt!);
    const results = await Promise.all(
      [0, 1].map(() =>
        f.t.mutation(ref("market:acquire"), {
          ...args,
          retry: true,
          token: crypto.randomUUID(),
        }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual(["acquired", "busy"]);
    await f.t.run(async (ctx) => {
      const b = (await ctx.db.query("marketBudget").first())!;
      await ctx.db.patch(b._id, { io: 497_500_000 });
    });
    const reservations = await Promise.all(
      [0, 1].map(() => f.call("provider")),
    );
    expect(reservations.filter((r) => r === null)).toHaveLength(1);
    expect(
      reservations.filter((r) => r?.code === "SHARED_BUDGET_EXHAUSTED"),
    ).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});
