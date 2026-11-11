// @vitest-environment node
import { test, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  reads: 0,
  rows: [] as {
    key: string;
    payload: string;
    revision: string;
    checkedAt: number;
  }[],
  busy: false,
  writes: 0,
  failWrite: false,
}));
vi.mock("../src/lib/market-storage.ts", () => ({
  revision: () => "a".repeat(64),
  convexStorage: () => ({
    read: async () => {
      state.reads++;
      return state.rows;
    },
    acquire: async () => (state.busy ? null : ((state.busy = true), "token")),
    write: async (_key: string, _token: string, rows: typeof state.rows) => {
      if (state.failWrite) throw Error("STORAGE_UNAVAILABLE");
      state.rows = rows.map((r) => ({ ...r, checkedAt: Date.now() }));
      state.writes++;
    },
    release: async () => {
      state.busy = false;
    },
  }),
}));
import { refreshCatalog, readCatalog } from "../src/lib/catalog-server";
test("durable catalog survives cold reader; cached refresh uses no provider; invalid replies never replace old shards", async () => {
  vi.stubEnv("TIKR_PERSONAL_DATA_ENABLED", "explicit");
  vi.stubEnv("TIKR_CONVEX_URL", "https://synthetic.convex.cloud");
  vi.stubEnv("TIKR_CONVEX_ADMIN_KEY", "synthetic");
  const rows = ["SPY", ...Array.from({ length: 15000 }, (_, i) => `X${i}`)].map(
    (symbol) => ({
      symbol,
      name: `Synthetic company ${symbol} Series A cumulative preferred shares international income fund`,
      status: "active",
      class: "us_equity",
      exchange: "NASDAQ",
      tradable: true,
    }),
  );
  const transport = vi.fn(async () =>
    Response.json(rows),
  ) as unknown as typeof fetch;
  try {
    await refreshCatalog(
      { keyId: "synthetic", secret: "synthetic", transport },
      "2026-11-10",
    );
    expect((await readCatalog()).length).toBe(15001);
    expect(state.writes).toBe(1);
    await refreshCatalog(
      { keyId: "synthetic", secret: "synthetic", transport },
      "2026-11-10",
    );
    expect(transport).toHaveBeenCalledTimes(1);
    const beforeReads = state.reads;
    await Promise.all([readCatalog(), readCatalog(), readCatalog()]);
    expect(state.reads).toBe(beforeReads);
    const old = state.rows;
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61000);
    state.rows = state.rows.map((r) => ({ ...r, checkedAt: 0 }));
    await expect(
      refreshCatalog(
        {
          keyId: "synthetic",
          secret: "synthetic",
          transport: async () => Response.json([{ symbol: "BAD" }]),
        },
        "2026-11-11",
      ),
    ).rejects.toThrow("CATALOG_INVALID");
    expect(state.writes).toBe(1);
    expect(state.rows.map((r) => r.payload)).toEqual(old.map((r) => r.payload));
    const fresh = old.map((r) => ({ ...r, checkedAt: Date.now() }));
    state.rows = old.map((r) => ({ ...r, checkedAt: Date.now() + 1000 }));
    expect((await readCatalog()).length).toBe(15001);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61000);
    for (const bad of [
      fresh.slice(1),
      fresh.map((r) => ({ ...r, checkedAt: Date.now() + 6000 })),
      fresh.map((r, i) => (i === 0 ? { ...r, revision: "b".repeat(64) } : r)),
      fresh.map((r, i) => (i === 0 ? { ...r, payload: "{}" } : r)),
      fresh.map((r, i) =>
        i === 0
          ? {
              ...r,
              payload: JSON.stringify([
                { ticker: "SPY", name: "Wrong shard", exchange: "NASDAQ" },
              ]),
            }
          : r,
      ),
    ]) {
      state.rows = bad;
      await expect(readCatalog()).rejects.toThrow();
    }
    state.rows = old.map((r) => ({ ...r, checkedAt: 0 }));
    for (const name of ["X".repeat(1025)]) {
      await expect(
        refreshCatalog(
          {
            keyId: "synthetic",
            secret: "synthetic",
            transport: async () =>
              Response.json(rows.slice(0, 2).map((r) => ({ ...r, name }))),
          },
          "2026-11-11",
        ),
      ).rejects.toThrow("CATALOG_INVALID");
      expect(state.writes).toBe(1);
    }
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [response, code, stage] of [
      [
        new Response(
          new ReadableStream({
            start(c) {
              c.error(Error("private-reset"));
            },
          }),
        ),
        "CATALOG_PROVIDER",
        "stream",
      ],
      [
        new Response("private-provider-error", { status: 403 }),
        "CATALOG_PROVIDER",
        "provider",
      ],
      [new Response("private-invalid-json"), "CATALOG_INVALID", "decode"],
      [Response.json([{ symbol: "PRIVATE" }]), "CATALOG_INVALID", "validation"],
      [new Response("x".repeat(16 * 1024 * 1024 + 1)), "CATALOG_LIMIT", "size"],
    ] as const) {
      await expect(
        refreshCatalog(
          {
            keyId: "synthetic",
            secret: "synthetic",
            transport: async () => response,
          },
          "2026-11-11",
        ),
      ).rejects.toThrow(code);
      const diagnostic = JSON.parse(log.mock.calls.at(-1)![0] as string) as {
        stage: string;
      };
      expect(diagnostic.stage).toBe(stage);
      expect(log.mock.calls.at(-1)![0]).not.toContain("private");
      expect(state.writes).toBe(1);
    }
    state.failWrite = true;
    await expect(
      refreshCatalog(
        { keyId: "synthetic", secret: "synthetic", transport },
        "2026-11-11",
      ),
    ).rejects.toThrow("STORAGE_UNAVAILABLE");
    expect(state.rows.map((r) => r.payload)).toEqual(old.map((r) => r.payload));
    state.failWrite = false;
    state.busy = true;
    await expect(
      refreshCatalog(
        { keyId: "synthetic", secret: "synthetic", transport },
        "2026-11-11",
      ),
    ).rejects.toThrow("CATALOG_UNAVAILABLE");
    expect(transport).toHaveBeenCalledTimes(2);
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  }
}, 20000);
