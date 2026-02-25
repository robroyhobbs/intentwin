import { generateHtml } from "./html-generator";
import puppeteerCore from "puppeteer-core";
import { logger } from "@/lib/utils/logger";
import type { ProposalData } from "./slides/types";

/**
 * Find a usable Chromium executable for PDF generation.
 *
 * Strategy:
 * 1. Always try @sparticuz/chromium first (works on Vercel, AWS Lambda, etc.)
 * 2. Fall back to locally installed browsers (dev machines)
 *
 * Previous approach checked AWS_LAMBDA_FUNCTION_NAME to detect Vercel,
 * but Vercel's runtime no longer sets that env var consistently.
 */
async function findBrowser(): Promise<{
  executablePath: string;
  args: string[];
}> {
  // 1. Try @sparticuz/chromium (serverless-compatible Chromium)
  let chromiumReason = "";
  try {
    const chromium = await import("@sparticuz/chromium");
    logger.info("pdf-export: @sparticuz/chromium imported", {
      hasDefault: !!chromium.default,
      hasExecPath: typeof chromium.default?.executablePath,
    });
    const execPath = await chromium.default.executablePath();
    logger.info("pdf-export: executablePath result", { execPath, type: typeof execPath });
    if (execPath) {
      // Verify the binary actually exists
      const { existsSync: fsExists } = await import("fs");
      const binExists = fsExists(execPath);
      logger.info("pdf-export: binary exists check", { execPath, binExists });
      if (binExists) {
        return { executablePath: execPath, args: chromium.default.args };
      }
      chromiumReason = `executablePath resolved to ${execPath} but file does not exist`;
    } else {
      chromiumReason = `executablePath() returned falsy: ${String(execPath)}`;
    }
  } catch (chromiumError) {
    chromiumReason = chromiumError instanceof Error
      ? `${chromiumError.message} | ${chromiumError.stack?.split("\n").slice(0, 3).join(" ")}`
      : String(chromiumError);
    logger.error("pdf-export: @sparticuz/chromium error", { reason: chromiumReason });
  }

  // 2. Local development: search for installed browsers
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

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      logger.info("pdf-export: using local browser", { executablePath: candidate });
      return {
        executablePath: candidate,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };
    }
  }

  throw new Error(
    `PDF browser not found. @sparticuz/chromium: ${chromiumReason}`,
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
