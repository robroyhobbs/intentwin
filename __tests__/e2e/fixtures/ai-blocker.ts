/**
 * AI Blocker Fixture for Playwright E2E Tests
 *
 * Prevents ANY real AI API calls from leaking during E2E test runs.
 * Two-layer defense:
 *
 * 1. Browser-side: `page.route()` intercepts outbound fetch/XHR to AI provider
 *    domains and fails the test immediately with a clear error message.
 *
 * 2. Server-side: Dummy API keys are set via CI environment variables
 *    (GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, VOYAGE_API_KEY)
 *    so any server-side SDK that tries to authenticate will receive an auth error
 *    from the provider, preventing real AI work from executing.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/ai-blocker";
 *   // replaces: import { test, expect } from "@playwright/test";
 */

import { test as base, expect } from "@playwright/test";

/**
 * AI provider domains that must NEVER receive real requests during tests.
 * Each entry is a glob pattern compatible with Playwright's `page.route()`.
 */
const AI_PROVIDER_PATTERNS: ReadonlyArray<{
  pattern: string;
  provider: string;
}> = [
  {
    pattern: "**/generativelanguage.googleapis.com/**",
    provider: "Google Gemini",
  },
  {
    pattern: "**/api.openai.com/**",
    provider: "OpenAI",
  },
  {
    pattern: "**/api.groq.com/**",
    provider: "Groq",
  },
  {
    pattern: "**/api.mistral.ai/**",
    provider: "Mistral",
  },
  {
    pattern: "**/api.voyageai.com/**",
    provider: "Voyage AI",
  },
];

/**
 * Extended Playwright test that automatically blocks all AI API calls
 * from the browser context. The fixture is auto-applied to every test.
 */
export const test = base.extend<{ _aiBlocker: void }>({
  // eslint-disable-next-line no-empty-pattern
  _aiBlocker: [async ({ page }, use, testInfo) => {
    // Register route handlers that abort + fail on AI provider requests
    for (const { pattern, provider } of AI_PROVIDER_PATTERNS) {
      await page.route(pattern, (route) => {
        const url = route.request().url();
        // Attach error info to the test so it shows in the report
        testInfo.annotations.push({
          type: "blocked-ai-call",
          description: `BLOCKED: Real AI API call detected to ${provider} (${url})`,
        });

        // Abort the network request
        void route.abort("blockedbyclient");

        // Force-fail the test with a descriptive message
        throw new Error(
          `BLOCKED: Real AI API call detected to ${provider}.\n` +
          `URL: ${url}\n` +
          `All AI calls must be mocked in tests. See src/lib/test-utils/mock-ai.ts for mock factories.`,
        );
      });
    }

    // Run the test
    await use();
  }, { auto: true }],
});

export { expect };

/**
 * Dummy API keys for server-side AI call prevention.
 * When set as environment variables, any SDK that attempts to authenticate
 * with these keys will receive an auth/invalid-key error from the provider,
 * preventing real AI work from being performed.
 *
 * These are set in:
 * - playwright.config.ts (for local runs)
 * - .github/workflows/ci.yml (for CI runs)
 */
export const DUMMY_AI_KEYS = {
  GEMINI_API_KEY: "test-mock-do-not-use",
  OPENAI_API_KEY: "test-mock-do-not-use",
  GROQ_API_KEY: "test-mock-do-not-use",
  MISTRAL_API_KEY: "test-mock-do-not-use",
  VOYAGE_API_KEY: "test-mock-do-not-use",
} as const;
