import { generateHtml } from "./html-generator";
import chromium from "@sparticuz/chromium";
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

export async function generatePdf(data: ProposalData): Promise<Buffer> {
  const companyName = data.company_name || "IntentWin";

  // Generate the full HTML first
  const html = await generateHtml(data);

  // Use @sparticuz/chromium for serverless (Vercel) compatibility
  const browser = await puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
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
