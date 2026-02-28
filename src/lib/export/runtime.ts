import {
  EXPORT_EXTENSION,
  EXPORT_MIME_TYPE,
  type ExportFormat,
} from "@/lib/export/formats";

export interface ExportProposalData {
  title: string;
  client_name: string;
  company_name: string;
  date: string;
  sections: Array<{
    title: string;
    content: string;
    section_type: string;
    diagram_image: string | null;
  }>;
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    header_text: string;
    footer_text: string;
  };
}

export async function generateExportFile(
  format: ExportFormat,
  proposalData: ExportProposalData,
): Promise<{ fileBuffer: Buffer; mimeType: string; extension: string }> {
  if (format === "slides") {
    const { generateSlides } = await import("@/lib/export/slides-generator");
    const html = await generateSlides(proposalData);
    return {
      fileBuffer: Buffer.from(html, "utf-8"),
      mimeType: EXPORT_MIME_TYPE[format],
      extension: EXPORT_EXTENSION[format],
    };
  }

  if (format === "html") {
    const { generateHtml } = await import("@/lib/export/html-generator");
    const html = await generateHtml(proposalData);
    return {
      fileBuffer: Buffer.from(html, "utf-8"),
      mimeType: EXPORT_MIME_TYPE[format],
      extension: EXPORT_EXTENSION[format],
    };
  }

  if (format === "pdf") {
    const { generatePdf } = await import("@/lib/export/pdf-generator");
    return {
      fileBuffer: await generatePdf(proposalData),
      mimeType: EXPORT_MIME_TYPE[format],
      extension: EXPORT_EXTENSION[format],
    };
  }

  if (format === "docx") {
    const { generateDocx } = await import("@/lib/export/docx-generator");
    return {
      fileBuffer: await generateDocx(proposalData),
      mimeType: EXPORT_MIME_TYPE[format],
      extension: EXPORT_EXTENSION[format],
    };
  }

  const { generatePptx } = await import("@/lib/export/pptx-generator");
  return {
    fileBuffer: await generatePptx(proposalData),
    mimeType: EXPORT_MIME_TYPE[format],
    extension: EXPORT_EXTENSION[format],
  };
}
