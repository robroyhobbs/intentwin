import { test, expect } from "@playwright/test";

test.describe("Export Flow", () => {
  test("export proposal to HTML", async ({ page }) => {
    // Create a proposal with content
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "Export Test Proposal");
    await page.fill('input[name="client_name"]', "Export Test Client");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate at least one section
    await page.click('[data-testid="generate-executive-summary"]');
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Click export button
    await page.click('[data-testid="export-button"]');

    // Select HTML format
    await page.click('[data-testid="export-html"]');

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="confirm-export"]'),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.html$/);
  });

  test("export proposal to DOCX", async ({ page }) => {
    // Create a proposal with content
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "DOCX Export Test");
    await page.fill('input[name="client_name"]', "DOCX Test Client");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate content
    await page.click('[data-testid="generate-executive-summary"]');
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Export to DOCX
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-docx"]');

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="confirm-export"]'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.docx$/);
  });

  test("export proposal to PDF", async ({ page }) => {
    // Create a proposal with content
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "PDF Export Test");
    await page.fill('input[name="client_name"]', "PDF Test Client");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate content
    await page.click('[data-testid="generate-executive-summary"]');
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Export to PDF
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-pdf"]');

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="confirm-export"]'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("export with custom branding", async ({ page }) => {
    // Create proposal
    await page.goto("/proposals/new");
    await page.fill('input[name="title"]', "Branded Export Test");
    await page.fill('input[name="client_name"]', "Branded Test Client");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/proposals\/[\w-]+/);

    // Generate content
    await page.click('[data-testid="generate-executive-summary"]');
    await page.waitForSelector('[data-testid="section-content"]', {
      timeout: 120000,
    });

    // Open export with branding options
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-html"]');

    // Verify branding options are available
    await expect(page.locator('[data-testid="branding-options"]')).toBeVisible();

    // Select custom color
    await page.fill('[data-testid="primary-color"]', "#FF5733");

    // Export
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testid="confirm-export"]'),
    ]);

    expect(download.suggestedFilename()).toBeTruthy();
  });
});
