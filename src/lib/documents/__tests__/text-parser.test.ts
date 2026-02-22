/**
 * Text/Markdown/CSV Parser — Unit Tests
 *
 * Tests parseTxt, parseMd, parseCsv functions and TextParseError class.
 * No external mocks needed — these are pure functions operating on Buffer.
 */

import { parseTxt, parseMd, parseCsv, TextParseError } from "@/lib/documents/parsers/text";

// ════════════════════════════════════════════════════════════════════════════
// TextParseError
// ════════════════════════════════════════════════════════════════════════════

describe("TextParseError", () => {
  it("stores both internal message and user-facing message", () => {
    const err = new TextParseError("internal detail", "user-friendly msg");
    expect(err.message).toBe("internal detail");
    expect(err.userMessage).toBe("user-friendly msg");
    expect(err.name).toBe("TextParseError");
  });

  it("is an instance of Error", () => {
    const err = new TextParseError("internal", "user");
    expect(err).toBeInstanceOf(Error);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTxt — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseTxt — Happy Path", () => {
  it("parses simple text as a single section with null heading", async () => {
    const buf = Buffer.from("This is a simple text file with no structure.");
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toBe("This is a simple text file with no structure.");
  });

  it("splits text by double newlines into blocks", async () => {
    const buf = Buffer.from("Block one content.\n\nBlock two content.\n\nBlock three content.");
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(3);
  });

  it("treats short first line as heading when rest exists", async () => {
    const buf = Buffer.from("Introduction\nThis is the body of the introduction section. It contains details.");
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Introduction");
    expect(sections[0].content).toContain("body of the introduction");
  });

  it("does not treat line ending with period as heading", async () => {
    const buf = Buffer.from("This line ends with a period.\nThis is the rest of the content.");
    const sections = await parseTxt(buf);

    expect(sections[0].heading).toBeNull();
  });

  it("does not treat long first line as heading", async () => {
    const longLine = "A".repeat(120);
    const buf = Buffer.from(`${longLine}\nSome more content follows.`);
    const sections = await parseTxt(buf);

    expect(sections[0].heading).toBeNull();
  });

  it("handles multiple blocks with headings", async () => {
    const buf = Buffer.from(
      "Overview\nThis section covers the overview.\n\n" +
      "Technical Details\nThis section covers technical specifics.\n\n" +
      "Conclusion\nFinal thoughts and next steps."
    );
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe("Overview");
    expect(sections[1].heading).toBe("Technical Details");
    expect(sections[2].heading).toBe("Conclusion");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTxt — Bad Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseTxt — Bad Path", () => {
  it("throws TextParseError when buffer is empty", async () => {
    await expect(parseTxt(Buffer.alloc(0))).rejects.toThrow(TextParseError);
    await expect(parseTxt(Buffer.alloc(0))).rejects.toMatchObject({
      userMessage: expect.stringContaining("empty"),
    });
  });

  it("throws TextParseError when buffer is null-ish", async () => {
    await expect(parseTxt(null as unknown as Buffer)).rejects.toThrow(TextParseError);
  });

  it("throws TextParseError when buffer is only whitespace", async () => {
    await expect(parseTxt(Buffer.from("   \n  \t  \n  "))).rejects.toThrow(TextParseError);
    try {
      await parseTxt(Buffer.from("   \n  \t  \n  "));
    } catch (err) {
      expect((err as TextParseError).userMessage).toContain("no readable content");
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseTxt — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("parseTxt — Edge Cases", () => {
  it("handles single-line file", async () => {
    const buf = Buffer.from("Just one line");
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toBe("Just one line");
  });

  it("handles many blank lines between blocks", async () => {
    const buf = Buffer.from("Block one\n\n\n\n\n\nBlock two");
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(2);
  });

  it("handles first line that is empty string (no heading)", async () => {
    const buf = Buffer.from("\nBody content here.");
    const sections = await parseTxt(buf);

    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it("handles unicode content", async () => {
    const buf = Buffer.from("Überblick\nDies ist eine Zusammenfassung.");
    const sections = await parseTxt(buf);

    expect(sections[0].heading).toBe("Überblick");
    expect(sections[0].content).toContain("Zusammenfassung");
  });

  it("handles very large text file", async () => {
    const bigText = Array.from({ length: 1000 }, (_, i) => `Paragraph ${i}`).join("\n\n");
    const buf = Buffer.from(bigText);
    const sections = await parseTxt(buf);

    expect(sections).toHaveLength(1000);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseMd — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseMd — Happy Path", () => {
  it("splits markdown by headings", async () => {
    const md = "# Introduction\nWelcome to the doc.\n\n## Details\nHere are details.\n\n### Sub-detail\nMore info.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe("Introduction");
    expect(sections[1].heading).toBe("Details");
    expect(sections[2].heading).toBe("Sub-detail");
  });

  it("captures content before first heading as null-heading section", async () => {
    const md = "Preamble text\n\n# First Section\nContent.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toContain("Preamble");
    expect(sections[1].heading).toBe("First Section");
  });

  it("handles all heading levels (h1-h6)", async () => {
    const md = "# H1\nContent 1\n## H2\nContent 2\n### H3\nContent 3\n#### H4\nContent 4\n##### H5\nContent 5\n###### H6\nContent 6";
    const sections = await parseMd(Buffer.from(md));

    expect(sections).toHaveLength(6);
    expect(sections[5].heading).toBe("H6");
  });

  it("uses heading as content when section has no body", async () => {
    const md = "# Empty Section\n# Next Section\nSome content.";
    const sections = await parseMd(Buffer.from(md));

    const empty = sections.find((s) => s.heading === "Empty Section");
    expect(empty).toBeDefined();
    expect(empty!.content).toBe("Empty Section");
  });

  it("handles markdown with no headings", async () => {
    const md = "Just plain text\nWith multiple lines\nBut no headings.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toContain("Just plain text");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseMd — Bad Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseMd — Bad Path", () => {
  it("throws TextParseError when buffer is empty", async () => {
    await expect(parseMd(Buffer.alloc(0))).rejects.toThrow(TextParseError);
    await expect(parseMd(Buffer.alloc(0))).rejects.toMatchObject({
      userMessage: expect.stringContaining("empty"),
    });
  });

  it("throws TextParseError when buffer is null-ish", async () => {
    await expect(parseMd(null as unknown as Buffer)).rejects.toThrow(TextParseError);
  });

  it("throws TextParseError when buffer is only whitespace", async () => {
    await expect(parseMd(Buffer.from("   \n  \t  "))).rejects.toThrow(TextParseError);
    try {
      await parseMd(Buffer.from("   \n  \t  "));
    } catch (err) {
      expect((err as TextParseError).userMessage).toContain("no readable content");
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseMd — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("parseMd — Edge Cases", () => {
  it("does not treat ## without space as heading", async () => {
    const md = "##NotAHeading\nSome content.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toContain("##NotAHeading");
  });

  it("handles heading with inline formatting", async () => {
    const md = "# **Bold Heading**\nContent here.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections[0].heading).toBe("**Bold Heading**");
  });

  it("preserves multiline content within a section", async () => {
    const md = "# Section\nLine 1\nLine 2\nLine 3";
    const sections = await parseMd(Buffer.from(md));

    expect(sections[0].content).toContain("Line 1");
    expect(sections[0].content).toContain("Line 2");
    expect(sections[0].content).toContain("Line 3");
  });

  it("handles empty lines between heading and content", async () => {
    const md = "# Title\n\n\nContent after blank lines.";
    const sections = await parseMd(Buffer.from(md));

    expect(sections[0].heading).toBe("Title");
    expect(sections[0].content).toContain("Content after blank lines.");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseCsv — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseCsv — Happy Path", () => {
  it("parses CSV into a single section with CSV Data heading", async () => {
    const csv = "Name,Age,City\nAlice,30,NYC\nBob,25,LA";
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("CSV Data");
    expect(sections[0].content).toContain("Name,Age,City");
    expect(sections[0].content).toContain("Alice,30,NYC");
  });

  it("returns null heading for single-row CSV", async () => {
    const csv = "Header1,Header2,Header3";
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
  });

  it("filters out empty lines", async () => {
    const csv = "Name,Age\n\nAlice,30\n\nBob,25";
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections[0].content).not.toContain("\n\n");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseCsv — Bad Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseCsv — Bad Path", () => {
  it("throws TextParseError when buffer is empty", async () => {
    await expect(parseCsv(Buffer.alloc(0))).rejects.toThrow(TextParseError);
    await expect(parseCsv(Buffer.alloc(0))).rejects.toMatchObject({
      userMessage: expect.stringContaining("empty"),
    });
  });

  it("throws TextParseError when buffer is null-ish", async () => {
    await expect(parseCsv(null as unknown as Buffer)).rejects.toThrow(TextParseError);
  });

  it("throws TextParseError when buffer is only whitespace", async () => {
    await expect(parseCsv(Buffer.from("   \n  \t  "))).rejects.toThrow(TextParseError);
    try {
      await parseCsv(Buffer.from("   \n  \t  "));
    } catch (err) {
      expect((err as TextParseError).userMessage).toContain("no readable content");
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// parseCsv — Edge Cases
// ════════════════════════════════════════════════════════════════════════════

describe("parseCsv — Edge Cases", () => {
  it("handles CSV with quoted fields containing commas", async () => {
    const csv = 'Name,Description\n"Smith, John","Works at ""Acme"""';
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain('"Smith, John"');
  });

  it("handles large CSV data", async () => {
    const header = "Col1,Col2,Col3";
    const rows = Array.from({ length: 500 }, (_, i) => `val${i},val${i + 1},val${i + 2}`);
    const csv = [header, ...rows].join("\n");
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("CSV Data");
  });

  it("handles CSV with Unicode content", async () => {
    const csv = "Name,City\nJürgen,München\nFrançois,Paris";
    const sections = await parseCsv(Buffer.from(csv));

    expect(sections[0].content).toContain("Jürgen");
    expect(sections[0].content).toContain("München");
  });
});
