// Owner-authorized DEV-only task. Never resets the admission ledger or task journal.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
const deploying = process.argv.includes("--deploy-dev");
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { validRefreshFailure } from "../src/lib/market-failure-record.ts";
process.loadEnvFile(resolve(".env.local"));
if (
  !/^dev:stoic-corgi-586(?:\s|$)/.test(process.env.CONVEX_DEPLOYMENT ?? "") ||
  process.env.TIKR_CONVEX_URL !== "https://stoic-corgi-586.convex.cloud" ||
  process.env.CONVEX_DEPLOY_KEY ||
  process.env.NODE_ENV !== "development"
)
  throw Error("DEV_TARGET_REQUIRED");
const directory = join(process.env.LOCALAPPDATA, "Tikr", "task-journals");
mkdirSync(directory, { recursive: true });
const path = join(directory, "history-refresh-2026-11-12.json");
const lockPath = path + ".lock";
const lock = openSync(lockPath, "wx", 0o600);
const runToken = randomUUID();
writeFileSync(
  lock,
  JSON.stringify({
    pid: process.pid,
    token: runToken,
    at: new Date().toISOString(),
  }),
);
// A killed process leaves the task lock for operator investigation. Never steal
// or automatically remove an abandoned lock to restart the cumulative budget.
process.on("exit", () => {
  closeSync(lock);
  const owner = JSON.parse(readFileSync(lockPath, "utf8"));
  if (owner.token === runToken) unlinkSync(lockPath);
});
let journal;
try {
  journal = JSON.parse(readFileSync(path, "utf8"));
} catch (error) {
  // This is a continuation of an allocated task, never a fresh zero-cost ledger.
  if (error.code === "ENOENT") throw Error("TASK_JOURNAL_REQUIRED");
  throw error;
}
if (journal.task !== "history-refresh-2026-11-12")
  throw Error("JOURNAL_MISMATCH");
if (
  !["providerHttp", "providerBytes", "convexHttp", "convexBytes"].every(
    (key) => Number.isSafeInteger(journal[key]) && journal[key] >= 0,
  ) ||
  !Number.isSafeInteger(journal.providerReservedBytes ?? 0) ||
  (journal.providerReservedBytes ?? 0) < 0 ||
  !Array.isArray(journal.runs)
)
  throw Error("JOURNAL_INVALID");
const save = () => writeFileSync(path, JSON.stringify(journal, null, 2) + "\n");
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  const provider = [
    "data.alpaca.markets",
    "api.alpaca.markets",
    "paper-api.alpaca.markets",
  ].includes(url.hostname);
  const convex = [
    "stoic-corgi-586.convex.cloud",
    "stoic-corgi-586.convex.site",
    ...(deploying ? ["api.convex.dev"] : []),
  ].includes(url.hostname);
  if (url.protocol !== "https:" || (!provider && !convex))
    throw Error("TASK_ENDPOINT_REJECTED");
  if (provider && deploying) throw Error("NO_PROVIDER_DURING_DEPLOY");
  journal[provider ? "providerHttp" : "convexHttp"]++;
  if (provider) {
    const operation =
      {
        "/v2/calendar": "calendar",
        "/v2/assets": "catalog",
        "/v2/stocks/bars": "bars",
        "/v1/corporate-actions": "actions",
      }[url.pathname] ?? "other";
    journal.providerOperations ??= {};
    journal.providerOperations[operation] =
      (journal.providerOperations[operation] ?? 0) + 1;
  }
  if (provider)
    journal.providerReservedBytes =
      (journal.providerReservedBytes ?? 0) + 2 * 1024 * 1024;
  save(); // Charge initiation before transport, including failures.
  const response = await nativeFetch(input, {
    ...init,
    redirect: "error",
    signal: AbortSignal.any([
      ...(init?.signal ? [init.signal] : []),
      AbortSignal.timeout(20000),
    ]),
  });
  if (provider) {
    journal.providerStatuses ??= {};
    journal.providerStatuses[response.status] =
      (journal.providerStatuses[response.status] ?? 0) + 1;
    const allowance = {};
    for (const name of [
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
    ]) {
      const value = response.headers.get(name);
      if (value && /^\d{1,15}$/.test(value)) allowance[name] = value;
    }
    journal.lastProviderRateHeaders = allowance;
    save();
  }
  if (!response.body) return response;
  const reader = response.body.getReader();
  let bytes = 0;
  return new Response(
    new ReadableStream({
      async pull(controller) {
        try {
          const part = await reader.read();
          if (part.done) {
            if (provider) {
              journal.providerReservedBytes -= 2 * 1024 * 1024;
              save();
            }
            reader.releaseLock();
            controller.close();
            return;
          }
          bytes += part.value.byteLength;
          journal[provider ? "providerBytes" : "convexBytes"] +=
            part.value.byteLength;
          save();
          if ((provider && bytes > 2 * 1024 * 1024) || bytes > 12_000_000) {
            await reader.cancel();
            throw Error("TASK_BODY_BOUND");
          }
          controller.enqueue(part.value);
        } catch {
          controller.error(Error("TASK_TRANSPORT_FAILED"));
        }
      },
      cancel: () => reader.cancel(),
    }),
    { status: response.status, headers: response.headers },
  );
};
if (process.argv.includes("--serve-production")) {
  const build = process.env.TIKR_REHEARSAL_BUILD;
  const keyPath = process.env.TIKR_REHEARSAL_TLS_KEY;
  const certPath = process.env.TIKR_REHEARSAL_TLS_CERT;
  if (
    !build ||
    !keyPath ||
    !certPath ||
    !readFileSync(join(build, ".next", "BUILD_ID"), "utf8").trim()
  )
    throw Error("REHEARSAL_BUILD_REQUIRED");
  const origin = "https://localhost:43201";
  process.env.NODE_ENV = "production";
  process.env.TIKR_MARKET_HOSTED_ORIGIN = origin;
  process.env.TIKR_HOSTED_DATA_ENABLED = "explicit";
  process.env.SKIP_ENV_VALIDATION = "1";
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  const { default: next } = await import("next");
  const { createServer } = await import("node:https");
  const app = next({
    dev: false,
    dir: build,
    hostname: "127.0.0.1",
    port: 43201,
  });
  await app.prepare();
  const handler = app.getRequestHandler();
  const controlToken = randomUUID();
  const controlPath = join(directory, "rehearsal-control.json");
  writeFileSync(
    controlPath,
    JSON.stringify({ origin, token: controlToken, pid: process.pid }),
    { mode: 0o600 },
  );
  let stop = () => {};
  const server = createServer(
    { key: readFileSync(keyPath), cert: readFileSync(certPath) },
    (request, response) => {
      if (
        request.url === "/__rehearsal/stop" &&
        request.method === "POST" &&
        request.headers.authorization === `Bearer ${controlToken}`
      ) {
        response.writeHead(200, { "Cache-Control": "no-store" });
        response.end();
        setImmediate(stop);
        return;
      }
      if (request.url === "/__rehearsal/health" && request.method === "GET") {
        response.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        response.end(
          JSON.stringify({
            productionMode: true,
            target: "dev:stoic-corgi-586",
            synthetic: false,
          }),
        );
        return;
      }
      // The owned loopback TLS terminator supplies trusted hosting metadata.
      request.headers["x-forwarded-proto"] = "https";
      request.headers["x-forwarded-host"] = "localhost:43201";
      void handler(request, response);
    },
  );
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(43201, "127.0.0.1", resolve);
  });
  journal.runs.push({
    kind: "production-browser-rehearsal-start",
    at: new Date().toISOString(),
    build,
    origin,
  });
  save();
  console.log(
    JSON.stringify({
      event: "rehearsal_ready",
      origin,
      target: "dev:stoic-corgi-586",
      productionMode: true,
      synthetic: false,
      build,
    }),
  );
  let stopping = false;
  stop = () => {
    if (stopping) return;
    stopping = true;
    journal.runs.push({
      kind: "production-browser-rehearsal-stop",
      at: new Date().toISOString(),
    });
    save();
    server.close(() => {
      void app.close().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
} else if (process.argv.includes("--inspect-dividend-terms")) {
  const { providerCredentials } =
    await import("../src/lib/market-diagnostics.ts");
  const { keyId, secret } = providerCredentials();
  const url = new URL("https://data.alpaca.markets/v1/corporate-actions");
  for (const [k, v] of Object.entries({
    symbols: "ASML,TSM",
    start: "2025-11-01",
    end: "2026-11-12",
    limit: "1000",
    data_quality: "all",
  }))
    url.searchParams.set(k, v);
  const r = await fetch(url, {
    headers: { "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secret },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw Error(`DIVIDEND_INSPECTION_HTTP_${r.status}`);
  const data = await r.json();
  const terms = (data.corporate_actions?.cash_dividends ?? []).map((row) => ({
    symbol: ["ASML", "TSM"].includes(row.symbol) ? row.symbol : "other",
    foreign: typeof row.foreign === "boolean" ? row.foreign : null,
    special: typeof row.special === "boolean" ? row.special : null,
    currency:
      row.currency === "USD" ? "USD" : row.currency ? "other" : "missing",
    subtype:
      row.sub_type == null
        ? "ordinary"
        : ["interest", "return_of_capital"].includes(row.sub_type)
          ? row.sub_type
          : "other",
    hasPaymentDate: typeof row.payable_date === "string",
    hasExDate: typeof row.ex_date === "string",
    hasPositiveRate: typeof row.rate === "number" && row.rate > 0,
    dueBill: row.due_bill_on_date != null || row.due_bill_off_date != null,
  }));
  journal.runs.push({
    kind: "dividend-terms-inspection",
    at: new Date().toISOString(),
    terms,
    paginationComplete: !data.next_page_token,
  });
  save();
  console.log(
    JSON.stringify({
      terms,
      paginationComplete: !data.next_page_token,
      providerHttp: journal.providerHttp,
    }),
  );
} else if (
  process.argv.includes("--enable-dev-gateway") ||
  process.argv.includes("--enable-dev-relief") ||
  process.argv.includes("--disable-dev-relief")
) {
  const client = new ConvexHttpClient(process.env.TIKR_CONVEX_URL, {
    logger: false,
  });
  client.setAdminAuth(process.env.TIKR_CONVEX_ADMIN_KEY);
  const previous = await client.query(
    makeFunctionReference("_system/cli/queryEnvironmentVariables:get"),
    { name: "TIKR_MARKET_GATEWAY_KEY" },
  );
  if (previous?.value && previous.value !== process.env.TIKR_MARKET_GATEWAY_KEY)
    throw Error("EXISTING_DEV_KEY_MISMATCH");
  if (
    !process.env.TIKR_MARKET_GATEWAY_KEY ||
    process.env.TIKR_MARKET_GATEWAY_KEY.length < 32
  )
    throw Error("DEV_GATEWAY_KEY_REQUIRED");
  const response = await fetch(
    "https://stoic-corgi-586.convex.cloud/api/update_environment_variables",
    {
      method: "POST",
      headers: {
        Authorization: `Convex ${process.env.TIKR_CONVEX_ADMIN_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        changes: [
          {
            name: "TIKR_MARKET_GATEWAY_KEY",
            value: process.env.TIKR_MARKET_GATEWAY_KEY,
          },
          { name: "TIKR_HOSTED_DATA_ENABLED", value: "explicit" },
          ...(process.argv.includes("--enable-dev-relief")
            ? [{ name: "TIKR_DEV_REFRESH_RELIEF", value: "explicit" }]
            : []),
          ...(process.argv.includes("--disable-dev-relief")
            ? [{ name: "TIKR_DEV_REFRESH_RELIEF", value: "disabled" }]
            : []),
        ],
      }),
    },
  );
  if (!response.ok) throw Error("DEV_GATEWAY_CONFIG_FAILED");
  await response.arrayBuffer();
  journal.runs.push({
    kind: "dev-gateway-enabled",
    at: new Date().toISOString(),
  });
  save();
  console.log(
    "Bearer-protected DEV gateway configured; no secret values logged.",
  );
} else if (process.argv.includes("--diagnose-dev-logs")) {
  const response = await fetch(
    "https://stoic-corgi-586.convex.cloud/api/stream_function_logs?cursor=0",
    {
      headers: { Authorization: `Convex ${process.env.TIKR_CONVEX_ADMIN_KEY}` },
    },
  );
  if (!response.ok) throw Error("DEV_LOG_READ_FAILED");
  const result = await response.json();
  const rows = (result.entries ?? []).slice(-300).map((row) => {
    const error = typeof row.error === "string" ? row.error : "";
    const known = [
      "LEASE_LOST",
      "INVALID_CONTROL",
      "CONTROL_LIMIT",
      "GUARD_LIMIT",
      "TEAM_BUDGET_UNVERIFIED",
      "SHARED_BUDGET_EXHAUSTED",
      "REVISION_CHANGED",
      "UNVERIFIED_DATA",
      "WRITE_LIMIT",
      "DOCUMENT_LIMIT",
      "EVIDENCE_REVOKED",
    ].find((code) => error.includes(code));
    const traceLines = (row.logLines ?? [])
      .flatMap((line) =>
        typeof line === "string" ? [line] : (line.messages ?? []),
      )
      .flatMap((message) => {
        try {
          const value = JSON.parse(message);
          return value.event === "market_gateway" &&
            /^[a-f0-9-]{36}$/.test(value.trace)
            ? [
                {
                  trace: value.trace,
                  stage: [
                    "lease",
                    "read",
                    "write",
                    "release",
                    "control",
                  ].includes(value.stage)
                    ? value.stage
                    : "unknown",
                  operation: [
                    "begin",
                    "recover",
                    "check",
                    "failure",
                    "finish",
                    "provider",
                    "providerFinish",
                  ].includes(value.operation)
                    ? value.operation
                    : undefined,
                },
              ]
            : [];
        } catch {
          return [];
        }
      });
    const usage = Object.fromEntries(
      Object.entries(row.usage ?? {}).filter(
        ([key, value]) =>
          /^(database|db|function|udf)/i.test(key) &&
          typeof value === "number" &&
          Number.isFinite(value),
      ),
    );
    return {
      function:
        typeof row.identifier === "string" &&
        /^(market|hosted)(\.js)?:[A-Za-z]+$/.test(row.identifier)
          ? row.identifier
          : "other",
      at: row.timestamp,
      kind: row.kind,
      hasError: Boolean(row.error),
      validation:
        error && /ArgumentValidationError|extra field|validator/i.test(error)
          ? {
              fields: ["checkedAt", "cost", "entries", "dependencies"].filter(
                (field) => error.includes(field),
              ),
            }
          : undefined,
      code:
        known ??
        (/optimistic|concurrent modification|write conflict|changed while this mutation|on every subsequent retry|too many concurrent/i.test(
          error,
        )
          ? "OCC_CONFLICT"
          : error
            ? "REDACTED_UNKNOWN"
            : undefined),
      traces: traceLines,
      usage,
    };
  });
  const summary = {
    kind: "sanitized-dev-execution-log-snapshot",
    at: new Date().toISOString(),
    retainedEntries: result.entries?.length ?? 0,
    rows,
  };
  journal.runs.push(summary);
  save();
  console.log(JSON.stringify(summary));
} else if (process.argv.includes("--gateway-preflight")) {
  const client = new ConvexHttpClient(process.env.TIKR_CONVEX_URL, {
    logger: false,
  });
  client.setAdminAuth(process.env.TIKR_CONVEX_ADMIN_KEY);
  const get = (name) =>
    client.query(
      makeFunctionReference("_system/cli/queryEnvironmentVariables:get"),
      { name },
    );
  const key = await get("TIKR_MARKET_GATEWAY_KEY");
  const activation = await get("TIKR_HOSTED_DATA_ENABLED");
  const result = {
    kind: "gateway-config-preflight",
    at: new Date().toISOString(),
    keyPresent: Boolean(key?.value),
    keyMatches: key?.value === process.env.TIKR_MARKET_GATEWAY_KEY,
    enabled: activation?.value === "explicit",
  };
  journal.runs.push(result);
  save();
  console.log(JSON.stringify(result));
} else if (process.argv.includes("--review-team")) {
  // Current owner-supplied All Projects evidence, rounded UP and conservatively
  // treated entirely as other usage. This changes review fields, never counters.
  const client = new ConvexHttpClient(process.env.TIKR_CONVEX_URL, {
    logger: false,
  });
  client.setAdminAuth(process.env.TIKR_CONVEX_ADMIN_KEY);
  await client.mutation(makeFunctionReference("market:configure"), {
    otherStorage: 6_100_000,
    otherIo: 134_000_000,
    otherCalls: 9000,
    reviewedThrough: Date.parse("2026-11-30T23:59:59.999Z"),
  });
  journal.runs.push({
    kind: "dev-team-review",
    at: new Date().toISOString(),
    otherStorage: 6_100_000,
    otherIo: 134_000_000,
    otherCalls: 9000,
  });
  save();
  console.log(
    "DEV review fields updated; historical counters and caps retained.",
  );
} else if (process.argv.includes("--inspect-history")) {
  const client = new ConvexHttpClient(process.env.TIKR_CONVEX_URL, {
    logger: false,
  });
  client.setAdminAuth(process.env.TIKR_CONVEX_ADMIN_KEY);
  const symbols = [
    "SPY",
    "PLTR",
    "NOC",
    "BA",
    "RTX",
    "MSFT",
    "NVDA",
    "AAPL",
    "AMZN",
  ];
  const heads = await client.mutation(makeFunctionReference("market:read"), {
    keys: symbols.map((s) => `asset:${s}`),
  });
  const leases = await client.query(
    makeFunctionReference("_system/cli/tableData"),
    {
      table: "marketLeases",
      order: "desc",
      paginationOpts: { cursor: null, numItems: 67 },
    },
  );
  const hosted = await client.query(
    makeFunctionReference("_system/cli/tableData"),
    {
      table: "marketHosted",
      order: "desc",
      paginationOpts: { cursor: null, numItems: 2 },
    },
  );
  if (!leases.isDone || !hosted.isDone) throw Error("INSPECTION_BOUND");
  const state = hosted.page.find((row) => row.key === "global");
  const parsed = state ? JSON.parse(state.payload) : {};
  const result = {
    kind: "dev-history-metadata",
    at: new Date().toISOString(),
    heads: heads.rows.map((row) => {
      const head = JSON.parse(row.payload);
      return {
        key: row.key,
        revision: row.revision,
        checkedAt: row.checkedAt,
        format: head.format,
        content: head.content ?? false,
        from: head.meta?.from,
        through: head.meta?.through,
        evidenceRevision: head.evidenceRevision,
        chunks: head.prices?.length,
      };
    }),
    leases: leases.page
      .filter((row) => symbols.some((s) => row.key === `asset:${s}`))
      .map(
        ({
          key,
          expires,
          cycle,
          attempts,
          scopeAttempts,
          attemptedAt,
          completed,
          completedFrom,
        }) => ({
          key,
          expires,
          cycle,
          attempts,
          scopeAttempts,
          attemptedAt,
          completed,
          completedFrom,
        }),
      ),
    guards: Object.keys(parsed.guards ?? {})
      .filter((key) => /^[a-f0-9]{64}:[A-Z0-9.-]{1,16}$/.test(key))
      .slice(0, 96),
    failures: Object.fromEntries(
      Object.entries(parsed.failures ?? {})
        .filter(
          ([key, value]) =>
            /^[a-f0-9]{64}:[A-Z0-9.-]{1,16}$/.test(key) &&
            validRefreshFailure(value),
        )
        .slice(0, 96),
    ),
  };
  journal.runs.push(result);
  save();
  console.log(JSON.stringify(result));
} else if (process.argv.some((arg) => arg.startsWith("--acceptance-"))) {
  const preflight = journal.runs.findLast(
    (run) => run.kind === "gateway-config-preflight",
  );
  if (
    !preflight?.keyMatches ||
    !preflight.enabled ||
    Date.now() - Date.parse(preflight.at) > 2 * 3600000
  )
    throw Error("FRESH_GATEWAY_PREFLIGHT_REQUIRED");
  process.env.TIKR_MARKET_HOSTED_ORIGIN = "https://dev-acceptance.tikr.invalid";
  process.env.TIKR_HOSTED_DATA_ENABLED = "explicit";
  const recovery = process.argv.includes("--acceptance-recovery");
  const tech = process.argv.includes("--acceptance-tech");
  const selected = tech
    ? ["MSFT", "NVDA", "AAPL", "AMZN"]
    : ["PLTR", "NOC", "BA", "RTX"];
  const request = {
    portfolios: [
      {
        id: "task-local",
        holdings: selected.map((symbol) => ({ symbol, weight: "25" })),
      },
    ],
    amount: "10000",
    range: "1W",
    retry: recovery,
  };
  const { openMarket } = await import("../src/lib/market-runtime.ts");
  const { withMarketTrace } = await import("../src/lib/market-trace.ts");
  const { marketFailure } = await import("../src/lib/market-errors.ts");
  for (const kind of [
    recovery
      ? "cache-loss-explicit-retry"
      : tech
        ? "tech-cold-process"
        : "war-cold-process",
    "warm-reopen",
  ]) {
    const before = {
      providerHttp: journal.providerHttp,
      providerBytes: journal.providerBytes,
      convexHttp: journal.convexHttp,
      convexBytes: journal.convexBytes,
    };
    const started = Date.now();
    const final = await withMarketTrace(async () => {
      try {
        return await (
          await openMarket(request)
        ).settled;
      } catch (error) {
        const failure = marketFailure(error);
        return {
          status: "blocked",
          code: failure?.code ?? "DATA_UNAVAILABLE",
          retryAt: failure?.retryAt,
          originalFailure: failure?.originalFailure,
        };
      }
    });
    const summary = {
      kind,
      at: new Date().toISOString(),
      status: final.status,
      code: final.code,
      retryAt: final.retryAt,
      originalFailure: final.originalFailure,
      requested: final.requested,
      period: final.period,
      series: final.series?.length,
      points: final.series?.[0]?.points.length,
      durationMs: Date.now() - started,
      ...Object.fromEntries(
        Object.keys(before).map((key) => [key, journal[key] - before[key]]),
      ),
    };
    if (final.status === "ready") {
      const dates = final.series[0].points.map((p) => p.date);
      if (
        dates.length < 2 ||
        final.series.some(
          (s) =>
            JSON.stringify(s.points.map((p) => p.date)) !==
            JSON.stringify(dates),
        ) ||
        dates[0] !== final.period.start ||
        dates.at(-1) !== final.period.end
      )
        throw Error("COMMON_PERIOD_ASSERTION");
      request.history = final.history;
    }
    journal.runs.push(summary);
    save();
    console.log(JSON.stringify(summary));
    if (final.status !== "ready") {
      process.exitCode = 2;
      break;
    }
    request.retry = false;
  }
  console.log(
    JSON.stringify({
      cumulative: {
        providerHttp: journal.providerHttp,
        providerBytes: journal.providerBytes,
        convexHttp: journal.convexHttp,
        convexBytes: journal.convexBytes,
      },
      providerRateHeaders: journal.lastProviderRateHeaders ?? {},
      plan: "not independently verified; no paid change",
    }),
  );
} else if (process.argv.includes("--preflight")) {
  const client = new ConvexHttpClient(process.env.TIKR_CONVEX_URL, {
    logger: false,
  });
  client.setAdminAuth(process.env.TIKR_CONVEX_ADMIN_KEY);
  const result = await client.query(
    makeFunctionReference("_system/cli/tableData"),
    {
      table: "marketBudget",
      order: "desc",
      paginationOpts: { cursor: null, numItems: 2 },
    },
  );
  if (
    !result.isDone ||
    result.page.length !== 1 ||
    result.page[0].key !== "global"
  )
    throw Error("BUDGET_PREFLIGHT_AMBIGUOUS");
  const {
    month,
    io,
    calls,
    storage,
    entries,
    reviewedThrough,
    otherStorage,
    otherIo,
    otherCalls,
  } = result.page[0];
  const evidence = {
    at: new Date().toISOString(),
    target: "dev:stoic-corgi-586",
    month,
    admissionUnits: io,
    calls,
    storage,
    entries,
    reviewedThrough,
    otherStorage,
    otherIo,
    otherCalls,
  };
  journal.runs.push({ kind: "read-only-budget-preflight", ...evidence });
  save();
  console.log(
    JSON.stringify({
      ...evidence,
      cumulative: {
        providerHttp: journal.providerHttp,
        providerBytes: journal.providerBytes,
        convexHttp: journal.convexHttp,
        convexBytes: journal.convexBytes,
      },
      journal: path,
    }),
  );
} else {
  throw Error("PREFLIGHT_ONLY_UNTIL_PROVIDER_ALLOWANCE_VERIFIED");
}
