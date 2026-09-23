import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Loads TELEGRAM_WEBHOOK_SECRET etc. for the specs; never overrides variables already set in the shell.
dotenv.config({ path: ".env", quiet: true });

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const TELEGRAM_MOCK_URL = "http://127.0.0.1:4141";

/**
 * Every run gets its own synthetic client IP so the in-memory rate limiter (5 lead posts / 10 min per IP)
 * never carries state between runs. `clientIp()` trusts X-Forwarded-For.
 */
const octet = () => 1 + Math.floor(Math.random() * 250);
export const RUN_IP = `10.${octet()}.${octet()}.${octet()}`;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /.*\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One shared dev server and one shared rate limiter: keep the run deterministic.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/.report" }]],
  outputDir: "tests/e2e/.results",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    extraHTTPHeaders: { "X-Forwarded-For": RUN_IP },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /a11y\.spec\.ts$/,
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      testMatch: /a11y\.spec\.ts$/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `${BASE_URL}/api/v1/public/health`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      TELEGRAM_BOT_TOKEN: "test-token",
      TELEGRAM_CHAT_ID: "424242",
      TELEGRAM_API_BASE: TELEGRAM_MOCK_URL,
      TELEGRAM_WEBHOOK_SECRET: "e2e-secret",
    },
  },
});
