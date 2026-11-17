// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { diagnose, providerCredentials } from "../src/lib/market-diagnostics";
import { enterHosted, gateway } from "../src/lib/market-hosted";

test("overlapping gateway mutations serialize and a rejected call releases the next caller", async () => {
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-test-only-00000000000000");
  vi.spyOn(console, "error").mockImplementation(() => {});
  let release!: () => void, started!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const begun = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  vi.stubGlobal("fetch", async () => {
    if (++calls === 1) {
      started();
      await blocked;
      return new Response(null, { status: 503 });
    }
    return Response.json({ result: "readable" });
  });
  const first = gateway("read", { keys: [] });
  const rejected = expect(first).rejects.toThrow("STORAGE_UNAVAILABLE");
  await begun;
  const next = gateway("read", { keys: [] });
  expect(calls).toBe(1);
  release();
  await rejected;
  await expect(next).resolves.toBe("readable");
  expect(calls).toBe(2);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
test("credentials fail closed; legacy works and canonical takes precedence", () => {
  expect(() => providerCredentials({})).toThrow("PROVIDER_NOT_CONFIGURED");
  const legacy = {
    APCA_API_KEY: "synthetic-old",
    APCA_API_SECRET: "synthetic-secret",
  };
  expect(providerCredentials(legacy).keyId).toBe("synthetic-old");
  expect(
    providerCredentials({ ...legacy, ALPACA_API_KEY_ID: "synthetic-new" })
      .keyId,
  ).toBe("synthetic-new");
  expect(() =>
    providerCredentials({ ...legacy, ALPACA_API_KEY_ID: "" }),
  ).toThrow("PROVIDER_NOT_CONFIGURED");
});
test("malformed gateway config make no outgoing requests", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(
    enterHosted(new Request("https://tikr.example")),
  ).rejects.toThrow("HOSTED_CONFIG");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://wrong.example");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-test-only-00000000000000");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  await expect(
    enterHosted(
      new Request("https://tikr.example", {
        headers: { "x-vercel-forwarded-for": "192.0.2.1" },
      }),
    ),
  ).rejects.toThrow("HOSTED_CONFIG");
  expect(fetch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    JSON.stringify({
      event: "market_failure",
      stage: "config",
      code: "HOSTED_CONFIG",
    }),
  );
});
test("diagnostics emit only exact allowlisted codes, never exception content", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  diagnose("calendar", new Error("UPSTREAM secret-canary 192.0.2.1"));
  diagnose("stream", new Error("TIMEOUT"));
  expect(log.mock.calls).toEqual([
    [
      JSON.stringify({
        event: "market_failure",
        stage: "calendar",
        code: "UNKNOWN_FAILURE",
      }),
    ],
    [
      JSON.stringify({
        event: "market_failure",
        stage: "stream",
        code: "TIMEOUT",
      }),
    ],
  ]);
});

test("hosted runtime missing credentials fails before calendar or provider transport", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_HOSTED_DATA_ENABLED", "explicit");
  vi.stubEnv("TIKR_MARKET_MODE", "personal-provisional");
  for (const name of [
    "ALPACA_API_KEY_ID",
    "ALPACA_API_SECRET_KEY",
    "APCA_API_KEY",
    "APCA_API_SECRET",
  ])
    vi.stubEnv(name, undefined);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { openMarket } = await import("../src/lib/market-runtime");
  await expect(
    openMarket({
      portfolios: [{ id: "p", holdings: [{ symbol: "SPY", weight: "100" }] }],
      amount: "100",
      range: "1W",
    }),
  ).rejects.toThrow("PROVIDER_NOT_CONFIGURED");
  expect(fetch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    JSON.stringify({
      event: "market_failure",
      stage: "config",
      code: "PROVIDER_NOT_CONFIGURED",
    }),
  );
});

test("trace contexts are isolated and reject arbitrary exception fields", async () => {
  const { withMarketTrace, marketTrace } =
    await import("../src/lib/market-trace");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const ids = await Promise.all(
    [1, 2].map(() =>
      withMarketTrace(async () => {
        const id = marketTrace();
        await Promise.resolve();
        diagnose("runtime", new Error("secret-canary"));
        expect(marketTrace()).toBe(id);
        return id;
      }),
    ),
  );
  expect(new Set(ids).size).toBe(2);
  expect(marketTrace()).toBeUndefined();
  for (const call of log.mock.calls) {
    const row = JSON.parse(String(call[0]));
    expect(ids).toContain(row.trace);
    expect(row.code).toBe("UNKNOWN_FAILURE");
    expect(Object.keys(row).sort()).toEqual([
      "code",
      "durationMs",
      "event",
      "stage",
      "trace",
    ]);
  }
});

test("HTTP200 lease refusals are distinct from provider transport and preserve the original safe reason", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-lease-diagnostic-00000000");
  const retryAt = Date.now() + 60000;
  const fetch = vi.fn(async () =>
    Response.json({ result: { status: "daily", retryAt } }),
  );
  vi.stubGlobal("fetch", fetch);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { convexStorage } = await import("../src/lib/market-storage");
  await expect(
    convexStorage(
      "https://synthetic.convex.cloud",
      "synthetic",
      "a".repeat(64),
    ).acquire("asset:SPY", "2026-11-13", true),
  ).rejects.toMatchObject({ code: "REFRESH_COOLDOWN", retryAt });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(log.mock.calls[0]![0]))).toEqual({
    event: "market_lease_rejected",
    stage: "lease",
    status: "daily",
    symbol: "SPY",
    retryAt,
  });
});

test("provider batch trace joins each browser-request parent without leaking request content", async () => {
  const { createBatchedPersonalLoader } =
    await import("../src/lib/alpaca/batched-loader");
  const { withMarketTrace, marketTrace } =
    await import("../src/lib/market-trace");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const days = ["2026-11-11", "2026-11-12"];
  const parents: string[] = [];
  const loader = createBatchedPersonalLoader(
    { keyId: "synthetic", secret: "secret-canary" },
    {
      from: days[0]!,
      through: days[1]!,
      sessions: days,
      complete: true,
      finalityVerified: true,
      provenance: "synthetic",
    },
    async (_config, q) => ({
      symbols: q.symbols,
      start: q.start,
      end: q.end,
      prices: Object.fromEntries(
        q.symbols.map((symbol) => [
          symbol,
          Object.fromEntries(days.map((day) => [day, "100"])),
        ]),
      ),
      actions: [],
      evidence: {
        barsTraversal: "complete",
        actionsTraversal: "complete",
        actionsCompleteness: "unknown",
        note: "synthetic",
      },
    }),
  );
  await Promise.all(
    ["SPY", "AAPL"].map((symbol) =>
      withMarketTrace(async () => {
        parents.push(marketTrace()!);
        return loader({
          symbol,
          from: days[0]!,
          through: days[1]!,
          recheckFrom: days[0]!,
          signal: new AbortController().signal,
        });
      }),
    ),
  );
  const batch = log.mock.calls
    .map((call) => JSON.parse(String(call[0])))
    .find((row) => row.event === "market_provider_batch");
  expect(batch.parents.sort()).toEqual(parents.sort());
  expect(batch.symbolCount).toBe(2);
  expect(parents).not.toContain(batch.trace);
  expect(JSON.stringify(log.mock.calls)).not.toContain("secret-canary");
});

test("hosted endObservation expires the exact owner once even after unsuccessful publication", async () => {
  vi.stubEnv("TIKR_MARKET_HOSTED_ORIGIN", "https://tikr.example");
  vi.stubEnv("TIKR_CONVEX_SITE_URL", "https://synthetic.convex.site");
  vi.stubEnv("TIKR_MARKET_GATEWAY_KEY", "synthetic-observation-test-00000000");
  const operations: {
    name: string;
    args: { op?: string; token: string; leaseToken?: string };
  }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      operations.push(body);
      return Response.json({
        result: body.name === "acquire" ? { status: "acquired" } : null,
      });
    }),
  );
  const { convexStorage } = await import("../src/lib/market-storage");
  const storage = convexStorage(
    "https://synthetic.convex.cloud",
    "synthetic",
    "a".repeat(64),
  );
  const lease = await storage.acquire("asset:SPY", "2026-11-13", true);
  const finish = await storage.beginRefresh("SPY");
  expect(typeof finish.endObservation).toBe("function");
  await finish.endObservation!();
  await finish();
  const ended = operations.filter((row) => row.args.op === "finish");
  expect(ended).toHaveLength(1);
  expect(ended[0]!.args.leaseToken).toBe(lease);
  expect(ended[0]!.args.token).toBe(
    operations.find((row) => row.args.op === "begin")!.args.token,
  );
});

test("one provider-batch consumer cancellation does not abort a healthy peer", async () => {
  const { createBatchedPersonalLoader } =
    await import("../src/lib/alpaca/batched-loader");
  const { withMarketTrace, marketTrace } =
    await import("../src/lib/market-trace");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const days = ["2026-11-11", "2026-11-12"];
  const parents: string[] = [];
  const cancelled = new AbortController();
  const healthy = new AbortController();
  const loader = createBatchedPersonalLoader(
    { keyId: "synthetic", secret: "secret-canary" },
    {
      from: days[0]!,
      through: days[1]!,
      sessions: days,
      complete: true,
      finalityVerified: true,
      provenance: "synthetic",
    },
    async (_config, q) => {
      cancelled.abort();
      expect(q.signal?.aborted).toBe(false);
      return {
        symbols: q.symbols,
        start: q.start,
        end: q.end,
        prices: Object.fromEntries(
          q.symbols.map((symbol) => [
            symbol,
            Object.fromEntries(days.map((day) => [day, "100"])),
          ]),
        ),
        actions: [],
        evidence: {
          barsTraversal: "complete",
          actionsTraversal: "complete",
          actionsCompleteness: "unknown",
          note: "synthetic",
        },
      };
    },
  );
  await Promise.all(
    ["SPY", "AAPL"].map((symbol) =>
      withMarketTrace(async () => {
        parents.push(marketTrace()!);
        return loader({
          symbol,
          from: days[0]!,
          through: days[1]!,
          recheckFrom: days[0]!,
          signal: symbol === "SPY" ? cancelled.signal : healthy.signal,
        });
      }),
    ),
  );
  const batch = log.mock.calls
    .map((call) => JSON.parse(String(call[0])))
    .find((row) => row.event === "market_provider_batch");
  expect(batch.parents.sort()).toEqual(parents.sort());
  expect(batch.symbolCount).toBe(2);
  expect(parents).not.toContain(batch.trace);
  expect(JSON.stringify(log.mock.calls)).not.toContain("secret-canary");
});
