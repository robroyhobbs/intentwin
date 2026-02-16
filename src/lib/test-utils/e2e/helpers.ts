/**
 * E2E Test Helpers
 * 
 * Utilities for Playwright end-to-end tests
 */

import { test as base, expect, Page } from "@playwright/test";

/**
 * Extended test fixture with authentication
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword");
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");
    
    await use(page);
  },
});

export { expect };

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp
) {
  return page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === "string") {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Helper to upload a file
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.locator(selector).click(),
  ]);
  await fileChooser.setFiles(filePath);
}

/**
 * Helper to generate a test PDF file path
 */
export function getTestFilePath(filename: string): string {
  return `__tests__/e2e/fixtures/${filename}`;
}

/**
 * Common test selectors
 */
export const selectors = {
  login: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
  },
  dashboard: {
    createProposalButton: '[data-testid="create-proposal-button"]',
    proposalList: '[data-testid="proposal-list"]',
  },
  proposal: {
    titleInput: 'input[name="title"]',
    clientNameInput: 'input[name="client_name"]',
    generateButton: '[data-testid="generate-button"]',
    exportButton: '[data-testid="export-button"]',
  },
};
