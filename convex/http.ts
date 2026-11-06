import { httpRouter, makeFunctionReference } from "convex/server";
import { httpAction } from "./_generated/server";
import type { Value } from "convex/values";
const http = httpRouter();
http.route({
  path: "/market-gateway",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
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
      const result: Value = await ctx.runMutation(
        makeFunctionReference<"mutation", Record<string, Value>, Value>(
          `${input.name === "control" ? "hosted" : "market"}:${input.name}`,
        ),
        input.args,
      );
      return Response.json(
        { result },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      return new Response(null, {
        status: 503,
        headers: {
          "X-Tikr-Code":
            error instanceof Error && error.message.includes("REFRESH_GUARDED")
              ? "REFRESH_GUARDED"
              : "STORAGE_UNAVAILABLE",
        },
      });
    } finally {
      reader.releaseLock();
    }
  }),
});
export default http;
