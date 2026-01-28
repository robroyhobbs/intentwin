import mammoth from "mammoth";

interface ParsedSection {
  heading: string | null;
  content: string;
  pageNumber?: number;
}

export async function parseDocx(buffer: Buffer): Promise<ParsedSection[]> {
  const result = await mammoth.convertToHtml({ buffer });
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
