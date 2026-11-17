// @vitest-environment node
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
vi.mock("server-only", () => ({}));
const modules = import.meta.glob("../convex/**/*.ts");
test("independent durable coordinators share Convex publication for delayed SPY", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
  const t = convexTest(schema, modules);
  await t.mutation(makeFunctionReference<"mutation">("market:configure"), {
    otherStorage: 0,
    otherIo: 0,
    otherCalls: 0,
    reviewedThrough: Date.now() + 86400000,
  });
  for (const [key, value] of Object.entries({
    TIKR_HOSTED_DATA_ENABLED: "explicit",
    TIKR_MARKET_MODE: "personal-provisional",
    TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
    TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
    TIKR_MARKET_GATEWAY_KEY: "synthetic-shared-refresh-00000000000",
  }))
    vi.stubEnv(key, value);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname !== "synthetic.convex.site")
        throw Error("UNEXPECTED_DESTINATION");
      return t.fetch(url.pathname, init);
    }),
  );
  try {
    const { convexStorage, revision } =
      await import("../src/lib/market-storage");
    const { catalogShard, packCatalogShard } =
      await import("../src/lib/asset-catalog");
    await t.run(async (ctx) => {
      await ctx.db.insert("marketEntries", {
        key: `catalog:${catalogShard("SPY")}`,
        payload: JSON.stringify(
          packCatalogShard([
            { ticker: "SPY", name: "SPY", exchange: "NASDAQ" },
          ]),
        ),
        revision: "a".repeat(64),
        dependencies: [],
        checkedAt: Date.now(),
        cost: 500,
      });
    });
    const { createDurableBacktests } =
      await import("../src/lib/durable-market");
    const { PROVISIONAL_POLICY } =
      await import("../src/lib/alpaca/personal-loader");
    const days = ["2026-11-11", "2026-11-12"];
    const scope = revision({ policy: PROVISIONAL_POLICY, start: "2021-11-13" });
    let calls = 0;
    const load = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 1800));
      return {
        feed: "sip" as const,
        asset: {
          symbol: "SPY",
          firstAvailable: days[0]!,
          from: days[0]!,
          through: days[1]!,
          complete: true,
          inceptionVerified: true,
          pricesComplete: true,
          actionsComplete: true,
          accessComplete: true,
          priceBasis: "raw" as const,
          provenance: "synthetic",
          prices: Object.fromEntries(days.map((d) => [d, "100"])),
          actions: [],
        },
      };
    };
    const make = () =>
      createDurableBacktests({
        storage: convexStorage(
          "https://synthetic.convex.cloud",
          "synthetic",
          scope,
          PROVISIONAL_POLICY,
        ),
        calendar: () => ({
          from: days[0]!,
          through: "2026-11-13",
          sessions: days,
          complete: true,
          finalityVerified: true,
          provenance: "synthetic",
        }),
        load,
        supportedSymbols: ["SPY"],
        historyStart: days[0]!,
        clock: () => new Date("2026-11-13T15:00:00Z"),
        evidenceRevision: scope,
        evidenceValidUntil: () => Date.parse("2026-12-01"),
        timeoutMs: 10000,
      });
    const request = {
      portfolios: [
        { id: "synthetic", holdings: [{ symbol: "SPY", weight: "100" }] },
      ],
      amount: "100",
    };
    const a = await make()(request, "Max");
    const b = await make()(request, "Max");
    const views = await Promise.all([a.settled, b.settled]);
    expect(views.map((v) => ({ status: v.status, code: v.code }))).toEqual([
      { status: "ready", code: undefined },
      { status: "ready", code: undefined },
    ]);
    expect(calls).toBe(1);
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
}, 20000);
