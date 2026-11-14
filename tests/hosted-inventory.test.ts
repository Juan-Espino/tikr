import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test } from "vitest";
import schema from "../convex/schema";
const modules = import.meta.glob("../convex/**/*.ts");
test("operator inventory classifies guards and returns exact CAS metadata without payloads or writes", async () => {
  const t = convexTest(schema, modules);
  const scope = "a".repeat(64),
    revoked = "b".repeat(64),
    now = Date.now();
  const symbols = ["AMZN", "SPY", "TSM", "ASML"];
  const guards = Object.fromEntries(
    symbols.map((s) => [
      `${s === "ASML" ? revoked : scope}:${s}`,
      crypto.randomUUID(),
    ]),
  );
  const observations = Object.fromEntries(
    ["SPY", "TSM"].map((s) => [
      `${scope}:${s}`,
      {
        token: guards[`${scope}:${s}`],
        leaseToken: crypto.randomUUID(),
        expires: s === "SPY" ? now + 60000 : 0,
      },
    ]),
  );
  const payload = JSON.stringify({
    day: "2026-11-14",
    opens: 9,
    buckets: {},
    active: {},
    guards,
    observations,
    revoked: [revoked],
  });
  await t.run(async (ctx) => {
    await ctx.db.insert("marketHosted", { key: "global", payload });
    await ctx.db.insert("marketEntries", {
      key: "asset:AMZN",
      payload: "private financial payload",
      revision: "c".repeat(64),
      dependencies: [],
      checkedAt: now,
      cost: 1,
    });
  });
  const result = await t.query(
    makeFunctionReference<"query">("hosted:recoveryMetadata"),
    { symbols, asOf: now },
  );
  expect(result.map((r: { state: string }) => r.state)).toEqual([
    "legacy",
    "active",
    "abandoned",
    "revoked",
  ]);
  const later = await t.query(
    makeFunctionReference<"query">("hosted:recoveryMetadata"),
    { symbols: ["SPY"], asOf: now + 60001 },
  );
  expect(later[0].state).toBe("abandoned");
  expect(result[0]).toMatchObject({
    expectedHead: "c".repeat(64),
    expectedLeaseToken: null,
  });
  expect(JSON.stringify(result)).not.toContain("private financial payload");
  await t.run(async (ctx) => {
    expect((await ctx.db.query("marketHosted").unique())?.payload).toBe(
      payload,
    );
  });
  await expect(
    t.query(makeFunctionReference<"query">("hosted:recoveryMetadata"), {
      symbols: ["invalid!"],
      asOf: now,
    }),
  ).rejects.toThrow("INVALID_CONTROL");
});
