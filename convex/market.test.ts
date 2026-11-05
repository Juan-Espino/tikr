/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import schema from "./schema";
import { getDocumentSize } from "convex/values";
import { MARKET_BUDGET, storageCharge } from "../src/lib/market-budget";
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
