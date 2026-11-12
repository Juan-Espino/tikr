import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep, basename } from "node:path";
import { convexStorage } from "../src/lib/market-storage.ts";
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), "tikr-storage-")),
    originalFetch = globalThis.fetch,
    originalRoot = process.env.LOCALAPPDATA;
  process.env.LOCALAPPDATA = dir;
  try {
    await run({
      dir,
      store: convexStorage(
        "https://offline-test.convex.cloud",
        "synthetic-private-canary",
        "a".repeat(64),
      ),
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalRoot === undefined) delete process.env.LOCALAPPDATA;
    else process.env.LOCALAPPDATA = originalRoot;
    const target = resolve(dir);
    if (
      !target.startsWith(resolve(tmpdir()) + sep) ||
      !basename(target).startsWith("tikr-storage-")
    )
      throw Error("UNSAFE_CLEANUP");
    await rm(target, { recursive: true });
  }
}
test("server SDK bridge uses fixed endpoint and credential header, refunds measured success", async () =>
  fixture(async ({ store, dir }) => {
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.equal(input, "https://offline-test.convex.cloud/api/mutation");
      assert.equal(init.redirect, "error");
      assert.equal(
        init.headers.Authorization,
        "Convex synthetic-private-canary",
      );
      return Response.json({
        status: "success",
        value: { status: "ok", rows: [], chargedIo: 8192 },
        logLines: [],
      });
    };
    assert.deepEqual(await store.read([]), []);
    assert.equal(calls, 1);
    const ledger = JSON.parse(
      await readFile(
        join(dir, "Tikr", "market-admission", "ledger.json"),
        "utf8",
      ),
    );
    assert.equal(ledger.calls, 1);
    assert.equal(ledger.io, 8192);
  }));
test("server errors never expose credential canaries and retain failed reservations", async () =>
  fixture(async ({ store, dir }) => {
    globalThis.fetch = async () =>
      new Response("synthetic-private-canary", { status: 500 });
    await assert.rejects(
      store.read([]),
      (error) =>
        error.message === "STORAGE_UNAVAILABLE" &&
        !error.message.includes("canary"),
    );
    const ledger = JSON.parse(
      await readFile(
        join(dir, "Tikr", "market-admission", "ledger.json"),
        "utf8",
      ),
    );
    assert.equal(ledger.calls, 1);
    assert.equal(ledger.io, 32768);
  }));

test("SDK budget review refusal reaches the caller as a safe distinct error", async () =>
  fixture(async ({ store }) => {
    globalThis.fetch = async () =>
      Response.json({
        status: "error",
        errorMessage: "private-canary",
        errorData: { code: "TEAM_BUDGET_UNVERIFIED" },
        logLines: [],
      });
    await assert.rejects(
      store.read([]),
      (error) =>
        error.code === "TEAM_BUDGET_UNVERIFIED" &&
        !error.message.includes("canary"),
    );
  }));
test("received SDK response bytes are capped before JSON parsing and overflow cancels", async () =>
  fixture(async ({ store }) => {
    let cancelled = false;
    globalThis.fetch = async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(6_000_000));
            controller.enqueue(new Uint8Array(6_000_001));
          },
          cancel() {
            cancelled = true;
          },
        }),
      );
    await assert.rejects(store.read([]), /STORAGE_UNAVAILABLE/);
    assert.equal(cancelled, true);
  }));

test("storage capacity refusal remains distinct from I/O budget exhaustion", async () =>
  fixture(async ({ store }) => {
    globalThis.fetch = async () =>
      Response.json({
        status: "success",
        value: { status: "storage" },
        logLines: [],
      });
    await assert.rejects(
      store.write("catalog:refresh", "synthetic", [
        {
          key: "catalog:0",
          payload: "{}",
          revision: "a".repeat(64),
          dependencies: [],
        },
      ]),
      (error) => error.code === "STORAGE_CAPACITY",
    );
  }));

test("personal correction cannot escape revocation through a monthly window change", async () =>
  fixture(async () => {
    const { PERSONAL_SOURCE_POLICY } =
      await import("../src/lib/market-policy.ts");
    const make = (scope) =>
      convexStorage(
        "https://offline-test.convex.cloud",
        "synthetic-private-canary",
        scope,
        PERSONAL_SOURCE_POLICY,
      );
    const november = make("b".repeat(64));
    await november.revoke("AAA");
    const december = make("c".repeat(64));
    globalThis.fetch = () => {
      throw Error("No provider or storage requests permitted");
    };
    await assert.rejects(
      december.assertReadable(["AAA", "SPY"]),
      /EVIDENCE_REVOKED/,
    );
    await assert.rejects(december.beginRefresh("AAA"), /EVIDENCE_REVOKED/);
    await assert.rejects(december.recoverySymbols(["AAA"]), /EVIDENCE_REVOKED/);
    await assert.rejects(
      december.confirmRefresh("AAA", "d".repeat(64)),
      /EVIDENCE_REVOKED/,
    );
    await december.assertReadable(["SPY"]);
    const freshProcessStore = make("e".repeat(64));
    await assert.rejects(
      freshProcessStore.assertReadable(["AAA"]),
      /EVIDENCE_REVOKED/,
    );
    await november.revoke();
    await assert.rejects(
      freshProcessStore.assertReadable(["SPY"]),
      /EVIDENCE_REVOKED/,
    );
  }));
