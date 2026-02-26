import { parseDocx } from "./parsers/docx";
import { parsePdf } from "./parsers/pdf";
import { parsePptx } from "./parsers/pptx";
import { parseTxt, parseMd } from "./parsers/text";
import { parseXlsx } from "./parsers/xlsx";

export interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
  slideNumber?: number;
}

/**
 * Parses a document buffer into structured sections based on file type.
 * Delegates to format-specific parsers (DOCX, PDF, PPTX, TXT, MD).
 *
 * @param buffer - Raw file content as a Buffer
 * @param fileType - File extension without dot (e.g., "pdf", "docx", "pptx", "txt", "md")
 * @returns Array of parsed sections with optional headings and page/slide numbers
 * @throws {Error} When the file type is not supported
 *
 * @example
 * const sections = await parseDocument(fileBuffer, "pdf");
 * // sections[0].heading, sections[0].content, sections[0].pageNumber
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: string,
): Promise<ParsedSection[]> {
  switch (fileType) {
    case "docx":
      return parseDocx(buffer);
    case "pdf":
      return parsePdf(buffer);
    case "pptx":
      return parsePptx(buffer);
    case "txt":
      return parseTxt(buffer);
    case "md":
      return parseMd(buffer);
    case "xlsx":
    case "xls":
      return parseXlsx(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
