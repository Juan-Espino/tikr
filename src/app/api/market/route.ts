import { diagnose } from "~/lib/market-diagnostics";
import { hosted, enterHosted, validMarketOrigin } from "~/lib/market-hosted";
import { marketRequestSchema } from "~/lib/market-contract";
import { openMarket } from "~/lib/market-runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const blocked = (code: string, status = 503) =>
  Response.json(
    { status: "blocked", code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: Request) {
  if (!validMarketOrigin(request)) {
    diagnose("origin", "ORIGIN_REJECTED");
    return blocked(hosted() ? "ORIGIN_REJECTED" : "LOCAL_ACCESS_ONLY", 403);
  }
  if (!request.body) return blocked("INVALID_INPUT", 400);
  const reader = request.body.getReader();
  let text = "",
    bytes = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 12_000) {
        await reader.cancel();
        return blocked("INPUT_LIMIT", 413);
      }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return blocked("INVALID_INPUT", 400);
  } finally {
    reader.releaseLock();
  }
  let parsed: ReturnType<typeof marketRequestSchema.safeParse>;
  try {
    parsed = marketRequestSchema.safeParse(JSON.parse(text));
  } catch {
    return blocked("INVALID_INPUT", 400);
  }
  if (!parsed.success) return blocked("INVALID_INPUT", 400);
  let leave: (() => Promise<unknown>) | undefined;
  try {
    if (hosted()) {
      try {
        leave = await enterHosted(request);
      } catch (error) {
        diagnose("admission", error);
        throw error;
      }
    }
    const job = await openMarket(parsed.data);
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(JSON.stringify(job.initial) + "\n"),
          );
          const final = await job.settled;
          if (final.status === "blocked") diagnose("stream", final.code);
          if (!cancelled)
            controller.enqueue(encoder.encode(JSON.stringify(final) + "\n"));
        } catch (error) {
          diagnose("stream", error);
          if (!cancelled)
            controller.enqueue(
              encoder.encode(
                '{"status":"blocked","code":"DATA_UNAVAILABLE"}\n',
              ),
            );
        } finally {
          await leave?.().catch((error: unknown) =>
            diagnose("admission", error),
          );
          if (!cancelled) controller.close();
        }
      },
      cancel() {
        cancelled = true;
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    diagnose("runtime", error);
    await leave?.().catch((error: unknown) => diagnose("admission", error));
    return blocked("DATA_NOT_VERIFIED");
  }
}
