import { parseOffice } from "officeparser";

interface ParsedSection {
  heading: string | null;
  content: string;
  slideNumber?: number;
}

/**
 * Custom error class for PPTX parsing failures.
 * Carries a user-facing message distinct from the internal error details.
 */
export class PptxParseError extends Error {
  public readonly userMessage: string;

  constructor(internalMessage: string, userMessage: string) {
    super(internalMessage);
    this.name = "PptxParseError";
    this.userMessage = userMessage;
  }
}

export async function parsePptx(buffer: Buffer): Promise<ParsedSection[]> {
  if (!buffer || buffer.length === 0) {
    throw new PptxParseError(
      "PPTX buffer is empty (0 bytes).",
      "The uploaded file is empty. Please upload a valid PPTX presentation.",
    );
  }

  let result: string;
  try {
    const parsed = await parseOffice(buffer);
    result = typeof parsed === "string" ? parsed : String(parsed);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);

    if (/Can't find end of central directory/i.test(raw) || /zip/i.test(raw)) {
      throw new PptxParseError(
        `PPTX is not a valid zip archive: ${raw}`,
        "This file does not appear to be a valid PPTX presentation. The file may be corrupted — please try re-saving it from PowerPoint or Google Slides and uploading again.",
      );
    }

    throw new PptxParseError(
      `officeparser failed: ${raw}`,
      "An error occurred while reading this PPTX file. The file may be damaged or in an unsupported format. Please try re-saving it and uploading again.",
    );
  }

  const text = result;
  const sections: ParsedSection[] = [];

  // officeParser returns text with slide separators
  // Split by double newlines or slide-like boundaries
  const slides = text
    .split(/\n{3,}/)
    .filter((s: string) => s.trim().length > 0);

  slides.forEach((slideText: string, index: number) => {
    const lines = slideText
      .trim()
      .split("\n")
      .filter((l: string) => l.trim().length > 0);
    if (lines.length === 0) return;

    // First line of a slide is typically the title
    const heading = lines[0].trim();
    const content = lines.slice(1).join("\n").trim();

    sections.push({
      heading: heading || null,
      content: content || heading, // If only a title, use it as content too
      slideNumber: index + 1,
    });
  });

  // Fallback
  if (sections.length === 0 && text.trim().length > 0) {
    sections.push({ heading: null, content: text.trim(), slideNumber: 1 });
  }

  if (sections.length === 0) {
    throw new PptxParseError(
      "PPTX parsed but no text content was extracted.",
      "This presentation was read successfully but contains no extractable text. It may only contain images or embedded media. Please upload a presentation with text content.",
    );
  }

  return sections;
}
