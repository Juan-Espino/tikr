import { afterEach, expect, test, vi } from "vitest";
import { PortfolioAutosave } from "../src/lib/portfolio-autosave";
type P = { id: string; revision: number; value: number };
afterEach(() => vi.useRealTimers());
function fixture() {
  vi.useFakeTimers();
  let online = true;
  let server: P = { id: "p", revision: 1, value: 1 };
  const ack = vi.fn();
  const write = vi.fn(async (p: P, revision: number) => {
    if (revision !== server.revision) throw Error("CONFLICT");
    server = { ...p, revision: revision + 1 };
    return { ...server };
  });
  const read = vi.fn(async () => ({ ...server }));
  const engine = new PortfolioAutosave<P>({
    fingerprint: (p) => String(p.value),
    validate: (p) => (p.value <= 0 ? "invalid" : ""),
    available: () => online,
    write,
    read,
    classify: (e) =>
      (e as Error).message === "CONFLICT" ? "conflict" : "retry",
    message: () => "failed",
    acknowledged: ack,
    changed: () => undefined,
  });
  engine.track(server);
  return {
    engine,
    write,
    read,
    ack,
    stage: (value: number) => engine.stage({ id: "p", revision: 1, value }),
    online: (v: boolean) => {
      online = v;
      engine.resume();
    },
    remote: (value: number) => {
      server = { ...server, value, revision: server.revision + 1 };
    },
    server: () => server,
  };
}
test("coalesces quick additions/removals into the latest valid definition", async () => {
  const f = fixture();
  f.stage(2);
  f.stage(3);
  f.stage(4);
  await vi.advanceTimersByTimeAsync(499);
  expect(f.write).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(f.write).toHaveBeenCalledTimes(1);
  expect(f.server().value).toBe(4);
  expect(f.engine.dirty()).toBe(false);
});
test("serializes changes during a pending save without overwriting latest edits", async () => {
  const f = fixture();
  let release!: (p: P) => void;
  f.write.mockImplementationOnce(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(3);
  f.stage(4);
  expect(f.write).toHaveBeenCalledTimes(1);
  release({ id: "p", revision: 2, value: 2 });
  await vi.advanceTimersByTimeAsync(0);
  expect(f.ack.mock.calls[0]![1].value).toBe(4);
  expect(f.write.mock.calls[1]![1]).toBe(2);
});
test("invalid and empty allocations never replace a saved definition", async () => {
  const f = fixture();
  f.stage(0);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.write).not.toHaveBeenCalled();
  expect(f.engine.status("p")?.state).toBe("invalid");
  f.stage(5);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.server().value).toBe(5);
});
test("offline edits coalesce and save automatically after reconnect", async () => {
  const f = fixture();
  f.online(false);
  f.stage(2);
  f.stage(3);
  await vi.advanceTimersByTimeAsync(2000);
  expect(f.write).not.toHaveBeenCalled();
  expect(f.engine.dirty()).toBe(true);
  f.online(true);
  await vi.advanceTimersByTimeAsync(0);
  expect(f.server().value).toBe(3);
});
test("lost acknowledgment reconciles exactly before sending newer changes", async () => {
  const f = fixture();
  const normal = f.write.getMockImplementation()!;
  f.write.mockImplementationOnce(async (p, r) => {
    await normal(p, r);
    throw Error("NETWORK");
  });
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(3);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.read).toHaveBeenCalled();
  expect(f.server()).toMatchObject({ value: 3, revision: 3 });
  expect(f.write).toHaveBeenCalledTimes(2);
});
test("a transport failure before commit retries at the original revision", async () => {
  const f = fixture();
  f.write.mockRejectedValueOnce(Error("NETWORK"));
  f.stage(2);
  await vi.advanceTimersByTimeAsync(1500);
  expect(f.read).toHaveBeenCalled();
  expect(f.server()).toMatchObject({ value: 2, revision: 2 });
});
test("remote conflicts pause autosave until explicit reload", async () => {
  const f = fixture();
  f.remote(7);
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.engine.status("p")?.state).toBe("conflict");
  f.stage(3);
  f.online(true);
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.server().value).toBe(7);
  expect(f.write).toHaveBeenCalledTimes(1);
  f.engine.reset(f.server());
  f.stage(4);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.server().value).toBe(4);
});
test("uncertain acknowledgement plus unrelated remote content cannot silently rebase", async () => {
  const f = fixture();
  f.write.mockRejectedValueOnce(Error("NETWORK"));
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.remote(9);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.engine.status("p")?.state).toBe("conflict");
  expect(f.server().value).toBe(9);
});
test("retry attempts are bounded; explicit retry can recover", async () => {
  const f = fixture();
  f.write.mockRejectedValue(Error("NETWORK"));
  f.stage(2);
  await vi.advanceTimersByTimeAsync(30000);
  expect(f.write).toHaveBeenCalledTimes(4);
  expect(f.engine.status("p")?.state).toBe("error");
  expect(f.engine.dirty()).toBe(true);
  await vi.advanceTimersByTimeAsync(300000);
  expect(f.write).toHaveBeenCalledTimes(4);
});
test("dispose fences late completions and prevents queued work", async () => {
  const f = fixture();
  let release!: (p: P) => void;
  f.write.mockImplementationOnce(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(3);
  f.engine.dispose();
  release({ id: "p", revision: 2, value: 2 });
  await vi.advanceTimersByTimeAsync(2000);
  expect(f.ack).not.toHaveBeenCalled();
  expect(f.write).toHaveBeenCalledTimes(1);
});
test("no-op edits and reversion do not write; flush skips debounce", async () => {
  const f = fixture();
  f.stage(2);
  f.stage(1);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.write).not.toHaveBeenCalled();
  f.stage(3);
  await f.engine.flush("p");
  expect(f.server().value).toBe(3);
});
test("multiple portfolios keep independent revisions and definitions", async () => {
  const f = fixture();
  f.engine.track({ id: "q", revision: 8, value: 2 });
  expect(f.engine.version("q")).toBe(8);
  f.stage(4);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.engine.version("p")).toBe(2);
  expect(f.engine.version("q")).toBe(8);
});

test("undo during a pending write is saved after acknowledgement", async () => {
  const f = fixture();
  const normal = f.write.getMockImplementation()!;
  let release!: () => void;
  f.write.mockImplementationOnce(async (p, r) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return normal(p, r);
  });
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(1);
  release();
  await vi.advanceTimersByTimeAsync(0);
  expect(f.server()).toMatchObject({ value: 1, revision: 3 });
  expect(f.engine.dirty()).toBe(false);
});
test("opening a newer clean server snapshot updates its baseline without hiding local edits", async () => {
  const f = fixture();
  f.remote(9);
  f.engine.track(f.server());
  f.stage(3);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.server().value).toBe(3);
  f.stage(4);
  f.engine.track({ ...f.server(), value: 88, revision: 90 });
  await vi.advanceTimersByTimeAsync(500);
  expect(f.server().value).toBe(4);
});
test("an explicit retry resets exhausted retry state", async () => {
  const f = fixture();
  f.write.mockRejectedValue(Error("NETWORK"));
  f.stage(2);
  await vi.advanceTimersByTimeAsync(30000);
  f.write.mockImplementation(async (p) => ({ ...p, revision: 2 }));
  f.engine.retry("p");
  await vi.advanceTimersByTimeAsync(0);
  expect(f.engine.dirty()).toBe(false);
  expect(f.engine.status("p")?.state).toBe("saved");
});

test("deletion waits for an in-flight write and supersedes newer queued edits", async () => {
  const f = fixture();
  const normal = f.write.getMockImplementation()!;
  let release!: () => void;
  f.write.mockImplementationOnce(async (p, r) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return normal(p, r);
  });
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(3);
  const revision = f.engine.beforeDelete("p");
  release();
  expect(await revision).toBe(2);
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.write).toHaveBeenCalledTimes(1);
  f.engine.discard("p");
  expect(f.engine.dirty()).toBe(false);
});
test("deletion can discard invalid queued edits; failed delete restores them", async () => {
  const f = fixture();
  f.stage(0);
  expect(await f.engine.beforeDelete("p")).toBe(1);
  f.engine.afterDeleteFailure("p");
  expect(f.engine.status("p")?.state).toBe("invalid");
  expect(f.engine.dirty()).toBe(true);
  expect(f.write).not.toHaveBeenCalled();
});
test("deletion reconciles a lost update acknowledgement before selecting revision", async () => {
  const f = fixture();
  const normal = f.write.getMockImplementation()!;
  f.write.mockImplementationOnce(async (p, r) => {
    await normal(p, r);
    throw Error("NETWORK");
  });
  f.stage(2);
  await vi.advanceTimersByTimeAsync(500);
  expect(await f.engine.beforeDelete("p")).toBe(2);
  expect(f.read).toHaveBeenCalledTimes(1);
  expect(f.write).toHaveBeenCalledTimes(1);
});
