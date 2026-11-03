import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  realpathSync,
  lstatSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, join, dirname, basename } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const parent = realpathSync(join(root, "tests"));
const directory = mkdtempSync(join(parent, "alpaca-boundary-probe-"));
const names = [
  "SystemRoot",
  "WINDIR",
  "PATH",
  "PATHEXT",
  "TEMP",
  "TMP",
  "COMSPEC",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "ProgramFiles",
  "ProgramFiles(x86)",
  "PROCESSOR_ARCHITECTURE",
  "NUMBER_OF_PROCESSORS",
];
const env = Object.fromEntries(
  names
    .filter((k) => process.env[k] !== undefined)
    .map((k) => [k, process.env[k]]),
);
env.SKIP_ENV_VALIDATION = "1";
try {
  mkdirSync(join(directory, "app"));
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({ name: "alpaca-negative-probe", private: true }),
  );
  writeFileSync(
    join(directory, "app", "layout.js"),
    "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n",
  );
  writeFileSync(
    join(directory, "app", "page.js"),
    '"use client";\nimport { fetchCandidates } from "../../../src/lib/alpaca/adapter.ts";\nexport default function Probe() { return <button onClick={() => { void fetchCandidates({keyId: "", secret: ""}, {symbols: [], start: "", end: "", feed: "sip"}); }}>probe</button>; }\n',
  );
  const result = spawnSync(
    process.execPath,
    [
      join(root, "node_modules", "next", "dist", "bin", "next"),
      "build",
      directory,
      "--no-lint",
    ],
    { cwd: root, env, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (
    result.error ||
    result.status === 0 ||
    !(
      /server-only/is.test(output) &&
      /only works in a Server Component/is.test(output) &&
      /alpaca[\\/]adapter\.ts/is.test(output) &&
      /app[\\/]page\.js/is.test(output)
    )
  ) {
    process.stderr.write(output);
    throw new Error(
      `Expected server-only client-import build failure; exit=${result.status}`,
    );
  }
  console.log(
    "Client import build rejected by Next.js server-only boundary (expected).",
  );
} finally {
  if (
    dirname(realpathSync(directory)) !== parent ||
    !basename(directory).startsWith("alpaca-boundary-probe-") ||
    lstatSync(directory).isSymbolicLink()
  )
    throw new Error("Refusing to remove unexpected probe path");
  rmSync(directory, { recursive: true });
}
