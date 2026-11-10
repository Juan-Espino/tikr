import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

// Offline guard for the server's module-path character restriction. Entry-point
// exclusions follow the installed Convex 1.46 bundler; this is not a deployment.
const validModulePath = (path) =>
  path.split("/").every((part) => /^[A-Za-z0-9_.]+$/.test(part));

test("Convex module-path guard rejects the reported hyphen regression", () => {
  assert.equal(validModulePath("market-limits.js"), false);
  assert.equal(validModulePath("market_limits.js"), true);
  assert.equal(validModulePath("nested/market_limits.js"), true);
  assert.equal(validModulePath("nested-name/market_limits.js"), false);
});

test("all repository Convex entry-point module paths use valid characters", () => {
  const root = fileURLToPath(new URL("../convex/", import.meta.url));
  const modules = readdirSync(root, { recursive: true })
    .map((path) => path.replaceAll("\\", "/"))
    .filter((path) => {
      const base = basename(path);
      return (
        /\.(ts|tsx|js|jsx|mts|mjs|cts|cjs)$/.test(base) &&
        !path.startsWith("_generated/") &&
        !base.startsWith(".") &&
        !base.startsWith("#") &&
        !["schema.ts", "schema.js"].includes(base) &&
        (base.match(/\./g) ?? []).length === 1 &&
        /^\s*(import|export)/m.test(readFileSync(join(root, path), "utf8"))
      );
    });
  assert.ok(modules.includes("market_limits.ts"));
  for (const path of modules)
    assert.ok(validModulePath(path.replace(/\.[^.]+$/, ".js")), path);
});
