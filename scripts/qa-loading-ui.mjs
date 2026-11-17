import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-loading-ui-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5010/");
    await page.evaluate(async () =>
      (await import("/loading-preview.tsx")).mountLoadingQA(),
    );
    for (const mode of [
      "landing",
      "dashboard",
      "portfolio",
      "signin",
      "search",
    ]) {
      await page.evaluate((mode) => window.__loadingQA.mode(mode), mode);
      await expect(
        page.locator('[data-slot="skeleton"]').first(),
      ).toBeVisible();
      expect(
        await page
          .locator('[data-slot="skeleton"]')
          .first()
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe("none");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: join(artifacts, `${mode}-${width}.png`),
        fullPage: true,
      });
    }
    await page.evaluate(() => window.__loadingQA.mode("market"));
    await expect(page.locator('[data-loading="history"]')).toBeVisible();
    await page.evaluate(() => window.__loadingQA.loaded());
    await expect(page.locator('[data-loading="history"]')).toHaveCount(0);
    await expect(page.locator(".recharts-wrapper")).toBeVisible();
    await page.evaluate(() => window.__loadingQA.refresh());
    await expect(page.locator('[data-loading="history"]')).toHaveCount(0);
    await expect(page.locator(".recharts-wrapper")).toBeVisible();
    await expect(page.locator(".market-pulse").first()).toBeAttached();
    await context.close();
  }
  console.log(
    `PASS: tailored landing/dashboard/portfolio/sign-in/search skeletons; mobile overflow; reduced motion; history first-load skeleton; loaded refresh retains chart/pulse. ${artifacts}`,
  );
} finally {
  await browser.close();
}
