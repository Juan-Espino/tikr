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
        evidenceScope: scope,
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
    expect(await check()).toMatchObject({ code: "REFRESH_GUARDED" });
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
    expect(await check()).toMatchObject({ code: "REFRESH_GUARDED" });
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
    expect(await check()).toMatchObject({ code: "REFRESH_GUARDED" });
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

test("retained guard rejection never spends an asset provider attempt or creates a lease", async () => {
  const t = convexTest(schema, modules),
    scope = "a".repeat(64);
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const guard = crypto.randomUUID();
  await t.run((ctx) =>
    ctx.db.insert("marketHosted", {
      key: "global",
      payload: JSON.stringify({
        day: "2026-11-10",
        opens: 1,
        buckets: { 5: 1 },
        active: {},
        revoked: [],
        guards: { [`${scope}:AMZN`]: guard },
      }),
    }),
  );
  for (let i = 0; i < 3; i++) {
    expect(
      (
        await t.mutation(ref("market:acquire"), {
          key: "asset:AMZN",
          token: crypto.randomUUID(),
          cycle: "2026-11-12",
          retry: true,
        })
      ).status,
    ).toBe("guarded");
  }
  await t.run(async (ctx) => {
    expect(await ctx.db.query("marketLeases").first()).toBeNull();
    const state = JSON.parse(
      (await ctx.db.query("marketHosted").unique())!.payload,
    );
    expect(state.guards[`${scope}:AMZN`]).toBe(guard);
    expect(state.opens).toBe(1);
  });
});

test("a hosted claim rejected before begin retains all old attempt counters", async () => {
  const t = convexTest(schema, modules),
    scope = "a".repeat(64),
    token = crypto.randomUUID();
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  await t.run((ctx) =>
    ctx.db.insert("marketLeases", {
      key: "asset:AMZN",
      token: crypto.randomUUID(),
      expires: 0,
      cycle: "2026-11-12",
      attempts: 1,
      scopeAttempts: 1,
      attemptedAt: Date.now() - 61000,
    }),
  );
  expect(
    (
      await t.mutation(ref("market:acquire"), {
        key: "asset:AMZN",
        token,
        cycle: "2026-11-12",
        retry: true,
        evidenceScope: scope,
      })
    ).status,
  ).toBe("acquired");
  // No catalog: begin rejects before any provider observation can be admitted.
  await expect(
    t.mutation(ref("hosted:control"), {
      op: "begin",
      scope,
      symbols: ["AMZN"],
      token: crypto.randomUUID(),
      leaseToken: token,
    }),
  ).rejects.toThrow("INVALID_CONTROL");
  await t.mutation(ref("market:release"), { key: "asset:AMZN", token });
  await t.run(async (ctx) => {
    const row = await ctx.db.query("marketLeases").unique();
    expect(row).toMatchObject({ attempts: 1, scopeAttempts: 1, expires: 0 });
    expect(row?.pendingAttempt?.attempts).toBe(2);
  });
});

test("failure summaries reject stale owners and arbitrary data and survive rejected retries", async () => {
  const t = convexTest(schema, modules),
    scope = "a".repeat(64),
    token = crypto.randomUUID(),
    guard = crypto.randomUUID();
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const summary = {
    trace: crypto.randomUUID(),
    at: Date.now(),
    stage: "source",
    code: "TIMEOUT",
  };
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
        revoked: [],
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
  const args = {
    op: "failure",
    scope,
    symbols: ["AMZN"],
    token: guard,
    leaseToken: token,
    failure: summary,
  };
  await expect(
    t.mutation(ref("hosted:control"), {
      ...args,
      failure: { ...summary, code: "secret-canary" },
    }),
  ).rejects.toThrow("INVALID_CONTROL");
  await expect(
    t.mutation(ref("hosted:control"), {
      ...args,
      leaseToken: crypto.randomUUID(),
    }),
  ).rejects.toThrow("LEASE_LOST");
  await t.mutation(ref("hosted:control"), args);
  await t.mutation(ref("hosted:control"), {
    ...args,
    failure: { ...summary, code: "UPSTREAM", trace: crypto.randomUUID() },
  });
  const refusal = await t.mutation(ref("hosted:control"), {
    op: "check",
    scope,
    symbols: ["AMZN"],
    token: crypto.randomUUID(),
  });
  expect(refusal).toMatchObject({
    code: "REFRESH_GUARDED",
    guardState: "active",
    failure: summary,
  });
  await t.run(async (ctx) => {
    const state = JSON.parse(
      (await ctx.db.query("marketHosted").unique())!.payload,
    );
    expect(Object.keys(state.failures)).toHaveLength(1);
    expect(state.opens).toBe(1);
    expect((await ctx.db.query("marketLeases").unique())?.attempts).toBe(1);
  });
});

test("validated progress is owner-fenced and cannot extend beyond the two-minute attempt bound", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const t = convexTest(schema, modules),
      scope = "a".repeat(64),
      token = crypto.randomUUID(),
      guard = crypto.randomUUID(),
      start = Date.now();
    await t.mutation(ref("market:configure"), {
      otherStorage: 0,
      otherIo: 0,
      otherCalls: 0,
      reviewedThrough: start + 86400000,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("marketLeases", {
        key: "asset:AMZN",
        token,
        expires: start + 60000,
        cycle: "2026-11-12",
        attempts: 1,
        attemptedAt: start,
      });
      await ctx.db.insert("marketHosted", {
        key: "global",
        payload: JSON.stringify({
          day: "2026-11-10",
          opens: 1,
          buckets: { 5: 1 },
          active: {},
          revoked: [],
          guards: { [`${scope}:AMZN`]: guard },
          observations: {
            [`${scope}:AMZN`]: {
              token: guard,
              leaseToken: token,
              expires: start + 60000,
            },
          },
        }),
      });
    });
    const args = {
      op: "progress",
      scope,
      symbols: ["AMZN"],
      token: guard,
      leaseToken: token,
    };
    await expect(
      t.mutation(ref("hosted:control"), {
        ...args,
        leaseToken: crypto.randomUUID(),
      }),
    ).rejects.toThrow("LEASE_LOST");
    for (const offset of [30000, 60000, 100000]) {
      vi.setSystemTime(start + offset);
      await t.mutation(ref("hosted:control"), args);
      await t.run(async (ctx) => {
        const lease = await ctx.db.query("marketLeases").unique();
        expect(lease?.expires).toBe(
          Math.min(start + offset + 60000, start + 120000),
        );
        expect(lease?.attempts).toBe(1);
        const state = JSON.parse(
          (await ctx.db.query("marketHosted").unique())!.payload,
        );
        expect(state.observations[`${scope}:AMZN`].expires).toBe(
          lease?.expires,
        );
      });
    }
    vi.setSystemTime(start + 120001);
    await expect(t.mutation(ref("hosted:control"), args)).rejects.toThrow(
      "LEASE_LOST",
    );
  } finally {
    vi.useRealTimers();
  }
});

test("recovery preflight retains the exact reviewed-policy validation exception without resetting exhausted counters", async () => {
  const { PERSONAL_SOURCE_POLICY: policy, REVIEWED_V5_SCOPE: scope } =
    await import("../src/lib/market-policy");
  const t = convexTest(schema, modules),
    token = crypto.randomUUID(),
    guard = crypto.randomUUID();
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  await t.run(async (ctx) => {
    await ctx.db.insert("marketLeases", {
      key: "asset:AMZN",
      token,
      expires: 0,
      cycle: new Date().toISOString().slice(0, 10),
      attempts: 2,
      scopeAttempts: 2,
      attemptedAt: Date.now() - 61000,
    });
    await ctx.db.insert("marketHosted", {
      key: "global",
      payload: JSON.stringify({
        day: "2026-11-10",
        opens: 1,
        buckets: { 5: 1 },
        active: {},
        revoked: [],
        guards: { [`${scope}:AMZN`]: guard },
        observations: {
          [`${scope}:AMZN`]: {
            token: guard,
            leaseToken: token,
            expires: Date.now() - 61000,
          },
        },
      }),
    });
  });
  expect(
    await t.mutation(ref("hosted:control"), {
      op: "recover",
      scope,
      policy,
      policyScope: scope,
      symbols: ["AMZN"],
      token: crypto.randomUUID(),
    }),
  ).toEqual(["AMZN"]);
  await t.run(async (ctx) => {
    expect((await ctx.db.query("marketLeases").unique())?.attempts).toBe(2);
  });
});
