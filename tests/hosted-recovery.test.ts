import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
const ref = (name: string) => makeFunctionReference<"mutation">(name);
test("lease expiry, concurrent reclaim, stale publication and atomic settlement preserve retained state", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const t = convexTest(schema, modules),
      scope = "a".repeat(64),
      key = `${scope}:AMZN`;
    await t.mutation(ref("market:configure"), {
      otherStorage: 0,
      otherIo: 0,
      otherCalls: 0,
      reviewedThrough: Date.now() + 86400000,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("marketEntries", {
        key: "catalog:AM",
        payload: JSON.stringify([
          { ticker: "AMZN", name: "Amazon", exchange: "NASDAQ" },
        ]),
        revision: "b".repeat(64),
        dependencies: [],
        checkedAt: Date.now(),
        cost: 1000,
      });
    });
    // Use the catalog's actual shard, independent of the recovery protocol.
    const { catalogShard } = await import("../src/lib/asset-catalog");
    await t.run(async (ctx) => {
      const row = await ctx.db.query("marketEntries").first();
      await ctx.db.patch(row!._id, { key: `catalog:${catalogShard("AMZN")}` });
    });
    const acquire = async () => {
      const token = crypto.randomUUID();
      const result = await t.mutation(ref("market:acquire"), {
        key: "asset:AMZN",
        token,
        cycle: "2026-11-12",
        retry: true,
      });
      return { token, result };
    };
    const first = await acquire(),
      guard = crypto.randomUUID();
    const begin = (token: string, g: string) =>
      t.mutation(ref("hosted:control"), {
        op: "begin",
        scope,
        symbols: ["AMZN"],
        token: g,
        leaseToken: token,
      });
    expect(await begin(first.token, guard)).toBeNull();
    const check = () =>
      t.mutation(ref("hosted:control"), {
        op: "check",
        scope,
        symbols: ["AMZN"],
        token: crypto.randomUUID(),
      });
    expect(await check()).toEqual({ code: "REFRESH_GUARDED" });
    const manifest = {
      format: "monthly-v2",
      meta: { from: "2026-11-01", symbol: "AMZN" },
      evidenceRevision: scope,
    };
    const write = (token: string, g: string) =>
      t.mutation(ref("market:write"), {
        leaseKey: "asset:AMZN",
        token,
        guard: { scope, token: g },
        entries: [
          {
            key: "asset:AMZN",
            payload: JSON.stringify(manifest),
            revision: "c".repeat(64),
            dependencies: [],
          },
        ],
      });
    vi.setSystemTime(Date.now() + 61000);
    await expect(write(first.token, guard)).rejects.toThrow("LEASE_LOST");
    expect(
      await t.mutation(ref("hosted:control"), {
        op: "begin",
        scope,
        symbols: ["AMZN"],
        token: crypto.randomUUID(),
      }),
    ).toEqual({ code: "REFRESH_GUARDED" });
    const contenders = await Promise.all([acquire(), acquire()]);
    expect(
      contenders.filter((c) => c.result.status === "acquired"),
    ).toHaveLength(1);
    const next = contenders.find((c) => c.result.status === "acquired")!,
      nextGuard = crypto.randomUUID();
    expect(await begin(next.token, nextGuard)).toBeNull();
    await t.mutation(ref("hosted:control"), {
      op: "finish",
      scope,
      symbols: ["AMZN"],
      token: guard,
      leaseToken: first.token,
    });
    expect(await check()).toEqual({ code: "REFRESH_GUARDED" });
    await expect(write(first.token, guard)).rejects.toThrow("LEASE_LOST");
    await expect(
      t.mutation(ref("market:write"), {
        leaseKey: "asset:AMZN",
        token: next.token,
        guard: { scope, token: nextGuard },
        entries: [
          {
            key: "asset:AMZN",
            payload: JSON.stringify({
              ...manifest,
              evidenceRevision: "d".repeat(64),
            }),
            revision: "c".repeat(64),
            dependencies: [],
          },
        ],
      }),
    ).rejects.toThrow("UNVERIFIED_DATA");
    expect(await check()).toEqual({ code: "REFRESH_GUARDED" });
    expect((await write(next.token, nextGuard)).status).toBe("ok");
    expect(await check()).toBeNull();
    // A process can disappear after commit: the atomic transaction left no guard.
    await t.run(async (ctx) => {
      const state = JSON.parse(
        (await ctx.db.query("marketHosted").unique())!.payload,
      );
      expect(state.guards[key]).toBeUndefined();
    });
  } finally {
    vi.useRealTimers();
  }
});

test("a concurrent durable revocation prevents guarded publication without resetting records", async () => {
  const t = convexTest(schema, modules),
    scope = "a".repeat(64),
    token = crypto.randomUUID(),
    guard = crypto.randomUUID();
  await t.run(async (ctx) => {
    await ctx.db.insert("marketLeases", {
      key: "asset:AMZN",
      token,
      expires: Date.now() + 60000,
      cycle: "2026-11-12",
      attempts: 1,
      attemptedAt: Date.now(),
    });
    await ctx.db.insert("marketHosted", {
      key: "global",
      payload: JSON.stringify({
        day: "2026-11-10",
        opens: 1,
        buckets: { 5: 1 },
        active: {},
        revoked: [scope],
        guards: { [`${scope}:AMZN`]: guard },
        observations: {
          [`${scope}:AMZN`]: {
            token: guard,
            leaseToken: token,
            expires: Date.now() + 60000,
          },
        },
      }),
    });
  });
  await expect(
    t.mutation(ref("market:write"), {
      leaseKey: "asset:AMZN",
      token,
      guard: { scope, token: guard },
      entries: [
        {
          key: "asset:AMZN",
          payload: "{}",
          revision: "b".repeat(64),
          dependencies: [],
        },
      ],
    }),
  ).rejects.toThrow("EVIDENCE_REVOKED");
  await t.run(async (ctx) => {
    expect(await ctx.db.query("marketEntries").first()).toBeNull();
    const state = JSON.parse(
      (await ctx.db.query("marketHosted").unique())!.payload,
    );
    expect(state.revoked).toEqual([scope]);
    expect(state.guards[`${scope}:AMZN`]).toBe(guard);
    expect(state.opens).toBe(1);
  });
});
