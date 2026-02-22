/**
 * DOCX Parser — Unit Tests
 *
 * Tests the parseDocx function and DocxParseError class.
 * Mocks mammoth to avoid needing real DOCX files.
 */

// ── Module Mocks ───────────────────────────────────────────────────────────

let mockMammothResult: { value: string; messages: Array<{ type: string; message: string }> } = {
  value: "",
  messages: [],
};
let mockMammothError: Error | null = null;

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn(async () => {
      if (mockMammothError) throw mockMammothError;
      return mockMammothResult;
    }),
  },
}));

import { parseDocx, DocxParseError } from "@/lib/documents/parsers/docx";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockMammothResult = { value: "", messages: [] };
  mockMammothError = null;
});

// ════════════════════════════════════════════════════════════════════════════
// DocxParseError
// ════════════════════════════════════════════════════════════════════════════

describe("DocxParseError", () => {
  it("stores both internal message and user-facing message", () => {
    const err = new DocxParseError("internal detail", "user-friendly msg");
    expect(err.message).toBe("internal detail");
    expect(err.userMessage).toBe("user-friendly msg");
    expect(err.name).toBe("DocxParseError");
  });

  it("is an instance of Error", () => {
    const err = new DocxParseError("internal", "user");
    expect(err).toBeInstanceOf(Error);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocx — Happy Path", () => {
  it("parses HTML with headings into sections", async () => {
    mockMammothResult = {
      value: "<h1>Introduction</h1><p>Welcome to the document.</p><h2>Details</h2><p>Some details here.</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake docx data"));

    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Introduction");
    expect(sections[0].content).toBe("Welcome to the document.");
    expect(sections[1].heading).toBe("Details");
    expect(sections[1].content).toBe("Some details here.");
  });

  it("returns content before first heading as a null-heading section", async () => {
    mockMammothResult = {
      value: "<p>Preamble text here.</p><h1>First Section</h1><p>Body text.</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake docx data"));

    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toBe("Preamble text here.");
    expect(sections[1].heading).toBe("First Section");
  });

  it("handles document with no headings as single section", async () => {
    mockMammothResult = {
      value: "<p>Just some text with no headings at all.</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake docx data"));

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toBe("Just some text with no headings at all.");
  });

  it("strips HTML entities from output", async () => {
    mockMammothResult = {
      value: "<p>AT&amp;T uses &lt;angle brackets&gt; and &quot;quotes&quot; with &#39;apostrophes&#39;</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake docx data"));

    expect(sections[0].content).toBe('AT&T uses <angle brackets> and "quotes" with \'apostrophes\'');
  });

  it("strips &nbsp; from output", async () => {
    mockMammothResult = {
      value: "<p>Word&nbsp;with&nbsp;spaces</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections[0].content).toBe("Word with spaces");
  });

  it("handles multiple heading levels (h1-h6)", async () => {
    mockMammothResult = {
      value: "<h1>H1</h1><p>Content 1</p><h3>H3</h3><p>Content 3</p><h6>H6</h6><p>Content 6</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe("H1");
    expect(sections[1].heading).toBe("H3");
    expect(sections[2].heading).toBe("H6");
  });

  it("includes heading-only sections when heading has no body content", async () => {
    mockMammothResult = {
      value: "<h1>Heading Only</h1><h2>Another Heading</h2><p>Some content</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    // "Heading Only" has empty content but heading.length > 0, so it's included
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const headingOnly = sections.find((s) => s.heading === "Heading Only");
    expect(headingOnly).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocx — Bad Path", () => {
  it("throws DocxParseError when buffer is empty", async () => {
    await expect(parseDocx(Buffer.alloc(0))).rejects.toThrow(DocxParseError);
    await expect(parseDocx(Buffer.alloc(0))).rejects.toMatchObject({
      userMessage: expect.stringContaining("empty"),
    });
  });

  it("throws DocxParseError when buffer is null-ish", async () => {
    await expect(parseDocx(null as unknown as Buffer)).rejects.toThrow(DocxParseError);
  });

  it("throws DocxParseError for corrupt zip archive", async () => {
    mockMammothError = new Error("Can't find end of central directory");

    await expect(parseDocx(Buffer.from("not a zip"))).rejects.toThrow(DocxParseError);
    try {
      await parseDocx(Buffer.from("not a zip"));
    } catch (err) {
      const e = err as DocxParseError;
      expect(e.userMessage).toContain("ZIP");
    }
  });

  it("throws DocxParseError for zip-related errors", async () => {
    mockMammothError = new Error("zip file error something went wrong");

    try {
      await parseDocx(Buffer.from("fake"));
    } catch (err) {
      const e = err as DocxParseError;
      expect(e.userMessage).toContain("ZIP");
    }
  });

  it("throws generic DocxParseError for non-zip mammoth errors", async () => {
    mockMammothError = new Error("Something completely different broke");

    await expect(parseDocx(Buffer.from("fake"))).rejects.toThrow(DocxParseError);
    try {
      await parseDocx(Buffer.from("fake"));
    } catch (err) {
      const e = err as DocxParseError;
      expect(e.userMessage).toContain("error occurred while reading");
    }
  });

  it("throws DocxParseError when mammoth throws non-Error value", async () => {
    mockMammothError = "string error" as unknown as Error;

    await expect(parseDocx(Buffer.from("fake"))).rejects.toThrow(DocxParseError);
  });

  it("throws DocxParseError when parsed HTML is empty", async () => {
    mockMammothResult = { value: "", messages: [] };

    await expect(parseDocx(Buffer.from("fake"))).rejects.toThrow(DocxParseError);
    try {
      await parseDocx(Buffer.from("fake"));
    } catch (err) {
      const e = err as DocxParseError;
      expect(e.userMessage).toContain("no extractable text");
    }
  });

  it("throws DocxParseError when HTML has only whitespace/tags", async () => {
    mockMammothResult = { value: "<p>   </p><p>  </p>", messages: [] };

    await expect(parseDocx(Buffer.from("fake"))).rejects.toThrow(DocxParseError);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocx — Edge Cases", () => {
  it("handles deeply nested HTML tags", async () => {
    mockMammothResult = {
      value: "<div><span><strong><em>Deep text</em></strong></span></div>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections).toHaveLength(1);
    expect(sections[0].content).toBe("Deep text");
  });

  it("collapses multiple whitespace into single space", async () => {
    mockMammothResult = {
      value: "<p>Word    with      many       spaces</p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections[0].content).toBe("Word with many spaces");
  });

  it("handles HTML with attributes on heading tags", async () => {
    mockMammothResult = {
      value: '<h1 class="title" style="color:red">Styled Heading</h1><p>Content</p>',
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections[0].heading).toBe("Styled Heading");
  });

  it("handles very large HTML output", async () => {
    const bigContent = "A".repeat(100_000);
    mockMammothResult = {
      value: `<p>${bigContent}</p>`,
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));

    expect(sections).toHaveLength(1);
    expect(sections[0].content.length).toBe(100_000);
  });

  it("handles interleaved headings and empty paragraphs", async () => {
    mockMammothResult = {
      value: "<h1>First</h1><p></p><p>Content</p><h2>Second</h2><p></p>",
      messages: [],
    };

    const sections = await parseDocx(Buffer.from("fake"));
    // "First" heading should have "Content" as body
    const first = sections.find((s) => s.heading === "First");
    expect(first).toBeDefined();
    expect(first!.content).toBe("Content");
  });
});
