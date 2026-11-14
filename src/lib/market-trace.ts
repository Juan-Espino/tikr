import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
const traces = new AsyncLocalStorage<{ id: string; started: number }>();
export const marketTrace = () => traces.getStore()?.id;
export const withMarketTrace = <T>(work: () => T): T =>
  traces.run({ id: randomUUID(), started: Date.now() }, work);
export function traceFields() {
  const trace = traces.getStore();
  return trace
    ? { trace: trace.id, durationMs: Math.max(0, Date.now() - trace.started) }
    : {};
}
