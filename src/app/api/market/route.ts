import { marketFailure } from "~/lib/market-errors";
import { diagnose } from "~/lib/market-diagnostics";
import { hosted, enterHosted, validMarketOrigin } from "~/lib/market-hosted";
import {
  type MarketResponse,
  marketRequestSchema,
} from "~/lib/market-contract";
import { openMarket } from "~/lib/market-runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const blocked = (
  code: string,
  status = 503,
  retryAt?: number,
  issues?: MarketResponse["issues"],
) =>
  Response.json(
    {
      status: "blocked",
      code,
      ...(retryAt ? { retryAt } : {}),
      ...(issues ? { issues } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(retryAt
          ? {
              "Retry-After": String(
                Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)),
              ),
            }
          : {}),
      },
    },
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
    let job = await openMarket(parsed.data);
    // Explicit retries can discover a cooldown before HTTP headers are committed.
    if (parsed.data.retry) {
      const final = await job.settled;
      if (
        final.status === "blocked" &&
        final.code &&
        marketFailure(new Error(final.code))
      ) {
        await leave?.().catch((error: unknown) => diagnose("admission", error));
        return blocked(
          final.code,
          final.code === "REFRESH_COOLDOWN" ? 429 : 503,
          final.retryAt,
          final.issues,
        );
      }
      job = { initial: final, settled: Promise.resolve(final) };
    }
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
                JSON.stringify({
                  status: "blocked",
                  code: marketFailure(error)?.code ?? "DATA_UNAVAILABLE",
                  retryAt: marketFailure(error)?.retryAt,
                }) + "\n",
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
        ...(job.initial.retryAt
          ? {
              "Retry-After": String(
                Math.max(
                  1,
                  Math.ceil((job.initial.retryAt - Date.now()) / 1000),
                ),
              ),
            }
          : {}),
      },
    });
  } catch (error) {
    diagnose("runtime", error);
    await leave?.().catch((error: unknown) => diagnose("admission", error));
    if (error instanceof Error && error.message === "INVALID_INPUT")
      return blocked("INVALID_INPUT", 400);
    const failure = marketFailure(error);
    return blocked(
      failure?.code ?? "DATA_NOT_VERIFIED",
      failure?.code === "BROWSING_RATE_LIMIT" ||
        failure?.code === "REFRESH_COOLDOWN"
        ? 429
        : 503,
      failure?.retryAt,
    );
  }
}
