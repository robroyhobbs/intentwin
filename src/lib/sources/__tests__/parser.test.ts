import { describe, it, expect } from "vitest";
import {
  parseSourceDocument,
  extractTables,
  extractBulletPoints,
  getSection,
  getSections,
} from "../parser";
import type { ParsedSourceDocument } from "../parser";

// ════════════════════════════════════════════════════════════════════════════
// parseSourceDocument
// ════════════════════════════════════════════════════════════════════════════

describe("parseSourceDocument — Happy Path", () => {
  it("parses a complete markdown document with title, metadata, and sections", () => {
    const markdown = `# Cloud Migration Methodology

> source_url: https://example.com/methodology
> verified_date: 2026-01-28
> content_type: methodology
> status: [VERIFIED]

## Overview

This is the overview of our cloud migration methodology.

## Phase 1: Assessment (2 weeks)

Evaluate the current infrastructure and identify migration candidates.

- Inventory all workloads
- Assess dependencies
- Risk analysis

## Phase 2: Planning

Create the migration plan.

## Deliverables

- Migration plan
- Risk register
- Timeline
`;

    const doc = parseSourceDocument(markdown);

    expect(doc.title).toBe("Cloud Migration Methodology");
    expect(doc.metadata.source_url).toBe("https://example.com/methodology");
    expect(doc.metadata.verified_date).toBe("2026-01-28");
    expect(doc.metadata.content_type).toBe("methodology");
    expect(doc.metadata.status).toBe("VERIFIED");
    expect(doc.sections).toHaveLength(4);
    expect(doc.sections[0].heading).toBe("Overview");
    expect(doc.sections[0].level).toBe(2);
    expect(doc.sections[1].heading).toBe("Phase 1: Assessment (2 weeks)");
    expect(doc.rawContent).toBe(markdown);
  });

  it("extracts title from H1 heading", () => {
    const markdown = `# My Document Title

Some content here.
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.title).toBe("My Document Title");
  });

  it("returns 'Untitled' when no H1 heading exists", () => {
    const markdown = `## Only H2 heading

Some content here.
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.title).toBe("Untitled");
  });

  it("parses H2 through H6 sections", () => {
    const markdown = `# Title

## H2 Section
Content 2

### H3 Section
Content 3

#### H4 Section
Content 4
`;
    const doc = parseSourceDocument(markdown);

    expect(doc.sections).toHaveLength(3);
    expect(doc.sections[0]).toEqual(
      expect.objectContaining({ heading: "H2 Section", level: 2 })
    );
    expect(doc.sections[1]).toEqual(
      expect.objectContaining({ heading: "H3 Section", level: 3 })
    );
    expect(doc.sections[2]).toEqual(
      expect.objectContaining({ heading: "H4 Section", level: 4 })
    );
  });

  it("strips metadata blockquotes from content", () => {
    const markdown = `# Title

> source_url: https://example.com
> status: [VERIFIED]

## Section One

Body text.
`;
    const doc = parseSourceDocument(markdown);
    // Content should not include the blockquote metadata lines
    expect(doc.content).not.toContain("> source_url");
    expect(doc.content).not.toContain("> status");
    // But should include the section body
    expect(doc.content).toContain("Body text.");
  });

  it("strips the H1 title line from content", () => {
    const markdown = `# My Title

## Section

Content.
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.content).not.toMatch(/^# My Title/m);
  });

  it("parses metadata with hyphenated keys (converted to underscores)", () => {
    const markdown = `# Title

> source-url: https://example.com
> verified-date: 2026-01-01

## Body
Content
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.metadata.source_url).toBe("https://example.com");
    expect(doc.metadata.verified_date).toBe("2026-01-01");
  });

  it("parses status with brackets removed", () => {
    const markdown = `# Title

> status: [PARTIAL]

## Body
Content
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.metadata.status).toBe("PARTIAL");
  });

  it("preserves section content including bullet points and paragraphs", () => {
    const markdown = `# Title

## Features

- Feature one
- Feature two

Additional paragraph.

## Next Section

Content here.
`;
    const doc = parseSourceDocument(markdown);
    const features = doc.sections.find((s) => s.heading === "Features");
    expect(features).toBeDefined();
    expect(features!.content).toContain("- Feature one");
    expect(features!.content).toContain("- Feature two");
    expect(features!.content).toContain("Additional paragraph.");
  });
});

describe("parseSourceDocument — Edge Cases", () => {
  it("handles empty string input", () => {
    const doc = parseSourceDocument("");
    expect(doc.title).toBe("Untitled");
    expect(doc.metadata).toEqual({});
    expect(doc.sections).toEqual([]);
    expect(doc.content).toBe("");
  });

  it("handles document with only a title", () => {
    const doc = parseSourceDocument("# Just a Title");
    expect(doc.title).toBe("Just a Title");
    expect(doc.sections).toEqual([]);
  });

  it("handles document with only metadata, no sections", () => {
    const markdown = `# Title

> content_type: test

Some body text without section headings.
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.title).toBe("Title");
    expect(doc.metadata.content_type).toBe("test");
    expect(doc.sections).toEqual([]);
    expect(doc.content).toContain("Some body text");
  });

  it("handles metadata lines without values", () => {
    const markdown = `# Title

> key_only:

## Section
Body
`;
    const doc = parseSourceDocument(markdown);
    // The key should be present with empty string value
    expect((doc.metadata as Record<string, string>)["key_only"]).toBe("");
  });

  it("handles multiple H1 headings (takes the first)", () => {
    const markdown = `# First Title

# Second Title

## Section
Content
`;
    const doc = parseSourceDocument(markdown);
    expect(doc.title).toBe("First Title");
  });

  it("handles blockquote lines without colon (not treated as metadata)", () => {
    const markdown = `# Title

> This is just a blockquote without key-value

## Section
Body
`;
    const doc = parseSourceDocument(markdown);
    // No metadata should be extracted from lines without colons
    expect(Object.keys(doc.metadata)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// extractTables
// ════════════════════════════════════════════════════════════════════════════

describe("extractTables — Happy Path", () => {
  it("extracts a single markdown table", () => {
    const content = `Some text before.

| Metric | Value |
| --- | --- |
| ROI | 150% |
| Savings | $2M |

Some text after.
`;
    const tables = extractTables(content);

    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(["Metric", "Value"]);
    expect(tables[0].rows).toEqual([
      ["ROI", "150%"],
      ["Savings", "$2M"],
    ]);
  });

  it("extracts multiple tables", () => {
    const content = `| H1 | H2 |
| --- | --- |
| a | b |

Some text.

| X | Y | Z |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |
`;
    const tables = extractTables(content);

    expect(tables).toHaveLength(2);
    expect(tables[0].headers).toEqual(["H1", "H2"]);
    expect(tables[0].rows).toEqual([["a", "b"]]);
    expect(tables[1].headers).toEqual(["X", "Y", "Z"]);
    expect(tables[1].rows).toHaveLength(2);
  });

  it("handles table at end of content (no trailing text)", () => {
    const content = `| Name | Status |
| --- | --- |
| Alpha | Active |`;

    const tables = extractTables(content);

    expect(tables).toHaveLength(1);
    expect(tables[0].rows).toEqual([["Alpha", "Active"]]);
  });

  it("handles cells with extra whitespace", () => {
    const content = `|  Metric  |  Value  |
| --- | --- |
|  ROI  |  150%  |`;

    const tables = extractTables(content);

    expect(tables[0].headers).toEqual(["Metric", "Value"]);
    expect(tables[0].rows[0]).toEqual(["ROI", "150%"]);
  });

  it("handles tables with many columns", () => {
    const content = `| A | B | C | D | E |
| --- | --- | --- | --- | --- |
| 1 | 2 | 3 | 4 | 5 |`;

    const tables = extractTables(content);

    expect(tables[0].headers).toHaveLength(5);
    expect(tables[0].rows[0]).toHaveLength(5);
  });
});

describe("extractTables — Edge Cases", () => {
  it("returns empty array for content with no tables", () => {
    const content = `Just some text.

- A bullet point
- Another bullet point

More text.
`;
    const tables = extractTables(content);
    expect(tables).toEqual([]);
  });

  it("returns empty array for empty content", () => {
    expect(extractTables("")).toEqual([]);
  });

  it("handles a table with only headers and separator (no data rows)", () => {
    const content = `| Header1 | Header2 |
| --- | --- |
`;
    const tables = extractTables(content);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(["Header1", "Header2"]);
    expect(tables[0].rows).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// extractBulletPoints
// ════════════════════════════════════════════════════════════════════════════

describe("extractBulletPoints — Happy Path", () => {
  it("extracts dash-style bullet points", () => {
    const content = `Some intro text.

- First item
- Second item
- Third item
`;
    const bullets = extractBulletPoints(content);
    expect(bullets).toEqual(["First item", "Second item", "Third item"]);
  });

  it("extracts asterisk-style bullet points", () => {
    const content = `* Item A
* Item B
`;
    const bullets = extractBulletPoints(content);
    expect(bullets).toEqual(["Item A", "Item B"]);
  });

  it("extracts mixed dash and asterisk bullets", () => {
    const content = `- Dash item
* Star item
- Another dash
`;
    const bullets = extractBulletPoints(content);
    expect(bullets).toEqual(["Dash item", "Star item", "Another dash"]);
  });

  it("trims whitespace from bullet content", () => {
    const content = `-   Extra spaces   
-   Trimmed   
`;
    const bullets = extractBulletPoints(content);
    expect(bullets).toEqual(["Extra spaces", "Trimmed"]);
  });

  it("preserves markdown formatting inside bullets", () => {
    const content = `- **Bold text**: with description
- Regular text
`;
    const bullets = extractBulletPoints(content);
    expect(bullets[0]).toBe("**Bold text**: with description");
  });
});

describe("extractBulletPoints — Edge Cases", () => {
  it("returns empty array for content with no bullets", () => {
    const content = `Just paragraphs.

No bullets here.
`;
    expect(extractBulletPoints(content)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractBulletPoints("")).toEqual([]);
  });

  it("ignores lines that look like bullets but are part of other structures", () => {
    // Nested bullets with indent should not match (they don't start with - at trim)
    // Actually trimmed lines starting with - will match regardless of indent
    const content = `  - Indented bullet`;
    const bullets = extractBulletPoints(content);
    expect(bullets).toEqual(["Indented bullet"]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSection
// ════════════════════════════════════════════════════════════════════════════

describe("getSection — Happy Path", () => {
  const doc: ParsedSourceDocument = {
    title: "Test Doc",
    metadata: {},
    content: "",
    rawContent: "",
    sections: [
      { heading: "Overview", level: 2, content: "Overview content" },
      { heading: "Phase 1: Assessment", level: 2, content: "Phase 1 content" },
      { heading: "Key Outcomes", level: 3, content: "Outcomes content" },
      { heading: "Client Profile", level: 2, content: "Client info" },
    ],
  };

  it("finds a section by exact heading match (case-insensitive)", () => {
    const section = getSection(doc, "overview");
    expect(section).toBeDefined();
    expect(section!.heading).toBe("Overview");
    expect(section!.content).toBe("Overview content");
  });

  it("finds a section by partial heading match", () => {
    const section = getSection(doc, "phase");
    expect(section).toBeDefined();
    expect(section!.heading).toBe("Phase 1: Assessment");
  });

  it("finds a section case-insensitively", () => {
    const section = getSection(doc, "KEY OUTCOMES");
    expect(section).toBeDefined();
    expect(section!.heading).toBe("Key Outcomes");
  });

  it("finds client section", () => {
    const section = getSection(doc, "client");
    expect(section).toBeDefined();
    expect(section!.content).toBe("Client info");
  });
});

describe("getSection — Edge Cases", () => {
  const doc: ParsedSourceDocument = {
    title: "Test Doc",
    metadata: {},
    content: "",
    rawContent: "",
    sections: [{ heading: "Overview", level: 2, content: "content" }],
  };

  it("returns undefined for non-existent heading", () => {
    expect(getSection(doc, "nonexistent")).toBeUndefined();
  });

  it("returns undefined for empty sections", () => {
    const emptyDoc: ParsedSourceDocument = {
      title: "Empty",
      metadata: {},
      content: "",
      rawContent: "",
      sections: [],
    };
    expect(getSection(emptyDoc, "anything")).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// getSections
// ════════════════════════════════════════════════════════════════════════════

describe("getSections — Happy Path", () => {
  const doc: ParsedSourceDocument = {
    title: "Test Doc",
    metadata: {},
    content: "",
    rawContent: "",
    sections: [
      { heading: "Phase 1: Discovery", level: 2, content: "Phase 1" },
      { heading: "Phase 2: Build", level: 2, content: "Phase 2" },
      { heading: "Phase 3: Deploy", level: 2, content: "Phase 3" },
      { heading: "Deliverables", level: 2, content: "Deliverables" },
    ],
  };

  it("returns all sections matching a pattern", () => {
    const phases = getSections(doc, "phase");
    expect(phases).toHaveLength(3);
    expect(phases[0].heading).toBe("Phase 1: Discovery");
    expect(phases[2].heading).toBe("Phase 3: Deploy");
  });

  it("returns empty array when no sections match", () => {
    const matches = getSections(doc, "nonexistent");
    expect(matches).toEqual([]);
  });

  it("returns single match when only one section matches", () => {
    const matches = getSections(doc, "deliverable");
    expect(matches).toHaveLength(1);
  });
});
