import type { MarketFailureCode } from "./market-errors.ts";
import { MarketFailure, marketFailureCodes } from "./market-errors.ts";
import { diagnose } from "./market-diagnostics.ts";
import "server-only";
import { createHmac, randomUUID } from "node:crypto";
export const hosted = () => process.env.TIKR_MARKET_HOSTED_ORIGIN !== undefined;
export async function gateway<T>(
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
    },
    body: JSON.stringify({ name, args }),
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!response.ok || !response.body) {
    const code = response.headers.get("X-Tikr-Code");
    const retry = Number(response.headers.get("X-Tikr-Retry-At"));
    throw new MarketFailure(
      marketFailureCodes.includes(code as never)
        ? (code as MarketFailureCode)
        : "STORAGE_UNAVAILABLE",
      Number.isSafeInteger(retry) && retry > 0 ? retry : undefined,
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
    symbols,
    token,
    ...(visitor ? { visitor } : {}),
  });
export async function enterHosted(request: Request) {
  // Vercel overwrites this header; deploy only behind Vercel, never trust client X-Forwarded-For.
  const ip = request.headers.get("x-vercel-forwarded-for");
  if (!ip || ip.length > 128) throw Error("VISITOR_REQUIRED");
  const key = process.env.TIKR_MARKET_GATEWAY_KEY;
  if (!key || key.length < 32) throw Error("HOSTED_CONFIG");
  // Keyed hash prevents offline enumeration of raw network addresses.
  const visitor = createHmac("sha256", key)
    .update("market-visitor:" + ip)
    .digest("hex");
  const token = randomUUID(),
    scope = "0".repeat(64);
  await control("enter", scope, [], token, visitor);
  return () => control("leave", scope, [], token, visitor);
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
