import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-search-motion-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5010/?ai-preview");
    await page.evaluate(async () =>
      (await import("/search-motion.tsx")).mountMotionQA(),
    );
    await expect(page.getByText("Isolated search motion")).toBeVisible();
    const viewport = page.locator("[data-search-viewport]").first();
    const rows = page.locator("[data-search-row]");
    const setRows = async (ids) =>
      page.evaluate((ids) => window.__motionQA.rows(ids), ids);
    await page
      .getByRole("textbox", { name: "Fixed search", exact: true })
      .focus();
    for (const count of [0, 1, 5, 24]) {
      await setRows(Array.from({ length: count }, (_, i) => `ASSET${i}`));
      await expect(rows).toHaveCount(count);
      await page.waitForTimeout(450);
      const bounds = await viewport.evaluate((el) => ({
        height: el.clientHeight,
        scroll: el.scrollHeight,
        modalHeight: el.closest("[role=dialog]").getBoundingClientRect().height,
        max: parseFloat(
          getComputedStyle(el.closest("[role=dialog]")).maxHeight,
        ),
      }));
      expect(bounds.modalHeight).toBeLessThanOrEqual(bounds.max + 1);
      if (count === 24) expect(bounds.scroll).toBeGreaterThan(bounds.height);
      await expect(
        page.getByRole("textbox", { name: "Fixed search", exact: true }),
      ).toBeFocused();
    }
    await page.evaluate(() => {
      window.__motionExits = 0;
      new MutationObserver((records) => {
        for (const record of records)
          for (const node of record.addedNodes)
            if (node instanceof Element && node.matches(".search-row-exit"))
              window.__motionExits++;
      }).observe(document.body, { childList: true, subtree: true });
    });
    await setRows([
      "ASSET0",
      "ASSET1",
      "NEW1",
      "NEW2",
      "NEW3",
      "NEW4",
      "NEW5",
      "NEW6",
      "NEW7",
    ]);
    await expect(rows).toHaveCount(9);
    const retained = page.locator('[data-search-row="ASSET0"]');
    expect(await retained.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(
      await page
        .locator('[data-search-row="NEW7"]')
        .evaluate((el) => el.getAnimations().length),
    ).toBe(0);
    expect(await page.evaluate(() => window.__motionExits)).toBeGreaterThan(0);
    await page.waitForTimeout(150);
    await expect(page.locator(".search-row-exit")).toHaveCount(0);
    for (const count of [20, 2, 18, 0, 5]) {
      await setRows(Array.from({ length: count }, (_, i) => `ASSET${i}`));
      await page.waitForTimeout(35);
    }
    await page.waitForTimeout(400);
    expect(await viewport.evaluate((el) => el.getAnimations().length)).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setRows(["REDUCED1", "REDUCED2"]);
    await expect(rows).toHaveCount(2);
    await page.waitForTimeout(50);
    expect(await rows.first().evaluate((el) => el.getAnimations().length)).toBe(
      0,
    );
    expect(await viewport.evaluate((el) => el.getAnimations().length)).toBe(0);
    await page.screenshot({
      path: join(artifacts, mobile ? "mobile.png" : "desktop.png"),
    });
    await page.evaluate(() => window.__motionQA.allowance());
    await page.getByRole("button", { name: "AI", exact: true }).click();
    await expect(page.locator(".ai-allowance-low")).toHaveCount(0);
    await page.evaluate(() => window.__motionQA.remaining(5));
    await expect(page.locator(".ai-allowance-low")).toHaveText("5");
    await expect(page.locator(".ai-allowance-low")).toHaveCSS(
      "color",
      "rgb(168, 73, 67)",
    );
    await page.evaluate(() => window.__motionQA.remaining(0));
    await expect(page.locator(".ai-allowance-low")).toHaveText("0");
    await context.close();
  }
  // Exercise the actual editor chrome, not just the isolated motion fixture.
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
    });
    const page = await context.newPage();
    await page.route("**/api/assets**", (route) =>
      route.fulfill({
        json: Array.from({ length: 24 }, (_, i) => ({
          ticker: `QA${i}`,
          name: `Synthetic company ${i}`,
          exchange: "Sample",
        })),
        headers: { "X-Tikr-Catalog": "sample" },
      }),
    );
    await page.goto("http://127.0.0.1:5010/?ai-preview&network-qa");
    await page.getByRole("button", { name: /Long-term core/ }).click();
    await page.getByRole("button", { name: "Try your own mix" }).click();
    const input = page.getByRole("textbox", { name: "Search assets" });
    await input.fill("QA");
    await expect(page.locator("[data-search-row]")).toHaveCount(24);
    await page.waitForTimeout(500);
    const bounds = await page
      .locator("[data-search-viewport]")
      .evaluate((el) => ({
        height: el.clientHeight,
        inner: el.firstElementChild.getBoundingClientRect().height,
        inline: el.style.height,
        dialogScroll: el.closest("[role=dialog]").scrollHeight,
        children: [...el.closest("[role=dialog]").children].map((c) => [
          c.tagName,
          c.getBoundingClientRect().height,
          getComputedStyle(c).marginTop,
          getComputedStyle(c).position,
        ]),
        scroll: el.scrollHeight,
        modal: el.closest("[role=dialog]").getBoundingClientRect().height,
        max: parseFloat(
          getComputedStyle(el.closest("[role=dialog]")).maxHeight,
        ),
        allocation: el
          .closest("[role=dialog]")
          .querySelector("[data-editor-allocation]")
          .getBoundingClientRect().height,
      }));
    expect(bounds.height).toBeGreaterThan(55);
    expect(bounds.scroll).toBeGreaterThan(bounds.height);
    expect(bounds.modal).toBeLessThanOrEqual(bounds.max + 1);
    expect(bounds.allocation).toBeGreaterThan(55);
    const before = await input.boundingBox();
    await page.locator("[data-search-viewport]").evaluate((el) => {
      el.scrollTop = 200;
    });
    expect((await input.boundingBox()).y).toBe(before.y);
    await expect(
      page.getByRole("button", { name: "Done", exact: true }),
    ).toBeVisible();
    const remove = page.getByRole("button", {
      name: "Remove SPY",
      exact: true,
    });
    const originalWidth = await page
      .getByRole("dialog")
      .evaluate((el) => el.getBoundingClientRect().width);
    await remove.hover();
    await page.waitForTimeout(250);
    const hoverBounds = await page
      .locator("[data-editor-allocation]")
      .evaluate((el) => ({
        client: el.clientWidth,
        scroll: el.scrollWidth,
        modalWidth: el.closest("[role=dialog]").getBoundingClientRect().width,
      }));
    expect(hoverBounds.scroll).toBeLessThanOrEqual(hoverBounds.client);
    expect(hoverBounds.modalWidth).toBe(originalWidth);
    await remove.focus();
    await page.waitForTimeout(200);
    expect(
      await page
        .locator("[data-editor-allocation]")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: join(artifacts, `editor-${width}.png`) });
    await context.close();
  }
  console.log(
    `PASS: 0/1/5/24 results; cap/scroll; retained keys; first-six entry; removal; rapid retarget; focus; reduced motion; desktop/mobile. ${artifacts}`,
  );
} finally {
  await browser.close();
}
