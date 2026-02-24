import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for IntentBid E2E tests
 * @see https://playwright.dev/docs/test-configuration
 *
 * AI Safety: All E2E tests run with dummy AI API keys so that any
 * server-side AI SDK calls will auth-fail rather than hitting real
 * provider endpoints. Browser-side calls are blocked by the AI blocker
 * fixture (see __tests__/e2e/fixtures/ai-blocker.ts).
 */

/**
 * Dummy API keys that cause auth failures on every AI provider.
 * These prevent real AI calls from server-side code during E2E runs.
 * The AI blocker Playwright fixture handles browser-side blocking.
 */
const DUMMY_AI_ENV = {
  GEMINI_API_KEY: "test-mock-do-not-use",
  OPENAI_API_KEY: "test-mock-do-not-use",
  GROQ_API_KEY: "test-mock-do-not-use",
  MISTRAL_API_KEY: "test-mock-do-not-use",
  VOYAGE_API_KEY: "test-mock-do-not-use",
};

export default defineConfig({
  testDir: "./__tests__/e2e",

  /* Run tests in files in parallel */
  fullyParallel: false, // Auth state conflicts if parallel

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on retry */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use prepared auth state
        storageState: "__tests__/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...DUMMY_AI_ENV,
    },
  },

  /* Global timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
