// @vitest-environment node
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
import type { MarketStorage, Stored } from "../src/lib/market-storage";
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../convex/**/*.ts");

test("unchanged monthly rows re-publish through the actual Convex argument validator", async () => {
  const { withDisposableHistory } =
    await import("../src/lib/market-history-storage");
  const { revision } = await import("../src/lib/market-storage");
  const t = convexTest(schema, modules);
  const ref = (name: string) => makeFunctionReference<"mutation">(name);
  await t.mutation(ref("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const token = crypto.randomUUID();
  await t.run(async (ctx) => {
    await ctx.db.insert("marketLeases", {
      key: "asset:SPY",
      token,
      expires: Date.now() + 60000,
      cycle: "2026-11-13",
      attempts: 1,
      attemptedAt: 0,
    });
  });
  const chunk = {
    key: "price:SPY:2026-11",
    payload: '{"prices":{"2026-11-12":"100"},"actions":[]}',
    revision: revision({ prices: { "2026-11-12": "100" }, actions: [] }),
    dependencies: [],
  };
  const head = {
    key: "asset:SPY",
    payload: JSON.stringify({
      format: "monthly-v2",
      meta: { symbol: "SPY", from: "2026-11-12" },
      prices: [chunk.key],
      content: true,
    }),
    revision: "a".repeat(64),
    dependencies: [],
  };
  const store = {
    namespace: "validator-republish",
    read: async (keys: string[]) =>
      (await t.mutation(ref("market:read"), { keys })).rows as Stored[],
    write: async (
      leaseKey: string,
      leaseToken: string,
      entries: Omit<Stored, "checkedAt">[],
    ) => {
      expect(
        (
          await t.mutation(ref("market:write"), {
            leaseKey,
            token: leaseToken,
            entries,
          })
        ).status,
      ).toBe("ok");
    },
  } as MarketStorage;
  await withDisposableHistory(store).storage.write("asset:SPY", token, [
    chunk,
    head,
  ]);
  const fresh = withDisposableHistory({
    ...store,
    namespace: "validator-republish-fresh",
  });
  await fresh.storage.read([head.key]);
  await fresh.storage.read([chunk.key]);
  await t.run(async (ctx) => {
    const lease = await ctx.db.query("marketLeases").unique();
    await ctx.db.patch(lease!._id, { expires: Date.now() + 60000 });
  });
  // Unchanged payload comes from the read path, including checkedAt. Only the
  // authoritative head changes; the boundary must send valid write arguments.
  await fresh.storage.write("asset:SPY", token, [
    { ...head, revision: "b".repeat(64) },
  ]);
});
