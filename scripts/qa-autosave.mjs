import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-autosave-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/assets**", (r) =>
    r.fulfill({
      json: [
        { ticker: "MSFT", name: "Microsoft", exchange: "Sample" },
        { ticker: "NVDA", name: "NVIDIA", exchange: "Sample" },
      ],
      headers: { "X-Tikr-Catalog": "sample" },
    }),
  );
  await page.goto("http://127.0.0.1:5010/");
  await page.evaluate(() => window.__cloudQA.account("A"));
  await page.waitForFunction(() => window.__portfolioStore.cloud);
  await page.evaluate(() =>
    window.__portfolioStore.open({
      id: "autosave-qa",
      name: "Autosave QA",
      amount: "10000",
      range: "1W",
      rangeChoice: "default",
      manual: false,
      pinned: false,
      holdings: [{ ticker: "SPY", weight: "100.00" }],
      updated: Date.now(),
    }),
  );
  expect(await page.evaluate(() => window.__cloudQA.rows().length)).toBe(0);
  await page.waitForFunction(() =>
    window.__cloudQA.rows().some((r) => r.clientId === "autosave-qa"),
  );
  const row = () =>
    page.evaluate(() =>
      window.__cloudQA.rows().find((r) => r.clientId === "autosave-qa"),
    );
  const edit = async () =>
    page.getByRole("button", { name: "Edit", exact: true }).click();
  const rename = async (value) => {
    await edit();
    await page.getByLabel("Portfolio name", { exact: true }).fill(value);
    await page.getByRole("button", { name: "Done", exact: true }).click();
  };
  await rename("Automatic rename");
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("Automatic rename");
  await expect(
    page.getByRole("button", { name: "Save to cloud", exact: true }),
  ).toHaveCount(0);
  await edit();
  await page.getByRole("textbox", { name: "Search assets" }).fill("tech");
  await page.getByRole("button", { name: "MSFT, Microsoft" }).click();
  await page.getByRole("button", { name: "NVDA, NVIDIA" }).click();
  await page.getByRole("button", { name: "MSFT, Microsoft" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(async () => (await row()).definition.holdings.map((h) => h.ticker))
    .toEqual(["SPY", "NVDA"]);
  await page.evaluate(() => window.__cloudQA.hold());
  await rename("Held snapshot");
  await page.waitForFunction(
    () => window.__portfolioStore.autosaveStatus?.state === "saving",
  );
  await rename("Latest while saving");
  await page.evaluate(() => window.__cloudQA.release());
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("Latest while saving");
  await expect(
    page.getByRole("heading", { name: "Latest while saving", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.__cloudQA.online(false));
  await rename("Offline latest");
  await expect(page.getByText(/Changes not saved/).first()).toBeVisible();
  expect((await row()).definition.name).toBe("Latest while saving");
  await page.evaluate(() => window.__cloudQA.online(true));
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("Offline latest");
  await page.evaluate(() => window.__cloudQA.loseAck());
  await rename("Lost acknowledgement");
  await expect
    .poll(() =>
      page.evaluate(() => window.__portfolioStore.autosaveStatus?.state),
    )
    .toBe("saved");
  expect((await row()).definition.name).toBe("Lost acknowledgement");
  await edit();
  await page.getByLabel("SPY allocation percent").fill("0");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByText(/Weights must be positive/).first(),
  ).toBeVisible();
  expect((await row()).definition.holdings[0].weight).not.toBe("0");
  await edit();
  await page.getByRole("button", { name: /Equal weights/ }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__portfolioStore.autosaveStatus?.state),
    )
    .toBe("saved");
  await page.evaluate(() =>
    window.__cloudQA.remote("autosave-qa", { name: "Remote change" }),
  );
  await rename("Local conflict");
  await expect(
    page.getByRole("button", { name: "Load cloud version" }),
  ).toBeVisible();
  expect((await row()).definition.name).toBe("Remote change");
  await page.getByRole("button", { name: "Load cloud version" }).click();
  await expect(
    page.getByRole("heading", { name: "Remote change", exact: true }),
  ).toBeVisible();
  await rename("After conflict recovery");
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("After conflict recovery");
  // Navigation waits for pending valid writes, and beforeunload guards dirty state.
  await page.evaluate(() => window.__cloudQA.online(false));
  await rename("Navigation pending");
  expect(
    await page.evaluate(() => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    }),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Create portfolio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Navigation pending", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Sign out with unsaved changes?",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Close account", exact: true })
    .click();
  await page.evaluate(() => window.__cloudQA.online(true));
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("Navigation pending");
  expect(
    await page.evaluate(() => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    }),
  ).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await rename("Mobile autosave");
  await expect
    .poll(async () => (await row()).definition.name)
    .toBe("Mobile autosave");
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect.poll(async () => (await row()).definition.pinned).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.__cloudQA.hold());
  await rename("A fenced pending");
  await page.waitForFunction(
    () => window.__portfolioStore.autosaveStatus?.state === "saving",
  );
  await page.evaluate(() => window.__cloudQA.account("B"));
  await page.evaluate(() => window.__cloudQA.release());
  await page.waitForTimeout(750);
  expect(
    await page.evaluate(
      () => window.__cloudQA.rows().filter((r) => r.ownerId === "B").length,
    ),
  ).toBe(0);
  expect((await row()).definition.name).toBe("Mobile autosave");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(artifacts, "account-b-mobile.png") });
  expect(errors).toEqual([]);
  console.log(
    `PASS: automatic creation; autosave rename/add/remove; in-flight latest edits; offline reconnect; lost ack; invalid manual weights; conflict/reload; session fencing; mobile. ${artifacts}`,
  );
} finally {
  await browser.close();
}
