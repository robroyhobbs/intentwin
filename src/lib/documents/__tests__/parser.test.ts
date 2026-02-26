/**
 * Parser Dispatcher — Unit Tests
 *
 * Tests the parseDocument function that routes to the correct file-type parser.
 * Mocks all individual parsers to isolate dispatcher logic.
 */

// ── Module Mocks ───────────────────────────────────────────────────────────

const mockParseDocx = vi.fn();
const mockParsePdf = vi.fn();
const mockParsePptx = vi.fn();
const mockParseTxt = vi.fn();
const mockParseMd = vi.fn();
const mockParseXlsx = vi.fn();

vi.mock("@/lib/documents/parsers/docx", () => ({
  parseDocx: (...args: unknown[]) => mockParseDocx(...args),
}));

vi.mock("@/lib/documents/parsers/pdf", () => ({
  parsePdf: (...args: unknown[]) => mockParsePdf(...args),
}));

vi.mock("@/lib/documents/parsers/pptx", () => ({
  parsePptx: (...args: unknown[]) => mockParsePptx(...args),
}));

vi.mock("@/lib/documents/parsers/text", () => ({
  parseTxt: (...args: unknown[]) => mockParseTxt(...args),
  parseMd: (...args: unknown[]) => mockParseMd(...args),
}));

vi.mock("@/lib/documents/parsers/xlsx", () => ({
  parseXlsx: (...args: unknown[]) => mockParseXlsx(...args),
}));

import { parseDocument } from "@/lib/documents/parser";

// ── Setup ──────────────────────────────────────────────────────────────────

const dummyBuffer = Buffer.from("test content");
const dummySections = [{ heading: "Test", content: "Test content" }];

beforeEach(() => {
  vi.clearAllMocks();
  mockParseDocx.mockResolvedValue(dummySections);
  mockParsePdf.mockResolvedValue(dummySections);
  mockParsePptx.mockResolvedValue(dummySections);
  mockParseTxt.mockResolvedValue(dummySections);
  mockParseMd.mockResolvedValue(dummySections);
  mockParseXlsx.mockResolvedValue(dummySections);
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTING
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocument — Routing", () => {
  it("routes docx to parseDocx", async () => {
    await parseDocument(dummyBuffer, "docx");

    expect(mockParseDocx).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParsePdf).not.toHaveBeenCalled();
    expect(mockParsePptx).not.toHaveBeenCalled();
    expect(mockParseTxt).not.toHaveBeenCalled();
    expect(mockParseMd).not.toHaveBeenCalled();
  });

  it("routes pdf to parsePdf", async () => {
    await parseDocument(dummyBuffer, "pdf");

    expect(mockParsePdf).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });

  it("routes pptx to parsePptx", async () => {
    await parseDocument(dummyBuffer, "pptx");

    expect(mockParsePptx).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });

  it("routes txt to parseTxt", async () => {
    await parseDocument(dummyBuffer, "txt");

    expect(mockParseTxt).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });

  it("routes md to parseMd", async () => {
    await parseDocument(dummyBuffer, "md");

    expect(mockParseMd).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });

  it("routes xlsx to parseXlsx", async () => {
    await parseDocument(dummyBuffer, "xlsx");

    expect(mockParseXlsx).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });

  it("routes xls to parseXlsx", async () => {
    await parseDocument(dummyBuffer, "xls");

    expect(mockParseXlsx).toHaveBeenCalledWith(dummyBuffer);
    expect(mockParseDocx).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// RETURN VALUES
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocument — Return Values", () => {
  it("returns the result from the delegate parser", async () => {
    const expected = [
      { heading: "Custom", content: "Custom content" },
      { heading: "Section 2", content: "More content" },
    ];
    mockParseDocx.mockResolvedValue(expected);

    const result = await parseDocument(dummyBuffer, "docx");

    expect(result).toEqual(expected);
  });

  it("passes through errors from delegate parsers", async () => {
    mockParsePdf.mockRejectedValue(new Error("PDF parse failure"));

    await expect(parseDocument(dummyBuffer, "pdf")).rejects.toThrow("PDF parse failure");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// BAD PATH
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocument — Bad Path", () => {
  it("throws Error for unsupported file type", async () => {
    await expect(parseDocument(dummyBuffer, "csv")).rejects.toThrow("Unsupported file type: csv");
  });

  it("throws Error for empty file type string", async () => {
    await expect(parseDocument(dummyBuffer, "")).rejects.toThrow("Unsupported file type: ");
  });

  it("throws Error for arbitrary file type", async () => {
    await expect(parseDocument(dummyBuffer, "exe")).rejects.toThrow("Unsupported file type: exe");
  });

  it("file type matching is case-sensitive", async () => {
    // "PDF" (uppercase) should not match "pdf" (lowercase)
    await expect(parseDocument(dummyBuffer, "PDF")).rejects.toThrow("Unsupported file type: PDF");
  });

  it("file type matching is exact (no partial matches)", async () => {
    await expect(parseDocument(dummyBuffer, "docxx")).rejects.toThrow("Unsupported file type: docxx");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EXPORTED TYPES
// ════════════════════════════════════════════════════════════════════════════

describe("parseDocument — ParsedSection interface", () => {
  it("returns objects matching ParsedSection shape", async () => {
    const sections = await parseDocument(dummyBuffer, "docx");

    sections.forEach((section) => {
      expect(section).toHaveProperty("heading");
      expect(section).toHaveProperty("content");
    });
  });
});
