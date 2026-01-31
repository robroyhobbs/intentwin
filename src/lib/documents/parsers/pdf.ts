import { parseOffice } from "officeparser";

interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedSection[]> {
  try {
    const result = await parseOffice(buffer, { outputErrorToConsole: false });
    const text = typeof result === "string" ? result : String(result);

    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split text by what looks like headings
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
  } catch (error) {
    console.error("PDF parsing error:", error);
    // Return empty sections on error - let the caller handle it
    return [];
  }
}
