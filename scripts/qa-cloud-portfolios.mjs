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
  server: { host: "127.0.0.1", port: 0, fs: { allow: [root] } },
});
let browser;
const passed = [];
try {
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/api/assets**", (route) =>
    route.fulfill({
      json: [
        { ticker: "SPY", name: "Synthetic SPY fixture", exchange: "ARCA" },
      ],
      headers: { "X-Tikr-Catalog": "sample" },
    }),
  );
  await page.goto(url);
  await page.waitForFunction(() => !!window.__cloudQA);
  const local = {
    version: 1,
    portfolios: ["local1", "local2"].map((id) => ({
      id,
      name: "Legacy same name",
      holdings: [{ ticker: "SPY", weight: "100.00" }],
      manual: false,
      pinned: false,
      updated: 1,
      amount: "10000",
      range: "1Y",
      rangeChoice: "explicit",
    })),
    draft: {
      id: "guestdraft",
      name: "Guest draft",
      holdings: [{ ticker: "SPY", weight: "100.00" }],
      manual: false,
      pinned: false,
      updated: 2,
      amount: "12345",
      range: "1W",
      rangeChoice: "default",
    },
  };
  await page.evaluate(
    (value) => localStorage.setItem("tikr-demo-v1", JSON.stringify(value)),
    local,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume draft: Guest draft" }),
  ).toBeVisible();
  const original = await page.evaluate(() =>
    localStorage.getItem("tikr-demo-v1"),
  );
  await page.evaluate(() => window.__cloudQA.account("A"));
  await expect(
    page.getByText("Account cloud portfolios", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume draft: Guest draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Guest draft", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(0);
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your experiments" }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tikr-demo-v1"))).toBe(
    original,
  );
  passed.push(
    "guest draft -> account -> explicit cloud save without guest rewrite",
  );
  await page.getByRole("button", { name: "Open account" }).click();
  await expect(
    page.getByRole("button", { name: /Import portfolios/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close account" }).click();
  await expect(
    page.getByRole("button", { name: "Open account" }),
  ).toBeFocused();
  passed.push("account dialog has no browser import action and returns focus");
  await page
    .getByRole("button", { name: "Open Guest draft, 1 assets" })
    .click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Portfolio name", { exact: true })
    .fill("Unsaved offline edit");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.evaluate(() => window.__cloudQA.sessionFailure(true));
  await expect(page.getByText(/Unable to verify your session/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Unsaved offline edit", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => window.__cloudQA.sessionFailure(false));
  await expect(
    page.getByRole("heading", { name: "Unsaved offline edit", exact: true }),
  ).toBeVisible();
  passed.push(
    "failed session refresh hides private content while preserving unsaved edits",
  );
  await page.evaluate(() => window.__cloudQA.online(false));
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(
    page.getByText(/Nothing is queued or saved locally/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Unsaved offline edit", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("tikr-demo-v1"))).toBe(
    original,
  );
  await page.evaluate(() => window.__cloudQA.online(true));
  await page.evaluate(() => window.__cloudQA.fail("TRANSPORT_FAILURE"));
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByText(/Cloud saving failed/)).toBeVisible();
  passed.push(
    "offline and transport failure preserve edits with explicit retry and no local fallback",
  );
  await page.evaluate(() => window.__cloudQA.hold());
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => window.__cloudQA.release());
  await expect(
    page.getByRole("heading", { name: "Your experiments" }),
  ).toBeVisible();
  passed.push("pending save stays pending until acknowledgment");
  await page
    .getByRole("button", { name: "Open Unsaved offline edit, 1 assets" })
    .click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Portfolio name", { exact: true })
    .fill("My conflicting edits");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unpin", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Pin saved to your account/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.__cloudQA.rows().find((row) => row.clientId === "guestdraft")
          ?.definition.name,
    ),
  ).toBe("Unsaved offline edit");
  await expect(
    page.getByRole("heading", { name: "My conflicting edits", exact: true }),
  ).toBeVisible();
  passed.push("pin saves only pin state and preserves unrelated unsaved edits");
  await page.evaluate(() =>
    window.__cloudQA.remote("guestdraft", { name: "Remote edit" }),
  );
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(
    page.getByText(/changed in another tab or device/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "My conflicting edits", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load cloud version" }).click();
  await expect(
    page.getByRole("heading", { name: "Remote edit", exact: true }),
  ).toBeVisible();
  passed.push("stale revision preserves edits until explicit cloud reload");
  await page.evaluate(() => window.__cloudQA.deleted("guestdraft"));
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(page.getByText(/was deleted or is unavailable/)).toBeVisible();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Portfolio name", { exact: true })
    .fill("Recovered edits");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your experiments" }),
  ).toBeVisible();
  passed.push(
    "remote deletion cannot resurrect; explicit duplicate saves a new definition",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open account" }).click();
  await expect(
    page.getByRole("button", { name: /Import portfolios/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: join(artifacts, "mobile-account.png") });
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.__cloudQA.staleResponse("A");
    window.__cloudQA.account("B");
  });
  await expect(
    page.getByRole("button", { name: /Open Recovered edits/ }),
  ).toHaveCount(0);
  await page.evaluate(() => window.__cloudQA.staleResponse(""));
  await page.evaluate(() => window.__cloudQA.account("A"));
  await expect(
    page.getByRole("button", { name: /Open Recovered edits/ }),
  ).toBeVisible();
  await page.evaluate(() => window.__cloudQA.expiresAt(Date.now() + 150));
  await expect(
    page.getByText("Browser-local portfolios", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open Recovered edits/ }),
  ).toHaveCount(0);
  passed.push(
    "session expiration and mismatched JWT query results clear private views",
  );
  await page.evaluate(() => window.__cloudQA.account(""));
  await expect(
    page.getByText("Browser-local portfolios", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Open Legacy same name/ }),
  ).toHaveCount(2);
  expect(await page.evaluate(() => localStorage.getItem("tikr-demo-v1"))).toBe(
    original,
  );
  passed.push(
    "mobile account dialog, account switch and guest return never show A cloud records",
  );
  expect(errors).toEqual([]);
  await writeFile(
    join(artifacts, "report.json"),
    JSON.stringify({ synthetic: true, passed, errors }, null, 2),
  );
  console.log(JSON.stringify({ synthetic: true, passed, artifacts }, null, 2));
} finally {
  await browser?.close();
  await server.close();
}
