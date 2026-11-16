import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = await mkdtemp(join(tmpdir(), "tikr-ai-ui-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let ordinary = 0;
  await page.route("**/api/assets**", (r) => {
    ordinary++;
    return r.fulfill({
      json: [
        { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
      ],
      headers: { "X-Tikr-Catalog": "sample" },
    });
  });
  await page.goto("http://127.0.0.1:5010/?ai-preview&network-qa");
  await page.getByRole("button", { name: /Long-term core/ }).click();
  await expect(
    page.getByText("Read-only original", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "AI", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Try your own mix" }).click();
  const ai = page.getByRole("button", { name: "AI", exact: true });
  const normal = page.getByRole("textbox", { name: "Search assets" });
  await normal.fill("NV");
  await expect(
    page.getByRole("button", { name: "NVDA, NVIDIA Corporation" }),
  ).toBeVisible();
  const guestDraft = await page.evaluate(() =>
    JSON.stringify(window.__portfolioStore.draft),
  );
  await ai.click();
  await expect(
    page.getByText("You must be signed in.", { exact: true }),
  ).toBeVisible();
  await expect(ai).toHaveAttribute("aria-pressed", "false");
  await expect(normal).toHaveValue("NV");
  expect(
    await page.evaluate(() => JSON.stringify(window.__portfolioStore.draft)),
  ).toBe(guestDraft);
  await page.evaluate(() => window.__cloudQA.account("A"));
  await page.waitForFunction(() => window.__portfolioStore.cloud);
  await normal.fill("NV");
  await expect(
    page.getByRole("button", { name: "NVDA, NVIDIA Corporation" }),
  ).toBeVisible();
  await ai.click();
  const prompt = page.getByRole("textbox", { name: "Describe assets" });
  const submit = page.getByRole("button", { name: "Find assets" });
  await expect(prompt).toBeFocused();
  await expect(submit).toBeDisabled();
  await page
    .getByRole("button", { name: "Data-center infrastructure", exact: true })
    .click();
  const calls = ordinary;
  await page.waitForTimeout(750);
  await expect(
    page.getByText("Illustrative sample rows", { exact: false }),
  ).toHaveCount(0);
  expect(ordinary).toBe(calls);
  await prompt.press("Shift+Enter");
  await expect(prompt).toHaveValue(/\n/);
  await prompt.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
  });
  await expect(page.getByText("Finding sample assets…")).toHaveCount(0);
  await prompt.press("Enter");
  await expect(page.getByText("Finding sample assets…")).toBeVisible();
  await expect(
    page.getByText("Illustrative sample rows", { exact: false }),
  ).toBeVisible();
  const add = page.getByRole("button", { name: "Add", exact: true });
  if (await add.count()) await add.first().click();
  await expect(
    page.getByRole("button", { name: "Added", exact: true }).first(),
  ).toBeDisabled();
  await prompt.fill("edited");
  await expect(
    page.getByText("Previous prompt results.", { exact: false }),
  ).toBeVisible();
  await ai.click();
  await expect(normal).toHaveValue("NV");
  await ai.click();
  await expect(prompt).toHaveValue("edited");
  for (const [text, expected] of [
    ["error", "Sample search failed."],
    ["no match", "No sample matches."],
    ["unavailable", "Sample AI unavailable."],
    ["limit", "Preview limit state only"],
    ["energy", "Which part of energy"],
  ]) {
    await prompt.fill(text);
    await submit.click();
    await expect(page.getByText(expected, { exact: false })).toBeVisible();
  }
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await expect(prompt).toHaveValue("energy: Equipment");
  await prompt.fill("slow");
  await submit.click();
  await prompt.fill("no match");
  await submit.click();
  await expect(
    page.getByText("No sample matches.", { exact: false }),
  ).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(
    page.getByText("No sample matches.", { exact: false }),
  ).toBeVisible();
  await prompt.fill("slow");
  await submit.click();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(page.getByText("Finding sample assets…")).toHaveCount(0);
  await prompt.fill("data-center infrastructure");
  await submit.click();
  await expect(
    page.getByText("Illustrative sample rows", { exact: false }),
  ).toBeVisible();
  expect(
    await page
      .locator(".ai-discovery-electric")
      .evaluate((e) => getComputedStyle(e).display),
  ).toBe("none");
  await page.screenshot({ path: join(out, "desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await prompt.tap();
  await expect(prompt).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: join(out, "mobile.png"), fullPage: true });
  await page
    .getByRole("textbox", { name: "SPY allocation percent" })
    .fill("75");
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  expect(
    await page.evaluate(
      () =>
        window.__portfolioStore.draft.holdings.find((h) => h.ticker === "SPY")
          .weight,
    ),
  ).toBe("75");
  expect(
    await page.evaluate(
      () =>
        window.__portfolioStore.draft.holdings.find((h) => h.ticker === "AAPL")
          .weight,
    ),
  ).toBe("0");
  await page.getByRole("button", { name: "Remove AAPL" }).click();
  await ai.click();
  await page.unroute("**/api/assets**");
  await page.route("**/api/assets**", (r) =>
    r.fulfill({
      json: [
        { ticker: "AMZN", name: "Amazon", exchange: "NASDAQ" },
        { ticker: "TSLA", name: "Tesla", exchange: "NASDAQ" },
      ],
    }),
  );
  await normal.fill("new");
  await page.getByRole("button", { name: "AMZN, Amazon" }).click();
  await page.getByRole("button", { name: "TSLA, Tesla" }).click();
  await ai.click();
  await expect(
    page.getByRole("button", { name: "Add", exact: true }),
  ).toBeDisabled();
  await prompt.fill("slow");
  await submit.click();
  await ai.click();
  await page.waitForTimeout(2000);
  await ai.click();
  await expect(
    page.getByText("Illustrative sample rows", { exact: false }),
  ).toHaveCount(0);
  const clean = await browser.newContext();
  const publicView = await clean.newPage();
  await publicView.goto("http://127.0.0.1:5010/");
  await publicView.getByRole("button", { name: /Long-term core/ }).click();
  await publicView.getByRole("button", { name: "Try your own mix" }).click();
  await publicView.evaluate(() => window.__cloudQA.account("A"));
  await publicView.waitForFunction(() => window.__portfolioStore.cloud);
  for (const viewport of [
    { width: 1280, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await publicView.setViewportSize(viewport);
    await publicView.waitForTimeout(350);
    const geometry = () =>
      publicView.evaluate(() => ({
        field: document
          .querySelector("[data-ai]")
          .getBoundingClientRect()
          .toJSON(),
        dialog: document
          .querySelector(".dialog-popup")
          .getBoundingClientRect()
          .toJSON(),
      }));
    const before = await geometry();
    const toggle = publicView.getByRole("button", { name: "AI", exact: true });
    await toggle.click();
    await publicView.waitForTimeout(80);
    const entering = await publicView
      .locator(".ai-discovery-rim")
      .evaluate((e) => parseFloat(getComputedStyle(e).strokeDashoffset));
    expect(entering).toBeGreaterThan(0);
    expect(entering).toBeLessThan(100);
    const fadeIn = await publicView
      .locator(".ai-mode-submit")
      .evaluate((e) => parseFloat(getComputedStyle(e).opacity));
    expect(fadeIn).toBeGreaterThan(0);
    expect(fadeIn).toBeLessThan(1);
    expect(
      await publicView.locator('[data-mode="normal"]').getAttribute("inert"),
    ).not.toBeNull();

    await publicView.waitForTimeout(850);
    const after = await geometry();
    expect(after).toEqual(before);
    await toggle.click();
    await publicView.waitForTimeout(80);
    const exiting = await publicView
      .locator(".ai-discovery-rim")
      .evaluate((e) => parseFloat(getComputedStyle(e).strokeDashoffset));
    const fading = await publicView
      .locator(".ai-discovery-field > svg")
      .evaluate((e) => parseFloat(getComputedStyle(e).opacity));
    expect(exiting).toBeGreaterThan(0);
    expect(exiting).toBeLessThan(100);
    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(1);
    const fadeOut = await publicView
      .locator(".ai-mode-submit")
      .evaluate((e) => parseFloat(getComputedStyle(e).opacity));
    expect(fadeOut).toBeGreaterThan(0);
    expect(fadeOut).toBeLessThan(1);
    expect(
      await publicView.locator('[data-mode="ai"]').getAttribute("inert"),
    ).not.toBeNull();

    expect(
      await publicView
        .locator("[data-ai]")
        .evaluate((e) => getComputedStyle(e).outlineStyle),
    ).toBe("none");
    await publicView.waitForTimeout(850);
    expect(await geometry()).toEqual(before);
  }
  await publicView.getByRole("button", { name: "AI", exact: true }).click();
  await expect(publicView.locator("#ai-preview-note")).toHaveCount(0);
  await publicView
    .getByRole("textbox", { name: "Describe assets" })
    .fill("data centers");
  await publicView.getByRole("button", { name: "Find assets" }).click();
  await expect(
    publicView.getByText(
      "AI discovery is not available yet. Use ticker or company search.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    publicView.getByText("AI interaction preview", { exact: false }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
  // Exercise the real production client adapter against a synthetic RPC client,
  // not the prototype's direct fixture adapter. No provider network requests.
  const backendContext = await browser.newContext();
  const backend = await backendContext.newPage();
  await backend.goto("http://127.0.0.1:5010/?ai-backend");
  await backend.getByRole("button", { name: /Long-term core/ }).click();
  await backend.getByRole("button", { name: "Try your own mix" }).click();
  await backend.getByRole("button", { name: "AI", exact: true }).click();
  await expect(
    backend.getByText("You must be signed in.", { exact: true }),
  ).toBeVisible();
  expect(
    await backend.evaluate(() => window.__discoveryQA.calls().length),
  ).toBe(0);
  await backend.evaluate(() => window.__cloudQA.account("A"));
  await backend.waitForFunction(() => window.__portfolioStore.cloud);
  await backend.getByRole("button", { name: "AI", exact: true }).click();
  await expect(
    backend.getByText("20 of 20 AI searches remaining today.", {
      exact: false,
    }),
  ).toBeVisible();
  await backend
    .getByRole("textbox", { name: "Describe assets" })
    .fill("data centers");
  expect(
    await backend.evaluate(() => window.__discoveryQA.calls().length),
  ).toBe(0);
  await backend.getByRole("button", { name: "Find assets" }).click();
  await expect(
    backend.getByText("Synthetic backend-adapter result"),
  ).toBeVisible();
  await expect(
    backend.getByText("19 of 20 AI searches remaining today.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await backend.evaluate(() =>
      Object.keys(window.__discoveryQA.calls()[0]).sort(),
    ),
  ).toEqual(["prompt", "requestId", "sessionFence"]);
  await expect(
    backend.getByText("AI interaction preview", { exact: false }),
  ).toHaveCount(0);
  await backend.evaluate(() => window.__discoveryQA.hold());
  await backend.getByRole("button", { name: "Find assets" }).click();
  await backend.waitForFunction(
    () => window.__discoveryQA.calls().length === 2,
  );
  await backend.evaluate(() => window.__cloudQA.account(""));
  await backend.evaluate(() => window.__discoveryQA.release());
  await expect(
    backend.getByText("Synthetic backend-adapter result"),
  ).toHaveCount(0);
  await expect(
    backend.getByText("18 of 20 AI searches remaining today.", {
      exact: false,
    }),
  ).toHaveCount(0);
  console.log(
    "PASS: read-only example; normal search; explicit submit; chips; Enter/Shift+Enter/IME; mode preservation; Add; stale prompt; all fixture states; clarification; supersession; cancellation; reduced motion; mobile focus/overflow",
    out,
  );
} finally {
  await browser.close();
}
