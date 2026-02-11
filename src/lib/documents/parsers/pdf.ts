// Use the lib path directly to avoid pdf-parse's test file loading bug
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse");

interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
}

/**
 * Custom error class for PDF parsing failures.
 * Carries a user-facing message distinct from the internal error details.
 */
export class PdfParseError extends Error {
  /** A message safe to display to end users in the UI. */
  public readonly userMessage: string;

  constructor(internalMessage: string, userMessage: string) {
    super(internalMessage);
    this.name = "PdfParseError";
    this.userMessage = userMessage;
  }
}

/** Minimum buffer size for a valid PDF (header + %%EOF) */
const MIN_PDF_SIZE = 64;

/** PDF magic bytes: "%PDF" */
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

export async function parsePdf(buffer: Buffer): Promise<ParsedSection[]> {
  // --- Basic validation ---
  if (!buffer || buffer.length === 0) {
    throw new PdfParseError(
      "PDF buffer is empty (0 bytes).",
      "The uploaded file is empty. Please upload a valid PDF document.",
    );
  }

  if (buffer.length < MIN_PDF_SIZE) {
    throw new PdfParseError(
      `PDF buffer too small (${buffer.length} bytes).`,
      "The uploaded file is too small to be a valid PDF. Please check the file and try again.",
    );
  }

  // Check PDF magic bytes
  if (!buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    throw new PdfParseError(
      "Buffer does not start with PDF magic bytes (%PDF).",
      "The uploaded file does not appear to be a valid PDF. Please ensure you are uploading a .pdf file.",
    );
  }

  // --- Parse ---
  let data: {
    text?: string;
    numpages?: number;
    info?: Record<string, unknown>;
  };
  try {
    // pdf-parse / pdfjs-dist requires Uint8Array, not Node Buffer
    const uint8 = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );
    data = await pdfParse(uint8);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);

    // Detect common pdf-parse / pdfjs-dist failure modes and surface helpful messages
    if (/password/i.test(raw)) {
      throw new PdfParseError(
        `PDF is password-protected: ${raw}`,
        "This PDF is password-protected and cannot be parsed. Please upload an unprotected version of the document.",
      );
    }

    if (/encrypt/i.test(raw)) {
      throw new PdfParseError(
        `PDF is encrypted: ${raw}`,
        "This PDF is encrypted and cannot be read. Please upload an unencrypted version of the document.",
      );
    }

    if (/invalid/i.test(raw) || /corrupt/i.test(raw) || /XRef/i.test(raw)) {
      throw new PdfParseError(
        `PDF appears to be corrupted or invalid: ${raw}`,
        "This PDF appears to be corrupted or in an unsupported format. Please try re-exporting it from the original application and uploading again.",
      );
    }

    throw new PdfParseError(
      `pdf-parse failed: ${raw}`,
      "An error occurred while reading this PDF. The file may be damaged or in an unsupported format. Please try re-saving it and uploading again.",
    );
  }

  const text: string =
    typeof data.text === "string" ? data.text : String(data.text ?? "");
  const pageCount = typeof data.numpages === "number" ? data.numpages : 0;

  if (!text || text.trim().length === 0) {
    // The PDF was parsed successfully but contains no extractable text.
    // This is the most common failure case: scanned / image-based PDFs.
    const hint =
      pageCount > 0
        ? `The PDF has ${pageCount} page(s) but no extractable text — it likely contains scanned images rather than selectable text.`
        : "The PDF contains no extractable text.";

    throw new PdfParseError(
      `Empty text extracted from PDF. Pages: ${pageCount}.`,
      `${hint} To process this document, please try one of the following:\n` +
        "- Upload a text-based (searchable) PDF instead of a scanned copy.\n" +
        "- Re-export the document from its source application (e.g., Word, Google Docs) as a text-based PDF.\n" +
        "- Convert the document to DOCX format and upload that instead.",
    );
  }

  // --- Split text into sections ---
  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];
  let currentPage = 1;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "\f" || trimmed === "") {
      if (trimmed === "\f") currentPage++;
      if (trimmed === "") currentContent.push("");
      continue;
    }

    // Heuristic: a line is likely a heading if it's short and either all-caps or title-cased
    const isLikelyHeading =
      trimmed.length > 2 &&
      trimmed.length < 100 &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith(",") &&
      (trimmed === trimmed.toUpperCase() ||
        /^[A-Z][A-Za-z0-9\s:&\-–]+$/.test(trimmed));

    if (isLikelyHeading && currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      if (content.length > 0) {
        sections.push({
          heading: currentHeading,
          content,
          pageNumber: currentPage,
        });
      }
      currentHeading = trimmed;
      currentContent = [];
    } else if (isLikelyHeading && currentContent.length === 0) {
      currentHeading = trimmed;
    } else {
      currentContent.push(trimmed);
    }
  }

  // Last section
  const lastContent = currentContent.join("\n").trim();
  if (lastContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: lastContent,
      pageNumber: currentPage,
    });
  }

  // Fallback
  if (sections.length === 0 && text.trim().length > 0) {
    sections.push({ heading: null, content: text.trim(), pageNumber: 1 });
  }

  return sections;
}
