/**
 * Chunker — Unit Tests
 *
 * Tests the chunkSections function that splits parsed sections into
 * token-bounded chunks with overlap.
 * Mocks js-tiktoken to avoid needing the full tokenizer.
 */

// ── Module Mocks ───────────────────────────────────────────────────────────

// Approximate token counting: split on whitespace, each word = 1 token
vi.mock("js-tiktoken", () => ({
  encodingForModel: vi.fn(() => ({
    encode: (text: string) => {
      // Simple tokenizer mock: each word = one token
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      return words; // length = word count
    },
  })),
}));

import { chunkSections, type Chunk } from "@/lib/documents/chunker";
import type { ParsedSection } from "@/lib/documents/parser";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSection(opts: Partial<ParsedSection> & { content: string }): ParsedSection {
  return {
    heading: opts.heading ?? null,
    content: opts.content,
    pageNumber: opts.pageNumber,
    slideNumber: opts.slideNumber,
  };
}

/** Generate a string with approximately N words */
function wordsOf(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
}

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH
// ════════════════════════════════════════════════════════════════════════════

describe("chunkSections — Happy Path", () => {
  it("returns empty array for empty sections input", () => {
    const chunks = chunkSections([]);
    expect(chunks).toEqual([]);
  });

  it("produces a single chunk for small section", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "This is a short section with just a few words." }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("short section");
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].sectionHeading).toBeNull();
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it("preserves section heading in chunk metadata", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Executive Summary", content: "Brief content here." }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks[0].sectionHeading).toBe("Executive Summary");
    // Content should include heading prepended
    expect(chunks[0].content).toContain("Executive Summary");
  });

  it("preserves pageNumber in chunk metadata", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "Page content.", pageNumber: 5 }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks[0].pageNumber).toBe(5);
  });

  it("preserves slideNumber in chunk metadata", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "Slide content.", slideNumber: 3 }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks[0].slideNumber).toBe(3);
  });

  it("assigns sequential chunkIndex across multiple sections", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "First section content." }),
      makeSection({ content: "Second section content." }),
      makeSection({ content: "Third section content." }),
    ];

    const chunks = chunkSections(sections);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i);
    }
  });

  it("includes tokenCount on every chunk", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "Some content words here." }),
    ];

    const chunks = chunkSections(sections);

    chunks.forEach((chunk) => {
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(typeof chunk.tokenCount).toBe("number");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LARGE SECTION SPLITTING
// ════════════════════════════════════════════════════════════════════════════

describe("chunkSections — Large Section Splitting", () => {
  it("splits large section into multiple chunks", () => {
    // Create a section with ~2000 words (well above MAX_CHUNK_SIZE of 1024)
    const sections: ParsedSection[] = [
      makeSection({ content: wordsOf(2000) }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("all chunks from a large section share the same sectionHeading", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Big Section", content: wordsOf(2000) }),
    ];

    const chunks = chunkSections(sections);

    chunks.forEach((chunk) => {
      expect(chunk.sectionHeading).toBe("Big Section");
    });
  });

  it("all chunks from a large section share the same pageNumber", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: wordsOf(2000), pageNumber: 7 }),
    ];

    const chunks = chunkSections(sections);

    chunks.forEach((chunk) => {
      expect(chunk.pageNumber).toBe(7);
    });
  });

  it("chunks have overlap (adjacent chunks share some content)", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: wordsOf(2000) }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks.length).toBeGreaterThan(1);

    // Verify overlap by checking that the last word(s) of chunk N appear
    // somewhere in chunk N+1 (due to sliding window overlap)
    // Use a wider window since the overlap mechanism steps back by a fraction of words
    const chunk0Words = chunks[0].content.split(/\s+/);
    const chunk1Words = chunks[1].content.split(/\s+/);

    // The first word of chunk 1 should be a word that also appeared in chunk 0
    // (since the sliding window steps back by overlapWords from the end)
    const chunk1Start = chunk1Words[0];
    const chunk0HasChunk1Start = chunk0Words.includes(chunk1Start);
    expect(chunk0HasChunk1Start).toBe(true);
  });

  it("no chunk exceeds a reasonable size", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: wordsOf(5000) }),
    ];

    const chunks = chunkSections(sections);

    // With our mock tokenizer (1 word = 1 token), TARGET_CHUNK_SIZE is 512
    // Chunks might slightly exceed TARGET but not by a huge margin
    chunks.forEach((chunk) => {
      // Allow some tolerance (chunk might be slightly over target due to word boundaries)
      expect(chunk.tokenCount).toBeLessThanOrEqual(1100);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("chunkSections — Edge Cases", () => {
  it("handles section with empty content (still included if non-blank)", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Title Only", content: "" }),
    ];

    const chunks = chunkSections(sections);

    // Heading prepended = "Title Only\n\n" — short but should still be included
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("handles whitespace-only content sections", () => {
    const sections: ParsedSection[] = [
      makeSection({ content: "   " }),
    ];

    const chunks = chunkSections(sections);

    // Whitespace-only after trim should be excluded
    expect(chunks).toHaveLength(0);
  });

  it("handles multiple sections with varying sizes", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Small", content: "Just a few words." }),
      makeSection({ heading: "Large", content: wordsOf(2000) }),
      makeSection({ heading: "Medium", content: wordsOf(300) }),
    ];

    const chunks = chunkSections(sections);

    // Should have at least 3 chunks (1 small + multiple from large + 1 medium)
    expect(chunks.length).toBeGreaterThanOrEqual(3);

    // Verify indexes are sequential
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i);
    }
  });

  it("handles section with heading but content is just the heading", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Overview", content: "Overview" }),
    ];

    const chunks = chunkSections(sections);

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].sectionHeading).toBe("Overview");
  });

  it("returns chunks with Chunk interface shape", () => {
    const sections: ParsedSection[] = [
      makeSection({ heading: "Test", content: "Test content.", pageNumber: 1, slideNumber: 2 }),
    ];

    const chunks = chunkSections(sections);
    const chunk: Chunk = chunks[0];

    expect(chunk).toHaveProperty("content");
    expect(chunk).toHaveProperty("chunkIndex");
    expect(chunk).toHaveProperty("sectionHeading");
    expect(chunk).toHaveProperty("pageNumber");
    expect(chunk).toHaveProperty("slideNumber");
    expect(chunk).toHaveProperty("tokenCount");
  });
});
