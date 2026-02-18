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
  // In local development, prefer local browser to avoid @sparticuz/chromium
  // download timeout. Only use @sparticuz/chromium in production (Vercel).
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
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // Linux
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    // Puppeteer cache
    `${process.env.HOME}/.cache/puppeteer/chrome/*/chrome-*/chrome`,
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

export async function generatePdf(data: ProposalData): Promise<Buffer> {
  const companyName = data.company_name || "IntentWin";

  // Generate the full HTML first
  const html = await generateHtml(data);

  const { executablePath, args } = await findBrowser();

  const browser = await puppeteerCore.launch({
    args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

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
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
