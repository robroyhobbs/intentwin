import { parseOffice } from "officeparser";

interface ParsedSection {
  heading: string | null;
  content: string;
  slideNumber?: number;
}

export async function parsePptx(buffer: Buffer): Promise<ParsedSection[]> {
  const result = await parseOffice(buffer);
  const text = typeof result === "string" ? result : String(result);
  const sections: ParsedSection[] = [];

  // officeParser returns text with slide separators
  // Split by double newlines or slide-like boundaries
  const slides = text.split(/\n{3,}/).filter((s: string) => s.trim().length > 0);

  slides.forEach((slideText: string, index: number) => {
    const lines = slideText.trim().split("\n").filter((l: string) => l.trim().length > 0);
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

  return sections;
}
