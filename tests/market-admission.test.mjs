import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  rm,
  readdir,
  stat,
} from "node:fs/promises";
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

test("confirmation never resolves a still-active overlapping observation, even beyond lease expiry", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    let time = new Date("2026-11-11T15:00:00Z");
    const scope = "7".repeat(64),
      rev = "8".repeat(64),
      gate = createAdmission(dir, () => time);
    const old = await gate.beginRefresh(scope, "SPY");
    time = new Date(time.valueOf() + 61000); // A backend lease may now be reacquired, but its observation is not over.
    const newer = await createAdmission(dir, () => time).beginRefresh(
      scope,
      "SPY",
    );
    await gate.confirmRefresh(scope, "SPY", rev);
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: rev }),
      /REFRESH_GUARDED/,
    );
    await old.endObservation();
    await gate.confirmRefresh(scope, "SPY", rev);
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: rev }),
      /REFRESH_GUARDED/,
    );
    await newer.endObservation();
    await gate.confirmRefresh(scope, "SPY", rev);
    await createAdmission(dir).assertReadable(scope, ["SPY"], { SPY: rev });
    assert.equal(
      (await readdir(dir)).filter((n) => n.endsWith(".flag")).length,
      2,
    );
  } finally {
    await cleanup(dir);
  }
});

test("guard recovery receipts preserve evidence and require the exact committed revision even after restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "e".repeat(64),
      revision = "1".repeat(64),
      gate = createAdmission(dir);
    const abandoned = await gate.beginRefresh(scope, "SPY");
    await abandoned.endObservation(); // Preserve the guard after a completed failed observation.
    const guard = (await readdir(dir)).find((n) => n.endsWith(".flag"));
    const before = await stat(join(dir, guard));
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: revision }),
      /REFRESH_GUARDED/,
    );
    await gate.confirmRefresh(scope, "SPY", revision);
    await createAdmission(dir).assertReadable(scope, ["SPY"], {
      SPY: revision,
    });
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"]),
      /REFRESH_GUARDED/,
    );
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: "2".repeat(64) }),
      /REFRESH_GUARDED/,
    );
    const after = await stat(join(dir, guard));
    assert.equal(after.size, before.size);
    assert.equal(after.mtimeMs, before.mtimeMs);
    await gate.revoke(scope);
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: revision }),
      /EVIDENCE_REVOKED/,
    );
    await assert.rejects(
      gate.confirmRefresh(scope, "SPY", revision),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(dir);
  }
});
test("upstream reservations persist across restart and count failed calls without refund", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const clock = () => new Date("2026-11-04T15:00:00Z");
    const gate = createAdmission(dir, clock);
    await gate.reserve(450_000_000); // Simulated failed/unknown request retains its entire reservation.
    await createAdmission(dir, clock).reserve(60_000_000);
    const settle = await gate.reserve(10_000_000);
    await settle(5000);
    await settle(0);
    const row = JSON.parse(await readFile(join(dir, "ledger.json"), "utf8"));
    assert.equal(row.calls, 3);
    assert.equal(row.io, 510_005_000);
  } finally {
    await cleanup(dir);
  }
});
test("concurrent processes atomically count usage without a quota", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir);
    const outcomes = await Promise.allSettled([
      gate.reserve(300_000_000),
      createAdmission(dir).reserve(300_000_000),
    ]);
    assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 2);
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

test("a terminated process remains guarded until an exact committed-head receipt without deleting evidence", async () => {
  const { execFileSync } = await import("node:child_process");
  const { pathToFileURL } = await import("node:url");
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "6".repeat(64),
      rev = "7".repeat(64),
      moduleUrl = pathToFileURL(resolve("src/lib/market-admission.ts")).href;
    const script = `const {createAdmission}=await import(${JSON.stringify(moduleUrl)});await createAdmission(${JSON.stringify(dir)}).beginRefresh(${JSON.stringify(scope)},'SPY');`;
    execFileSync(process.execPath, [
      "--conditions=react-server",
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      script,
    ]);
    const guard = (await readdir(dir)).find((n) => n.endsWith(".flag"));
    const before = await stat(join(dir, guard)),
      activeBefore = await stat(join(dir, guard + ".active"));
    const gate = createAdmission(dir);
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"], { SPY: rev }),
      /REFRESH_GUARDED/,
    );
    await gate.confirmRefresh(scope, "SPY", rev);
    await gate.assertReadable(scope, ["SPY"], { SPY: rev });
    assert.equal((await stat(join(dir, guard))).mtimeMs, before.mtimeMs);
    assert.equal(
      (await stat(join(dir, guard + ".active"))).mtimeMs,
      activeBefore.mtimeMs,
    );
  } finally {
    await cleanup(dir);
  }
});

test("an asset correction stays revoked without disabling unrelated SPY history", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const scope = "3".repeat(64),
      gate = createAdmission(dir);
    await gate.revoke(scope, "AAA");
    await assert.rejects(
      createAdmission(dir).assertReadable(scope, ["AAA", "SPY"]),
      /EVIDENCE_REVOKED/,
    );
    await gate.assertReadable(scope, ["SPY"]);
    await assert.rejects(gate.beginRefresh(scope, "AAA"), /EVIDENCE_REVOKED/);
    await assert.rejects(
      gate.confirmRefresh(scope, "AAA", "4".repeat(64)),
      /EVIDENCE_REVOKED/,
    );
    await assert.rejects(
      gate.guardedSymbols(scope, ["AAA"]),
      /EVIDENCE_REVOKED/,
    );
    await gate.revoke(scope);
    await assert.rejects(
      gate.assertReadable(scope, ["SPY"]),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(dir);
  }
});

test("legacy source scopes cannot bypass revocations or unresolved guards; exact receipts remain readable", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir);
    const old = "1".repeat(64),
      current = "2".repeat(64),
      root = "3".repeat(64);
    const observation = await gate.beginRefresh(old, "AAA");
    await assert.rejects(
      gate.assertLegacyReadable(current, ["AAA"]),
      /REFRESH_GUARDED/,
    );
    await observation.endObservation();
    await gate.confirmRefresh(old, "AAA", root);
    await gate.assertLegacyReadable(current, ["AAA"], { AAA: root });
    assert.ok(
      (await readdir(dir)).some(
        (name) =>
          name.startsWith(`refresh-${old}-AAA-`) && name.endsWith(".flag"),
      ),
    );
    await gate.revoke(old, "AAA");
    await assert.rejects(
      gate.assertLegacyReadable(current, ["AAA"], { AAA: root }),
      /EVIDENCE_REVOKED/,
    );
    await gate.assertLegacyReadable(current, ["SPY"]);
  } finally {
    await cleanup(dir);
  }
});
test("scoped new provider observations settle measured bytes without refunding historical control units", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir);
    await gate.reserve(100000);
    const provider = await gate.reserve(1000, undefined, "provider");
    await provider(20);
    const database = await gate.reserve(500, undefined, "database");
    await database(200);
    const ledger = JSON.parse(await readFile(join(dir, "ledger.json"), "utf8"));
    assert.equal(ledger.io, 100220);
    assert.equal(ledger.calls, 3);
    assert.deepEqual(ledger.scoped.provider, {
      attempts: 1,
      retainedUnits: 20,
      measuredReceivedBytes: 20,
    });
    assert.deepEqual(ledger.scoped.database, {
      attempts: 1,
      retainedUnits: 200,
      measuredReceivedBytes: 0,
    });
  } finally {
    await cleanup(dir);
  }
});

test("reviewed v5 transition preserves only exact superseded global flags", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir),
      current =
        "695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7",
      old = "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7",
      policy = "personal-provisional-sip-v5-acquiree-only-mergers";
    const oldObservation = await gate.beginRefresh(old, "MSFT");
    await oldObservation.endObservation();
    await gate.revoke(old);
    await assert.rejects(
      gate.assertLegacyReadable(current, ["SPY"]),
      /EVIDENCE_REVOKED/,
    );
    await assert.rejects(
      gate.assertLegacyReadable(current, ["SPY"], {}, "unreviewed"),
      /EVIDENCE_REVOKED/,
    );
    await assert.rejects(
      gate.assertLegacyReadable("f".repeat(64), ["SPY"], {}, policy),
      /EVIDENCE_REVOKED/,
    );
    await gate.assertLegacyReadable(current, ["SPY"], {}, policy);
    assert.ok((await readdir(dir)).includes(`revoked-${old}.flag`));
    await gate.revoke(old, "SPY");
    await assert.rejects(
      gate.assertLegacyReadable(current, ["SPY"], {}, policy),
      /EVIDENCE_REVOKED/,
    );
    await gate.assertLegacyReadable(current, ["MSFT"], {}, policy);
    await gate.revoke(current);
    await assert.rejects(
      gate.assertLegacyReadable(current, ["MSFT"], {}, policy),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(dir);
  }
});

test("unknown global and historical ledger revocations remain blocking in reviewed v5", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    const gate = createAdmission(dir),
      scope = "a".repeat(64),
      policy = "personal-provisional-sip-v5-acquiree-only-mergers";
    await gate.revoke(scope);
    await assert.rejects(
      gate.assertLegacyReadable("b".repeat(64), ["SPY"], {}, policy),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(dir);
  }
  const other = await mkdtemp(join(tmpdir(), "tikr-admission-"));
  try {
    await writeFile(
      join(other, "ledger.json"),
      JSON.stringify({
        revoked: [
          "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7",
        ],
      }),
    );
    await assert.rejects(
      createAdmission(other).assertLegacyReadable(
        "b".repeat(64),
        ["SPY"],
        {},
        "personal-provisional-sip-v5-acquiree-only-mergers",
      ),
      /EVIDENCE_REVOKED/,
    );
  } finally {
    await cleanup(other);
  }
});

test("reviewed lineage hashes bind exact historical policy and coverage", async () => {
  const { createHash } = await import("node:crypto");
  for (const [policy, hash] of [
    [
      "personal-provisional-sip-v3-requested-period",
      "5678a7ec4e584fb841e6e25049b7efb790e49a63167aa80cf8eaa4c561e928e7",
    ],
    [
      "personal-provisional-sip-v5-acquiree-only-mergers",
      "695f9ce4566c9a60d17cee85ef9359c8831943e3ec378d3bf005c9a97cdd16f7",
    ],
    [
      "personal-provisional-sip-v4-stock-merger-acquirer",
      "dcb3fad8de5e1ec032403090533da422eaa911b249dfd8511affd38539b87d8d",
    ],
  ]) {
    assert.equal(
      createHash("sha256")
        .update(JSON.stringify({ policy, start: "2021-10-25" }))
        .digest("hex"),
      hash,
    );
  }
});
