import { chromium } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});
const context = await browser.newContext();
const page = await context.newPage();
const external = [];
await context.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (u.hostname === "127.0.0.1") return route.continue();
  external.push(u.origin);
  return route.abort();
});
try {
  await page.request.post("http://127.0.0.1:43149/qa-fixture/control", {
    data: { scenario: "sunday" },
  });
  await page.goto("http://127.0.0.1:43149/qa-fixture/seed");
  await page.getByRole("button", { name: "Seed isolated portfolios" }).click();
  await page.waitForURL("**/dashboard");
  await page.locator(".recharts-surface").first().waitFor({ timeout: 60000 });
  await page
    .getByText(/Loading history/)
    .first()
    .waitFor({ state: "hidden", timeout: 60000 });
  if (
    (await page
      .getByText("Synthetic QA data; not market history.", { exact: true })
      .count()) !== 2
  )
    throw Error("Synthetic labels missing");
  if (
    ((await page.locator("body").innerText()).match(/\bSPY\b/g) ?? []).length <
    3
  )
    throw Error("SPY comparisons missing");
  console.log("Sunday: two charts ready through November 13");
  console.log(
    "charts",
    await page.locator(".recharts-surface").count(),
    "external",
    external,
  );
  if (!(await page.locator("body").innerText()).includes("11-13"))
    throw Error("Sunday endpoint absent");
  await page.screenshot({
    path: join(tmpdir(), "tikr-calendar-sunday.png"),
    fullPage: true,
  });
  if ((await page.locator(".recharts-surface").count()) < 2)
    throw Error("Sunday charts missing");
  await page.request.post("http://127.0.0.1:43149/qa-fixture/control", {
    data: { scenario: "holiday" },
  });
  await page.reload();
  await page.locator(".recharts-surface").first().waitFor({ timeout: 60000 });
  await page
    .getByText(/Loading history/)
    .first()
    .waitFor({ state: "hidden", timeout: 60000 });
  console.log("Holiday: two charts ready through April 2");
  if ((await page.locator(".recharts-surface").count()) < 2)
    throw Error("Holiday charts missing");
  if (!(await page.locator("body").innerText()).includes("04-02"))
    throw Error("Holiday endpoint absent");
  await page.screenshot({
    path: join(tmpdir(), "tikr-calendar-holiday.png"),
    fullPage: true,
  });
} finally {
  await browser.close();
}
