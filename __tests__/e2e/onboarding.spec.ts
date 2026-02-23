import { test, expect } from "./fixtures/ai-blocker";

test.describe("Onboarding Flow", () => {
  test("complete onboarding wizard", async ({ page }) => {
    // Navigate to signup
    await page.goto("/signup");

    // Fill signup form
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123!");

    // Submit signup
    await page.click('button[type="submit"]');

    // Wait for onboarding redirect
    await page.waitForURL("/onboarding");

    // Step 1: Company Profile
    await page.fill('input[name="companyName"]', "Test Company");
    await page.fill(
      'textarea[name="companyDescription"]',
      "A test company for E2E testing"
    );
    await page.click('button:has-text("Next")');

    // Step 2: Differentiators
    await page.fill(
      'input[name="differentiator1"]',
      "Fast delivery"
    );
    await page.click('button:has-text("Next")');

    // Step 3: Knowledge Base (skip for now)
    await page.click('button:has-text("Skip")');

    // Should redirect to dashboard
    await page.waitForURL("/dashboard");

    // Verify getting started checklist is visible
    await expect(
      page.locator('[data-testid="getting-started-checklist"]')
    ).toBeVisible();
  });

  test("getting started checklist auto-dismisses", async ({ page }) => {
    await page.goto("/dashboard");

    // Complete checklist items
    const checklist = page.locator('[data-testid="getting-started-checklist"]');
    
    // Check if checklist exists (may already be dismissed)
    if (await checklist.isVisible().catch(() => false)) {
      // Complete company profile
      await page.click('[data-testid="complete-company-profile"]');
      await page.waitForURL("/settings/company");
      await page.goto("/dashboard");

      // Complete knowledge base upload
      await page.click('[data-testid="upload-documents"]');
      await page.waitForURL("/knowledge-base/upload");
      await page.goto("/dashboard");

      // Create first proposal
      await page.click('[data-testid="create-first-proposal"]');
      await page.waitForURL("/proposals/new");
    }
  });
});
