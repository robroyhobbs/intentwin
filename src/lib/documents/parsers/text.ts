interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
}

/**
 * Custom error class for plain-text parsing failures.
 */
export class TextParseError extends Error {
  public readonly userMessage: string;

  constructor(internalMessage: string, userMessage: string) {
    super(internalMessage);
    this.name = "TextParseError";
    this.userMessage = userMessage;
  }
}

/**
 * Parse a plain-text (.txt) file into sections.
 * Splits on blank-line-separated blocks and treats short leading lines as headings.
 */
export async function parseTxt(buffer: Buffer): Promise<ParsedSection[]> {
  if (!buffer || buffer.length === 0) {
    throw new TextParseError(
      "TXT buffer is empty (0 bytes).",
      "The uploaded text file is empty. Please upload a file with text content."
    );
  }

  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    throw new TextParseError(
      "TXT file contains only whitespace.",
      "The uploaded text file contains no readable content. Please upload a file with text content."
    );
  }

  // Split into blocks separated by one or more blank lines
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  const sections: ParsedSection[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const firstLine = lines[0]?.trim() ?? "";
    const rest = lines.slice(1).join("\n").trim();

    // Heuristic: treat a short first line as a heading if there is more content
    const isHeading =
      rest.length > 0 &&
      firstLine.length > 0 &&
      firstLine.length < 120 &&
      !firstLine.endsWith(".");

    if (isHeading) {
      sections.push({ heading: firstLine, content: rest });
    } else {
      sections.push({ heading: null, content: block.trim() });
    }
  }

  // Fallback — should not be reachable given the trim check above, but be safe
  if (sections.length === 0) {
    sections.push({ heading: null, content: text.trim() });
  }

  return sections;
}

/**
 * Parse a Markdown (.md) file into sections.
 * Splits on Markdown headings (# / ## / ### etc.) and uses them as section headings.
 */
export async function parseMd(buffer: Buffer): Promise<ParsedSection[]> {
  if (!buffer || buffer.length === 0) {
    throw new TextParseError(
      "MD buffer is empty (0 bytes).",
      "The uploaded Markdown file is empty. Please upload a file with content."
    );
  }

  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    throw new TextParseError(
      "MD file contains only whitespace.",
      "The uploaded Markdown file contains no readable content. Please upload a file with content."
    );
  }

  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);

    if (headingMatch) {
      // Flush previous section
      const content = currentContent.join("\n").trim();
      if (content.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          content: content || currentHeading || "",
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Flush final section
  const lastContent = currentContent.join("\n").trim();
  if (lastContent.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      content: lastContent || currentHeading || "",
    });
  }

  // Fallback
  if (sections.length === 0) {
    sections.push({ heading: null, content: text.trim() });
  }

  return sections;
}

/**
 * Parse a CSV (.csv) file into a single section.
 * Converts the CSV into a readable text representation.
 */
export async function parseCsv(buffer: Buffer): Promise<ParsedSection[]> {
  if (!buffer || buffer.length === 0) {
    throw new TextParseError(
      "CSV buffer is empty (0 bytes).",
      "The uploaded CSV file is empty. Please upload a file with data."
    );
  }

  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    throw new TextParseError(
      "CSV file contains only whitespace.",
      "The uploaded CSV file contains no readable content. Please upload a file with data."
    );
  }

  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new TextParseError(
      "CSV file has no data rows.",
      "The uploaded CSV file contains no data rows. Please upload a CSV file with content."
    );
  }

  // Build a readable text version: header row + data rows
  const content = lines.join("\n");

  return [
    {
      heading: lines.length > 1 ? "CSV Data" : null,
      content,
    },
  ];
}
