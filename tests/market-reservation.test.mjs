import test from "node:test";
import assert from "node:assert/strict";
import { getDocumentSize } from "convex/values";
import { storageReservation } from "../src/lib/market-reservation.ts";

test("reservations bound charged reads and writes including maximum old/dependency documents", () => {
  const old = {
    key: "price:SPY:2026-11",
    payload: "x".repeat(59000),
    revision: "a".repeat(64),
    dependencies: [],
    checkedAt: 0,
    cost: 0,
    _id: "x".repeat(32),
    _creationTime: 0,
  };
  const entries = [
    {
      key: "asset:SPY",
      payload: "{}",
      revision: "b".repeat(64),
      dependencies: [{ key: old.key, revision: old.revision }],
    },
  ];
  const data = { ...entries[0], checkedAt: 0, cost: 0 };
  const charge =
    4 * getDocumentSize(data) +
    2 * getDocumentSize(old) +
    2 * getDocumentSize(old) +
    8192;
  assert.ok(storageReservation("write", { entries }) >= charge);
  assert.ok(
    storageReservation("read", { keys: [old.key] }) >=
      2 * getDocumentSize(old) + 1024 + 16384,
  );
  assert.ok(storageReservation("write", { entries }) < 1_000_000);
});

test("operation shape remains bounded and staged dependencies are not charged as external reads", () => {
  const entry = {
    key: "one",
    payload: "{}",
    revision: "a".repeat(64),
    dependencies: [],
  };
  const staged = {
    ...entry,
    key: "two",
    dependencies: [{ key: "one", revision: entry.revision }],
  };
  assert.ok(storageReservation("write", { entries: [entry, staged] }) < 600000);
  assert.throws(
    () => storageReservation("read", { keys: Array(81).fill("one") }),
    /READ_LIMIT/,
  );
  assert.throws(
    () => storageReservation("write", { entries: [] }),
    /WRITE_LIMIT/,
  );
  assert.throws(
    () =>
      storageReservation("write", {
        entries: [{ ...entry, payload: "x".repeat(60000) }],
      }),
    /DOCUMENT_LIMIT/,
  );
});
