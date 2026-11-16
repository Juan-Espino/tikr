import { mkdtemp, cp, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const target = await mkdtemp(join(tmpdir(), "tikr-cleared-build-"));
for (const path of [
  "src",
  "public",
  "convex",
  "tests",
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "postcss.config.js",
  "eslint.config.js",
  "prettier.config.js",
  "vitest.config.ts",
])
  await cp(join(root, path), join(target, path), {
    recursive: true,
    filter: (source) => !/(^|[\\/])\.env(?:\.|$)/.test(source),
  });
await symlink(
  join(root, "node_modules"),
  join(target, "node_modules"),
  "junction",
);
const names = [
  "SystemRoot",
  "WINDIR",
  "PATH",
  "PATHEXT",
  "TEMP",
  "TMP",
  "COMSPEC",
  "USERPROFILE",
  "ProgramFiles",
  "ProgramFiles(x86)",
  "PROCESSOR_ARCHITECTURE",
  "NUMBER_OF_PROCESSORS",
];
const env = Object.fromEntries(
  names
    .filter((name) => process.env[name] !== undefined)
    .map((name) => [name, process.env[name]]),
);
env.NEXT_TELEMETRY_DISABLED = "1";
env.SKIP_ENV_VALIDATION = "1";
// Exercise the same client/provider branch used by a configured production app,
// without copying credentials or contacting a real deployment.
if (process.argv.includes("--auth-fixture")) {
  env.NEXT_PUBLIC_CONVEX_URL = "https://build-fixture.convex.cloud";
  env.NEXT_PUBLIC_CONVEX_SITE_URL = "https://build-fixture.convex.site";
  console.log(
    "Synthetic public auth bindings enabled; no live deployment credentials.",
  );
}
if (process.argv.includes("--ai-fixture")) {
  env.NEXT_PUBLIC_AI_DISCOVERY_ENABLED = "true";
  // Intentionally no server enable flag or Groq key: compile only, no activation.
}
console.log("Credential-cleared source build: " + target);
const child = spawn(
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build", target],
  { cwd: target, env, stdio: "inherit", windowsHide: true },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
