// QA only: read callbacks must return allowlisted summaries, never raw bodies.
// Playwright response.text() can remain unresolved after stream cancellation.
export function createResponseCollector({ timeoutMs = 2000, limit = 64 } = {}) {
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 10000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 256
  )
    throw Error("QA_COLLECTOR_CONFIG");
  const pending = new Set();
  const records = [];
  let sealed = false,
    started = 0,
    dropped = 0;
  return {
    track(read) {
      if (sealed || started >= limit) {
        dropped++;
        return false;
      }
      started++;
      let complete, timer;
      const done = new Promise((resolve) => {
        complete = resolve;
      });
      pending.add(done);
      let settled = false;
      const finish = (record) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        records.push(record);
        pending.delete(done);
        complete();
      };
      timer = setTimeout(
        () => finish({ outcome: "body-unavailable" }),
        timeoutMs,
      );
      Promise.resolve()
        .then(read)
        .then(
          (summary) => {
            // Bound retained evidence independently from financial response size.
            try {
              if (!summary || typeof summary !== "object")
                return finish({ outcome: "summary-unavailable" });
              if (JSON.stringify(summary)?.length > 8192)
                return finish({ outcome: "summary-limit" });
              finish({ outcome: "complete", summary });
            } catch {
              finish({ outcome: "summary-unavailable" });
            }
          },
          () => finish({ outcome: "body-unavailable" }),
        );
      return true;
    },
    async finish() {
      sealed = true;
      await Promise.all([...pending]);
      return structuredClone({ started, dropped, records });
    },
  };
}
