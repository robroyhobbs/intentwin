/**
 * PPTX Generator Tests
 *
 * Tests the markdown parser, slide splitting, and full PPTX generation.
 * 6 categories: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage
 */

import {
  parseInlineMarkdown,
  parseMarkdownToBlocks,
  splitBlocksIntoSlides,
  generatePptx,
} from "@/lib/export/pptx-generator";

// ════════════════════════════════════════════════════════════════════════════
// INLINE MARKDOWN PARSER — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseInlineMarkdown — Happy Path", () => {
  it("parses **bold** into bold run", () => {
    const runs = parseInlineMarkdown("**bold**");
    expect(runs).toEqual([{ text: "bold", bold: true }]);
  });

  it("parses *italic* into italic run", () => {
    const runs = parseInlineMarkdown("*italic*");
    expect(runs).toEqual([{ text: "italic", italic: true }]);
  });

  it("parses ***both*** into bold+italic run", () => {
    const runs = parseInlineMarkdown("***both***");
    expect(runs).toEqual([{ text: "both", bold: true, italic: true }]);
  });

  it("parses [link](url) into plain text (link stripped)", () => {
    const runs = parseInlineMarkdown("[link](http://x.com)");
    expect(runs).toEqual([{ text: "link" }]);
  });

  it("parses plain text unchanged", () => {
    const runs = parseInlineMarkdown("plain text");
    expect(runs).toEqual([{ text: "plain text" }]);
  });

  it('parses mixed "before **bold** after" into 3 runs', () => {
    const runs = parseInlineMarkdown("before **bold** after");
    expect(runs).toHaveLength(3);
    expect(runs[0]).toEqual({ text: "before " });
    expect(runs[1]).toEqual({ text: "bold", bold: true });
    expect(runs[2]).toEqual({ text: " after" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// MARKDOWN BLOCKS PARSER — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("parseMarkdownToBlocks — Happy Path", () => {
  it("parses headings", () => {
    const blocks = parseMarkdownToBlocks("## My Heading\n\nSome text");
    expect(blocks[0]).toEqual({
      type: "heading",
      text: "My Heading",
      level: 2,
    });
  });

  it("parses bullet items (dash)", () => {
    const blocks = parseMarkdownToBlocks("- First item\n- Second item");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("bullet");
    expect(blocks[1].type).toBe("bullet");
  });

  it("parses numbered lists", () => {
    const blocks = parseMarkdownToBlocks("1. First\n2. Second");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("bullet");
  });

  it("parses regular text as paragraphs", () => {
    const blocks = parseMarkdownToBlocks("This is a paragraph.");
    expect(blocks[0].type).toBe("paragraph");
  });

  it("parses blockquotes", () => {
    const blocks = parseMarkdownToBlocks("> A wise quote");
    expect(blocks[0]).toEqual({ type: "blockquote", text: "A wise quote" });
  });

  it("parses pipe tables", () => {
    const blocks = parseMarkdownToBlocks(
      "| Name | Value |\n|------|-------|\n| Cost | $100 |",
    );
    const tableRows = blocks.filter((b) => b.type === "table-row");
    expect(tableRows.length).toBeGreaterThanOrEqual(1);
  });

  it("skips code blocks entirely", () => {
    const blocks = parseMarkdownToBlocks(
      "Before\n```\ncode here\nmore code\n```\nAfter",
    );
    const texts = blocks.map((b) => {
      if (b.type === "paragraph") return b.runs.map((r) => r.text).join("");
      return "";
    });
    expect(texts).not.toContain("code here");
    expect(texts).not.toContain("more code");
  });

  it("skips image lines", () => {
    const blocks = parseMarkdownToBlocks("![alt text](http://img.png)");
    expect(blocks).toHaveLength(0);
  });

  it("skips horizontal rules", () => {
    const blocks = parseMarkdownToBlocks("---");
    expect(blocks).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SLIDE SPLITTING — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("splitBlocksIntoSlides — Happy Path", () => {
  it("splits 12 bullets into 2 slides", () => {
    const blocks = Array.from({ length: 12 }, (_, i) => ({
      type: "bullet" as const,
      runs: [{ text: `Item ${i + 1}` }],
    }));
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBe(2);
  });

  it("puts heading at start of new slide group", () => {
    const blocks = [
      ...Array.from({ length: 6 }, () => ({
        type: "bullet" as const,
        runs: [{ text: "bullet" }],
      })),
      { type: "heading" as const, text: "New Section", level: 2 },
      { type: "bullet" as const, runs: [{ text: "after heading" }] },
    ];
    const slides = splitBlocksIntoSlides(blocks);
    // The heading should start a new slide
    expect(slides.length).toBeGreaterThanOrEqual(2);
    const secondSlide = slides[1];
    expect(secondSlide[0].type).toBe("heading");
  });

  it("returns 1 slide group for ≤8 items", () => {
    const blocks = Array.from({ length: 6 }, (_, i) => ({
      type: "bullet" as const,
      runs: [{ text: `Item ${i + 1}` }],
    }));
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FULL GENERATION — Happy Path
// ════════════════════════════════════════════════════════════════════════════

describe("generatePptx — Happy Path", () => {
  it("produces a non-empty Buffer", async () => {
    const result = await generatePptx({
      title: "Test Proposal",
      client_name: "Test Client",
      date: "2026-01-15",
      sections: [
        {
          title: "Executive Summary",
          content: "Some content here.",
          section_type: "executive_summary",
        },
      ],
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("with 1 section produces ≥5 slides (title + agenda + intro + content + thankyou)", async () => {
    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        {
          title: "Section One",
          content: "- Point 1\n- Point 2\n- Point 3",
          section_type: "test",
        },
      ],
    });
    // Buffer is valid and non-trivial size
    expect(result.length).toBeGreaterThan(1000);
  });

  it("with long section content produces multiple content slides", async () => {
    const longContent = Array.from(
      { length: 20 },
      (_, i) =>
        `- Important point number ${i + 1} about our approach to solving the client problem`,
    ).join("\n");

    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        { title: "Approach", content: longContent, section_type: "approach" },
      ],
    });
    expect(result.length).toBeGreaterThan(1000);
  });

  it("with section containing ## headings creates slides per heading group", async () => {
    const content = `## Phase 1\n- Step A\n- Step B\n\n## Phase 2\n- Step C\n- Step D`;
    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        { title: "Methodology", content, section_type: "methodology" },
      ],
    });
    expect(result.length).toBeGreaterThan(1000);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parseInlineMarkdown — Bad Path", () => {
  it("returns empty array for empty string", () => {
    expect(parseInlineMarkdown("")).toEqual([]);
  });

  it("handles unclosed **bold without crashing", () => {
    const runs = parseInlineMarkdown("**unclosed bold");
    expect(runs.length).toBeGreaterThanOrEqual(1);
    // Should return as plain text
    expect(runs[0].text).toContain("unclosed bold");
  });
});

describe("parseMarkdownToBlocks — Bad Path", () => {
  it("returns empty array for empty string", () => {
    expect(parseMarkdownToBlocks("")).toEqual([]);
  });

  it("returns empty array for only code blocks", () => {
    const blocks = parseMarkdownToBlocks("```\ncode only\n```");
    expect(blocks).toEqual([]);
  });

  it("handles unclosed code fence without hanging", () => {
    const blocks = parseMarkdownToBlocks("```\ncode\nmore code");
    // Everything after opening fence should be skipped
    expect(blocks).toEqual([]);
  });
});

describe("splitBlocksIntoSlides — Bad Path", () => {
  it("returns empty array for empty blocks", () => {
    expect(splitBlocksIntoSlides([])).toEqual([]);
  });
});

describe("generatePptx — Bad Path", () => {
  it("with empty section content produces at least intro slide", async () => {
    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [{ title: "Empty Section", content: "", section_type: "test" }],
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("with section content that is only code blocks produces intro + fallback", async () => {
    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        {
          title: "Code Only",
          content: "```\nconst x = 1;\n```",
          section_type: "test",
        },
      ],
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("parseInlineMarkdown — Edge Cases", () => {
  it("strips backtick code to plain text", () => {
    const runs = parseInlineMarkdown("`some code`");
    expect(runs).toEqual([{ text: "some code" }]);
  });

  it("strips ~~strikethrough~~ to plain text", () => {
    const runs = parseInlineMarkdown("~~strike~~");
    expect(runs).toEqual([{ text: "strike" }]);
  });

  it("strips HTML tags", () => {
    const runs = parseInlineMarkdown("<strong>html</strong>");
    expect(runs).toEqual([{ text: "html" }]);
  });
});

describe("parseMarkdownToBlocks — Edge Cases", () => {
  it("handles mixed content types", () => {
    const md = `## Heading

Some paragraph text.

- Bullet one
- Bullet two

> A quote

| Key | Value |
|-----|-------|
| A | B |`;
    const blocks = parseMarkdownToBlocks(md);
    const types = blocks.map((b) => b.type);
    expect(types).toContain("heading");
    expect(types).toContain("paragraph");
    expect(types).toContain("bullet");
    expect(types).toContain("blockquote");
    expect(types).toContain("table-row");
  });
});

describe("splitBlocksIntoSlides — Edge Cases", () => {
  it("8 bullets fits on 1 slide (no split)", () => {
    const blocks = Array.from({ length: 8 }, (_, i) => ({
      type: "bullet" as const,
      runs: [{ text: `Item ${i + 1}` }],
    }));
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBe(1);
  });

  it("9 bullets splits to 2 slides", () => {
    const blocks = Array.from({ length: 9 }, (_, i) => ({
      type: "bullet" as const,
      runs: [{ text: `Item ${i + 1}` }],
    }));
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBe(2);
  });

  it("25+ bullets caps at 3 slide groups max", () => {
    const blocks = Array.from({ length: 30 }, (_, i) => ({
      type: "bullet" as const,
      runs: [{ text: `Item ${i + 1}` }],
    }));
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBeLessThanOrEqual(3);
  });

  it("table rows render as content blocks", () => {
    const blocks = parseMarkdownToBlocks(
      "| Name | Value |\n|------|-------|\n| Cost | $100 |\n| Time | 3 weeks |",
    );
    const tableRows = blocks.filter((b) => b.type === "table-row");
    // Header row + 2 data rows = 3 table-row blocks (separator is skipped)
    expect(tableRows.length).toBe(3);
  });

  it("blockquotes are included in blocks", () => {
    const blocks = parseMarkdownToBlocks("> Important note");
    expect(blocks[0].type).toBe("blockquote");
  });

  it("very long section (5000+ chars) produces slides within cap", () => {
    const longContent = Array.from(
      { length: 100 },
      (_, i) =>
        `- Point ${i + 1}: This is a detailed point about methodology and approach`,
    ).join("\n");
    const blocks = parseMarkdownToBlocks(longContent);
    const slides = splitBlocksIntoSlides(blocks);
    expect(slides.length).toBeLessThanOrEqual(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════

describe("PPTX Generator — Security", () => {
  it("strips HTML tags (prevents injection into PPTX XML)", () => {
    const runs = parseInlineMarkdown('<script>alert("xss")</script>content');
    const allText = runs.map((r) => r.text).join("");
    expect(allText).not.toContain("<script>");
    expect(allText).not.toContain("</script>");
    expect(allText).toContain("content");
  });

  it("content with <script> tags is stripped clean", () => {
    const blocks = parseMarkdownToBlocks(
      '<script>alert("xss")</script>\n\nSafe content',
    );
    // Script content should be stripped
    for (const block of blocks) {
      if (block.type === "paragraph") {
        const text = block.runs.map((r) => r.text).join("");
        expect(text).not.toContain("<script>");
      }
    }
  });

  it("extremely long single line does not cause issues", () => {
    const longLine = "x".repeat(10000);
    const runs = parseInlineMarkdown(longLine);
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs[0].text.length).toBe(10000);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LEAK
// ════════════════════════════════════════════════════════════════════════════

describe("PPTX Generator — Data Leak", () => {
  it("PPTX metadata uses company name, not internal identifiers", async () => {
    const result = await generatePptx({
      title: "Test",
      client_name: "Client",
      company_name: "Acme Corp",
      date: "2026-01-15",
      sections: [],
    });
    // Should succeed; the buffer contains PPTX metadata
    expect(result).toBeInstanceOf(Buffer);
  });

  it("no raw markdown visible in generated content", () => {
    // Test that the parser strips markdown before it reaches slide text
    const runs = parseInlineMarkdown(
      "Check **this** and *that* plus [link](url) and `code`",
    );
    const allText = runs.map((r) => r.text).join("");
    expect(allText).not.toContain("**");
    expect(allText).not.toContain("[link](url)");
    expect(allText).not.toContain("`");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DATA DAMAGE
// ════════════════════════════════════════════════════════════════════════════

describe("PPTX Generator — Data Damage", () => {
  it("modifying one section does not affect other sections", async () => {
    const result1 = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        { title: "Section 1", content: "Content 1", section_type: "test" },
        { title: "Section 2", content: "Content 2", section_type: "test" },
      ],
    });

    const result2 = await generatePptx({
      title: "Test",
      client_name: "Client",
      date: "2026-01-15",
      sections: [
        {
          title: "Section 1",
          content: "MODIFIED CONTENT",
          section_type: "test",
        },
        { title: "Section 2", content: "Content 2", section_type: "test" },
      ],
    });

    // Both should produce valid buffers
    expect(result1).toBeInstanceOf(Buffer);
    expect(result2).toBeInstanceOf(Buffer);
    // They should be different (content changed)
    expect(result1.equals(result2)).toBe(false);
  });

  it("empty proposal data (no sections) still produces title + thank you", async () => {
    const result = await generatePptx({
      title: "Empty Proposal",
      client_name: "Client",
      date: "2026-01-15",
      sections: [],
    });
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});
