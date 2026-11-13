import { POST as single } from "../route";
import { validMarketOrigin } from "~/lib/market-hosted";
import { marketRequestSchema } from "~/lib/market-contract";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!validMarketOrigin(request) || !request.body)
    return new Response(null, { status: 403 });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2_036_000) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(part.value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      !body ||
      typeof body !== "object" ||
      !("requests" in body) ||
      !Array.isArray(body.requests) ||
      body.requests.length < 1 ||
      body.requests.length > 3 ||
      !("history" in body) ||
      Object.keys(body).some((key) => !["requests", "history"].includes(key))
    )
      return new Response(null, { status: 400 });
    const history = body.history;
    const requests = body.requests.map((value: unknown) =>
      marketRequestSchema.parse({ ...(value as object), history }),
    );
    const encoder = new TextEncoder();
    let cancelled = false;
    return new Response(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          await Promise.all(
            requests.map(async (value, index) => {
              try {
                const response = await single(
                  new Request(new URL("/api/market", request.url), {
                    method: "POST",
                    headers: request.headers,
                    body: JSON.stringify(value),
                  }),
                );
                const body = await response.text();
                if (!cancelled)
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        index,
                        status: response.status,
                        body,
                        syntheticReview:
                          response.headers.get("X-Tikr-Synthetic-Review") ===
                          "1",
                      }) + "\n",
                    ),
                  );
              } catch {
                if (!cancelled)
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        index,
                        status: 503,
                        body: JSON.stringify({
                          status: "blocked",
                          code: "DATA_UNAVAILABLE",
                        }),
                      }) + "\n",
                    ),
                  );
              }
            }),
          );
          if (!cancelled) controller.close();
        },
        cancel() {
          cancelled = true;
        },
      }),
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/x-ndjson",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response(null, { status: 400 });
  } finally {
    reader.releaseLock();
  }
}
