import mammoth from "mammoth";

interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
}

/**
 * Custom error class for DOCX parsing failures.
 * Carries a user-facing message distinct from the internal error details.
 */
export class DocxParseError extends Error {
  public readonly userMessage: string;

  constructor(internalMessage: string, userMessage: string) {
    super(internalMessage);
    this.name = "DocxParseError";
    this.userMessage = userMessage;
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParsedSection[]> {
  if (!buffer || buffer.length === 0) {
    throw new DocxParseError(
      "DOCX buffer is empty (0 bytes).",
      "The uploaded file is empty. Please upload a valid DOCX document.",
    );
  }

  let result: { value: string; messages: mammoth.Message[] };
  try {
    result = await mammoth.convertToHtml({ buffer });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);

    if (/Can't find end of central directory/i.test(raw) || /zip/i.test(raw)) {
      throw new DocxParseError(
        `DOCX is not a valid zip archive: ${raw}`,
        "This file does not appear to be a valid DOCX document. DOCX files are ZIP archives internally. The file may be corrupted — please try re-saving it from Word or Google Docs and uploading again.",
      );
    }

    throw new DocxParseError(
      `mammoth failed: ${raw}`,
      "An error occurred while reading this DOCX file. The file may be damaged or in an unsupported format. Please try re-saving it and uploading again.",
    );
  }

  const html = result.value;

  // Split by heading tags to create sections
  const sections: ParsedSection[] = [];
  const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  const parts = html.split(headingRegex);

  // First part (before any heading) may have content
  if (parts[0]) {
    const text = stripHtml(parts[0]).trim();
    if (text.length > 0) {
      sections.push({ heading: null, content: text });
    }
  }

  // Process heading/content pairs
  for (let i = 1; i < parts.length; i += 2) {
    const heading = stripHtml(parts[i] || "").trim();
    const content = stripHtml(parts[i + 1] || "").trim();
    if (content.length > 0 || heading.length > 0) {
      sections.push({ heading: heading || null, content });
    }
  }

  // If no sections were extracted, treat entire text as one section
  if (sections.length === 0) {
    const fullText = stripHtml(html).trim();
    if (fullText.length > 0) {
      sections.push({ heading: null, content: fullText });
    }
  }

  if (sections.length === 0) {
    throw new DocxParseError(
      "DOCX parsed but no text content was extracted.",
      "This DOCX file was read successfully but contains no extractable text. It may only contain images or embedded objects. Please upload a document with text content.",
    );
  }

  return sections;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
