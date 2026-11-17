import { afterEach, expect, test, vi } from "vitest";
import { PortfolioAutosave } from "../src/lib/portfolio-autosave";
type P = { id: string; revision?: number; value: number };
afterEach(() => vi.useRealTimers());
function fixture() {
  vi.useFakeTimers();
  let online = true;
  let server: P | undefined;
  const ack = vi.fn();
  const create = vi.fn(async (p: P) => {
    if (server && server.value !== p.value) throw Error("CONFLICT");
    server ??= { ...p, revision: 1 };
    return { ...server };
  });
  const write = vi.fn(async (p: P, revision: number) => {
    if (server?.revision !== revision) throw Error("CONFLICT");
    server = { ...p, revision: revision + 1 };
    return { ...server };
  });
  const read = vi.fn(async () => {
    if (!server) throw Error("MISSING");
    return { ...server };
  });
  const engine = new PortfolioAutosave<P>({
    fingerprint: (p) => String(p.value),
    validate: (p) => (p.value > 0 ? "" : "invalid"),
    available: () => online,
    create,
    write,
    read,
    classify: (e) =>
      (e as Error).message === "CONFLICT" ? "conflict" : "retry",
    message: () => "failed",
    acknowledged: ack,
    changed: () => undefined,
  });
  return {
    engine,
    create,
    write,
    read,
    ack,
    stage: (value: number) => engine.stage({ id: "new", value }),
    server: () => server,
    online: (value: boolean) => {
      online = value;
      engine.resume();
    },
    remote: (value: number) => {
      server = { id: "new", value, revision: 1 };
    },
  };
}
test("debounces creation and coalesces rapid edits into one client ID", async () => {
  const f = fixture();
  f.stage(1);
  f.stage(2);
  f.stage(3);
  await vi.advanceTimersByTimeAsync(499);
  expect(f.create).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.server()).toEqual({ id: "new", value: 3, revision: 1 });
  expect(f.engine.dirty()).toBe(false);
});
test("edits during creation remain editable and update after its acknowledgement", async () => {
  const f = fixture();
  const normal = f.create.getMockImplementation()!;
  let release!: () => void;
  f.create.mockImplementationOnce(async (p) => {
    await new Promise<void>((r) => (release = r));
    return normal(p);
  });
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(2);
  f.stage(3);
  expect(f.engine.canDiscardUncreated("new")).toBe(false);
  release();
  await vi.advanceTimersByTimeAsync(0);
  expect(f.create).toHaveBeenCalledTimes(1);
  expect(f.write).toHaveBeenCalledTimes(1);
  expect(f.server()?.value).toBe(3);
  expect(f.ack.mock.calls[0]![1].value).toBe(3);
});
test("lost creation acknowledgement replays exact creation then updates latest", async () => {
  const f = fixture();
  const normal = f.create.getMockImplementation()!;
  f.create.mockImplementationOnce(async (p) => {
    await normal(p);
    throw Error("NETWORK");
  });
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(2);
  expect(f.engine.canDiscardUncreated("new")).toBe(false);
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.create.mock.calls.map(([p]) => p.value)).toEqual([1, 1]);
  expect(f.server()).toMatchObject({ value: 2, revision: 2 });
  expect(f.engine.dirty()).toBe(false);
});
test("offline creation resumes without another edit", async () => {
  const f = fixture();
  f.online(false);
  f.stage(1);
  await vi.advanceTimersByTimeAsync(2000);
  expect(f.create).not.toHaveBeenCalled();
  expect(f.engine.status("new")?.state).toBe("offline");
  f.online(true);
  await vi.advanceTimersByTimeAsync(0);
  expect(f.server()?.revision).toBe(1);
});
test("invalid definitions cannot create and can recover after editing", async () => {
  const f = fixture();
  f.stage(0);
  await vi.advanceTimersByTimeAsync(2000);
  expect(f.create).not.toHaveBeenCalled();
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.server()?.value).toBe(1);
});
test("an uncertain creation reconciles even if the newest allocation is invalid", async () => {
  const f = fixture();
  const normal = f.create.getMockImplementation()!;
  f.create.mockImplementationOnce(async (p) => {
    await normal(p);
    throw Error("NETWORK");
  });
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(0);
  await vi.advanceTimersByTimeAsync(2000);
  // Invalid newer work never replaces the valid created definition.
  expect(f.server()?.value).toBe(1);
  expect(f.write).not.toHaveBeenCalled();
  expect(f.engine.version("new")).toBe(1);
  expect(f.engine.status("new")?.state).toBe("invalid");
});
test("same-ID different contents pause for explicit conflict resolution", async () => {
  const f = fixture();
  f.remote(9);
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  expect(f.engine.status("new")?.state).toBe("conflict");
  f.stage(2);
  f.online(true);
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.server()?.value).toBe(9);
  expect(f.create).toHaveBeenCalledTimes(1);
});
test("creation retries exhaust and require explicit retry", async () => {
  const f = fixture();
  f.create.mockRejectedValue(Error("NETWORK"));
  f.stage(1);
  await vi.advanceTimersByTimeAsync(330000);
  expect(f.create).toHaveBeenCalledTimes(4);
  f.create.mockImplementation(async (p) => ({ ...p, revision: 1 }));
  f.engine.retry("new");
  await vi.advanceTimersByTimeAsync(0);
  expect(f.engine.dirty()).toBe(false);
});
test("discarding unsent creation cancels the timer", async () => {
  const f = fixture();
  f.stage(1);
  expect(f.engine.canDiscardUncreated("new")).toBe(true);
  f.engine.discard("new");
  await vi.advanceTimersByTimeAsync(1000);
  expect(f.create).not.toHaveBeenCalled();
});
test("session disposal fences creation acknowledgements and later updates", async () => {
  const f = fixture();
  let release!: (p: P) => void;
  f.create.mockImplementationOnce(() => new Promise((r) => (release = r)));
  f.stage(1);
  await vi.advanceTimersByTimeAsync(500);
  f.stage(2);
  f.engine.dispose();
  release({ id: "new", revision: 1, value: 1 });
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.ack).not.toHaveBeenCalled();
  expect(f.write).not.toHaveBeenCalled();
});
