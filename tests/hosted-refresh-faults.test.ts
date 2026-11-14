// @vitest-environment node
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { expect, test, vi } from "vitest";
import schema from "../convex/schema";
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/market-admission.ts", () => ({
  localAdmission: () => {
    throw Error("Hosted fixture must not use owner ledger");
  },
}));
const modules = import.meta.glob("../convex/**/*.ts");
const ref = (name: string) => makeFunctionReference<"mutation">(name);

for (const mode of [
  "401",
  "403",
  "429",
  "503",
  "timeout",
  "partial",
  "pagination",
  "action",
]) {
  test(`actual hosted runtime preserves ${mode} breadcrumb through failed work and automatic restarted recovery`, async () => {
    vi.useFakeTimers(mode === "timeout" ? undefined : { toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-13T14:00:00Z"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const t = convexTest(schema, modules);
    await t.mutation(ref("market:configure"), {
      otherStorage: 0,
      otherIo: 0,
      otherCalls: 0,
      reviewedThrough: Date.now() + 3 * 86400000,
    });
    for (const [name, value] of Object.entries({
      NODE_ENV: "production",
      TIKR_HOSTED_DATA_ENABLED: "explicit",
      TIKR_MARKET_MODE: "personal-provisional",
      TIKR_MARKET_HOSTED_ORIGIN: "https://tikr.example",
      TIKR_CONVEX_SITE_URL: "https://synthetic.convex.site",
      TIKR_MARKET_GATEWAY_KEY: "synthetic-refresh-fault-only-00000000",
      ALPACA_API_KEY_ID: "synthetic",
      ALPACA_API_SECRET_KEY: "synthetic",
    }))
      vi.stubEnv(name, value);
    const days = [
      "2026-11-05",
      "2026-11-06",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
    ];
    let failing = true,
      providerCalls = 0,
      scope = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.hostname === "synthetic.convex.site") {
          const body = JSON.parse(String(init?.body));
          if (body.args.scope && body.args.scope !== "0".repeat(64))
            scope = body.args.scope;
          return t.fetch(url.pathname, init);
        }
        providerCalls++;
        if (url.pathname === "/v2/assets")
          return Response.json([
            {
              symbol: "SPY",
              name: "SPY",
              exchange: "ARCA",
              status: "active",
              class: "us_equity",
              tradable: true,
            },
          ]);
        if (url.pathname === "/v2/calendar")
          return Response.json(
            days.map((date) => ({ date, open: "09:30", close: "16:00" })),
          );
        if (url.pathname === "/v2/stocks/bars") {
          if (failing && mode === "timeout")
            return new Promise<Response>((_resolve, reject) =>
              init?.signal?.addEventListener(
                "abort",
                () => reject(Error("Synthetic timeout")),
                { once: true },
              ),
            );
          if (failing && /^\d+$/.test(mode))
            return new Response("private-provider-canary", {
              status: Number(mode),
            });
          return Response.json({
            bars: {
              SPY: (failing &&
              mode === "pagination" &&
              url.searchParams.has("page_token")
                ? []
                : days
              )
                .filter(
                  (day) =>
                    day >= url.searchParams.get("start")!.slice(0, 10) &&
                    day <= url.searchParams.get("end")!.slice(0, 10),
                )
                .filter((_, i) => !(failing && mode === "partial" && i === 2))
                .map((d, i) => ({ t: d + "T05:00:00Z", c: 100 + i })),
            },
            next_page_token:
              failing && mode === "pagination" ? "repeated" : null,
          });
        }
        if (url.pathname === "/v1/corporate-actions")
          return Response.json({
            corporate_actions:
              failing && mode === "action"
                ? {
                    spin_offs: [
                      {
                        id: "synthetic-event",
                        symbol: "SPY",
                        ex_date: "2026-11-10",
                      },
                    ],
                  }
                : {},
            next_page_token: null,
          });
        throw Error("Unexpected fixture destination");
      }),
    );
    const request = {
      portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
      amount: "100",
      range: "1W" as const,
      retry: false,
    };
    const open = async () => {
      vi.resetModules();
      const { openMarket } = await import("../src/lib/market-runtime");
      const { withMarketTrace } = await import("../src/lib/market-trace");
      const pending = withMarketTrace(
        async () => (await openMarket(request)).settled,
      );
      if (mode === "timeout") {
        let done = false;
        void pending.then(
          () => {
            done = true;
          },
          () => {
            done = true;
          },
        );
        for (let tick = 0; !done && tick < 60; tick++)
          await vi.advanceTimersByTimeAsync(1000);
      }
      return pending;
    };
    try {
      expect((await open()).status).toBe("blocked");
      const state = await t.run(async (ctx) =>
        JSON.parse((await ctx.db.query("marketHosted").unique())!.payload),
      );
      const original = state.failures[`${scope}:SPY`];
      expect(original).toMatchObject({
        stage: "source",
        code: (
          {
            "401": "AUTH",
            "403": "FORBIDDEN",
            "429": "RATE_LIMIT",
            "503": "UPSTREAM",
            timeout: "TIMEOUT",
            partial: "MISSING_PRICE",
            pagination: "PAGINATION",
            action: "UNSUPPORTED_ACTION",
          } as Record<string, string>
        )[mode],
      });
      expect(original.trace).toMatch(/^[a-f0-9-]{36}$/);
      // No operational cooldown: a reload can recover the expired owned guard.
      // Keep the original backend breadcrumb until validated replacement commits.
      const lease = await t.run((ctx) =>
        ctx.db
          .query("marketLeases")
          .withIndex("by_key", (q) => q.eq("key", "asset:SPY"))
          .unique(),
      );
      expect(lease?.attempts).toBe(1);
      failing = false;
      const recovered = await open();
      expect(recovered.status, JSON.stringify(recovered)).toBe("ready");
      expect(recovered.period).toEqual({
        start: days[0],
        end: days.at(-1),
      });
      await t.run(async (ctx) => {
        const current = JSON.parse(
          (await ctx.db.query("marketHosted").unique())!.payload,
        );
        expect(current.guards[`${scope}:SPY`]).toBeUndefined();
        expect(current.failures[`${scope}:SPY`]).toBeUndefined();
        expect(
          (
            await ctx.db
              .query("marketLeases")
              .withIndex("by_key", (q) => q.eq("key", "asset:SPY"))
              .unique()
          )?.attempts,
        ).toBe(2);
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        "private-provider-canary",
      );
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.useRealTimers();
    }
  });
}
