import { describe, it, expect } from "vitest";
import { nurtureDay1Email } from "../templates/nurture-day1";
import { nurtureDay3Email } from "../templates/nurture-day3";
import { nurtureDay7Email } from "../templates/nurture-day7";
import { nurtureDay14Email } from "../templates/nurture-day14";

// ════════════════════════════════════════════════════════════════════════════
// HAPPY PATH — Each template returns valid HTML with expected content
// ════════════════════════════════════════════════════════════════════════════

const testParams = { name: "Jane Doe", company: "Acme Corp" };

describe("Nurture Email Templates — Happy Path", () => {
  describe("nurtureDay1Email", () => {
    it("returns a non-empty HTML string", () => {
      const html = nurtureDay1Email(testParams);
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(100);
    });

    it("contains a DOCTYPE and html structure", () => {
      const html = nurtureDay1Email(testParams);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("includes the first name in the greeting", () => {
      const html = nurtureDay1Email(testParams);
      expect(html).toContain("Jane");
    });

    it("contains proposal failure messaging", () => {
      const html = nurtureDay1Email(testParams);
      expect(html).toContain("proposals fail");
    });

    it("includes a CTA link", () => {
      const html = nurtureDay1Email(testParams);
      expect(html).toContain("href=");
      expect(html).toContain("intentbid.com");
    });
  });

  describe("nurtureDay3Email", () => {
    it("returns a non-empty HTML string", () => {
      const html = nurtureDay3Email(testParams);
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(100);
    });

    it("contains the 6-Layer framework content", () => {
      const html = nurtureDay3Email(testParams);
      expect(html).toContain("Company Truth");
      expect(html).toContain("Brand Voice");
    });

    it("includes the first name in the greeting", () => {
      const html = nurtureDay3Email(testParams);
      expect(html).toContain("Jane");
    });

    it("includes a CTA link", () => {
      const html = nurtureDay3Email(testParams);
      expect(html).toContain("href=");
      expect(html).toContain("intentbid.com");
    });
  });

  describe("nurtureDay7Email", () => {
    it("returns a non-empty HTML string", () => {
      const html = nurtureDay7Email(testParams);
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(100);
    });

    it("contains target audience segments", () => {
      const html = nurtureDay7Email(testParams);
      expect(html).toContain("Consulting Firms");
      expect(html).toContain("Government Contractors");
    });

    it("includes the first name in the greeting", () => {
      const html = nurtureDay7Email(testParams);
      expect(html).toContain("Jane");
    });

    it("includes a CTA link", () => {
      const html = nurtureDay7Email(testParams);
      expect(html).toContain("href=");
      expect(html).toContain("intentbid.com");
    });
  });

  describe("nurtureDay14Email", () => {
    it("returns a non-empty HTML string", () => {
      const html = nurtureDay14Email(testParams);
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(100);
    });

    it("contains access/waitlist update messaging", () => {
      const html = nurtureDay14Email(testParams);
      expect(html).toContain("access");
      expect(html).toContain("reviewed");
    });

    it("includes the first name in the greeting", () => {
      const html = nurtureDay14Email(testParams);
      expect(html).toContain("Jane");
    });

    it("mentions the pricing", () => {
      const html = nurtureDay14Email(testParams);
      expect(html).toContain("$999");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SECURITY — HTML escaping
// ════════════════════════════════════════════════════════════════════════════

describe("Nurture Email Templates — Security", () => {
  it("escapes HTML special characters in the name", () => {
    const xssParams = { name: '<script>alert("xss")</script>', company: "Safe Corp" };
    const html = nurtureDay1Email(xssParams);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes ampersands in the name", () => {
    const ampParams = { name: "Tom & Jerry", company: "Warner" };
    const html = nurtureDay3Email(ampParams);

    // First name is "Tom", which has no special chars
    // But let's test with a name that has & in the first part
    const ampFirstName = { name: "A&B Smith", company: "Test" };
    const html2 = nurtureDay7Email(ampFirstName);
    expect(html2).toContain("A&amp;B");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Nurture Email Templates — Edge Cases", () => {
  it("handles a single-word name (no space to split)", () => {
    const singleName = { name: "Madonna", company: "Music Inc" };
    const html = nurtureDay1Email(singleName);
    expect(html).toContain("Madonna");
  });

  it("handles names with multiple spaces (uses first part)", () => {
    const longName = { name: "Mary Jane Watson-Parker", company: "Daily Bugle" };
    const html = nurtureDay14Email(longName);
    expect(html).toContain("Mary");
  });
});
