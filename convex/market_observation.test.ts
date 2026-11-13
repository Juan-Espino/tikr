/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import type { MutationCtx } from "./_generated/server";
import schema from "./schema";
import { read, write, acquire } from "./market";
import {
  observeDatabase,
  type DbObservation,
} from "../tests/support/observe-database";
const modules = import.meta.glob("./**/*.ts");
const ref = (name: string) =>
  makeFunctionReference<"mutation">(`market:${name}`);
test("database observations count actual local Convex API documents and values separately from admission units", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(ref("configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const stats: DbObservation = {
    readOperations: 0,
    documentsReturned: 0,
    returnedValueBytes: 0,
    writeOperations: 0,
    writeArgumentBytes: 0,
  };
  const invoke = async <A, R>(registered: unknown, args: A): Promise<R> =>
    t.run(async (ctx) => {
      const handler = (
        registered as { _handler: (ctx: MutationCtx, args: A) => Promise<R> }
      )._handler;
      return handler({ ...ctx, db: observeDatabase(ctx.db, stats) }, args);
    });
  const token = "12345678-1234-1234-1234-123456789012";
  await invoke(acquire, {
    key: "asset:AAA",
    cycle: "2026-11-12",
    retry: false,
    token,
  });
  await invoke(write, {
    leaseKey: "asset:AAA",
    token,
    entries: [
      {
        key: "asset:AAA",
        payload: '{"format":"monthly-v2","meta":{"from":"2026-11-01"}}',
        revision: "a".repeat(64),
        dependencies: [],
      },
    ],
  });
  const result = await invoke<
    { keys: string[] },
    { rows: unknown[]; admissionUnits: number }
  >(read, { keys: ["asset:AAA"] });
  expect(result.rows).toHaveLength(1);
  expect(stats.readOperations).toBeGreaterThan(0);
  expect(stats.documentsReturned).toBeGreaterThan(0);
  expect(stats.writeOperations).toBeGreaterThan(0);
  expect(stats.returnedValueBytes).toBeGreaterThan(0);
  console.info(
    JSON.stringify({
      scope:
        "actual application database API operations against synthetic convex-test transactions; not billing",
      stats,
      admissionUnits: result.admissionUnits,
    }),
  );
});
test("only a matching newly recorded provider reservation can settle; old ledger charges are preserved", async () => {
  const t = convexTest(schema, modules);
  const control = makeFunctionReference<"mutation">("hosted:control");
  await t.mutation(ref("configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  await t.run(async (ctx) => {
    const row = await ctx.db.query("marketBudget").unique();
    await ctx.db.patch(row!._id, { io: 123456 });
  });
  const args = {
    scope: "0".repeat(64),
    symbols: [],
    token: "12345678-1234-1234-1234-123456789012",
  };
  expect(await t.mutation(control, { ...args, op: "provider" })).toBeNull();
  expect(
    await t.mutation(control, {
      ...args,
      op: "providerFinish",
      receivedBytes: 100,
    }),
  ).toBeNull();
  const row = await t.run((ctx) => ctx.db.query("marketBudget").unique());
  expect(row!.io).toBe(123456 + 8192 + 100);
  await expect(
    t.mutation(control, { ...args, op: "providerFinish", receivedBytes: 0 }),
  ).rejects.toThrow("INVALID_CONTROL");
});
