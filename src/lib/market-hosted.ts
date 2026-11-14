import { freshnessCycle } from "./market-cache.ts";
import type { MarketFailureCode } from "./market-errors.ts";
import { MarketFailure, marketFailureCodes } from "./market-errors.ts";
import { diagnose } from "./market-diagnostics.ts";
import "server-only";
import {
  PERSONAL_SOURCE_POLICY,
  personalHistoryStart,
} from "./market-policy.ts";
import { createHash, randomUUID } from "node:crypto";
import { marketTrace, traceFields } from "./market-trace.ts";
import { validRefreshFailure } from "./market-failure-record.ts";
import { withMarketWriteTurn } from "./market-write-queue.ts";
export const hosted = () => process.env.TIKR_MARKET_HOSTED_ORIGIN !== undefined;
export async function gateway<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  // All gateway mutations update shared accounting. Avoid self-inflicted OCC
  // storms when a dashboard opens several overlapping portfolios at once.
  return withMarketWriteTurn(() => gatewayTurn<T>(name, args));
}
async function gatewayTurn<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const url = process.env.TIKR_CONVEX_SITE_URL,
    key = process.env.TIKR_MARKET_GATEWAY_KEY;
  if (
    !url ||
    !/^https:\/\/[a-z0-9-]+\.convex\.site$/.test(url) ||
    !key ||
    key.length < 32
  ) {
    diagnose("config", "HOSTED_CONFIG");
    throw Error("HOSTED_CONFIG");
  }
  const response = await fetch(`${url}/market-gateway`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(marketTrace() ? { "X-Tikr-Trace": marketTrace()! } : {}),
    },
    body: JSON.stringify({ name, args }),
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!response.ok || !response.body) {
    console.error(
      JSON.stringify({
        event: "market_gateway_rejection",
        stage: name === "acquire" ? "lease" : "control",
        operation: ["read", "acquire", "write", "release", "control"].includes(
          name,
        )
          ? name
          : "unknown",
        status: response.status,
        ...traceFields(),
      }),
    );
    const code = response.headers.get("X-Tikr-Code");
    const retry = Number(response.headers.get("X-Tikr-Retry-At"));
    let original: unknown;
    try {
      original = JSON.parse(
        response.headers.get("X-Tikr-Original-Failure") ?? "null",
      );
    } catch {
      /* Untrusted diagnostics are discarded. */
    }
    const state = response.headers.get("X-Tikr-Guard-State");
    throw new MarketFailure(
      marketFailureCodes.includes(code as never)
        ? (code as MarketFailureCode)
        : "STORAGE_UNAVAILABLE",
      Number.isSafeInteger(retry) && retry > 0 ? retry : undefined,
      validRefreshFailure(original) ? original : undefined,
      state === "active" || state === "abandoned" ? state : undefined,
    );
  }
  const reader = response.body.getReader();
  let total = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const p = await reader.read();
      if (p.done) break;
      total += p.value.length;
      if (total > 12000000) {
        await reader.cancel();
        throw Error("STORAGE_RESPONSE_LIMIT");
      }
      parts.push(p.value);
    }
  } finally {
    reader.releaseLock();
  }
  return (JSON.parse(Buffer.concat(parts).toString("utf8")) as { result: T })
    .result;
}
export function policyIdentity(scope: string) {
  if (process.env.TIKR_MARKET_MODE !== "personal-provisional") return {};
  const cycle = freshnessCycle(new Date());
  const start = personalHistoryStart(cycle);
  return {
    policy: PERSONAL_SOURCE_POLICY,
    policyScope:
      scope === "0".repeat(64)
        ? createHash("sha256")
            .update(JSON.stringify({ policy: PERSONAL_SOURCE_POLICY, start }))
            .digest("hex")
        : scope,
  };
}
export const control = (
  op: string,
  scope: string,
  symbols: string[] = [],
  token = randomUUID(),
  visitor?: string,
) =>
  gateway<null>("control", {
    op,
    scope,
    ...policyIdentity(scope),
    symbols,
    token,
    ...(visitor ? { visitor } : {}),
  });
export async function reserveHostedProvider(count = 1) {
  const tokens: string[] = [];
  for (let i = 0; i < count; i++) {
    const token = randomUUID();
    await control("provider", "0".repeat(64), [], token);
    tokens.push(token);
  }
  return async (bytes: number) => {
    for (const token of tokens) {
      const receivedBytes = Math.min(bytes, 2 * 1024 * 1024);
      await gateway("control", {
        op: "providerFinish",
        scope: "0".repeat(64),
        symbols: [],
        token,
        receivedBytes,
      });
      bytes -= receivedBytes;
    }
  };
}
export async function enterHosted(_request: Request) {
  const token = randomUUID(),
    scope = "0".repeat(64);
  await control("enter", scope, [], token);
  return () => control("leave", scope, [], token);
}
export function validMarketOrigin(request: Request) {
  try {
    const url = new URL(request.url),
      configured = process.env.TIKR_MARKET_HOSTED_ORIGIN;
    const expected = configured
      ? new URL(configured)
      : new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`);
    if (
      configured
        ? expected.protocol !== "https:" ||
          expected.origin !== configured ||
          url.origin !== configured
        : !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
          !["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname)
    )
      return false;
    return (
      request.headers.get("host") === expected.host &&
      request.headers.get("origin") === expected.origin &&
      request.headers.get("content-type") === "application/json"
    );
  } catch {
    return false;
  }
}
