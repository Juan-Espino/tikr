import { createServer } from "vite";
import { chromium, expect } from "@playwright/test";
import { resolve, join } from "node:path";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
const root = resolve(import.meta.dirname, "..");
const fixture = join(root, "tests/cloud-ui");
const artifacts = await mkdtemp(join(tmpdir(), "tikr-cloud-ui-"));
const server = await createServer({
  configFile: false,
  root: fixture,
  publicDir: join(root, "public"),
  oxc: { jsx: { runtime: "automatic" } },
  define: {
    "process.env.NEXT_PUBLIC_CONVEX_URL": JSON.stringify(
      "https://synthetic.invalid",
    ),
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  resolve: {
    alias: [
      { find: "next/image", replacement: join(fixture, "image.tsx") },
      { find: "~/lib/auth-client", replacement: join(fixture, "auth.ts") },
      { find: "convex/react", replacement: join(fixture, "convex.ts") },
      { find: "next/navigation", replacement: join(fixture, "navigation.ts") },
      {
        find: "~/components/market-performance",
        replacement: join(fixture, "market.tsx"),
      },
      { find: "~", replacement: join(root, "src") },
    ],
  },
  css: { postcss: join(root, "postcss.config.js") },
  server: {
    host: "127.0.0.1",
    port: process.argv.includes("--serve") ? 43128 : 0,
    fs: { allow: [root] },
  },
});

await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}`;
console.log(
  `Account deletion synthetic fixture: ${url}/?deletion-qa&landing-qa`,
);
if (!process.argv.includes("--serve")) {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    for (const width of [1440, 390, 360]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(url + "/?deletion-qa&landing-qa");
      await page.waitForFunction(() => !!window.__cloudQA);
      const controls = [
        page.getByRole("button", { name: "Portfolios", exact: true }),
        page.getByRole("link", { name: "Methodology", exact: true }),
        page.getByRole("button", { name: "Sign in", exact: true }),
      ];
      const boxes = await Promise.all(controls.map((x) => x.boundingBox()));
      expect(boxes.every((b) => b && b.height === 44)).toBe(true);
      expect(new Set(boxes.map((b) => b.y)).size).toBe(1);
      expect(
        Math.abs(
          boxes[1].x -
            boxes[0].x -
            boxes[0].width -
            (boxes[2].x - boxes[1].x - boxes[1].width),
        ),
      ).toBeLessThan(1);
      const textBoxes = await Promise.all(
        controls.map((control) =>
          control.evaluate((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const rect = range.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom };
          }),
        ),
      );
      expect(
        Math.max(...textBoxes.map((b) => b.bottom)) -
          Math.min(...textBoxes.map((b) => b.bottom)),
      ).toBeLessThan(1);
      await controls[0].focus();
      await page.keyboard.press("Tab");
      await expect(controls[1]).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(controls[2]).toBeFocused();
      expect(await controls[1].getAttribute("href")).toBe("/methodology");
      await controls[1].focus();
      await expect(controls[1]).toBeFocused();
      await page.evaluate(() => {
        localStorage.setItem("tikr-demo-v1", "legacy bytes unchanged");
        window.__cloudQA.account("A");
      });
      await page.getByRole("button", { name: "Open account" }).click();
      await page
        .getByRole("button", { name: "Delete account", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Permanently delete your account?" }),
      ).toBeVisible();
      await expect(page.getByText(/ALL your portfolios/)).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: "Available in 3s" }),
      ).toBeVisible();
      await expect(
        page.getByText("Please wait three seconds before confirming."),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", {
          name: "Permanently delete account",
          exact: true,
        }),
      ).toBeDisabled();
      expect(await page.evaluate(() => window.__deletionQA.starts)).toBe(0);
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Sign out", exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => window.__deletionQA.starts)).toBe(0);
      await page
        .getByRole("button", { name: "Delete account", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Permanently delete account",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", { name: "Account deletion", exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => window.__deletionQA.starts)).toBe(1);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Account deletion", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => localStorage.getItem("tikr-demo-v1")),
      ).toBe("legacy bytes unchanged");
      await page.evaluate(() => {
        window.__deletionQA.state = "pending";
      });
      const capability = await page.evaluate(() =>
        sessionStorage.getItem("tikr-account-deletion"),
      );
      await page
        .getByRole("button", { name: "Sign in again", exact: true })
        .click();
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("tikr-account-deletion"),
        ),
      ).toBe(capability);
      await page.evaluate(
        (owner) => {
          localStorage.setItem(
            "tikr-trial-v1",
            JSON.stringify({
              version: 1,
              owner,
              draft: {
                id: "private-trial",
                name: "Private",
                holdings: [],
                manual: false,
                pinned: false,
                updated: 1,
                amount: "10000",
                range: "1W",
                rangeChoice: "default",
              },
            }),
          );
        },
        width === 1440 ? "A" : "B",
      );
      const trialBefore = await page.evaluate(() =>
        localStorage.getItem("tikr-trial-v1"),
      );
      await page.evaluate(() => {
        window.__deletionQA.state = "completed";
      });
      await page.waitForURL(url + "/");
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("tikr-account-deletion"),
        ),
      ).toBeNull();
      expect(
        await page.evaluate(() => localStorage.getItem("tikr-demo-v1")),
      ).toBe("legacy bytes unchanged");
      await page.goto(url + "/?deletion-qa&landing-qa");
      await page.evaluate(() => {
        window.__cloudQA.account("A");
        window.__deletionQA.failure = true;
      });
      await page.getByRole("button", { name: "Open account" }).click();
      await page
        .getByRole("button", { name: "Delete account", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Permanently delete account",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", { name: "Account deletion", exact: true }),
      ).toBeVisible();
      const originalToken = JSON.parse(
        await page.evaluate(() =>
          sessionStorage.getItem("tikr-account-deletion"),
        ),
      ).token;
      await page
        .getByRole("button", { name: "Sign in again", exact: true })
        .click();
      await page.waitForURL(/sign-in/);
      expect(
        JSON.parse(
          await page.evaluate(() =>
            sessionStorage.getItem("tikr-account-deletion"),
          ),
        ).token,
      ).toBe(originalToken);
      await expect(
        page.getByRole("button", { name: "Continue with Google" }),
      ).toBeVisible();
      await context.close();
      const staleContext = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const stalePage = await staleContext.newPage();
      await stalePage.goto(url + "/?deletion-qa&landing-qa");
      await stalePage.waitForFunction(() => !!window.__cloudQA);
      await stalePage.evaluate(() => {
        window.__cloudQA.account("A");
        window.__deletionQA.reauth = true;
      });
      await stalePage.getByRole("button", { name: "Open account" }).click();
      await stalePage
        .getByRole("button", { name: "Delete account", exact: true })
        .click();
      const permanent = stalePage.getByRole("button", {
        name: "Permanently delete account",
        exact: true,
      });
      await expect(permanent).toBeDisabled();
      await expect(permanent).toBeEnabled({ timeout: 5000 });
      await permanent.click();
      await expect(stalePage.getByRole("alert")).toContainText(
        "Nothing has been deleted",
      );
      await expect(
        stalePage.getByRole("heading", {
          name: "Account deletion",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(permanent).toBeDisabled();
      expect(
        await stalePage.evaluate(() =>
          sessionStorage.getItem("tikr-account-deletion"),
        ),
      ).toBeNull();
      await stalePage
        .getByRole("button", { name: "Sign in again", exact: true })
        .click();
      await stalePage.waitForURL(/sign-in/);
      await expect(
        stalePage.getByRole("button", { name: "Continue with Google" }),
      ).toBeVisible();
      await staleContext.close();
    }
    console.log(
      "PASS desktop/mobile header geometry, native anchor/focus, modal strong wording, cancel, begin, reload, completion, matching trial cleanup, other-owner/legacy preservation and reauthentication capability, three-second confirmation delay and inline stale-session refusal",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}
