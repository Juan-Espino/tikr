/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import schema from "./schema";
import { packCatalogShard } from "../src/lib/asset-catalog";
import { getDocumentSize } from "convex/values";
import { MARKET_BUDGET, storageCharge } from "../src/lib/market-budget";
import { PERSONAL_SOURCE_POLICY } from "../src/lib/market-policy";
const modules = import.meta.glob("./**/*.ts");
const ref = (name: string) =>
  makeFunctionReference<"mutation">(`market:${name}`);
async function fixture() {
  const t = convexTest(schema, modules);
  await t.mutation(ref("configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  return t;
}
const entry = {
  key: "asset:SPY",
  payload: '{"prices":{}}',
  revision: "a".repeat(64),
  dependencies: [],
};
const token = "12345678-1234-1234-1234-123456789012";

test("persisting a period limitation does not certify a completed source refresh", async () => {
  const t = await fixture();
  expect(
    (
      await t.mutation(ref("acquire"), {
        key: "asset:SPY",
        token,
        cycle: "2026-11-11",
        retry: false,
      })
    ).status,
  ).toBe("acquired");
  expect(
    (
      await t.mutation(ref("write"), {
        leaseKey: "asset:SPY",
        token,
        entries: [
          {
            ...entry,
            key: "limitation:SPY:5Y",
            payload: '{"code":"MISSING_PRICE"}',
          },
        ],
      })
    ).status,
  ).toBe("ok");
  const lease = await t.run((ctx) =>
    ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", "asset:SPY"))
      .unique(),
  );
  expect(lease?.completed).toBe(false);
  expect(lease?.completedFrom).toBeUndefined();
  expect(lease?.attempts).toBe(1);
});

test("exact reviewed policy permits one fresh validation while retaining exhausted attempt counters", async () => {
  const t = await fixture(),
    cycle = "2026-11-11";
  await t.run(async (ctx) => {
    await ctx.db.insert("marketLeases", {
      key: "asset:SPY",
      token,
      cycle,
      expires: 0,
      attemptedAt: Date.now() - 61000,
      attempts: 2,
      scopeAttempts: 2,
      completed: false,
    });
  });
  const args = { key: "asset:SPY", token, cycle, retry: true };
  expect((await t.mutation(ref("acquire"), args)).status).toBe("daily");
  expect(
    (
      await t.mutation(ref("acquire"), {
        ...args,
        reviewedPolicy: PERSONAL_SOURCE_POLICY,
      })
    ).status,
  ).toBe("acquired");
  const row = await t.run((ctx) =>
    ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", "asset:SPY"))
      .unique(),
  );
  expect(row).toMatchObject({
    attempts: 3,
    scopeAttempts: 3,
    reviewedPolicy: PERSONAL_SOURCE_POLICY,
  });
  await t.mutation(ref("release"), { key: args.key, token });
  expect(
    (
      await t.mutation(ref("acquire"), {
        ...args,
        reviewedPolicy: PERSONAL_SOURCE_POLICY,
      })
    ).status,
  ).toBe("daily");
  await expect(
    t.mutation(ref("acquire"), { ...args, reviewedPolicy: "random-scope" }),
  ).rejects.toThrow();
});

test("reviewed policy cannot bypass a live lease, cooldown or shared budget", async () => {
  for (const mode of ["busy", "cooldown", "budget"]) {
    const t = await fixture(),
      cycle = "2026-11-11";
    await t.run(async (ctx) => {
      await ctx.db.insert("marketLeases", {
        key: "asset:SPY",
        token,
        cycle,
        expires: mode === "busy" ? Date.now() + 60000 : 0,
        attemptedAt: mode === "cooldown" ? Date.now() : Date.now() - 61000,
        attempts: 2,
        scopeAttempts: 2,
      });
      if (mode === "budget") {
        const b = (await ctx.db
          .query("marketBudget")
          .withIndex("by_key", (q) => q.eq("key", "global"))
          .unique())!;
        await ctx.db.patch(b._id, { io: MARKET_BUDGET.monthlyIoBytes });
      }
    });
    expect(
      (
        await t.mutation(ref("acquire"), {
          key: "asset:SPY",
          token,
          cycle,
          retry: true,
          reviewedPolicy: PERSONAL_SOURCE_POLICY,
        })
      ).status,
    ).toBe(mode);
  }
});

test("a reviewed policy upgrade that also expands coverage retains cooldown and counters", async () => {
  vi.useFakeTimers();
  try {
    const t = await fixture(),
      cycle = "2026-11-11";
    await t.run(async (ctx) => {
      await ctx.db.insert("marketLeases", {
        key: "asset:SPY",
        token,
        cycle,
        expires: 0,
        attemptedAt: Date.now(),
        attempts: 2,
        scopeAttempts: 2,
        completed: true,
        completedFrom: "2026-11-03",
      });
    });
    const args = {
      key: "asset:SPY",
      token,
      cycle,
      retry: true,
      from: "2021-11-10",
      reviewedPolicy: PERSONAL_SOURCE_POLICY,
    };
    expect((await t.mutation(ref("acquire"), args)).status).toBe("cooldown");
    vi.advanceTimersByTime(61000);
    expect((await t.mutation(ref("acquire"), args)).status).toBe("acquired");
    const row = await t.run((ctx) =>
      ctx.db
        .query("marketLeases")
        .withIndex("by_key", (q) => q.eq("key", "asset:SPY"))
        .unique(),
    );
    expect(row).toMatchObject({
      attempts: 3,
      scopeAttempts: 3,
      reviewedPolicy: PERSONAL_SOURCE_POLICY,
    });
  } finally {
    vi.useRealTimers();
  }
});
test("requires reviewed team headroom; rejects insufficient free allowance", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(ref("read"), { keys: [] })).rejects.toThrow(
    "TEAM_BUDGET_UNVERIFIED",
  );
  await expect(
    t.mutation(ref("configure"), {
      otherStorage: 400_000_000,
      otherIo: 0,
      otherCalls: 0,
      reviewedThrough: Date.now() + 86400000,
    }),
  ).rejects.toThrow("TEAM_BUDGET_INVALID");
});
test("concurrent lease acquisition has one winner and persists across client handles", async () => {
  const t = await fixture();
  const args = { key: "asset:SPY", token, cycle: "2026-11-04", retry: false };
  const results = await Promise.all([
    t.mutation(ref("acquire"), args),
    t.mutation(ref("acquire"), {
      ...args,
      token: "22345678-1234-1234-1234-123456789012",
    }),
  ]);
  expect(results.filter((r) => r.status === "acquired")).toHaveLength(1);
  expect(results.filter((r) => r.status === "busy")).toHaveLength(1);
});
test("stale writer cannot commit after lease expiry and takeover", async () => {
  vi.useFakeTimers();
  try {
    const t = await fixture();
    const args = { key: "asset:SPY", token, cycle: "2026-11-04", retry: false };
    await t.mutation(ref("acquire"), args);
    vi.advanceTimersByTime(61000);
    const newer = "22345678-1234-1234-1234-123456789012";
    expect(
      (await t.mutation(ref("acquire"), { ...args, token: newer, retry: true }))
        .status,
    ).toBe("acquired");
    await expect(
      t.mutation(ref("write"), { leaseKey: args.key, token, entries: [entry] }),
    ).rejects.toThrow("LEASE_LOST");
    await t.mutation(ref("write"), {
      leaseKey: args.key,
      token: newer,
      entries: [entry],
    });
    expect(
      (await t.mutation(ref("read"), { keys: [entry.key] })).rows[0].revision,
    ).toBe(entry.revision);
  } finally {
    vi.useRealTimers();
  }
});
test("budgets deny data without writes, including storage and IO", async () => {
  const t = await fixture();
  await t.mutation(ref("acquire"), {
    key: "asset:SPY",
    token,
    cycle: "2026-11-04",
    retry: false,
  });
  await t.run(async (ctx) => {
    const b = (await ctx.db.query("marketBudget").first())!;
    await ctx.db.patch(b._id, { storage: MARKET_BUDGET.storageBytes });
  });
  expect(
    (
      await t.mutation(ref("write"), {
        leaseKey: "asset:SPY",
        token,
        entries: [entry],
      })
    ).status,
  ).toBe("storage");
  await t.run(async (ctx) => {
    const b = (await ctx.db.query("marketBudget").first())!;
    await ctx.db.patch(b._id, { io: MARKET_BUDGET.monthlyIoBytes });
  });
  expect((await t.mutation(ref("read"), { keys: [entry.key] })).status).toBe(
    "budget",
  );
});
test("dependency revision compare and swap prevents stale results", async () => {
  const t = await fixture();
  await t.mutation(ref("acquire"), {
    key: "asset:SPY",
    token,
    cycle: "2026-11-04",
    retry: false,
  });
  await t.mutation(ref("write"), {
    leaseKey: "asset:SPY",
    token,
    entries: [entry],
  });
  await t.mutation(ref("acquire"), {
    key: "job:result:slot0",
    token,
    cycle: "2026-11-04",
    retry: false,
  });
  await expect(
    t.mutation(ref("write"), {
      leaseKey: "job:result:slot0",
      token,
      entries: [
        {
          ...entry,
          key: "result:slot0",
          dependencies: [{ key: entry.key, revision: "b".repeat(64) }],
        },
      ],
    }),
  ).rejects.toThrow("REVISION_CHANGED");
});
test("real Convex value size has bounded document/index charge", () => {
  const row = { ...entry, checkedAt: 0, cost: 0 };
  expect(getDocumentSize(row)).toBeGreaterThan(entry.payload.length);
  expect(storageCharge(getDocumentSize(row))).toBeGreaterThan(
    3 * getDocumentSize(row),
  );
});

test("catalog replacement is atomic across all 32 shards on invalid document and storage refusal", async () => {
  const t = await fixture();
  const leaseKey = "catalog:refresh";
  await t.mutation(ref("acquire"), {
    key: leaseKey,
    token,
    cycle: "2026-11-10",
    retry: true,
  });
  const entries = Array.from({ length: 32 }, (_, i) => ({
    key: `catalog:${i}`,
    payload: JSON.stringify(packCatalogShard([])),
    revision: "a".repeat(64),
    dependencies: [],
  }));
  expect(
    (await t.mutation(ref("write"), { leaseKey, token, entries })).status,
  ).toBe("ok");
  await t.mutation(ref("acquire"), {
    key: leaseKey,
    token,
    cycle: "2026-11-11",
    retry: true,
  });
  const replacement = entries.map((e) => ({ ...e, revision: "b".repeat(64) }));
  await expect(
    t.mutation(ref("write"), {
      leaseKey,
      token,
      entries: replacement.map((e, i) =>
        i === 31 ? { ...e, payload: "x".repeat(61000) } : e,
      ),
    }),
  ).rejects.toThrow("DOCUMENT_LIMIT");
  expect(
    (
      await t.mutation(ref("read"), { keys: entries.map((e) => e.key) })
    ).rows.map((e: { revision: string }) => e.revision),
  ).toEqual(entries.map((e) => e.revision));
  await t.run(async (ctx) => {
    const budget = await ctx.db
      .query("marketBudget")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    await ctx.db.patch(budget!._id, { storage: MARKET_BUDGET.storageBytes });
  });
  expect(
    (await t.mutation(ref("write"), { leaseKey, token, entries: replacement }))
      .status,
  ).toBe("storage");
  expect(
    (
      await t.mutation(ref("read"), { keys: entries.map((e) => e.key) })
    ).rows.map((e: { revision: string }) => e.revision),
  ).toEqual(entries.map((e) => e.revision));
});

test("window expansion retains symbol exclusion and cannot bypass failed-attempt cooldown", async () => {
  vi.useFakeTimers();
  const t = await fixture();
  const args = {
    key: "asset:SPY",
    token,
    cycle: "2026-11-10",
    retry: false,
    from: "2026-11-03",
  };
  expect((await t.mutation(ref("acquire"), args)).status).toBe("acquired");
  expect(
    (await t.mutation(ref("acquire"), { ...args, from: "2025-11-10" })).status,
  ).toBe("busy");
  await t.mutation(ref("write"), {
    leaseKey: args.key,
    token,
    entries: [
      {
        ...entry,
        payload: JSON.stringify({
          format: "monthly-v2",
          meta: { from: args.from },
        }),
      },
    ],
  });
  expect(
    (await t.mutation(ref("acquire"), { ...args, from: "2025-11-10" })).status,
  ).toBe("acquired");
  await t.mutation(ref("release"), { key: args.key, token });
  expect(
    (await t.mutation(ref("acquire"), { ...args, from: "2021-11-10" })).status,
  ).toBe("daily");
  expect(
    (
      await t.mutation(ref("acquire"), {
        ...args,
        from: "2025-11-10",
        retry: true,
      })
    ).status,
  ).toBe("cooldown");
  vi.advanceTimersByTime(61000);
  expect(
    (
      await t.mutation(ref("acquire"), {
        ...args,
        from: "2025-11-10",
        retry: true,
      })
    ).status,
  ).toBe("acquired");
  const lease = await t.run(async (ctx) =>
    ctx.db
      .query("marketLeases")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique(),
  );
  expect(lease?.attempts).toBe(3);
  expect(lease?.scopeAttempts).toBe(2);
  vi.useRealTimers();
});
