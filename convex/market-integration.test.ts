/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import type { Value } from "convex/values";
vi.mock("server-only", () => ({}));
import { createDurableBacktests } from "../src/lib/durable-market";
import type { MarketStorage, Stored } from "../src/lib/market-storage";
import type { Asset } from "../src/lib/backtest";
import schema from "./schema";
const modules = import.meta.glob("./**/*.ts");
test("separate coordinators share one transactional Convex store and coalesce SPY", async () => {
  const now = Date.parse("2024-11-06T14:00:00Z"),
    spy = vi.spyOn(Date, "now").mockReturnValue(now);
  try {
    const t = convexTest(schema, modules);
    const call = <T>(name: string, args: Record<string, Value>) =>
      t.mutation(
        makeFunctionReference<"mutation", Record<string, Value>, T>(
          `market:${name}`,
        ),
        args,
      );
    await call("configure", {
      otherStorage: 0,
      otherIo: 0,
      otherCalls: 0,
      reviewedThrough: now + 86400000,
    });
    let revoked = false;
    const bridge = (): MarketStorage => ({
      async beginRefresh() {
        return async () => undefined;
      },
      async assertReadable() {
        if (revoked) throw Error("EVIDENCE_REVOKED");
      },
      async revoke() {
        revoked = true;
      },
      async read(keys) {
        const r = await call<{ status: string; rows: Stored[] }>("read", {
          keys,
        });
        if (r.status !== "ok") throw Error("BUDGET");
        return r.rows;
      },
      async acquire(key, cycle, retry) {
        const token = crypto.randomUUID();
        const r = await call<{ status: string }>("acquire", {
          key,
          cycle,
          retry,
          token,
        });
        return r.status === "acquired" ? token : null;
      },
      async write(leaseKey, token, entries) {
        const r = await call<{ status: string }>("write", {
          leaseKey,
          token,
          entries,
        });
        if (r.status !== "ok") throw Error("BUDGET");
      },
      async release(key, token) {
        await call("release", { key, token });
      },
    });
    const sessions = ["2024-11-01", "2024-11-04", "2024-11-05"],
      calls: string[] = [];
    const options = {
      calendar: () => ({
        complete: true,
        finalityVerified: true,
        provenance: "synthetic",
        from: sessions[0]!,
        through: "2024-11-06",
        sessions,
      }),
      historyStart: sessions[0]!,
      supportedSymbols: ["AAA", "BBB", "SPY"],
      clock: () => new Date(now),
      evidenceValidUntil: () => now + 3600000,
      load: async (q: { symbol: string; from: string; through: string }) => {
        calls.push(q.symbol);
        await new Promise((r) => setTimeout(r, 20));
        return {
          feed: "sip" as const,
          asset: {
            symbol: q.symbol,
            firstAvailable: sessions[0]!,
            from: q.from,
            through: q.through,
            complete: true,
            inceptionVerified: true,
            pricesComplete: true,
            actionsComplete: true,
            accessComplete: true,
            priceBasis: "raw",
            provenance: "synthetic",
            prices: Object.fromEntries(
              sessions.map((d, i) => [d, String(100 + i * 10)]),
            ),
            actions: [],
          } as Asset,
        };
      },
    };
    const request = (symbol: string) => ({
      portfolios: [{ id: symbol, holdings: [{ symbol, weight: "100" }] }],
      amount: "1000",
    });
    const first = await Promise.all([
      createDurableBacktests({ ...options, storage: bridge() })(
        request("AAA"),
        "Max",
      ),
      createDurableBacktests({ ...options, storage: bridge() })(
        request("BBB"),
        "Max",
      ),
    ]);
    const settled = await Promise.all(first.map((r) => r.settled));
    expect(settled.map((r) => r.status)).toEqual(["ready", "ready"]);
    expect(calls.filter((s) => s === "SPY")).toHaveLength(1);
    const reopen = await createDurableBacktests({
      ...options,
      storage: bridge(),
    })(request("AAA"), "Max");
    expect(reopen.initial.status).toBe("ready");
    expect(calls).toHaveLength(3);
    const budget = await t.run((ctx) => ctx.db.query("marketBudget").first());
    expect(budget!.storage).toBeGreaterThan(0);
    expect(budget!.io).toBeLessThan(250_000_000);
  } finally {
    spy.mockRestore();
  }
});
