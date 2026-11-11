import { test, expect } from "@playwright/test";
const portfolio = {
  id: "test-one",
  name: "Core experiment",
  holdings: [{ ticker: "SPY", weight: "100" }],
  manual: false,
  pinned: false,
  updated: 1,
  amount: "10000",
  range: "1Y",
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (p) =>
      localStorage.setItem(
        "tikr-demo-v1",
        JSON.stringify({
          version: 1,
          portfolios: [
            p,
            {
              ...p,
              id: "test-two",
              name: "Second portfolio",
              amount: "750",
              range: "5Y",
            },
          ],
          draft: p,
        }),
      ),
    portfolio,
  );
});
const sample = (status = "ready") => ({
  status,
  asOf: "2024-11-04",
  dataCheckedAt: "2024-11-05T14:00:00Z",
  period: { start: "2024-11-01", end: "2024-11-04" },
  series: ["test-one", "SPY"].map((id) => ({
    id,
    ending: "11000.00",
    change: "1000.00",
    totalReturn: "10.00",
    difference: "0.00",
    drawdown: "0.00",
    points: [
      { date: "2024-11-01", value: 10000, dollars: "10000.00", growth: "0.00" },
      {
        date: "2024-11-04",
        value: 11000,
        dollars: "11000.00",
        growth: "10.00",
      },
    ],
  })),
});

test("market admission errors distinguish browsing, cooldown, shared budget and missing history", async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [code, message] of [
      ["BROWSING_RATE_LIMIT", "Browsing is temporarily rate limited"],
      ["REFRESH_COOLDOWN", "Market history refresh is cooling down"],
      ["SHARED_BUDGET_EXHAUSTED", "The shared market-data budget is exhausted"],
      ["MISSING_PRICE", "Required market history is missing"],
    ]) {
      await page.route("**/api/market", (route) =>
        route.fulfill({
          status:
            code === "BROWSING_RATE_LIMIT" || code === "REFRESH_COOLDOWN"
              ? 429
              : 503,
          contentType: "application/json",
          body: JSON.stringify({
            status: "blocked",
            code,
            retryAt: Date.now() + 60000,
          }),
        }),
      );
      await page.goto("/portfolio/test-one");
      await expect(
        page.getByRole("status").filter({ hasText: message! }),
      ).toBeVisible();
      await expect(page.getByText(/Retry after/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Retry data check" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.unroute("**/api/market");
    }
  }
});

test("a refresh budget failure retains a dated stale result and its explanation", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body:
        JSON.stringify({
          ...sample("stale"),
          code: "SHARED_BUDGET_EXHAUSTED",
        }) + "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByText("The shared market-data budget is exhausted.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Showing the last verified result.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Market data as of 2024-11-04/)).toBeVisible();
  await expect(
    page.getByText("$11,000.00", { exact: true }).first(),
  ).toBeVisible();
});
test("duplicate names block saving and duplication waits for a user-chosen name", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(sample()) + "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const input = page.getByLabel("Portfolio name", { exact: true });
  await input.fill("  SECOND PORTFOLIO  ");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveCSS("border-color", "rgb(248, 113, 113)");
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeDisabled();
  await expect(input).toHaveValue("  SECOND PORTFOLIO  ");
  await input.fill("Core experiment");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save locally", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.getByLabel("Portfolio name", { exact: true })).toHaveValue(
    "Core experiment",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("tikr-demo-v1")!).portfolios.length,
    ),
  ).toBe(2);
  await page
    .getByLabel("Portfolio name", { exact: true })
    .fill("My chosen copy");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tikr-demo-v1")!).portfolios.map(
        (p: { name: string }) => p.name,
      ),
    ),
  ).toEqual(
    expect.arrayContaining([
      "Core experiment",
      "Second portfolio",
      "My chosen copy",
    ]),
  );
});
test("saving changed holdings replaces the failed card and keeps other portfolios separate", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const data = JSON.parse(localStorage.getItem("tikr-demo-v1")!);
    data.portfolios[0].holdings = [{ ticker: "NVDA", weight: "100" }];
    data.draft = data.portfolios[0];
    localStorage.setItem("tikr-demo-v1", JSON.stringify(data));
  });
  await page.route("**/api/market", async (route) => {
    const request = route.request().postDataJSON();
    const p = request.portfolios[0];
    const reply = p.holdings.some(
      (h: { symbol: string }) => h.symbol === "NVDA",
    )
      ? {
          status: "blocked",
          issues: [{ symbol: "NVDA", code: "REFRESH_FAILED" }],
        }
      : {
          ...sample(),
          series: sample().series.map((s, i) => ({
            ...s,
            id: i === 0 ? p.id : "SPY",
          })),
        };
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(reply) + "\n",
    });
  });
  await page.goto("/dashboard");
  const card = page.getByRole("button", {
    name: "Open Core experiment, 1 assets",
    exact: true,
  });
  await expect(card.getByText("Affected holdings: NVDA")).toBeVisible();
  await card.click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Remove NVDA", exact: true }).click();
  await page.route("**/api/assets?*", (route) =>
    route.fulfill({
      json: [{ ticker: "SPY", name: "Synthetic SPY", exchange: "ARCA" }],
    }),
  );
  await page.getByRole("textbox", { name: "Search assets" }).fill("SPY");
  await page.getByRole("button", { name: /^SPY, / }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(card.getByText("1 asset · SPY", { exact: true })).toBeVisible();
  await expect(card.getByText("10.00%", { exact: true })).toBeVisible();
  await expect(card.getByText("Affected holdings: NVDA")).toHaveCount(0);
});
test("timeframe picker hides Max while migrating a saved Max selection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const data = JSON.parse(localStorage.getItem("tikr-demo-v1")!);
    data.portfolios[0].range = "Max";
    data.draft = data.portfolios[0];
    localStorage.setItem("tikr-demo-v1", JSON.stringify(data));
  });
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(sample()) + "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByRole("button", { name: "Timeframe: 5Y" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Timeframe: 5Y" }).hover();
  await expect(
    page.getByRole("button", { name: "Set timeframe to Max" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Set timeframe to 1Y" }),
  ).toBeVisible();
});
test("unconfigured real endpoint blocks without inventing returns", async ({
  page,
}) => {
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByText(
      "Verified market data is unavailable. No estimated returns are shown.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry data check" }),
  ).toBeVisible();
  await expect(page.getByText("Ending value", { exact: true })).toHaveCount(0);
});
test("ready and stale states show exact metrics, common dates and accessible daily table", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(sample("stale")) + "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByText("$11,000.00", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Showing the last verified result; newer data is unavailable.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/Market data as of 2024-11-04/)).toBeVisible();
  await expect(
    page.getByText("View daily values", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: "$11,000.00", exact: true }),
  ).toHaveCount(2);
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/market")) requests.push(r.postData() ?? "");
  });
  await page.getByRole("button", { name: "Retry data check" }).click();
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(JSON.parse(requests[0]!).retry).toBe(true);
});
test("an obsolete response cannot replace a changed timeframe", async ({
  page,
}) => {
  await page.route("**/api/market", async (route) => {
    const body = route.request().postDataJSON() as { range: string };
    if (body.range === "1Y") {
      await new Promise((r) => setTimeout(r, 900));
      await route
        .fulfill({
          contentType: "application/x-ndjson",
          body: JSON.stringify(sample()) + "\n",
        })
        .catch(() => undefined);
    } else
      await route.fulfill({
        contentType: "application/x-ndjson",
        body: '{"status":"blocked","code":"NEW_RANGE_UNAVAILABLE"}\n',
      });
  });
  await page.goto("/portfolio/test-one");
  await page.waitForTimeout(400);
  const timeframe = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await timeframe.focus();
  await timeframe.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(
    page.getByText(
      "Verified market data is unavailable. No estimated returns are shown.",
    ),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText("Ending value", { exact: true })).toHaveCount(0);
});
test("local endpoint rejects foreign origins and oversized requests", async ({
  request,
}) => {
  const foreign = await request.post("/api/market", {
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    data: {},
  });
  expect(foreign.status()).toBe(403);
  const huge = await request.post("/api/market", {
    headers: {
      Origin: "http://127.0.0.1:43127",
      "Content-Type": "application/json",
    },
    data: "x".repeat(12001),
  });
  expect(huge.status()).toBe(413);
});
for (const width of [390, 768, 1440])
  test(`layout at ${width}px preserves blocked state without horizontal overflow`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/portfolio/test-one");
    await expect(
      page.getByText("Market history unavailable", { exact: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`portfolio-${width}.png`),
      fullPage: true,
    });
    await page.goto("/dashboard");
    await expect(
      page.getByText("Market history unavailable", { exact: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`dashboard-${width}.png`),
      fullPage: true,
    });
  });

test("evidence expiry removes an already displayed result", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body:
        JSON.stringify({
          ...sample(),
          evidenceExpiresAt: new Date(Date.now() + 1500).toISOString(),
        }) + "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Verified market data is unavailable. No estimated returns are shown.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Ending value", { exact: true })).toHaveCount(0);
});
test("loading shows no invented chart and the final ready result keeps guest draft", async ({
  page,
}) => {
  await page.route("**/api/market", async (route) => {
    await new Promise((r) => setTimeout(r, 700));
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(sample()) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Loading history…", { exact: true })).toHaveCount(
    1,
  );
  await expect(page.locator(".market-pulse").first()).toBeVisible();
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("tikr-demo-v1") ?? "{}").draft,
  );
  expect(stored.id).toBe("test-one");
  expect(stored.amount).toBe("10000");
});
test("selected portfolio comparison uses the active amount and one request period", async ({
  page,
}) => {
  const requests: {
    portfolios: { id: string }[];
    amount: string;
    range: string;
  }[] = [];
  await page.route("**/api/market", (route) => {
    const input = route.request().postDataJSON();
    requests.push(input);
    const out = sample();
    out.series = [
      ...input.portfolios.map((p: { id: string }) => ({
        ...out.series[0],
        id: p.id,
      })),
      out.series[1],
    ];
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  await page
    .getByRole("button", { name: "Second portfolio", exact: true })
    .click();
  await expect
    .poll(() => requests.some((r) => r.portfolios.length === 2))
    .toBe(true);
  const compared = [...requests]
    .reverse()
    .find((r) => r.portfolios.length === 2)!;
  expect(compared.amount).toBe("10000");
  expect(compared.range).toBe("1Y");
  await expect(
    page.getByText("Second portfolio · comparison", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Second portfolio", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("retry applies once and a later timeframe edit is an automatic request", async ({
  page,
}) => {
  const requests: { range: string; retry: boolean }[] = [];
  await page.route("**/api/market", (r) => {
    requests.push(r.request().postDataJSON());
    return r.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"status":"blocked"}',
    });
  });
  await page.goto("/portfolio/test-one");
  await page.getByRole("button", { name: "Retry data check" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]!.retry).toBe(true);
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2]!.retry).toBe(false);
});
test("clicking the body of a dashboard card opens the portfolio", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const card = page.getByRole("button", {
    name: "Open Core experiment, 1 assets",
    exact: true,
  });
  await expect(card).toBeVisible();
  await card.click({ position: { x: 120, y: 180 } });
  await expect(page).toHaveURL(/portfolio\/test-one$/);
});
test("a truncated refreshing stream cannot leave an endless loading result", async ({
  page,
}) => {
  await page.route("**/api/market", (r) =>
    r.fulfill({
      contentType: "application/x-ndjson",
      body: '{"status":"refreshing"}\n',
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByText(
      "Verified market data is unavailable. No estimated returns are shown.",
    ),
  ).toBeVisible();
});

test("streamed refresh waits for a final result before showing values", async ({
  page,
}) => {
  await page.addInitScript((data) => {
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      if (input !== "/api/market") return original(input, init);
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ ...data, status: "refreshing" }) + "\n",
              ),
            );
            setTimeout(() => {
              controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
              controller.close();
            }, 1200);
          },
        }),
        { headers: { "Content-Type": "application/x-ndjson" } },
      );
    };
  }, sample());
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Loading history…", { exact: true })).toHaveCount(
    1,
  );
  await expect(page.getByText("Ending value", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Market data as of 2024-11-04/)).toBeVisible();
  await expect(
    page.getByText(
      "Alpaca SIP daily closes · dividends reinvested on payment date",
    ),
  ).toBeVisible();
});

test("timeframe and comparison changes retain the previous result while loading", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/market", async (route) => {
    const input = route.request().postDataJSON() as {
      range: string;
      portfolios: { id: string }[];
    };
    if (input.range !== "1Y" || input.portfolios.length > 1) await gate;
    const out = sample();
    out.series = [
      ...input.portfolios.map((p) => ({ ...out.series[0]!, id: p.id })),
      out.series[1]!,
    ];
    await route
      .fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify(out) + "\n",
      })
      .catch(() => undefined);
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const chart = page.locator(".history-chart").first();
  const before = await chart.boundingBox();
  const timeframe = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await timeframe.focus();
  await timeframe.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toBeVisible();
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const during = await chart.boundingBox();
  expect(during?.height).toBe(before?.height);
  release?.();
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toHaveCount(0);
  gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page
    .getByRole("button", { name: "Second portfolio", exact: true })
    .click();
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toBeVisible();
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  expect((await chart.boundingBox())?.height).toBe(before?.height);
  release?.();
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toHaveCount(0);
});

test("dashboard updates all cards together and pulses only changing content", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let secondWaiting = false;
  await page.route("**/api/market", async (route) => {
    const input = route.request().postDataJSON() as {
      range: string;
      portfolios: { id: string }[];
    };
    if (input.range === "1M" && input.portfolios[0]?.id === "test-two") {
      secondWaiting = true;
      await gate;
    }
    const out = sample();
    out.series[0]!.id = input.portfolios[0]!.id;
    if (input.range === "1M") out.series[0]!.totalReturn = "20.00";
    await route
      .fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify(out) + "\n",
      })
      .catch(() => undefined);
  });
  await page.goto("/dashboard");
  const cards = page.locator(
    "button[aria-label^='Open '][aria-label$='assets']",
  );
  await expect(cards).toHaveCount(2);
  await expect(cards.first().getByText("10.00%")).toBeVisible();
  await expect(cards.nth(1).getByText("10.00%")).toBeVisible();
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect.poll(() => secondWaiting).toBe(true);
  await expect(cards.first().getByText("10.00%")).toBeVisible();
  await expect(cards.nth(1).getByText("10.00%")).toBeVisible();
  await expect(cards.first().locator(".market-pulse")).toHaveCount(3);
  await expect(cards.first().getByRole("heading")).not.toHaveClass(
    /market-pulse/,
  );
  release?.();
  await expect(cards.first().getByText("20.00%")).toBeVisible();
  await expect(cards.nth(1).getByText("20.00%")).toBeVisible();
  await expect(cards.first().locator(".market-pulse")).toHaveCount(0);
});

test("comparison colors match the buttons and removed lines animate out", async ({
  page,
}) => {
  await page.route("**/api/market", (route) => {
    const input = route.request().postDataJSON() as {
      portfolios: { id: string }[];
    };
    const out = sample();
    out.series = [
      ...input.portfolios.map((p) => ({ ...out.series[0]!, id: p.id })),
      out.series[1]!,
    ];
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  const button = page.getByRole("button", {
    name: "Second portfolio",
    exact: true,
  });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  await expect(button.locator("span").first()).toHaveCSS(
    "color",
    "rgb(145, 184, 208)",
  );
  await button.click();
  await expect(page.locator(".chart-line-exiting")).toHaveCount(1);
  await expect(page.locator(".chart-line-exiting")).toHaveCount(0, {
    timeout: 3000,
  });
});

test("reduced motion disables the loading pulse", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/market", async (route) => {
    const input = route.request().postDataJSON() as { range: string };
    if (input.range !== "1Y")
      await new Promise((resolve) => setTimeout(resolve, 800));
    await route
      .fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify(sample()) + "\n",
      })
      .catch(() => undefined);
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(page.locator(".market-pulse").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("a failed dashboard card does not prevent other results from updating", async ({
  page,
}) => {
  await page.route("**/api/market", (route) => {
    const input = route.request().postDataJSON() as {
      range: string;
      portfolios: { id: string }[];
    };
    if (input.range === "1M" && input.portfolios[0]?.id === "test-two")
      return route.fulfill({
        contentType: "application/x-ndjson",
        body:
          JSON.stringify({ status: "blocked", code: "DATA_UNAVAILABLE" }) +
          "\n",
      });
    const out = sample();
    out.series[0]!.id = input.portfolios[0]!.id;
    if (input.range === "1M") out.series[0]!.totalReturn = "20.00";
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/dashboard");
  const cards = page.locator(
    "button[aria-label^='Open '][aria-label$='assets']",
  );
  await expect(cards.first().getByText("10.00%")).toBeVisible();
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(cards.first().getByText("20.00%")).toBeVisible();
  await expect(
    cards.nth(1).getByText("Market history unavailable"),
  ).toBeVisible();
  await expect(cards.first().locator(".market-pulse")).toHaveCount(0);
});

test("dashboard releases completed cards after the bounded wait", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/market", async (route) => {
    const input = route.request().postDataJSON() as {
      range: string;
      portfolios: { id: string }[];
    };
    if (input.range === "1M" && input.portfolios[0]?.id === "test-two")
      await gate;
    const out = sample();
    out.series[0]!.id = input.portfolios[0]!.id;
    if (input.range === "1M") out.series[0]!.totalReturn = "20.00";
    await route
      .fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify(out) + "\n",
      })
      .catch(() => undefined);
  });
  await page.goto("/dashboard");
  const cards = page.locator(
    "button[aria-label^='Open '][aria-label$='assets']",
  );
  await expect(cards.first().getByText("10.00%")).toBeVisible();
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(cards.first().getByText("20.00%")).toBeVisible({
    timeout: 12000,
  });
  await expect(
    cards.nth(1).getByText("Market history unavailable"),
  ).toBeVisible();
  release?.();
  await expect(cards.nth(1).getByText("20.00%")).toBeVisible();
});

test("intermediate streams cannot replace the previous snapshot", async ({
  page,
}) => {
  await page.addInitScript((data) => {
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      if (input !== "/api/market") return original(input, init);
      const request = JSON.parse(String(init?.body)) as {
        portfolios: { id: string }[];
      };
      const final = structuredClone(data);
      final.series = [
        ...request.portfolios.map((p) => ({ ...data.series[0]!, id: p.id })),
        data.series[1]!,
      ];
      const interim = structuredClone(final);
      interim.series[0]!.totalReturn = "77.00";
      interim.series[0]!.ending = "17700.00";
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ ...interim, status: "refreshing" }) + "\n",
              ),
            );
            setTimeout(() => {
              controller.enqueue(encoder.encode(JSON.stringify(final) + "\n"));
              controller.close();
            }, 1000);
          },
        }),
        { headers: { "Content-Type": "application/x-ndjson" } },
      );
    };
  }, sample());
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("10.00%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Second portfolio", exact: true })
    .click();
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toBeVisible();
  await expect(page.getByText("10.00%", { exact: true })).toBeVisible();
  await expect(page.getByText("77.00%", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Refreshing; showing the last verified result."),
  ).toHaveCount(0);
  await expect(page.getByText("10.00%", { exact: true })).toBeVisible();
});

test("only marked synthetic results are reused for repeat comparisons", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/market", (route) => {
    calls++;
    const input = route.request().postDataJSON() as {
      portfolios: { id: string }[];
    };
    const out = sample();
    out.series = [
      ...input.portfolios.map((p) => ({ ...out.series[0]!, id: p.id })),
      out.series[1]!,
    ];
    return route.fulfill({
      headers: {
        "Content-Type": "application/x-ndjson",
        "X-Tikr-Synthetic-Review": "1",
      },
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const button = page.getByRole("button", {
    name: "Second portfolio",
    exact: true,
  });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  expect(calls).toBe(2);
  await button.click();
  await expect(page.locator(".chart-line-exiting")).toHaveCount(1);
  await expect(page.locator(".chart-line-exiting")).toHaveCount(0, {
    timeout: 3000,
  });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  expect(calls).toBe(2);
});

test("unmarked responses always recheck the server on repeat selections", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/market", (route) => {
    calls++;
    const input = route.request().postDataJSON() as {
      portfolios: { id: string }[];
    };
    const out = sample();
    out.series = [
      ...input.portfolios.map((p) => ({ ...out.series[0]!, id: p.id })),
      out.series[1]!,
    ];
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("Ending value", { exact: true })).toBeVisible();
  const button = page.getByRole("button", {
    name: "Second portfolio",
    exact: true,
  });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(0, { timeout: 4000 });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  expect(calls).toBe(4);
});

test("main metrics remain stable for matching dates and change for a shorter shared period", async ({
  page,
}) => {
  await page.route("**/api/market", (route) => {
    const input = route.request().postDataJSON() as {
      range: string;
      portfolios: { id: string }[];
    };
    const out = sample();
    out.series = [
      ...input.portfolios.map((p) => ({ ...out.series[0]!, id: p.id })),
      out.series[1]!,
    ];
    if (input.portfolios.length > 1 && input.range === "1M") {
      out.period.start = "2024-11-04";
      out.series[0]!.totalReturn = "3.00";
      out.series[0]!.drawdown = "-2.00";
      out.series[0]!.ending = "10300.00";
      out.series[0]!.difference = "1.00";
    }
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify(out) + "\n",
    });
  });
  await page.goto("/portfolio/test-one");
  await expect(page.getByText("10.00%", { exact: true })).toBeVisible();
  const button = page.getByRole("button", {
    name: "Second portfolio",
    exact: true,
  });
  await button.click();
  await expect(
    page.locator(".recharts-line path[stroke='#91b8d0']"),
  ).toHaveCount(1);
  await expect(page.getByText("10.00%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("$11,000.00", { exact: true }).first(),
  ).toBeVisible();
  const picker = page.getByRole("button", {
    name: "Timeframe: 1Y",
    exact: true,
  });
  await picker.focus();
  await picker.press("ArrowRight");
  await page
    .getByRole("button", { name: "Set timeframe to 1M", exact: true })
    .click();
  await expect(page.getByText("3.00%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("$10,300.00", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(/2024-11-04 – 2024-11-04/)).toBeVisible();
});

test("provisional quality is visible in the workspace and compact dashboard", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body:
        JSON.stringify({ ...sample(), dataQuality: "personal-provisional" }) +
        "\n",
    }),
  );
  await page.goto("/portfolio/test-one");
  await expect(
    page.getByText(/Personal provisional Alpaca data/),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page.getByText(/Personal provisional Alpaca data/).first(),
  ).toBeVisible();
});

test("catalog search debounces, ignores superseded responses, supports keyboard selection and equal weights", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({ json: sample() }),
  );
  let calls = 0;
  await page.route("**/api/assets?*", async (route) => {
    calls++;
    const q = new URL(route.request().url()).searchParams.get("q");
    if (q === "old") await new Promise((r) => setTimeout(r, 500));
    await route
      .fulfill({
        json:
          q === "none"
            ? []
            : [
                {
                  ticker: q === "old" ? "OLD" : "NEW",
                  name: "New synthetic company",
                  exchange: "NASDAQ",
                },
              ],
      })
      .catch(() => {});
  });
  await page.goto("/portfolio/test-one");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Search assets" });
  await expect(page.getByText("Enter a ticker or company name.")).toBeVisible();
  await input.fill("old");
  await page.waitForTimeout(220);
  await input.fill("new");
  const result = page.getByRole("button", {
    name: "NEW, New synthetic company",
    exact: true,
  });
  await expect(result).toBeVisible();
  await page.waitForTimeout(550);
  await expect(
    page.getByRole("button", {
      name: "OLD, New synthetic company",
      exact: true,
    }),
  ).toHaveCount(0);
  await result.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "NEW allocation percent" }),
  ).toHaveValue("50.00");
  await expect(
    page.getByRole("textbox", { name: "SPY allocation percent" }),
  ).toHaveValue("50.00");
  await expect(result).toHaveAttribute("aria-pressed", "true");
  await input.fill("none");
  await expect(page.getByText("No matching assets.")).toBeVisible();
  expect(calls).toBe(3);
  await page.route("**/api/assets?*", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await input.fill("error");
  await expect(
    page.getByText("Asset search unavailable. Try again later."),
  ).toBeVisible();
});

test("credential-free demo search is labeled and supports touch selection", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.addInitScript(
    (p) =>
      localStorage.setItem(
        "tikr-demo-v1",
        JSON.stringify({ version: 1, portfolios: [p], draft: p }),
      ),
    portfolio,
  );
  await page.route("**/api/market", (route) =>
    route.fulfill({ json: sample() }),
  );
  await page.goto("http://127.0.0.1:43127/portfolio/test-one");
  await page.getByRole("button", { name: "Edit", exact: true }).tap();
  await page.getByRole("textbox", { name: "Search assets" }).fill("Apple");
  await expect(
    page.getByText(
      "Sample catalog: six demo assets; market data is not configured",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "AAPL, Apple Inc.", exact: true })
    .tap();
  await expect(
    page.getByRole("textbox", { name: "AAPL allocation percent" }),
  ).toHaveValue("50.00");
  await context.close();
});
test("six-holding limit is announced; rate limit shows timing and search retry recovers", async ({
  page,
}) => {
  await page.addInitScript((p) => {
    p.holdings = ["SPY", "AAPL", "MSFT", "NVDA", "AMZN", "SCHD"].map(
      (ticker, i) => ({ ticker, weight: i === 5 ? "16.65" : "16.67" }),
    );
    localStorage.setItem(
      "tikr-demo-v1",
      JSON.stringify({ version: 1, portfolios: [p], draft: p }),
    );
  }, portfolio);
  await page.route("**/api/market", (route) =>
    route.fulfill({ json: sample() }),
  );
  let limited = true;
  await page.route("**/api/assets?*", (route) =>
    limited
      ? route.fulfill({
          status: 429,
          json: { code: "BROWSING_RATE_LIMIT", retryAt: Date.now() + 1000 },
        })
      : route.fulfill({
          json: [{ ticker: "NEW", name: "New company", exchange: "NASDAQ" }],
        }),
  );
  await page.goto("/portfolio/test-one");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("textbox", { name: "Search assets" }).fill("NEW");
  await expect(
    page.getByText(/Search is temporarily rate limited/),
  ).toBeVisible();
  await expect(page.getByText(/Six holdings maximum/)).toBeVisible();
  limited = false;
  await page.getByRole("button", { name: "Retry search" }).click();
  const result = page.getByRole("button", {
    name: "NEW, New company",
    exact: true,
  });
  await expect(result).toBeDisabled();
  await page.getByRole("button", { name: "Remove SCHD", exact: true }).click();
  await expect(result).toBeEnabled();
});

for (const width of [390, 1440]) {
  test(`catalog failure messages distinguish stages at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/market", (route) =>
      route.fulfill({ json: sample() }),
    );
    let code = "CATALOG_PROVIDER";
    await page.route("**/api/assets?*", (route) =>
      route.fulfill({
        status: code === "REFRESH_COOLDOWN" ? 429 : 503,
        json: {
          code,
          ...(code === "REFRESH_COOLDOWN"
            ? { retryAt: Date.now() + 60000 }
            : {}),
        },
      }),
    );
    await page.goto("/portfolio/test-one");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("textbox", { name: "Search assets" }).fill("NEW");
    await expect(
      page.getByText(/The catalog provider could not complete/),
    ).toBeVisible();
    for (const [next, message] of [
      ["CATALOG_INVALID", /Catalog validation failed/],
      ["CATALOG_LIMIT", /Catalog import exceeded/],
      ["STORAGE_CAPACITY", /Market-data storage capacity/],
      ["REFRESH_COOLDOWN", /Catalog refresh is cooling down.*Try again after/],
    ]) {
      code = next as string;
      await page.getByRole("button", { name: "Retry search" }).click();
      await expect(page.getByText(message as RegExp)).toBeVisible();
    }
  });
}

test("literal PLTR sample search and malformed successful responses are not live matches", async ({
  page,
}) => {
  await page.route("**/api/market", (route) =>
    route.fulfill({ status: 503, json: { code: "DATA_UNAVAILABLE" } }),
  );
  let malformed = false;
  await page.route("**/api/assets?*", (route) =>
    route.fulfill({
      status: 200,
      headers: { "X-Tikr-Catalog": "sample" },
      json: malformed ? { results: [] } : [],
    }),
  );
  await page.goto("/portfolio/test-one");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("textbox", { name: "Search assets" }).fill("PLTR");
  await expect(
    page.getByText(/No matches in the six-asset sample catalog/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /PLTR, Palantir/ }),
  ).toHaveCount(0);
  malformed = true;
  await page.getByRole("textbox", { name: "Search assets" }).fill("Palantir");
  await expect(
    page.getByText("Asset search unavailable. Try again later."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry search" }),
  ).toBeVisible();
});
