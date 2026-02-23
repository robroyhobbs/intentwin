import { test, expect } from "./fixtures/ai-blocker";
import path from "path";

test.describe("Knowledge Base Flow", () => {
  test("upload PDF document", async ({ page }) => {
    // Navigate to knowledge base upload
    await page.goto("/knowledge-base/upload");

    // Fill document metadata
    await page.fill('input[name="title"]', "Test RFP Document");
    await page.fill('textarea[name="description"]', "A test RFP for E2E testing");
    await page.selectOption('select[name="document_type"]', "rfp");

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles(path.join(__dirname, "fixtures", "sample-rfp.pdf"));

    // Submit upload
    await page.click('button[type="submit"]');

    // Wait for upload to complete
    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 30000,
    });

    // Verify document appears in list
    await page.goto("/knowledge-base");
    await expect(page.locator("text=Test RFP Document")).toBeVisible();
  });

  test("upload DOCX document", async ({ page }) => {
    await page.goto("/knowledge-base/upload");

    await page.fill('input[name="title"]', "Test Capability Document");
    await page.fill(
      'textarea[name="description"]',
      "A test capability statement"
    );
    await page.selectOption('select[name="document_type"]', "capability");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles(path.join(__dirname, "fixtures", "sample-capability.docx"));

    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 30000,
    });

    // Verify document processed
    await page.goto("/knowledge-base");
    await expect(page.locator("text=Test Capability Document")).toBeVisible();
  });

  test("search knowledge base", async ({ page }) => {
    // Upload a document first
    await page.goto("/knowledge-base/upload");
    await page.fill('input[name="title"]', "Search Test Document");
    await page.selectOption('select[name="document_type"]', "reference");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles(path.join(__dirname, "fixtures", "sample-rfp.pdf"));
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 30000,
    });

    // Navigate to search
    await page.goto("/knowledge-base/search");

    // Search for content
    await page.fill('input[name="query"]', "cloud migration");
    await page.click('button[type="submit"]');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', {
      timeout: 10000,
    });

    // Verify results appear
    const results = page.locator('[data-testid="search-result-item"]');
    expect(await results.count()).toBeGreaterThan(0);
  });

  test("reprocess document", async ({ page }) => {
    // Upload document
    await page.goto("/knowledge-base/upload");
    await page.fill('input[name="title"]', "Reprocess Test Document");
    await page.selectOption('select[name="document_type"]', "past_performance");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles(path.join(__dirname, "fixtures", "sample-rfp.pdf"));
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 30000,
    });

    // Navigate to documents list
    await page.goto("/knowledge-base");

    // Find document and click reprocess
    await page.click('[data-testid="reprocess-document"]').first();

    // Confirm reprocess
    await page.click('[data-testid="confirm-reprocess"]');

    // Wait for reprocessing
    await page.waitForSelector('[data-testid="processing-complete"]', {
      timeout: 60000,
    });
  });

  test("delete document", async ({ page }) => {
    // Upload document
    await page.goto("/knowledge-base/upload");
    await page.fill('input[name="title"]', "Delete Test Document");
    await page.selectOption('select[name="document_type"]', "reference");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setFiles(path.join(__dirname, "fixtures", "sample-rfp.pdf"));
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="upload-success"]', {
      timeout: 30000,
    });

    // Navigate to documents
    await page.goto("/knowledge-base");

    // Delete document
    await page.click('[data-testid="delete-document"]').first();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Verify document removed
    await expect(page.locator("text=Delete Test Document")).not.toBeVisible();
  });
});
