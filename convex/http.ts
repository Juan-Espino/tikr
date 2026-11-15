import { httpRouter, makeFunctionReference } from "convex/server";
import { httpAction } from "./_generated/server";
import { ConvexError, type Value } from "convex/values";
import { marketFailureCodes } from "../src/lib/market-errors";
import { validRefreshFailure } from "../src/lib/market-failure-record";
import { authComponent, createAuth } from "./auth";
const http = httpRouter();
authComponent.registerRoutes(http, createAuth);
http.route({
  path: "/market-gateway",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const candidateTrace = request.headers.get("X-Tikr-Trace");
    const trace =
      candidateTrace && /^[a-f0-9-]{36}$/.test(candidateTrace)
        ? candidateTrace
        : undefined;
    const key = process.env.TIKR_MARKET_GATEWAY_KEY;
    if (
      !key ||
      key.length < 32 ||
      request.headers.get("authorization") !== `Bearer ${key}` ||
      process.env.TIKR_HOSTED_DATA_ENABLED !== "explicit"
    )
      return new Response(null, { status: 403 });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    let size = 0;
    const parts: Uint8Array[] = [];
    try {
      while (true) {
        const p = await reader.read();
        if (p.done) break;
        size += p.value.length;
        if (size > 1000000) {
          await reader.cancel();
          throw Error();
        }
        parts.push(p.value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const p of parts) {
        bytes.set(p, offset);
        offset += p.length;
      }
      const input = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      ) as { name: string; args: Record<string, Value> };
      if (
        !["read", "acquire", "write", "release", "control"].includes(input.name)
      )
        throw Error();
      if (trace)
        console.log(
          JSON.stringify({
            event: "market_gateway",
            trace,
            stage: input.name === "acquire" ? "lease" : input.name,
            ...(input.name === "control" &&
            [
              "begin",
              "recover",
              "check",
              "failure",
              "finish",
              "provider",
              "providerFinish",
            ].includes(String(input.args.op))
              ? { operation: input.args.op }
              : {}),
          }),
        );
      const result: Value = await ctx.runMutation(
        makeFunctionReference<"mutation", Record<string, Value>, Value>(
          `${input.name === "control" ? "hosted" : "market"}:${input.name}`,
        ),
        input.args,
      );
      if (
        input.name === "control" &&
        result &&
        typeof result === "object" &&
        "code" in result
      ) {
        const failure = result as {
          code: string;
          retryAt?: number;
          failure?: unknown;
          guardState?: string;
        };
        return failureResponse(
          failure.code,
          failure.retryAt,
          failure.failure,
          failure.guardState,
        );
      }
      return Response.json(
        { result },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const data = error instanceof ConvexError ? error.data : undefined;
      const code =
        data && typeof data === "object" && "code" in data
          ? data.code
          : undefined;
      return failureResponse(
        typeof code === "string" ? code : "STORAGE_UNAVAILABLE",
      );
    } finally {
      reader.releaseLock();
    }
  }),
});
export default http;

function failureResponse(
  code: string,
  retryAt?: number,
  failure?: unknown,
  guardState?: string,
) {
  const safe = marketFailureCodes.includes(code as never)
    ? code
    : "STORAGE_UNAVAILABLE";
  const headers: Record<string, string> = {
    "X-Tikr-Code": safe,
    "Cache-Control": "no-store",
  };
  if (validRefreshFailure(failure))
    headers["X-Tikr-Original-Failure"] = JSON.stringify(failure);
  if (guardState === "active" || guardState === "abandoned")
    headers["X-Tikr-Guard-State"] = guardState;
  if (retryAt && Number.isSafeInteger(retryAt)) {
    headers["X-Tikr-Retry-At"] = String(retryAt);
    headers["Retry-After"] = String(
      Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)),
    );
  }
  return new Response(null, {
    status:
      safe === "BROWSING_RATE_LIMIT" || safe === "REFRESH_COOLDOWN" ? 429 : 503,
    headers,
  });
}
