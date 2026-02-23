import { test as setup, expect } from "./fixtures/ai-blocker";
import { testUsers } from "@/lib/test-utils/e2e";

const authFile = "__tests__/e2e/.auth/user.json";

/**
 * E2E Authentication Setup
 * 
 * This test runs first to create an authenticated session
 * that other tests can reuse for better performance
 */

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials
  await page.fill('input[type="email"]', testUsers.admin.email);
  await page.fill('input[type="password"]', testUsers.admin.password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL("/dashboard");

  // Verify we're logged in by checking for dashboard element
  await expect(page.locator('[data-testid="dashboard-layout"]')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
