import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { privateDirectory } from "./lib/alpaca-private-storage.mjs";
import { cases, getCase } from "./lib/alpaca-cases.mjs";
import {
  captureCase,
  replayCase,
  auditCase,
  caseHash,
  sha256,
} from "./lib/alpaca-validation.mjs";

const MAX_FILE = 64 * 1024 * 1024;
const safeCodes = new Set([
  "CONFIG",
  "LIMIT",
  "ABORTED",
  "TIMEOUT",
  "NETWORK",
  "UPSTREAM",
  "MALFORMED",
  "BLOCKED",
  "RATE_LIMIT",
  "SECRET_ECHO",
  "SNAPSHOT_INVALID",
  "NUMERIC_LIMIT",
]);
async function jsonFile(filename) {
  if (!filename || (await stat(filename)).size > MAX_FILE)
    throw new Error("Invalid file");
  return JSON.parse(await readFile(filename, "utf8"));
}
function option(args, name) {
  const matches = args.filter((arg) => arg.startsWith(`--${name}=`));
  if (matches.length > 1) throw new Error("Duplicate option");
  return matches[0]?.slice(name.length + 3);
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "list" && args.length === 0) {
    console.log(
      JSON.stringify(
        cases.map(({ id, start, end, holding, references, referenceNote }) => ({
          id,
          start,
          end,
          holding,
          references,
          referenceNote,
        })),
        null,
        2,
      ),
    );
    return;
  }
  if (
    !["capture", "replay"].includes(command) ||
    args.some((arg) => !/^--(case|snapshot|review)=.+$/.test(arg))
  )
    throw new Error("Invalid command");
  const spec = getCase(option(args, "case"));
  const reviewPath = option(args, "review");
  const review = reviewPath ? await jsonFile(reviewPath) : undefined;
  let snapshot;
  let output;
  if (command === "capture") {
    if (option(args, "snapshot"))
      throw new Error("Capture does not read a snapshot");
    const {
      ALPACA_PRIVATE_VALIDATION,
      ALPACA_PRIVATE_STORAGE_ACK,
      ALPACA_KEY_ID,
      ALPACA_SECRET_KEY,
      ALPACA_FEED,
    } = process.env;
    if (
      ALPACA_PRIVATE_VALIDATION !== "explicit" ||
      ALPACA_PRIVATE_STORAGE_ACK !== "local-private-no-sync" ||
      !ALPACA_KEY_ID ||
      !ALPACA_SECRET_KEY ||
      !["sip", "iex"].includes(ALPACA_FEED)
    ) {
      console.error(
        "Blocked: supply the explicit private-validation opt-in, local-private-no-sync storage acknowledgment, credentials, and feed in this process environment.",
      );
      process.exitCode = 2;
      return;
    }
    output = await privateDirectory(); // Secure storage before any authenticated request.
    snapshot = await captureCase(spec, ALPACA_FEED, {
      keyId: ALPACA_KEY_ID,
      secret: ALPACA_SECRET_KEY,
    });
  } else snapshot = await jsonFile(option(args, "snapshot"));
  const candidates = await replayCase(snapshot, spec);
  const report = auditCase(snapshot, spec, candidates, review);
  output ??= await privateDirectory();
  if (command === "capture")
    await writeFile(
      path.join(output, "snapshot.json"),
      JSON.stringify(snapshot),
      { flag: "wx", mode: 0o600 },
    );
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
    { flag: "wx", mode: 0o600 },
  );
  const reviewTemplate = {
    comparisonPrices: Object.fromEntries(
      spec.symbols.map((symbol) => [symbol, {}]),
    ),
    review: {
      caseHash: caseHash(spec),
      snapshotHash: sha256(JSON.stringify(snapshot)),
      reviewer: "",
      reviewedAt: "",
      sources: spec.references,
    },
    evidence: {
      calendar: null,
      finality: null,
      actions: {},
      inception: {},
      prices: {},
      access: {},
      dividendUnits: {},
    },
  };
  await writeFile(
    path.join(output, "review-template.json"),
    JSON.stringify(reviewTemplate, null, 2),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      caseId: spec.id,
      status: report.status,
      checks: report.checks.map(({ id, status }) => ({ id, status })),
      output,
    }),
  );
  process.exitCode =
    report.status === "passed" ? 0 : report.status === "failed" ? 1 : 2;
}
try {
  await main();
} catch (error) {
  // Provider error bodies, request headers, credentials and arbitrary exception text never reach stdout.
  console.error(
    `Validation stopped: ${safeCodes.has(error?.code) ? error.code : "INVALID_OR_UNAVAILABLE_INPUT"}`,
  );
  process.exitCode = 1;
}
