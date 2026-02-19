import { generateHtml } from "./html-generator";
import puppeteerCore from "puppeteer-core";

interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

interface ProposalData {
  title: string;
  client_name: string;
  company_name?: string;
  date: string;
  sections: ProposalSection[];
}

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
  const isVercel =
    !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isVercel) {
    try {
      const chromium = await import("@sparticuz/chromium");
      console.log("[pdf-export] @sparticuz/chromium imported successfully");
      const execPath = await chromium.default.executablePath();
      console.log("[pdf-export] executablePath:", execPath);
      if (execPath) {
        return { executablePath: execPath, args: chromium.default.args };
      }
      console.warn("[pdf-export] executablePath was falsy, falling through");
    } catch (chromiumError) {
      console.error(
        "[pdf-export] @sparticuz/chromium failed:",
        chromiumError instanceof Error ? chromiumError.message : chromiumError,
      );
    }
  } else {
    console.log("[pdf-export] Not on Vercel, skipping @sparticuz/chromium");
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
  const companyName = data.company_name || "IntentWin";

  // Generate HTML with inline fonts (no external CDN requests in serverless)
  const html = await generateHtml(data, { inlineFonts: true });

  const { executablePath, args } = await findBrowser();

  console.log("[pdf-export] Launching browser...");
  const browser = await launchBrowser(executablePath, args);
  console.log("[pdf-export] Browser launched successfully");

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

    console.log("[pdf-export] Generating PDF...");
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
        <div style="font-size:8px; color:#999; width:100%; text-align:center; padding:5px 0;">
          ${data.title} | ${companyName} | Confidential
        </div>`,
      footerTemplate: `
        <div style="font-size:8px; color:#999; width:100%; text-align:center; padding:5px 0;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      timeout: 60000,
    });

    console.log("[pdf-export] PDF generated successfully, size:", pdfBuffer.length);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch((err: unknown) => {
      console.warn("[pdf-export] Browser close error:", err);
    });
  }
}
