// Local type generation with the installed Convex generator. No deployment,
// credentials or .env loading. Full deployment codegen is still required before
// the separately authorized dev rollout. Components are unchanged in this task.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import prettier from "prettier";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const { apiCodegen } = require(
  join(root, "node_modules/convex/dist/cjs/cli/codegen_templates/api.js"),
);
const files = (await readdir(join(root, "convex")))
  .filter(
    (name) =>
      name.endsWith(".ts") &&
      !name.endsWith(".test.ts") &&
      !["schema.ts", "auth.config.ts", "convex.config.ts"].includes(name),
  )
  .sort();
const existing = await readFile(
  join(root, "convex/_generated/api.d.ts"),
  "utf8",
);
const components = existing.slice(
  existing.indexOf("export declare const components:"),
);
if (!components.startsWith("export declare const components:"))
  throw Error("Existing component declarations missing");
const { DTS } = apiCodegen(files);
await writeFile(
  join(root, "convex/_generated/api.d.ts"),
  await prettier.format(`${DTS}\n${components}`, { parser: "typescript" }),
);
console.log("Generated local Convex API types; no deployment access.");
