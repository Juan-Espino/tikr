import { chromium, expect } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = process.env.TIKR_QA_URL ?? "http://127.0.0.1:5010";
const artifacts = await mkdtemp(join(tmpdir(), "tikr-autocreate-"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const definition = {
  id: "automatic-qa",
  name: "Automatic QA",
  amount: "10000",
  range: "1W",
  rangeChoice: "default",
  manual: false,
  pinned: false,
  holdings: [{ ticker: "SPY", weight: "100.00" }],
  updated: 1,
};
const contexts = [];
async function pageFor(width = 1440) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  contexts.push(context);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Base UI:"))
      errors.push(message.text());
  });
  await page.route("**/api/assets**", (r) =>
    r.fulfill({
      json: [{ ticker: "MSFT", name: "Microsoft", exchange: "Sample" }],
      headers: { "X-Tikr-Catalog": "sample" },
    }),
  );
  await page.goto(base);
  await page.waitForFunction(() => window.__portfolioStore?.ready);
  return page;
}
async function signed(page) {
  await page.evaluate(() => window.__cloudQA.account("A"));
  await page.waitForFunction(
    () => window.__portfolioStore.cloud && window.__portfolioStore.ready,
  );
}
async function open(page, patch = {}) {
  await page.evaluate((p) => window.__portfolioStore.open(p), {
    ...definition,
    ...patch,
  });
}
async function saved(page) {
  await page.waitForFunction(
    () =>
      window.__portfolioStore.draft?.revision !== undefined &&
      window.__portfolioStore.autosaveStatus?.state === "saved",
  );
}
async function change(page, patch) {
  await page.evaluate(
    (p) =>
      window.__portfolioStore.setDraft({
        ...window.__portfolioStore.draft,
        ...p,
      }),
    patch,
  );
}
try {
  for (const width of [1440, 390]) {
    const page = await pageFor(width);
    await signed(page);
    await open(page, { name: "", holdings: [] });
    await change(page, { name: "Name only" });
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => window.__cloudQA.rows().length)).toBe(0);
    await change(page, { holdings: definition.holdings });
    await saved(page);
    if (await page.getByRole("dialog").count())
      await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Create in account", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "All portfolios", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Open Name only, 1 assets" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Resume draft:/ }),
    ).toHaveCount(0);
    await page.screenshot({ path: join(artifacts, `dashboard-${width}.png`) });
  }
  {
    const page = await pageFor(390);
    await signed(page);
    await open(page, { name: "", holdings: [] });
    await page
      .getByLabel("Portfolio name", { exact: true })
      .fill("Leave before Done");
    await page.getByLabel("Search assets", { exact: true }).fill("MSFT");
    await page.evaluate(() => window.__cloudQA.hold());
    await page
      .getByRole("button", { name: "MSFT, Microsoft", exact: true })
      .click();
    await page.waitForFunction(
      () => window.__portfolioStore.autosaveStatus?.state === "saving",
    );
    await page
      .getByRole("button", { name: "Close editor", exact: true })
      .click();
    await page
      .getByRole("button", { name: "All portfolios", exact: true })
      .click();
    await page.evaluate(() => window.__cloudQA.release());
    await expect(
      page.getByRole("button", { name: "Open Leave before Done, 1 assets" }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(1);
  }
  {
    const page = await pageFor();
    await open(page);
    await change(page, { name: "Guest latest", amount: "12345" });
    await signed(page);
    await saved(page);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Guest latest");
    expect(
      await page.evaluate(() => localStorage.getItem("tikr-trial-v1")),
    ).toBeNull();
    await page.evaluate(() => window.__cloudQA.account("B"));
    await expect(
      page.getByRole("heading", { name: "Portfolio not found" }),
    ).toBeVisible();
  }
  {
    const page = await pageFor();
    await open(page);
    await page.evaluate(() => window.__cloudQA.hold());
    await signed(page);
    await page.waitForFunction(
      () => window.__portfolioStore.autosaveStatus?.state === "saving",
    );
    await change(page, { name: "Recovery during create", amount: "12346" });
    await page.evaluate(() => {
      window.__cloudQA.hold();
      window.__cloudQA.release();
    });
    await page.waitForFunction(() => window.__cloudQA.writes().length === 2);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("tikr-trial-v1")).draft.amount,
      ),
    ).toBe("12346");
    await change(page, { amount: "12347" });
    await page.evaluate(() => window.__cloudQA.release());
    await saved(page);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.amount),
    ).toBe("12347");
    expect(
      await page.evaluate(() => localStorage.getItem("tikr-trial-v1")),
    ).toBeNull();
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.hold());
    await open(page);
    await page.waitForFunction(
      () => window.__portfolioStore.autosaveStatus?.state === "saving",
    );
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page
      .getByLabel("Portfolio name", { exact: true })
      .fill("Latest during creation");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.evaluate(() => window.__cloudQA.release());
    await saved(page);
    expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(1);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Latest during creation");
    expect(
      await page.evaluate(
        () =>
          window.__cloudQA.writes().filter((w) => w.revision === undefined)
            .length,
      ),
    ).toBe(1);
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.loseAck());
    await open(page);
    await page.waitForFunction(
      () => window.__portfolioStore.autosaveStatus?.state === "error",
    );
    await change(page, { name: "Newest after lost ack" });
    await saved(page);
    expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(1);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Newest after lost ack");
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.online(false));
    await open(page);
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(0);
    await change(page, { name: "Offline latest" });
    await page.evaluate(() => window.__cloudQA.online(true));
    await saved(page);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Offline latest");
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.fail("NAME_CONFLICT"));
    await open(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByLabel("Portfolio name", { exact: true })
      .fill("Resolved name");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await saved(page);
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Resolved name");
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.hold());
    await open(page);
    await page.waitForFunction(
      () => window.__portfolioStore.autosaveStatus?.state === "saving",
    );
    await page.evaluate(() => window.__cloudQA.account("B"));
    await page.evaluate(() => window.__cloudQA.release());
    await expect(
      page.getByRole("heading", { name: "Portfolio not found" }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__cloudQA.rows())).toHaveLength(0);
  }
  {
    const page = await pageFor();
    await signed(page);
    await open(page);
    await saved(page);
    await page.evaluate((p) => {
      localStorage.setItem(
        "tikr-trial-v1",
        JSON.stringify({
          version: 1,
          owner: "A",
          draft: { ...p, name: "Different recovery" },
        }),
      );
      window.__cloudQA.account("B");
    }, definition);
    await page.evaluate(() => window.__cloudQA.account("A"));
    await expect(
      page.getByRole("button", { name: "Load cloud version" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => window.__cloudQA.rows()[0].definition.name),
    ).toBe("Automatic QA");
  }
  {
    const page = await pageFor();
    await signed(page);
    await page.evaluate(() => window.__cloudQA.fail("REVISION_CONFLICT"));
    await open(page);
    await expect(
      page.getByRole("button", { name: "Duplicate", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Duplicate", exact: true }).click();
    await saved(page);
    expect(
      await page.evaluate(() => window.__portfolioStore.draft.id),
    ).not.toBe("automatic-qa");
    expect(
      await page.evaluate(() =>
        window.__cloudQA.rows().some((r) => r.clientId === "automatic-qa"),
      ),
    ).toBe(false);
  }
  // The hero/canvas must survive auth readiness and guest -> account replacement.
  {
    const page = await pageFor();
    await page.goto(base + "/?landing-qa");
    await expect(page.locator(".hero-headline")).toBeVisible();
    await page.evaluate(() => {
      window.__heroNode = document.querySelector(".hero-headline");
      window.__canvasNode = document.querySelector("canvas");
      window.__cloudQA.pending(true);
    });
    await page.evaluate(() => window.__cloudQA.pending(false));
    await page.evaluate(() => window.__cloudQA.account("A"));
    await page.waitForFunction(
      () => window.__portfolioStore.cloud && window.__portfolioStore.ready,
    );
    expect(
      await page.evaluate(
        () =>
          window.__heroNode === document.querySelector(".hero-headline") &&
          window.__canvasNode === document.querySelector("canvas"),
      ),
    ).toBe(true);
    await page.evaluate(() => window.__cloudQA.account(""));
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
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
    expect(new Set(styles).size).toBe(1);
    await page.screenshot({ path: join(artifacts, "landing.png") });
  }
  {
    const page = await pageFor();
    await page.goto(base + "/?chart-qa");
    const compact = page.locator(".history-chart").first();
    const full = page.locator(".history-chart").nth(1);
    await expect(compact.locator(".recharts-wrapper")).toBeVisible();
    await compact.locator(".recharts-wrapper").hover({ force: true });
    await expect(compact.locator(".recharts-active-dot")).toHaveCount(0);
    await expect(compact.locator(".recharts-tooltip-wrapper")).toHaveCount(0);
    await full
      .locator(".recharts-wrapper")
      .hover({ position: { x: 300, y: 100 } });
    await expect(full.locator(".recharts-tooltip-wrapper")).toBeVisible();
  }
  expect(errors).toEqual([]);
  console.log(
    `PASS automatic creation/recovery, desktop/mobile, queue/lost ack/offline/conflict/account fences, stable hero and header typography. ${artifacts}`,
  );
} finally {
  for (const c of contexts) await c.close();
  await browser.close();
}
