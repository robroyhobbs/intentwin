import { describe, it, expect, vi } from "vitest";
import type { ProposalData, BrandingSettings } from "../slides/types";

// Mock mermaid conversion (no actual image processing in tests)
vi.mock("@/lib/diagrams/mermaid-to-svg", () => ({
  batchMermaidToImages: vi.fn().mockResolvedValue(new Map()),
}));
vi.mock("@/lib/diagrams/extract-mermaid", () => ({
  extractMermaidBlocks: vi.fn().mockImplementation((content: string) => [
    { type: "text", content },
  ]),
}));

const { generateHtml } = await import("../html-generator");

function makeData(overrides?: Partial<ProposalData>): ProposalData {
  return {
    title: "Test Proposal",
    client_name: "Acme Corp",
    company_name: "TestCo",
    date: "Feb 23, 2026",
    sections: [
      { title: "Overview", content: "Some content here.", section_type: "executive_summary" },
    ],
    ...overrides,
  };
}

const customBranding: BrandingSettings = {
  primary_color: "#FF0000",
  secondary_color: "#00FF00",
  accent_color: "#0000FF",
  font_family: "Georgia",
  header_text: "ACME Industries",
  footer_text: "Top Secret",
  logo_url: "https://example.com/logo.png",
};

describe("generateHtml", () => {
  describe("default branding (no branding provided)", () => {
    it("uses default brand colors in CSS variables", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain("--brand-primary: #0070AD");
      expect(html).toContain("--brand-dark: #1B365D");
      expect(html).toContain("--brand-accent: #12ABDB");
    });

    it("uses company name as hero label", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain("TestCo Proposal");
    });

    it("uses Confidential as default footer text", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain("Confidential");
    });

    it("does not render a logo when logo_url is empty", async () => {
      const html = await generateHtml(makeData());
      expect(html).not.toContain("<img src=");
    });

    it("sets theme-color meta to default primary", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain('content="#0070AD"');
    });
  });

  describe("custom branding", () => {
    it("applies custom colors to CSS variables", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain("--brand-primary: #FF0000");
      expect(html).toContain("--brand-dark: #00FF00");
      expect(html).toContain("--brand-accent: #0000FF");
    });

    it("applies custom font family", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain("'Georgia'");
    });

    it("uses header_text in hero label", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain("ACME Industries Proposal");
    });

    it("uses footer_text in hero meta", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain("Top Secret");
    });

    it("uses footer_text in document footer", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      // Footer should contain the custom footer text, not the default confidential message
      expect(html).toContain("Top Secret");
    });

    it("renders logo when logo_url is provided", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      // escapeHtml converts / to &#x2F; and " to &quot; in attributes
      expect(html).toContain("<img src=");
      expect(html).toContain("example.com");
      expect(html).toContain("logo.png");
      expect(html).toContain("ACME Industries");
    });

    it("sets theme-color meta to custom primary", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain('content="#FF0000"');
    });

    it("uses custom colors in hero gradient", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      expect(html).toContain("#00FF00 30%"); // secondary in gradient
      expect(html).toContain("#FF0000 70%"); // primary in gradient
      expect(html).toContain("#0000FF 100%"); // accent in gradient
    });

    it("uses custom accent color for hero dot", async () => {
      const html = await generateHtml(makeData({ branding: customBranding }));
      // Dot background uses accent_color
      expect(html).toContain("background: #0000FF;");
    });
  });

  describe("partial branding (some fields overridden)", () => {
    it("falls back to defaults for missing fields", async () => {
      const partial: BrandingSettings = {
        primary_color: "#AA0000",
        secondary_color: "#1B365D",
        accent_color: "#12ABDB",
        font_family: "Helvetica",
      };
      const html = await generateHtml(makeData({ branding: partial }));
      expect(html).toContain("--brand-primary: #AA0000");
      // Missing header_text should fall back to company_name
      expect(html).toContain("TestCo Proposal");
      // Missing footer_text should fall back to "Confidential"
      expect(html).toContain("Confidential");
    });
  });

  describe("structure", () => {
    it("produces valid HTML with doctype", async () => {
      const html = await generateHtml(makeData());
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain("</html>");
    });

    it("renders sections with correct titles", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain("Overview");
    });

    it("includes TOC links", async () => {
      const html = await generateHtml(makeData());
      expect(html).toContain('class="toc-item"');
      expect(html).toContain("#overview");
    });

    it("uses inline fonts when option is set", async () => {
      const html = await generateHtml(makeData(), { inlineFonts: true });
      expect(html).toContain("@font-face");
      expect(html).not.toContain("fonts.googleapis.com");
    });

    it("uses Google Fonts link when inlineFonts is false", async () => {
      const html = await generateHtml(makeData(), { inlineFonts: false });
      expect(html).toContain("fonts.googleapis.com");
    });
  });
});
