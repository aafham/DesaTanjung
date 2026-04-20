import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: process.env.PLAYWRIGHT_ENV_FILE || ".env.e2e.local",
});

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120 * 1000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
