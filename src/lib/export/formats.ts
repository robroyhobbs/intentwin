export const EXPORT_FORMATS = ["docx", "pptx", "html", "slides", "pdf"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export const EXPORT_EXTENSION: Record<ExportFormat, string> = {
  docx: "docx",
  pptx: "pptx",
  html: "html",
  slides: "html",
  pdf: "pdf",
};

export const EXPORT_MIME_TYPE: Record<ExportFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html",
  slides: "text/html",
  pdf: "application/pdf",
};
