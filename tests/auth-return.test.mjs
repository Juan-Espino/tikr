import assert from "node:assert/strict";
import { test } from "node:test";
import { safeAuthReturn } from "../src/lib/auth-return.ts";
test("safe draft return preserves internal path, query and fragment", () => {
  assert.equal(
    safeAuthReturn("/portfolio/test-draft?range=1Y#holdings"),
    "/portfolio/test-draft?range=1Y#holdings",
  );
});
test("external, malformed and auth-loop return values fall back to guest dashboard", () => {
  for (const value of [
    null,
    "",
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\nevil",
    "/api/auth/sign-out",
    "/sign-in?returnTo=/sign-in",
    "/x/../api/auth",
    "/".repeat(2050),
  ])
    assert.equal(safeAuthReturn(value), "/dashboard");
});
