import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeTitle,
  sanitizeEmail,
  sanitizeObject,
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

describe("sanitizeEmail", () => {
  it("accepts valid email", () => {
    expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
  });

  it("lowercases email", () => {
    expect(sanitizeEmail("Test@EXAMPLE.com")).toBe("test@example.com");
  });

  it("trims whitespace", () => {
    expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
  });

  it("returns empty for invalid email", () => {
    expect(sanitizeEmail("not-an-email")).toBe("");
    expect(sanitizeEmail("@no-local.com")).toBe("");
  });

  it("returns empty for non-string input", () => {
    expect(sanitizeEmail(null)).toBe("");
    expect(sanitizeEmail(123)).toBe("");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes string values in objects", () => {
    const obj = { name: "<b>Test</b>", count: 42 };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.name).toBe("Test");
    expect(sanitized.count).toBe(42);
  });

  it("sanitizes nested objects", () => {
    const obj = { inner: { value: "<script>xss</script>" } };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.inner.value).toBe("xss");
  });

  it("sanitizes arrays", () => {
    const arr = ["<b>a</b>", "<i>b</i>"];
    const sanitized = sanitizeObject(arr);
    expect(sanitized).toEqual(["a", "b"]);
  });

  it("preserves null and undefined", () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });

  it("limits recursion depth", () => {
    const deep = { a: { b: { c: { d: "  <b>deep</b>  " } } } };
    const sanitized = sanitizeObject(deep, 2);
    // At depth 2, the inner object is returned as-is
    expect(sanitized.a.b).toEqual({ c: { d: "  <b>deep</b>  " } });
  });
});
