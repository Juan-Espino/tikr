import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep, basename } from "node:path";
async function cleanup(dir) {
  const target = resolve(dir),
    root = resolve(tmpdir());
  if (
    !target.startsWith(root + sep) ||
    !basename(target).startsWith("tikr-admission-")
  )
    throw Error("UNSAFE_CLEANUP");
  await rm(target, { recursive: true });
}
import { createAdmission } from "../src/lib/market-admission.ts";
test("upstream reservations persist across restart and count failed calls without refund", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const clock = () => new Date("2026-11-04T15:00:00Z");
    const gate = createAdmission(dir, clock);
    await gate.reserve(450_000_000); // Simulated failed/unknown request retains its entire reservation.
    await assert.rejects(
      createAdmission(dir, clock).reserve(60_000_000),
      /CACHE_BUDGET/,
    );
    const settle = await gate.reserve(10_000_000);
    await settle(5000);
    await settle(0);
    const row = JSON.parse(await readFile(join(dir, "ledger.json"), "utf8"));
    assert.equal(row.calls, 2);
    assert.equal(row.io, 450_005_000);
  } finally {
    await cleanup(dir);
  }
});
test("concurrent processes cannot reserve the same remaining budget", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir);
    const outcomes = await Promise.allSettled([
      gate.reserve(300_000_000),
      createAdmission(dir).reserve(300_000_000),
    ]);
    assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  } finally {
    await cleanup(dir);
  }
});
test("abandoned lock and corrupt ledger fail closed without requests", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    await writeFile(join(dir, "ledger.lock"), "");
    await assert.rejects(createAdmission(dir).reserve(1));
  } finally {
    await cleanup(dir);
  }
});

test("durable revocation blocks a new client before a call even after restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "a".repeat(64);
    await createAdmission(dir).reserve(1, "b".repeat(64));
    await createAdmission(dir).revoke(scope);
    await assert.rejects(
      createAdmission(dir).reserve(1, scope),
      /EVIDENCE_REVOKED/,
    );
    const row = JSON.parse(await readFile(join(dir, "ledger.json"), "utf8"));
    assert.equal(row.calls, 1);
  } finally {
    await cleanup(dir);
  }
});

test("revocation remains durable while another process holds the ledger lock", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "c".repeat(64);
    await writeFile(join(dir, "ledger.lock"), "active owner");
    await createAdmission(dir).revoke(scope);
    await rm(join(dir, "ledger.lock"));
    await assert.rejects(
      createAdmission(dir).reserve(1, scope),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(dir);
  }
});

test("a write-ahead refresh guard blocks readers before any provider observation and survives restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "d".repeat(64);
    const finish = await createAdmission(dir).beginRefresh(scope, "SPY");
    await assert.rejects(
      createAdmission(dir).assertReadable(scope, ["SPY"]),
      /REFRESH_GUARDED/,
    );
    await createAdmission(dir).assertReadable(scope, ["AAA"]);
    await finish();
    await createAdmission(dir).assertReadable(scope, ["SPY"]);
  } finally {
    await cleanup(dir);
  }
});
