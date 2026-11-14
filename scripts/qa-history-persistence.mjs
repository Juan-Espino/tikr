// Credential-free browser QA. Refuses the real review URL; uses marked fixture only.
import { chromium, expect } from "@playwright/test";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createResponseCollector } from "./lib/qa-response-collector.mjs";

const origin = process.env.TIKR_QA_FIXTURE_ORIGIN ?? "http://127.0.0.1:43140";
if (origin !== "http://127.0.0.1:43140")
  throw Error("ISOLATED_FIXTURE_REQUIRED");
const control = await (await fetch(`${origin}/qa-fixture/control`)).json();
if (control.synthetic !== true) throw Error("SYNTHETIC_MARKER_REQUIRED");
await fetch(`${origin}/qa-fixture/control`, {
  method: "POST",
  body: JSON.stringify({ action: "reset" }),
});
const output = join(tmpdir(), "tikr-qa-persistence");
await mkdir(output, { recursive: true });
const statePath = join(output, "synthetic-storage-state.json");
const collector = createResponseCollector();
const sockets = new Set();
const hang = createServer((_request, response) => {
  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/x-ndjson",
  });
  response.write('{"status":"refreshing"}\n');
});
hang.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});
await new Promise((resolve) => hang.listen(0, "127.0.0.1", resolve));
const hangUrl = `http://127.0.0.1:${hang.address().port}/__qa-hanging-body`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const contexts = [];
const report = {
  synthetic: true,
  liveProviderRequests: 0,
  deployedConvexCalls: 0,
  checks: {},
};
try {
  const context = await browser.newContext();
  contexts.push(context);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("response", (response) => {
    if (response.url() === hangUrl) {
      collector.track(() => response.text()); // Never completes on this fixture.
      return;
    }
    if (!/\/api\/market(?:\/batch)?$/.test(response.url())) return;
    collector.track(async () => {
      const lines = (await response.text()).trim().split("\n").map(JSON.parse);
      const finals = response.url().endsWith("/batch")
        ? lines.map((p) => p.body.trim().split("\n").map(JSON.parse).at(-1))
        : [lines.at(-1)];
      return finals.map((f) => ({
        status: f.status,
        quality: f.dataQuality,
        historyChunks: f.history?.length ?? 0,
        series: f.series?.length ?? 0,
      }));
    });
  });
  await page.goto(origin);
  await page.evaluate(() => {
    const portfolios = [
      ["qa-persistence", ["AAA", "BBB"]],
      ["qa-comparison", ["CCC", "DDD"]],
    ].map(([id, tickers], i) => ({
      id,
      name: i ? "QA comparison" : "QA persistence",
      holdings: tickers.map((ticker) => ({ ticker, weight: "50" })),
      manual: false,
      pinned: false,
      updated: i,
      amount: i ? "750" : "10000",
      range: "YTD",
      rangeChoice: "explicit",
    }));
    localStorage.setItem(
      "tikr-demo-v1",
      JSON.stringify({ version: 1, portfolios, draft: null }),
    );
  });
  await page.goto(`${origin}/portfolio/qa-persistence`);
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Synthetic QA data; not market history."),
  ).toBeVisible();
  report.checks.syntheticLabel = true;
  await page
    .getByRole("button", { name: "QA comparison", exact: true })
    .click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  report.checks.comparison = true;
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Remove BBB", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "BBB allocation percent" }),
  ).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search assets" }).fill("CCC");
  await page.getByRole("button", { name: /^CCC, / }).click();
  await page
    .getByRole("textbox", { name: "AAA allocation percent" })
    .fill("75");
  await expect(
    page.getByText("25.00% over. Adjust the weights to continue."),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "CCC allocation percent" })
    .fill("25");
  await expect(
    page.getByText("Allocation is valid. History is checked separately."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await page.goto(`${origin}/portfolio/qa-persistence`);
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  report.checks.addRemoveAndManualWeights = true;
  await expect
    .poll(async () => {
      const state = await context.storageState({ indexedDB: true });
      return (
        state.origins
          .find((o) => o.origin === origin)
          ?.indexedDB?.find((db) => db.name === "tikr-market-history")
          ?.stores[0]?.records.length ?? 0
      );
    })
    .toBeGreaterThan(0);
  // Capture browser persistence BEFORE draining response bodies or closing pages.
  const state = await context.storageState({
    path: statePath,
    indexedDB: true,
  });
  report.checks.storageState = true;
  report.checks.indexedDbChunks = state.origins
    .find((o) => o.origin === origin)
    .indexedDB.find(
      (db) => db.name === "tikr-market-history",
    ).stores[0].records.length;
  const restored = await browser.newContext({ storageState: statePath });
  contexts.push(restored);
  const fresh = await restored.newPage();
  fresh.setDefaultTimeout(10000);
  await fresh.goto(`${origin}/portfolio/qa-persistence`);
  await expect(fresh.getByText("Ending value", { exact: true })).toBeVisible();
  await expect(
    fresh.getByRole("heading", { name: "QA persistence", exact: true }),
  ).toBeVisible();
  await expect(
    fresh.getByText("Synthetic QA data; not market history."),
  ).toBeVisible();
  report.checks.freshContextRestored = true;
  report.checks.portfoliosRestored = await fresh.evaluate(
    () => JSON.parse(localStorage.getItem("tikr-demo-v1")).portfolios.length,
  );
  report.checks.restoredHoldings = await fresh.evaluate(
    () =>
      JSON.parse(localStorage.getItem("tikr-demo-v1")).portfolios.find(
        (p) => p.id === "qa-persistence",
      ).holdings,
  );
  expect(report.checks.restoredHoldings).toEqual([
    { ticker: "AAA", weight: "75" },
    { ticker: "CCC", weight: "25" },
  ]);
  await page.evaluate((url) => {
    void fetch(url)
      .then((r) => r.text())
      .catch(() => {});
  }, hangUrl);
  await expect
    .poll(() => (collector.track ? sockets.size : 0))
    .toBeGreaterThan(0);
  report.collector = await collector.finish();
  report.checks.unfinishedBodyBounded = report.collector.records.some(
    (r) => r.outcome === "body-unavailable",
  );
  expect(report.checks.unfinishedBodyBounded).toBe(true);
  await fresh.screenshot({
    path: join(output, "restored-synthetic.png"),
    fullPage: true,
  });
} finally {
  // No body Promise.all before cleanup: abandoned reads have a fixed deadline.
  report.collector ??= await collector.finish();
  for (const context of contexts) await context.close();
  await browser.close();
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => hang.close(resolve));
  await writeFile(
    join(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ output, ...report }));
