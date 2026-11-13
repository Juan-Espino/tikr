import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "market.spec.ts",
  workers: 1,
  timeout: 45000,
  reporter: "list",
  outputDir: process.env.TIKR_BROWSER_OUTPUT ?? "test-results",
  use: {
    baseURL: process.env.TIKR_BROWSER_BASE_URL ?? "http://127.0.0.1:43127",
    headless: true,
    channel: "msedge",
  },
});
