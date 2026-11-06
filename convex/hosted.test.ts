/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "./schema";
vi.mock("server-only", () => ({}));
import { validMarketOrigin, gateway } from "../src/lib/market-hosted";
const modules = import.meta.glob("./**/*.ts");

test("overlapping hosts cannot exceed concurrency or both acquire a refresh guard", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const scope = "b".repeat(64);
  const call = (
    op: string,
    token: string,
    bucket = 0,
    symbols: string[] = [],
  ) =>
    t.mutation(makeFunctionReference<"mutation">("hosted:control"), {
      op,
      scope,
      token,
      bucket,
      symbols,
    });
  const tokens = Array.from({ length: 8 }, () => crypto.randomUUID());
  const entries = await Promise.allSettled(
    tokens.map((token, i) => call("enter", token, i)),
  );
  expect(entries.filter((r) => r.status === "fulfilled")).toHaveLength(4);
  expect(entries.filter((r) => r.status === "rejected")).toHaveLength(4);
  const guards = await Promise.allSettled(
    tokens.slice(0, 2).map((token) => call("begin", token, 0, ["SPY"])),
  );
  expect(guards.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(guards.filter((r) => r.status === "rejected")).toHaveLength(1);
  await expect(call("check", tokens[2]!, 0, ["SPY"])).rejects.toThrow(
    "REFRESH_GUARDED",
  );
  await call("revoke", tokens[3]!);
  await Promise.all(tokens.map((token) => call("leave", token)));
  await expect(call("provider", tokens[4]!)).rejects.toThrow(
    "EVIDENCE_REVOKED",
  );
});
test("HTTP gateway rejects anonymous access and cannot invoke operator functions", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-only-00000000000000000000");
  vi.stubEnv("TIKR_HOSTED_DATA_ENABLED", "explicit");
  try {
    expect(
      (await t.fetch("/market-gateway", { method: "POST", body: "{}" })).status,
    ).toBe(403);
    const response = await t.fetch("/market-gateway", {
      method: "POST",
      headers: { Authorization: "Bearer synthetic-only-00000000000000000000" },
      body: JSON.stringify({ name: "configure", args: {} }),
    });
    expect(response.status).toBe(503);
    expect(
      await t.run((ctx) => ctx.db.query("marketBudget").first()),
    ).toBeNull();
  } finally {
    vi.unstubAllEnvs();
  }
});
test("production origin validation rejects missing, forged and preview origins", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  const req = (origin: string, host = "tikr.example") =>
    new Request("https://tikr.example/api/market", {
      headers: { origin, host, "content-type": "application/json" },
    });
  expect(validMarketOrigin(req("https://tikr.example"))).toBe(true);
  expect(validMarketOrigin(req("https://evil.example"))).toBe(false);
  expect(validMarketOrigin(req("null"))).toBe(false);
  expect(validMarketOrigin(req("https://tikr.example", "evil.example"))).toBe(
    false,
  );
  vi.unstubAllEnvs();
});
test("two hosts share bounded admission, persistent guards, revocation and monthly budgets", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  const scope = "a".repeat(64);
  const host =
    () =>
    (op: string, token: string, symbols: string[] = [], bucket = 0) =>
      t.mutation(makeFunctionReference<"mutation">("hosted:control"), {
        op,
        scope,
        token,
        symbols,
        bucket,
      });
  const a = host(),
    b = host(),
    token = crypto.randomUUID();
  for (let i = 0; i < 10; i++) {
    const id = crypto.randomUUID();
    await a("enter", id);
    await b("leave", id);
  }
  await expect(b("enter", token)).rejects.toThrow("VISITOR_LIMIT");
  const ids = Array.from({ length: 4 }, () => crypto.randomUUID());
  for (const id of ids) await a("enter", id, [], 1);
  await expect(b("enter", token, [], 2)).rejects.toThrow("VISITOR_LIMIT");
  await a("begin", token, ["SPY"]);
  await expect(b("check", crypto.randomUUID(), ["SPY"])).rejects.toThrow(
    "REFRESH_GUARDED",
  );
  await b("finish", crypto.randomUUID(), ["SPY"]);
  await expect(a("check", token, ["SPY"])).rejects.toThrow("REFRESH_GUARDED");
  await a("revoke", token);
  await expect(b("provider", token)).rejects.toThrow("EVIDENCE_REVOKED");
  await t.run(async (ctx) => {
    const row = await ctx.db.query("marketBudget").first();
    await ctx.db.patch(row!._id, { io: 499999999 });
  });
  await expect(b("provider", token)).rejects.toThrow("CACHE_BUDGET");
});
test("hosted storage failures do not return data or expose upstream errors", async () => {
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-test-only-key-000000000000");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("private diagnostic", { status: 500 })),
  );
  await expect(gateway("read", { keys: [] })).rejects.toThrow(
    "STORAGE_UNAVAILABLE",
  );
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
