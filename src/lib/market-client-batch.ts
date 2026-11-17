// Session-scoped, in-flight only. Full history bytes remain part of identity;
// hints never establish trust. Each consumer receives its own response stream.
const flights = new Map<string, Promise<Response>>();
export function fetchMarket(
  body: MarketRequest,
  signal: AbortSignal,
  scope?: string,
): Promise<Response> {
  if (signal.aborted) return Promise.reject(new Error("ABORTED"));
  const key = scope && !body.retry ? JSON.stringify([scope, body]) : undefined;
  let task = key ? flights.get(key) : undefined;
  if (!task) {
    task = enqueueMarket(body, AbortSignal.timeout(55000)).then(
      async (response) => {
        if (!response.body) return response;
        const reader = response.body.getReader();
        const parts: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.byteLength;
            if (size > 5_000_000) throw new Error("RESPONSE_LIMIT");
            parts.push(part.value);
          }
        } finally {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) {
          bytes.set(part, offset);
          offset += part.byteLength;
        }
        return new Response(bytes, {
          status: response.status,
          headers: response.headers,
        });
      },
    );
    if (key && flights.size < 64) {
      flights.set(key, task);
      const clear = () => {
        if (flights.get(key) === task) flights.delete(key);
      };
      void task.then(clear, clear);
    }
  }
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("ABORTED"));
    signal.addEventListener("abort", abort, { once: true });
    void task.then(
      (response) => {
        signal.removeEventListener("abort", abort);
        if (!signal.aborted) resolve(response.clone());
      },
      (error: unknown) => {
        signal.removeEventListener("abort", abort);
        reject(error instanceof Error ? error : new Error("DATA_UNAVAILABLE"));
      },
    );
  });
}
import type { MarketRequest } from "./market-contract";
type Pending = {
  body: MarketRequest;
  signal: AbortSignal;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
};
let pending: Pending[] = [],
  scheduled = false;
function enqueueMarket(
  body: MarketRequest,
  signal: AbortSignal,
): Promise<Response> {
  if (signal.aborted) return Promise.reject(new Error("ABORTED"));
  const promise = new Promise<Response>((resolve, reject) => {
    pending.push({ body, signal, resolve, reject });
    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, 10);
    }
  });
  return new Promise<Response>((resolve, reject) => {
    const abort = () => reject(new Error("ABORTED"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error instanceof Error ? error : new Error("DATA_UNAVAILABLE"));
      },
    );
  });
}
function flush() {
  const queue = pending.filter((item) => !item.signal.aborted);
  pending = [];
  scheduled = false;
  for (let i = 0; i < queue.length; i += 3) {
    const group = queue.slice(i, i + 3);
    if (group.length === 1) {
      const item = group[0]!;
      void fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
        signal: AbortSignal.timeout(55000),
        cache: "no-store",
      }).then(item.resolve, item.reject);
      continue;
    }
    const history = [
      ...new Map(
        group
          .flatMap((item) => item.body.history ?? [])
          .map((row) => [row.key, row]),
      ).values(),
    ];
    const envelope = JSON.stringify({
      requests: group.map((item) => ({ ...item.body, history: undefined })),
      history,
    });
    if (new TextEncoder().encode(envelope).length > 2_036_000) {
      for (const item of group)
        void fetch("/api/market", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
          signal: AbortSignal.timeout(55000),
          cache: "no-store",
        }).then(item.resolve, item.reject);
      continue;
    }
    void fetch("/api/market/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: envelope,
      signal: AbortSignal.timeout(55000),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          group.forEach((item) =>
            item.resolve(
              new Response(
                JSON.stringify({ status: "blocked", code: "DATA_UNAVAILABLE" }),
                { status: response.status },
              ),
            ),
          );
          return;
        }
        if (!response.body) throw Error("INVALID_RESPONSE");
        const reader = response.body.getReader(),
          decoder = new TextDecoder();
        let pending = "",
          bytes = 0;
        const completed = new Set<number>();
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 12_000_000) throw Error("RESPONSE_LIMIT");
            pending += decoder.decode(chunk.value, { stream: true });
            let split: number;
            while ((split = pending.indexOf("\n")) >= 0) {
              const value = JSON.parse(pending.slice(0, split)) as {
                index: number;
                status: number;
                body: string;
                syntheticReview?: boolean;
              };
              pending = pending.slice(split + 1);
              if (
                !Number.isInteger(value.index) ||
                !group[value.index] ||
                completed.has(value.index) ||
                typeof value.body !== "string"
              )
                throw Error("INVALID_RESPONSE");
              completed.add(value.index);
              group[value.index]!.resolve(
                new Response(value.body, {
                  status: value.status,
                  headers: value.syntheticReview
                    ? { "X-Tikr-Synthetic-Review": "1" }
                    : undefined,
                }),
              );
            }
          }
          if (pending.trim() || completed.size !== group.length)
            throw Error("INCOMPLETE_RESPONSE");
        } finally {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
      })
      .catch((error: unknown) => group.forEach((item) => item.reject(error)));
  }
}
