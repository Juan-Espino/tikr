import { catalogShard } from "../src/lib/asset-catalog";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
import {
  PERSONAL_SOURCE_POLICY as policy,
  REVIEWED_V5_SCOPE as scope,
  supersededMarketScope,
} from "../src/lib/market-policy";
const modules = import.meta.glob("../convex/**/*.ts");
const old = "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7";
const ref = makeFunctionReference<"mutation">("hosted:control");
test("exact lineage identity rejects arbitrary policy, date and current scope", () => {
  expect(supersededMarketScope(old, scope, policy)).toBe(true);
  expect(
    supersededMarketScope(
      "dcb3fad8de5e1ec032403090533da422eaa911b249dfd8511affd38539b87d8d",
      scope,
      policy,
    ),
  ).toBe(true);
  expect(supersededMarketScope(old, scope, "unknown")).toBe(false);
  expect(supersededMarketScope(old, "f".repeat(64), policy)).toBe(false);
  expect(supersededMarketScope(scope, scope, policy)).toBe(false);
});
test("retained control state preserves budgets, guards, active observations and fail-closed identity", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const state = {
    day: "2026-11-10",
    opens: 1,
    buckets: { "5": 1 },
    active: { [crypto.randomUUID()]: Date.now() + 120000 },
    visitors: {},
    providerReservations: {},
    revoked: [old],
    guards: {
      [`${old}:BA`]: "83f34e3c-536a-40ec-b74e-84c9eb0b1c55",
      [`${scope}:AMZN`]: "846ec5fd-a2b6-46e9-835b-78713b5dbf8a",
    },
  };
  const id = await t.run((ctx) =>
    ctx.db.insert("marketHosted", {
      key: "global",
      payload: JSON.stringify(state),
    }),
  );
  const call = (args: Record<string, unknown>) =>
    t.mutation(ref, {
      op: "check",
      scope,
      symbols: ["SPY"],
      token: crypto.randomUUID(),
      policy,
      policyScope: scope,
      ...args,
    });
  expect(await call({})).toBeNull();
  expect(await call({ symbols: ["BA"] })).toBeNull();
  expect(await call({ symbols: ["AMZN"] })).toEqual({
    code: "REFRESH_GUARDED",
  });
  expect(await call({ policy: undefined })).toEqual({
    code: "EVIDENCE_REVOKED",
  });
  expect(
    await call({ scope: "f".repeat(64), policyScope: "f".repeat(64) }),
  ).toEqual({ code: "EVIDENCE_REVOKED" });
  await expect(call({ scope: "f".repeat(64) })).rejects.toThrow(
    "INVALID_CONTROL",
  );
  await expect(call({ policy: "unknown" })).rejects.toThrow();
  expect(
    await t.run(async (ctx) => JSON.parse((await ctx.db.get(id))!.payload)),
  ).toEqual(state);
  // Normal checks consume the same conservative admission charges; compatibility
  // does not reset the ledger or manufacture a new accounting namespace.
  const beforeLedger = await t.run((ctx) =>
    ctx.db.query("marketBudget").unique(),
  );
  await call({});
  const afterLedger = await t.run((ctx) =>
    ctx.db.query("marketBudget").unique(),
  );
  expect(afterLedger!.calls - beforeLedger!.calls).toBe(1);
  expect(afterLedger!.io - beforeLedger!.io).toBe(131072 + 8192);
  expect(afterLedger!.storage).toBe(beforeLedger!.storage);
  const entryToken = crypto.randomUUID();
  expect(
    await call({
      op: "enter",
      scope: "0".repeat(64),
      symbols: [],
      token: entryToken,
    }),
  ).toBeNull();
  expect(
    await call({
      op: "provider",
      scope: "0".repeat(64),
      symbols: [],
      token: entryToken,
    }),
  ).toBeNull();
  const admitted = await t.run(async (ctx) =>
    JSON.parse((await ctx.db.get(id))!.payload),
  );
  expect(admitted.guards).toEqual(state.guards);
  expect(admitted.active).toMatchObject(state.active);
  expect(admitted.providerReservations[entryToken].units).toBe(2 * 1024 * 1024);
  // Even the same scope cannot steal a current observation. Exact old BA lineage
  // permits new work, retaining the old guard while a new token owns the new one.
  await t.run(async (ctx) => {
    for (const symbol of ["BA", "AMZN"])
      await ctx.db.insert("marketEntries", {
        key: `catalog:${catalogShard(symbol)}`,
        payload: JSON.stringify([
          { ticker: symbol, name: symbol, exchange: "NASDAQ" },
        ]),
        revision: "a".repeat(64),
        dependencies: [],
        checkedAt: Date.now(),
        cost: 1000,
      });
  });
  expect(await call({ op: "begin", symbols: ["AMZN"] })).toEqual({
    code: "REFRESH_GUARDED",
  });
  const outcomes = await Promise.all([
    call({ op: "begin", symbols: ["BA"] }),
    call({ op: "begin", symbols: ["BA"] }),
  ]);
  expect(outcomes.filter((x) => x === null)).toHaveLength(1);
  expect(outcomes.filter((x) => x?.code === "REFRESH_GUARDED")).toHaveLength(1);
  const observed = await t.run(async (ctx) =>
    JSON.parse((await ctx.db.get(id))!.payload),
  );
  expect(observed.guards).toMatchObject(state.guards);
  // A nonowner finish cannot acknowledge the retained AMZN observation.
  await call({ op: "finish", symbols: ["AMZN"] });
  expect(
    (await t.run(async (ctx) => JSON.parse((await ctx.db.get(id))!.payload)))
      .guards,
  ).toEqual(observed.guards);
  await t.run((ctx) =>
    ctx.db.patch(id, {
      payload: JSON.stringify({
        ...observed,
        guards: {
          ...observed.guards,
          [`${"e".repeat(64)}:RTX`]: crypto.randomUUID(),
        },
      }),
    }),
  );
  expect(await call({ symbols: ["RTX"] })).toEqual({ code: "REFRESH_GUARDED" });
  const ledger = await t.run((ctx) => ctx.db.query("marketBudget").unique());
  expect(ledger!.calls).toBeGreaterThan(0);
  expect(ledger!.io).toBeGreaterThan(0);
  for (const revoked of [scope, "e".repeat(64)]) {
    await t.run((ctx) =>
      ctx.db.patch(id, {
        payload: JSON.stringify({ ...state, revoked: [old, revoked] }),
      }),
    );
    for (const op of ["check", "begin", "enter", "provider"]) {
      expect(
        await call({
          op,
          scope: op === "enter" || op === "provider" ? "0".repeat(64) : scope,
          symbols: [],
        }),
      ).toEqual({ code: "EVIDENCE_REVOKED" });
    }
  }
});

test("gateway denies browser-supplied policy identity without server authentication", async () => {
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-test-only-00000000000000");
  vi.stubEnv("TIKR_HOSTED_DATA_ENABLED", "explicit");
  try {
    const t = convexTest(schema, modules);
    const response = await t.fetch("/market-gateway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "control",
        args: {
          op: "check",
          scope,
          policy,
          policyScope: scope,
          symbols: ["SPY"],
          token: crypto.randomUUID(),
        },
      }),
    });
    expect(response.status).toBe(403);
  } finally {
    vi.unstubAllEnvs();
  }
});
