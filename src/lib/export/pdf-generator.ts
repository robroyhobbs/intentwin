import { generateHtml } from "./html-generator";
import { logger } from "@/lib/utils/logger";
import type { ProposalData } from "./slides/types";

/**
 * Generate a PDF from proposal data.
 *
 * Strategy:
 * 1. If GOTENBERG_URL is set, send HTML to Gotenberg (external container
 *    running Chromium — no binary management needed).
 * 2. Fall back to local browser rendering for development (puppeteer-core
 *    with locally installed Chrome/Chromium).
 *
 * Gotenberg API: POST /forms/chromium/convert/html
 *   - Multipart form: index.html (required), header.html, footer.html
 *   - Returns PDF binary directly
 *   - Docs: https://gotenberg.dev/docs/convert-with-chromium/convert-html-to-pdf
 */

const GOTENBERG_TIMEOUT_MS = 60000;
const LOCAL_BROWSER_TIMEOUT_MS = 30000;

export async function generatePdf(data: ProposalData): Promise<Buffer> {
  const gotenbergUrl = process.env.GOTENBERG_URL?.trim();

  if (gotenbergUrl) {
    return generatePdfWithGotenberg(data, gotenbergUrl);
  }

  // Fail fast on serverless environments — no local browser available
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  if (isServerless) {
    throw new Error(
      "PDF export requires GOTENBERG_URL in production. " +
      "Deploy Gotenberg to Cloud Run: ./scripts/deploy-gotenberg.sh",
    );
  }

  logger.info("pdf-export: GOTENBERG_URL not set, falling back to local browser");
  return generatePdfWithLocalBrowser(data);
}

// ============================================================
// Gotenberg (Production)
// ============================================================

async function generatePdfWithGotenberg(
  data: ProposalData,
  baseUrl: string,
): Promise<Buffer> {
  const companyName = data.branding?.header_text || data.company_name || "IntentBid";
  const footerText = data.branding?.footer_text || "Confidential";
  const primaryColor = data.branding?.primary_color || "#0070AD";

  // Generate the main HTML with inline fonts (no CDN requests) and PDF-specific overrides
  // (forces all sections visible, hides TOC sidebar, removes scroll animations)
  const html = await generateHtml(data, { inlineFonts: true, forPdf: true });

  // Build header HTML (complete document required by Gotenberg)
  const headerHtml = `<!DOCTYPE html>
<html><head><style>
  body { font-size: 8px; color: ${primaryColor}; margin: 0 15mm; -webkit-print-color-adjust: exact; }
  .header { width: 100%; text-align: center; padding: 5px 0; }
</style></head><body>
  <div class="header">${escapeHtml(data.title)} | ${escapeHtml(companyName)} | ${escapeHtml(footerText)}</div>
</body></html>`;

  // Build footer HTML
  const footerHtml = `<!DOCTYPE html>
<html><head><style>
  body { font-size: 8px; color: ${primaryColor}; margin: 0 15mm; -webkit-print-color-adjust: exact; }
  .footer { width: 100%; text-align: center; padding: 5px 0; }
</style></head><body>
  <div class="footer">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
</body></html>`;

  // Build multipart form data
  const formData = new FormData();

  // index.html (required)
  formData.append(
    "files",
    new Blob([html], { type: "text/html" }),
    "index.html",
  );

  // header.html
  formData.append(
    "files",
    new Blob([headerHtml], { type: "text/html" }),
    "header.html",
  );

  // footer.html
  formData.append(
    "files",
    new Blob([footerHtml], { type: "text/html" }),
    "footer.html",
  );

  // PDF settings — match previous Puppeteer config
  formData.append("paperWidth", "8.5"); // US Letter width in inches
  formData.append("paperHeight", "11"); // US Letter height in inches
  formData.append("marginTop", "0.79"); // 20mm in inches
  formData.append("marginBottom", "0.79"); // 20mm in inches
  formData.append("marginLeft", "0.59"); // 15mm in inches
  formData.append("marginRight", "0.59"); // 15mm in inches
  formData.append("printBackground", "true");
  formData.append("emulatedMediaType", "screen"); // Preserve background colors/images
  formData.append("waitDelay", "1s"); // Match the 1s pause from Puppeteer version

  const url = `${baseUrl.replace(/\/$/, "")}/forms/chromium/convert/html`;

  logger.info("pdf-export: sending to Gotenberg", { url });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOTENBERG_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Gotenberg error ${response.status}: ${errorText.slice(0, 500)}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    logger.info("pdf-export: PDF generated via Gotenberg", {
      size: pdfBuffer.length,
    });

    return pdfBuffer;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// Local Browser Fallback (Development)
// ============================================================

async function generatePdfWithLocalBrowser(
  data: ProposalData,
): Promise<Buffer> {
  const companyName = data.branding?.header_text || data.company_name || "IntentBid";
  const footerText = data.branding?.footer_text || "Confidential";

  const html = await generateHtml(data, { inlineFonts: true, forPdf: true });

  // Dynamic import — only loads puppeteer-core when actually needed (dev only)
  let puppeteerCore;
  try {
    puppeteerCore = await import("puppeteer-core");
  } catch {
    throw new Error(
      "PDF export requires either GOTENBERG_URL (production) or puppeteer-core (development). " +
      "Install puppeteer-core as a dev dependency: npm install -D puppeteer-core",
    );
  }

  // Find a local browser
  const { existsSync } = await import("fs");
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  let executablePath: string | null = null;
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      executablePath = candidate;
      break;
    }
  }

  if (!executablePath) {
    throw new Error(
      "No local browser found for PDF generation. Set GOTENBERG_URL for production, " +
      "or install Chrome/Chromium for local development.",
    );
  }

  logger.info("pdf-export: using local browser", { executablePath });

  const launchPromise = puppeteerCore.default.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Browser launch timed out after ${LOCAL_BROWSER_TIMEOUT_MS}ms`)),
      LOCAL_BROWSER_TIMEOUT_MS,
    );
  });

  const browser = await Promise.race([launchPromise, timeoutPromise]);

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; color:${data.branding?.primary_color || "#0070AD"}; width:100%; text-align:center; padding:5px 0;">
          ${data.title} | ${companyName} | ${footerText}
        </div>`,
      footerTemplate: `
        <div style="font-size:8px; color:${data.branding?.primary_color || "#0070AD"}; width:100%; text-align:center; padding:5px 0;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      timeout: 60000,
    });

    logger.info("pdf-export: PDF generated via local browser", { size: pdfBuffer.length });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch((err: unknown) => {
      logger.warn("pdf-export: browser close error", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
}

// ============================================================
// Utilities
// ============================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
