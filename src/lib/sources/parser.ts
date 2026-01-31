/**
 * Source Document Parser
 *
 * Parses markdown files from the sources/ directory with blockquote-style metadata.
 *
 * Expected format:
 * ```
 * # Title
 *
 * > source_url: https://...
 * > verified_date: 2026-01-28
 * > content_type: methodology
 * > status: [VERIFIED]
 *
 * ## Section...
 * ```
 */

export interface SourceMetadata {
  source_url?: string;
  verified_date?: string;
  content_type?: string;
  status?: 'VERIFIED' | 'UNVERIFIED' | 'PARTIAL';
}

export interface SourceSection {
  heading: string;
  level: number;
  content: string;
}

export interface ParsedSourceDocument {
  metadata: SourceMetadata;
  title: string;
  content: string;
  sections: SourceSection[];
  rawContent: string;
}

/**
 * Parse blockquote-style metadata from the beginning of markdown content
 */
function parseMetadata(lines: string[]): { metadata: SourceMetadata; endIndex: number } {
  const metadata: SourceMetadata = {};
  let endIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop at first non-empty, non-blockquote, non-title line
    if (line && !line.startsWith('>') && !line.startsWith('#')) {
      break;
    }

    // Parse blockquote metadata lines
    if (line.startsWith('>')) {
      const metaLine = line.slice(1).trim();
      const colonIndex = metaLine.indexOf(':');
      if (colonIndex > 0) {
        const key = metaLine.slice(0, colonIndex).trim().toLowerCase().replace(/-/g, '_');
        let value = metaLine.slice(colonIndex + 1).trim();

        // Handle status with brackets like [VERIFIED]
        if (key === 'status') {
          value = value.replace(/[\[\]]/g, '') as 'VERIFIED' | 'UNVERIFIED' | 'PARTIAL';
        }

        (metadata as Record<string, string>)[key] = value;
      }
      endIndex = i + 1;
    }
  }

  return { metadata, endIndex };
}

/**
 * Extract the main title from the first H1 heading
 */
function extractTitle(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      return trimmed.slice(2).trim();
    }
  }
  return 'Untitled';
}

/**
 * Parse markdown sections (H2, H3, etc.) into structured format
 */
function parseSections(content: string): SourceSection[] {
  const sections: SourceSection[] = [];
  const lines = content.split('\n');

  let currentSection: SourceSection | null = null;
  let sectionContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = sectionContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        content: '',
      };
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = sectionContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Extract key-value tables from markdown content
 */
export function extractTables(content: string): Array<{ headers: string[]; rows: string[][] }> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  const lines = content.split('\n');

  let inTable = false;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let headerParsed = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());

      if (!inTable) {
        // Start new table
        inTable = true;
        currentTable = { headers: cells, rows: [] };
        headerParsed = false;
      } else if (!headerParsed && trimmed.includes('---')) {
        // Separator row - skip
        headerParsed = true;
      } else if (currentTable) {
        // Data row
        currentTable.rows.push(cells);
      }
    } else if (inTable && currentTable) {
      // End of table
      tables.push(currentTable);
      inTable = false;
      currentTable = null;
    }
  }

  // Handle table at end of content
  if (inTable && currentTable) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Extract bullet points from a section
 */
export function extractBulletPoints(content: string): string[] {
  const bullets: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bullets.push(trimmed.slice(2).trim());
    }
  }

  return bullets;
}

/**
 * Parse a source document from markdown content
 */
export function parseSourceDocument(markdown: string): ParsedSourceDocument {
  const lines = markdown.split('\n');

  const title = extractTitle(lines);
  const { metadata, endIndex } = parseMetadata(lines);

  // Get content without title line and metadata
  const contentLines = lines.filter((line, i) => {
    const trimmed = line.trim();
    // Skip title line
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      return false;
    }
    // Skip metadata lines
    if (i < endIndex && trimmed.startsWith('>')) {
      return false;
    }
    return true;
  });

  const content = contentLines.join('\n').trim();
  const sections = parseSections(content);

  return {
    metadata,
    title,
    content,
    sections,
    rawContent: markdown,
  };
}

/**
 * Get a specific section by heading (case-insensitive partial match)
 */
export function getSection(doc: ParsedSourceDocument, headingQuery: string): SourceSection | undefined {
  const query = headingQuery.toLowerCase();
  return doc.sections.find(s => s.heading.toLowerCase().includes(query));
}

/**
 * Get all sections matching a pattern
 */
export function getSections(doc: ParsedSourceDocument, headingQuery: string): SourceSection[] {
  const query = headingQuery.toLowerCase();
  return doc.sections.filter(s => s.heading.toLowerCase().includes(query));
}
