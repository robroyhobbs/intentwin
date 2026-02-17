import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeTitle,
} from "@/lib/security/sanitize";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('value="test"')).toBe("value=&quot;test&quot;");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<b>bold</b> text")).toBe("bold text");
  });

  it("removes script tags and content markers", () => {
    expect(stripHtml("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml("line<br/>break")).toBe("linebreak");
  });

  it("preserves text without tags", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

describe("sanitizeString", () => {
  it("strips HTML and trims whitespace", () => {
    expect(sanitizeString("  <b>hello</b>  ")).toBe("hello");
  });

  it("limits length", () => {
    const long = "a".repeat(20000);
    expect(sanitizeString(long).length).toBe(10000);
  });

  it("returns empty for non-string input", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
    expect(sanitizeString(123)).toBe("");
  });

  it("respects custom maxLength", () => {
    expect(sanitizeString("hello world", 5)).toBe("hello");
  });
});

describe("sanitizeTitle", () => {
  it("limits to 500 characters", () => {
    const long = "t".repeat(1000);
    expect(sanitizeTitle(long).length).toBe(500);
  });

  it("strips HTML from titles", () => {
    expect(sanitizeTitle("<h1>Title</h1>")).toBe("Title");
  });
});


