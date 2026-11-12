import test from "node:test";
import assert from "node:assert/strict";
import { developmentIoAllowance } from "../src/lib/market-dev-allowance.ts";
const approved = {
  NODE_ENV: "development",
  TIKR_DEV_IO_ALLOWANCE_MONTH: "2026-11",
  TIKR_DEV_IO_ALLOWANCE_BYTES: "750000000",
};
test("reviewed headroom is local development and month scoped, without changing ordinary limits", () => {
  assert.equal(developmentIoAllowance(approved, "2026-11"), 750000000);
  assert.equal(
    developmentIoAllowance(
      { ...approved, TIKR_DEV_IO_ALLOWANCE_BYTES: "650000000" },
      "2026-11",
    ),
    650000000,
  );
  assert.equal(developmentIoAllowance(approved, "2026-12"), 500000000);
  assert.equal(
    developmentIoAllowance(
      { ...approved, TIKR_DEV_IO_ALLOWANCE_MONTH: "2026-12" },
      "2026-12",
    ),
    500000000,
  );
  assert.equal(
    developmentIoAllowance({ ...approved, NODE_ENV: "production" }, "2026-11"),
    500000000,
  );
  assert.equal(
    developmentIoAllowance(
      { ...approved, TIKR_MARKET_HOSTED_ORIGIN: "https://example.test" },
      "2026-11",
    ),
    500000000,
  );
  assert.equal(
    developmentIoAllowance({ NODE_ENV: "development" }, "2026-11"),
    500000000,
  );
});
test("partial, malformed and excessive allowances fail closed", () => {
  for (const change of [
    { TIKR_DEV_IO_ALLOWANCE_MONTH: undefined },
    { TIKR_DEV_IO_ALLOWANCE_MONTH: "bad" },
    { TIKR_DEV_IO_ALLOWANCE_BYTES: "750000001" },
    { TIKR_DEV_IO_ALLOWANCE_BYTES: "0" },
    { TIKR_DEV_IO_ALLOWANCE_BYTES: "NaN" },
  ])
    assert.throws(
      () => developmentIoAllowance({ ...approved, ...change }, "2026-11"),
      /ADMISSION_CONFIG/,
    );
});
