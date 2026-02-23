import { test, expect } from "./fixtures/ai-blocker";

test.describe("Proposal Flow", () => {
  test("create proposal and generate sections", async ({ page }) => {
    // Navigate to proposals
    await page.goto("/proposals");

    // Click create proposal button
    await page.click('[data-testid="create-proposal-button"]');

    // Fill proposal form
    await page.fill('input[name="title"]', "E2E Test Proposal");
    await page.fill('input[name="client_name"]', "E2E Test Client");
    await page.fill(
      'textarea[name="description"]',
      "This is a test proposal created during E2E testing"
    );
    await page.fill('input[name="client_industry"]', "Technology");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for proposal to be created and redirect to detail page
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Verify proposal title is displayed
    await expect(page.locator("h1")).toContainText("E2E Test Proposal");

    // Generate a section
    await page.click('[data-testid="generate-executive-summary"]');

    // Wait for generation to complete (may take a while)
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Verify content was generated
    const content = await page.locator('[data-testid="section-content"]').textContent();
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100);
  });

  test("edit proposal section", async ({ page }) => {
    // Create a proposal first
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "Edit Test Proposal");
    await page.fill('input[name="client_name"]', "Edit Test Client");
    await page.click('button[type="submit"]');

    // Wait for proposal page
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate a section if not already generated
    const sectionContent = page.locator('[data-testid="section-content"]').first();
    
    if (!(await sectionContent.isVisible().catch(() => false))) {
      await page.click('[data-testid="generate-executive-summary"]');
      await page.waitForSelector('[data-testid="section-content"]', {
        timeout: 120000,
      });
    }

    // Click edit
    await page.click('[data-testid="edit-section"]').first();

    // Edit content
    await page.fill(
      '[data-testid="section-editor"]',
      "Edited content for E2E test"
    );

    // Save
    await page.click('[data-testid="save-section"]');

    // Verify saved
    await expect(page.locator('[data-testid="section-content"]').first()).toContainText(
      "Edited content for E2E test"
    );
  });

  test("regenerate section with feedback", async ({ page }) => {
    // Create and generate a proposal
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "Regenerate Test Proposal");
    await page.fill('input[name="client_name"]', "Regenerate Test Client");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate section
    await page.click('[data-testid="generate-executive-summary"]');
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Click regenerate
    await page.click('[data-testid="regenerate-section"]').first();

    // Add feedback
    await page.fill(
      '[data-testid="regenerate-feedback"]',
      "Make it more concise and focused on ROI"
    );

    // Submit regeneration
    await page.click('[data-testid="submit-regenerate"]');

    // Wait for new content
    await page.waitForTimeout(5000); // Wait for loading state
    await page.waitForSelector('[data-testid="section-content"]:not([data-loading="true"])', {
      timeout: 120000,
    });

    // Verify new content
    const newContent = await page.locator('[data-testid="section-content"]').first().textContent();
    expect(newContent).toBeTruthy();
  });
});
