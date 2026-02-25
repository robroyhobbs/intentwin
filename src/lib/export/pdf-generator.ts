import { generateHtml } from "./html-generator";
import puppeteerCore from "puppeteer-core";
import { logger } from "@/lib/utils/logger";
import type { ProposalData } from "./slides/types";

/**
 * Find a usable Chromium executable for PDF generation.
 * In production (Vercel), uses @sparticuz/chromium.
 * Locally, searches for installed browsers.
 */
async function findBrowser(): Promise<{
  executablePath: string;
  args: string[];
}> {
  const { existsSync } = await import("fs");
  // Detect actual Vercel serverless runtime (AWS Lambda), NOT the VERCEL env var
  // which is also set locally by `vercel env pull`.
  const isVercel = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isVercel) {
    try {
      const chromium = await import("@sparticuz/chromium");
      logger.info("pdf-export: @sparticuz/chromium imported successfully");
      const execPath = await chromium.default.executablePath();
      logger.info("pdf-export: executablePath resolved", { execPath });
      if (execPath) {
        return { executablePath: execPath, args: chromium.default.args };
      }
      logger.warn("pdf-export: executablePath was falsy, falling through to local search");
    } catch (chromiumError) {
      const msg = chromiumError instanceof Error ? chromiumError.message : String(chromiumError);
      logger.error("pdf-export: @sparticuz/chromium failed", {
        error: msg,
        stack: chromiumError instanceof Error ? chromiumError.stack?.slice(0, 500) : undefined,
      });
      // Re-throw with a clear message instead of silently falling through on Vercel
      throw new Error(`PDF export requires @sparticuz/chromium on Vercel but it failed: ${msg}`);
    }
  } else {
    logger.debug("pdf-export: not on Vercel, skipping @sparticuz/chromium");
  }

  // Local development: search for installed browsers
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

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return {
        executablePath: candidate,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };
    }
  }

  throw new Error(
    "No Chromium-based browser found. Install Chrome, Edge, or Chromium for PDF export.",
  );
}

/**
 * Launch browser with a timeout to prevent zombie processes.
 */
async function launchBrowser(
  executablePath: string,
  args: string[],
  timeoutMs = 30000,
): Promise<ReturnType<typeof puppeteerCore.launch>> {
  const launchPromise = puppeteerCore.launch({
    args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Browser launch timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  return Promise.race([launchPromise, timeoutPromise]);
}

export async function generatePdf(data: ProposalData): Promise<Buffer> {
  const companyName = data.branding?.header_text || data.company_name || "IntentBid";
  const footerText = data.branding?.footer_text || "Confidential";

  // Generate HTML with inline fonts (no external CDN requests in serverless)
  const html = await generateHtml(data, { inlineFonts: true });

  const { executablePath, args } = await findBrowser();

  logger.debug("pdf-export: launching browser...");
  const browser = await launchBrowser(executablePath, args);
  logger.debug("pdf-export: browser launched successfully");

  try {
    const page = await browser.newPage();

    // Use domcontentloaded instead of networkidle0 to avoid hanging
    // on external resource requests (fonts, images) in serverless
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Brief wait for any inline styles/fonts to apply
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.debug("pdf-export: generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; color:${data.branding?.primary_color || "#999"}; width:100%; text-align:center; padding:5px 0;">
          ${data.title} | ${companyName} | ${footerText}
        </div>`,
      footerTemplate: `
        <div style="font-size:8px; color:${data.branding?.primary_color || "#999"}; width:100%; text-align:center; padding:5px 0;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      timeout: 60000,
    });

    logger.info("pdf-export: PDF generated successfully", { size: pdfBuffer.length });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch((err: unknown) => {
      logger.warn("pdf-export: browser close error", { error: err instanceof Error ? err.message : String(err) });
    });
  }
}
