// Run against the credential-cleared optimized build, never an owner profile.
import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = process.env.TIKR_QA_URL ?? "http://127.0.0.1:5012";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-landing-production-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (message.type() === "error" && message.text().includes("Base UI:"))
        errors.push(message.text());
    });
    await page.route("**/api/auth/**", async (r) => {
      await new Promise((resolve) => setTimeout(resolve, 1600));
      await r.fulfill({ json: null });
    });
    await page.route("https://*.convex.*/**", (r) => r.abort());
    await page.routeWebSocket("**", (ws) => ws.close());
    await page.addInitScript(() => {
      window.__heroStarts = [];
      document.addEventListener("animationstart", (e) => {
        if (e.animationName.startsWith("hero-"))
          window.__heroStarts.push(e.animationName);
      });
    });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".hero-headline")).toBeVisible();
    await page.evaluate(() => {
      window.__heroElement = document.querySelector(".hero-headline");
      window.__canvasElement = document.querySelector("canvas");
    });
    await expect(
      page.getByRole("button", { name: "Build a portfolio", exact: true }),
    ).toBeEnabled();
    await page.waitForTimeout(2600);
    const state = await page.evaluate(() => ({
      sameHeadline:
        window.__heroElement === document.querySelector(".hero-headline"),
      sameCanvas: window.__canvasElement === document.querySelector("canvas"),
      words: document.querySelectorAll(".hero-headline > span").length,
      starts: window.__heroStarts,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    expect(state.sameHeadline).toBe(true);
    expect(state.sameCanvas).toBe(true);
    expect(state.starts.filter((n) => n === "hero-globe")).toHaveLength(1);
    expect(state.starts.filter((n) => n !== "hero-globe")).toHaveLength(
      state.words,
    );
    expect(state.overflow).toBe(false);
    const styles = await page
      .locator("header nav [data-slot=button]")
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const s = getComputedStyle(n);
          return [s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight].join(
            "|",
          );
        }),
      );
    expect(styles).toHaveLength(3);
    expect(new Set(styles).size).toBe(1);
    await page.getByRole("link", { name: "Methodology", exact: true }).hover();
    await page.screenshot({
      path: join(artifacts, `landing-${width}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
    await context.close();
  }
  console.log(
    `PASS optimized-build delayed auth: one hero entrance, stable canvas/headline, matched header typography, desktop/mobile overflow. ${artifacts}`,
  );
} finally {
  await browser.close();
}
