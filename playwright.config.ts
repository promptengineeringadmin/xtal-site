import { defineConfig, devices } from "@playwright/test"

const merchantUrl =
  process.env.E2E_MERCHANT_URL ||
  "https://www.willowgroupltd.com/shop/?Search=baskets"

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  workers: 1,
  retries: 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/html-report", open: "never" }],
  ],
  use: {
    baseURL: merchantUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
      testMatch: "10-mobile.spec.ts",
    },
  ],
  outputDir: "e2e/test-results",
})
