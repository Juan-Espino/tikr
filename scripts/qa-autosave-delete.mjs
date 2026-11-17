import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const scenario of [
    "held-newer-edit",
    "invalid-allocation",
    "delete-failure",
    "lost-update-ack",
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5010/");
    await page.evaluate(() => window.__cloudQA.account("A"));
    await page.waitForFunction(() => window.__portfolioStore.cloud);
    await page.evaluate(() =>
      window.__portfolioStore.open({
        id: "delete-qa",
        name: "Delete QA",
        amount: "10000",
        range: "1W",
        rangeChoice: "default",
        manual: false,
        pinned: false,
        holdings: [{ ticker: "SPY", weight: "100.00" }],
        updated: Date.now(),
      }),
    );
    await page
      .getByRole("button", { name: "Create in account", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Open Delete QA, 1 assets" })
      .click();
    const rename = async (name) => {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await page.getByLabel("Portfolio name", { exact: true }).fill(name);
      await page.getByRole("button", { name: "Done", exact: true }).click();
    };
    if (scenario === "held-newer-edit") {
      await page.evaluate(() => window.__cloudQA.hold());
      await rename("Held write");
      await page.waitForFunction(
        () => window.__portfolioStore.autosaveStatus?.state === "saving",
      );
      await rename("Latest queued edit");
    } else if (scenario === "invalid-allocation") {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await page.getByLabel("SPY allocation percent").fill("0");
      await page.getByRole("button", { name: "Done", exact: true }).click();
    } else if (scenario === "lost-update-ack") {
      await page.evaluate(() => window.__cloudQA.loseAck());
      await rename("Ack lost");
      await page.waitForFunction(
        () => window.__portfolioStore.autosaveStatus?.state === "error",
      );
    } else {
      await page.evaluate(() => window.__cloudQA.fail("TRANSPORT_FAILURE"));
    }
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("button", { name: "Delete portfolio", exact: true })
      .click();
    if (scenario === "held-newer-edit") {
      expect(
        await page.evaluate(() => window.__cloudQA.rows()[0].deleted),
      ).toBe(false);
      await page.evaluate(() => window.__cloudQA.release());
    }
    if (scenario === "delete-failure") {
      await expect(
        page.getByRole("button", { name: "Retry delete", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => window.__cloudQA.rows()[0].deleted),
      ).toBe(false);
      await page
        .getByRole("button", { name: "Retry delete", exact: true })
        .click();
    }
    await expect
      .poll(() => page.evaluate(() => window.__cloudQA.rows()[0].deleted))
      .toBe(true);
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(
        () => window.__cloudQA.rows().filter((r) => !r.deleted).length,
      ),
    ).toBe(0);
    const writes = await page.evaluate(() => window.__cloudQA.writes());
    if (scenario === "held-newer-edit") expect(writes.length).toBe(3); // create, existing update, delete; queued update superseded
    if (scenario === "invalid-allocation") expect(writes.length).toBe(2); // never sends invalid update
    console.log(`PASS: mobile confirmed deletion: ${scenario}`);
    await context.close();
  }
} finally {
  await browser.close();
}
