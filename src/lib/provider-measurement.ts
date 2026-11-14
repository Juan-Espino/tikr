import "server-only";
import { traceFields } from "./market-trace.ts";
export type ProviderMeasurement = {
  requests: number;
  responses: number;
  receivedBytes: number;
  completedBodies: number;
  failedBodies: number;
};
export function createProviderMeasurement(): ProviderMeasurement {
  return {
    requests: 0,
    responses: 0,
    receivedBytes: 0,
    completedBodies: 0,
    failedBodies: 0,
  };
}
export const providerMeasurement = createProviderMeasurement();
// Measures application-received bytes, including non-2xx bodies. Compression,
// provider billing and wire-level overhead are deliberately outside this metric.
export function measuredTransport(
  transport: typeof fetch,
  metrics: ProviderMeasurement,
  reserve: () => Promise<unknown>,
): typeof fetch {
  return async (url, init) => {
    const settlement = await reserve();
    metrics.requests++;
    const response = await transport(url, init);
    let operation = "other";
    try {
      const path = new URL(
        typeof url === "string" ? url : url instanceof URL ? url.href : url.url,
      ).pathname;
      operation =
        (
          {
            "/v2/calendar": "calendar",
            "/v2/assets": "catalog",
            "/v2/stocks/bars": "bars",
            "/v1/corporate-actions": "actions",
          } as Record<string, string>
        )[path] ?? "other";
    } catch {
      /* Only fixed operation names may reach diagnostics. */
    }
    console.error(
      JSON.stringify({
        event: "market_provider_response",
        stage: "provider",
        operation,
        status: response.status,
        ...traceFields(),
      }),
    );
    metrics.responses++;
    if (!response.body) {
      if (typeof settlement === "function")
        await (settlement as (bytes: number) => Promise<void>)(0);
      return response;
    }
    const reader = response.body.getReader();
    let bytes = 0;
    return new Response(
      new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const part = await reader.read();
            if (part.done) {
              if (typeof settlement === "function")
                await (settlement as (bytes: number) => Promise<void>)(bytes);
              metrics.completedBodies++;
              reader.releaseLock();
              controller.close();
            } else {
              bytes += part.value.byteLength;
              metrics.receivedBytes += part.value.byteLength;
              controller.enqueue(part.value);
            }
          } catch (error) {
            metrics.failedBodies++;
            controller.error(error);
            void reader.cancel().catch(() => undefined);
          }
        },
        async cancel() {
          metrics.failedBodies++;
          await reader.cancel();
        },
      }),
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    );
  };
}
