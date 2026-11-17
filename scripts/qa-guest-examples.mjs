// Requires scripts/serve-guest-qa.mjs. Disposable synthetic browser state only.
import { chromium, expect } from "@playwright/test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
const reviewUrl = process.env.TIKR_QA_URL ?? "http://127.0.0.1:5177";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-guest-ui-"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const passed = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/assets**", (r) =>
    r.fulfill({ json: [], headers: { "X-Tikr-Catalog": "sample" } }),
  );
  await page.goto(reviewUrl);
  await page.waitForFunction(() => !!window.__guestScenarios);
  const legacy = JSON.stringify(
    {
      version: 1,
      portfolios: [
        {
          id: "legacy-fixture",
          name: "Legacy fixture",
          holdings: [{ ticker: "SPY", weight: "100.00" }],
          manual: false,
          pinned: true,
          updated: 1,
          amount: "10000",
          range: "1Y",
          rangeChoice: "explicit",
        },
      ],
      draft: null,
    },
    null,
    2,
  );
  await page.evaluate((raw) => {
    if (localStorage.length) throw Error("Context is not empty");
    localStorage.setItem("tikr-demo-v1", raw);
  }, legacy);
  await page.getByRole("button", { name: /Long-term core/ }).click();
  await expect(
    page.getByText("Read-only original", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try your own mix" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("tikr-trial-v1")),
  ).toBeNull();
  await page.evaluate(() => window.__cloudQA.account("A"));
  await page.getByRole("button", { name: "Portfolios", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Examples", exact: true }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.__cloudQA.rows().length)).toBe(0);
  await expect(
    page.getByRole("button", { name: "Portfolios", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => window.__cloudQA.account(""));
  await page.getByRole("button", { name: /Long-term core/ }).click();
  passed.push("signed-in empty account hides examples; guests retain examples");
  await page.getByRole("button", { name: "Try your own mix" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  passed.push(
    ...(await page.evaluate(() => window.__guestScenarios("guest"))).passed,
  );
  const id = await page.evaluate(() => window.__portfolioStore.draft.id);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Synthetic trial", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__portfolioStore.draft.amount)).toBe(
    "12345",
  );
  passed.push("full reload recovers the specific trial without legacy rewrite");
  await page.screenshot({
    path: join(artifacts, "guest-desktop.png"),
    fullPage: true,
  });
  const second = await context.newPage();
  await second.goto(`${reviewUrl}/portfolio/${id}`);
  await second.waitForFunction(() => !!window.__portfolioStore?.draft);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator("#portfolio-amount").fill("12346");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    second.getByText(/temporary draft changed in another tab/),
  ).toBeVisible();
  await second.close();
  passed.push(
    "second tab detects recovery changes and refuses stale replacement",
  );
  passed.push(
    ...(await page.evaluate(() => window.__guestScenarios("cloud"))).passed,
  );
  // Notice rendering is a Sonner toast, outside the dashboard content flow.
  await expect(page.locator("[data-sonner-toaster]")).toHaveCount(1);

  await page.evaluate(() => {
    const row = window.__cloudQA.rows()[0];
    localStorage.setItem(
      "tikr-trial-v1",
      JSON.stringify({
        version: 1,
        owner: "A",
        draft: {
          ...row.definition,
          id: row.clientId,
          updated: row.updated,
          amount: "98765",
        },
      }),
    );
    window.__cloudQA.account("A");
  });
  await expect(page.getByText(/draft was saved differently/)).toBeVisible();
  expect(await page.evaluate(() => window.__portfolioStore.draft.amount)).toBe(
    "98765",
  );
  await page.getByRole("button", { name: "Load cloud version" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("tikr-trial-v1")),
  ).toBeNull();
  passed.push(
    "a differing recovery draft survives same-ID cloud reconciliation until explicit reload",
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Delete this portfolio?" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete portfolio", exact: true }),
  ).toHaveClass(/text-destructive/);
  await expect(
    page.getByRole("dialog").locator("div.justify-center"),
  ).toHaveCount(1);
  await page.screenshot({
    path: join(artifacts, "delete-dialog-desktop.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => window.__cloudQA.rows()[0].deleted)).toBe(
    false,
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete portfolio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Portfolio dashboard",
      exact: true,
      includeHidden: true,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__cloudQA.rows()[0].deleted)).toBe(
    true,
  );
  await expect(page.getByRole("button", { name: /Resume draft:/ })).toHaveCount(
    0,
  );
  passed.push(
    "shadcn delete cancellation/focus return and explicit deletion acknowledgement",
  );

  passed.push(
    ...(await page.evaluate(() => window.__guestScenarios("originals"))).passed,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: join(artifacts, "example-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Try your own mix" }).focus();
  await expect(
    page.getByRole("button", { name: "Try your own mix" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Try your own mix" }).press("Enter");
  await page.locator("#portfolio-name").fill("Discard fixture");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const positions = await page.evaluate(() =>
    ["Discard draft", "Edit"].map((label) => {
      const b = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === label,
      );
      return b.getBoundingClientRect().top;
    }),
  );
  expect(positions[0]).toBe(positions[1]);
  const previousId = await page.evaluate(
    () => window.__portfolioStore.draft.id,
  );
  await page
    .getByRole("button", { name: "Create portfolio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replace draft", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "New portfolio" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__portfolioStore.draft.id)).not.toBe(
    previousId,
  );
  await page.locator("#portfolio-name").fill("Replacement fixture");
  await page.getByRole("button", { name: "Done", exact: true }).click();

  await page
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Discard this draft?" }),
  ).toBeVisible();
  await page.screenshot({
    path: join(artifacts, "discard-dialog-mobile.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: "Discard draft", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Examples", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("tikr-trial-v1")),
  ).toBeNull();
  await expect(
    page.getByRole("button", { name: "Older browser portfolios" }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("tikr-demo-v1"))).toBe(
    legacy,
  );
  const hash = createHash("sha256").update(legacy).digest("hex");
  passed.push(
    "aligned mobile actions, keyboard cancel/focus return, shadcn discard and unchanged stored bytes without legacy UI",
  );
  expect(errors).toEqual([]);
  await writeFile(
    join(artifacts, "report.json"),
    JSON.stringify(
      { synthetic: true, passed, legacyHash: hash, errors },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      { synthetic: true, passed, legacyHash: hash, artifacts },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
