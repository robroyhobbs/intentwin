import { parseDocx } from "./parsers/docx";
import { parsePdf } from "./parsers/pdf";
import { parsePptx } from "./parsers/pptx";
import { parseTxt, parseMd } from "./parsers/text";

export interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
  slideNumber?: number;
}

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
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
