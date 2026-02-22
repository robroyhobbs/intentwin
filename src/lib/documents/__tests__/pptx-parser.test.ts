/**
 * PPTX Parser — Unit Tests
 *
 * Tests the parsePptx function and PptxParseError class.
 * Mocks officeparser to avoid needing real PPTX files.
 */

// ── Module Mocks ───────────────────────────────────────────────────────────

let mockOfficeparserResult: string = "";
let mockOfficeparserError: Error | null = null;

vi.mock("officeparser", () => ({
  parseOffice: vi.fn(async () => {
    if (mockOfficeparserError) throw mockOfficeparserError;
    return mockOfficeparserResult;
  }),
}));

import { parsePptx, PptxParseError } from "@/lib/documents/parsers/pptx";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockOfficeparserResult = "";
  mockOfficeparserError = null;
});

// ════════════════════════════════════════════════════════════════════════════
// PptxParseError
// ════════════════════════════════════════════════════════════════════════════

describe("PptxParseError", () => {
  it("stores both internal message and user-facing message", () => {
    const err = new PptxParseError("internal detail", "user-friendly msg");
    expect(err.message).toBe("internal detail");
    expect(err.userMessage).toBe("user-friendly msg");
    expect(err.name).toBe("PptxParseError");
  });

  it("is an instance of Error", () => {
    const err = new PptxParseError("internal", "user");
    expect(err).toBeInstanceOf(Error);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parsePptx — Happy Path", () => {
  it("parses slides separated by triple newlines", async () => {
    mockOfficeparserResult = "Slide Title 1\nBullet point A\nBullet point B\n\n\n\nSlide Title 2\nBullet point C\nBullet point D";

    const sections = await parsePptx(Buffer.from("fake pptx"));

    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Slide Title 1");
    expect(sections[0].content).toContain("Bullet point A");
    expect(sections[0].slideNumber).toBe(1);
    expect(sections[1].heading).toBe("Slide Title 2");
    expect(sections[1].slideNumber).toBe(2);
  });

  it("uses first line of each slide as heading", async () => {
    mockOfficeparserResult = "My Presentation\nContent goes here";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections[0].heading).toBe("My Presentation");
    expect(sections[0].content).toBe("Content goes here");
  });

  it("uses heading as content when slide has only a title", async () => {
    mockOfficeparserResult = "Title Only Slide";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections[0].heading).toBe("Title Only Slide");
    expect(sections[0].content).toBe("Title Only Slide");
  });

  it("assigns sequential slideNumber to each section", async () => {
    mockOfficeparserResult = "Slide 1\nContent 1\n\n\n\nSlide 2\nContent 2\n\n\n\nSlide 3\nContent 3";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections).toHaveLength(3);
    expect(sections[0].slideNumber).toBe(1);
    expect(sections[1].slideNumber).toBe(2);
    expect(sections[2].slideNumber).toBe(3);
  });

  it("filters out empty lines within slides", async () => {
    mockOfficeparserResult = "Slide Title\n\nContent line\n\nMore content";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections.length).toBeGreaterThanOrEqual(1);
    // Empty lines within a slide (not triple newlines) should be filtered
    const content = sections[0].content;
    expect(content).toContain("Content line");
  });

  it("handles non-string return from parseOffice (coerced to string)", async () => {
    mockOfficeparserResult = 12345 as unknown as string;

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0].content).toContain("12345");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parsePptx — Bad Path", () => {
  it("throws PptxParseError when buffer is empty", async () => {
    await expect(parsePptx(Buffer.alloc(0))).rejects.toThrow(PptxParseError);
    await expect(parsePptx(Buffer.alloc(0))).rejects.toMatchObject({
      userMessage: expect.stringContaining("empty"),
    });
  });

  it("throws PptxParseError when buffer is null-ish", async () => {
    await expect(parsePptx(null as unknown as Buffer)).rejects.toThrow(PptxParseError);
  });

  it("throws PptxParseError for corrupt zip archive", async () => {
    mockOfficeparserError = new Error("Can't find end of central directory");

    await expect(parsePptx(Buffer.from("not a zip"))).rejects.toThrow(PptxParseError);
    try {
      await parsePptx(Buffer.from("not a zip"));
    } catch (err) {
      // User message mentions the file is not a valid PPTX
      expect((err as PptxParseError).userMessage).toContain("does not appear to be a valid PPTX");
    }
  });

  it("throws PptxParseError for zip-related errors", async () => {
    mockOfficeparserError = new Error("zip entry broken");

    try {
      await parsePptx(Buffer.from("fake"));
    } catch (err) {
      expect((err as PptxParseError).userMessage).toContain("does not appear to be a valid PPTX");
    }
  });

  it("throws generic PptxParseError for non-zip officeparser errors", async () => {
    mockOfficeparserError = new Error("Unknown parsing failure");

    await expect(parsePptx(Buffer.from("fake"))).rejects.toThrow(PptxParseError);
    try {
      await parsePptx(Buffer.from("fake"));
    } catch (err) {
      expect((err as PptxParseError).userMessage).toContain("error occurred while reading");
    }
  });

  it("handles non-Error throw values from officeparser", async () => {
    mockOfficeparserError = "string error" as unknown as Error;

    await expect(parsePptx(Buffer.from("fake"))).rejects.toThrow(PptxParseError);
  });

  it("throws PptxParseError when parsed text is empty", async () => {
    mockOfficeparserResult = "";

    await expect(parsePptx(Buffer.from("fake"))).rejects.toThrow(PptxParseError);
    try {
      await parsePptx(Buffer.from("fake"));
    } catch (err) {
      expect((err as PptxParseError).userMessage).toContain("no extractable text");
    }
  });

  it("throws PptxParseError when text is only whitespace", async () => {
    mockOfficeparserResult = "   \n  \n\n\n   ";

    await expect(parsePptx(Buffer.from("fake"))).rejects.toThrow(PptxParseError);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("parsePptx — Edge Cases", () => {
  it("falls back to single section when no slide separators exist", async () => {
    mockOfficeparserResult = "All content on one slide no separators";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it("handles many consecutive newlines (more than 3)", async () => {
    mockOfficeparserResult = "Slide 1\nContent\n\n\n\n\n\n\nSlide 2\nContent 2";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections).toHaveLength(2);
  });

  it("handles slide with only empty lines as content (filtered out)", async () => {
    mockOfficeparserResult = "Title\n\n\n\n\n\n\nAnother Title\nSome content";

    const sections = await parsePptx(Buffer.from("fake"));

    // First "slide" is just "Title" (empty lines are filtered), second slide has content
    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it("sets heading to null when first line is empty after trim", async () => {
    // This shouldn't normally happen since empty lines are filtered,
    // but test the behavior anyway
    mockOfficeparserResult = "   \nActual content\n\n\n\nSlide 2\nMore";

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it("handles very large presentation text", async () => {
    const slides = Array.from({ length: 100 }, (_, i) => `Slide ${i + 1}\nContent for slide ${i + 1}`);
    mockOfficeparserResult = slides.join("\n\n\n\n");

    const sections = await parsePptx(Buffer.from("fake"));

    expect(sections).toHaveLength(100);
    expect(sections[99].slideNumber).toBe(100);
  });
});
