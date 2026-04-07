import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  testMatch: ["apps/*/e2e/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace=apps/marketing",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env["CI"],
      timeout: 120_000,
    },
    {
      command: "npm run dev --workspace=apps/portal",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env["CI"],
      timeout: 120_000,
    },
  ],
});
