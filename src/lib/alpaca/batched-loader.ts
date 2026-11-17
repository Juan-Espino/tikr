import "server-only";
import {
  fetchCandidates,
  type Candidates,
  type Config,
  type Query,
} from "./adapter.ts";
import { createPersonalLoader } from "./personal-loader.ts";
import type { Calendar } from "../backtest.ts";
import { marketTrace, withMarketTrace } from "../market-trace.ts";

// Process-local provider concurrency only. Durable per-symbol leases remain
// responsible for cross-instance admission; this queue does not replace them.
let active = 0;
const waiting: (() => void)[] = [];
async function slot<T>(work: () => Promise<T>): Promise<T> {
  if (active >= 2) await new Promise<void>((resolve) => waiting.push(resolve));
  else active++;
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}
type Pending = {
  trace?: string;
  query: Query;
  resolve: (value: Candidates) => void;
  reject: (error: unknown) => void;
};
export function createBatchedPersonalLoader(
  config: Config,
  calendar: Calendar,
  fetcher = fetchCandidates,
) {
  let queue: Pending[] = [],
    scheduled = false;
  const flush = () => {
    scheduled = false;
    const pending = queue;
    queue = [];
    const groups = new Map<string, Pending[]>();
    for (const item of pending) {
      const key = JSON.stringify([
        item.query.start,
        item.query.end,
        item.query.feed,
      ]);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    for (const group of groups.values()) {
      // Public request bounds permit at most 19 symbols; cap a process batch too.
      for (let i = 0; i < group.length; i += 19) {
        const batch = group.slice(i, i + 19);
        const symbols = [
          ...new Set(batch.flatMap((item) => item.query.symbols)),
        ].sort();
        const controller = new AbortController();
        const signals = batch.map((item) => item.query.signal);
        const check = () => {
          if (signals.every((signal) => signal?.aborted)) controller.abort();
        };
        for (const signal of signals)
          signal?.addEventListener("abort", check, { once: true });
        check();
        void slot(() =>
          withMarketTrace(() => {
            controller.signal.throwIfAborted();
            console.error(
              JSON.stringify({
                event: "market_provider_batch",
                stage: "provider-batch",
                trace: marketTrace(),
                parents: [
                  ...new Set(
                    batch
                      .map((item) => item.trace)
                      .filter(
                        (trace): trace is string =>
                          !!trace && /^[a-f0-9-]{36}$/.test(trace),
                      ),
                  ),
                ],
                symbolCount: symbols.length,
              }),
            );
            return fetcher(
              { ...config, maxTotalBars: 1300 * symbols.length },
              {
                ...batch[0]!.query,
                symbols,
                signal: controller.signal,
              },
            );
          }),
        )
          .finally(() => {
            for (const signal of signals)
              signal?.removeEventListener("abort", check);
          })
          .then(
            (value) => {
              for (const item of batch) {
                const symbol = item.query.symbols[0]!;
                item.resolve({
                  ...value,
                  symbols: [symbol],
                  prices: { [symbol]: value.prices[symbol] ?? {} },
                  actions: value.actions.filter(
                    (action) => action.symbol === symbol,
                  ),
                });
              }
            },
            (error: unknown) => batch.forEach((item) => item.reject(error)),
          );
      }
    }
  };
  return createPersonalLoader(
    config,
    calendar,
    (_config, query) =>
      new Promise<Candidates>((resolve, reject) => {
        queue.push({ query, resolve, reject, trace: marketTrace() });
        if (!scheduled) {
          scheduled = true;
          setTimeout(flush, 5);
        }
      }),
  );
}
