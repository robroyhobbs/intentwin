import { describe, it, expect } from "vitest";
import type { ProposalData, BrandingSettings } from "../slides/types";
import { generateDocx } from "../docx-generator";

// PizZip for inspecting the generated DOCX
const PizZip = require("pizzip");

function makeData(overrides?: Partial<ProposalData>): ProposalData {
  return {
    title: "Test Proposal",
    client_name: "Acme Corp",
    company_name: "TestCo",
    date: "Feb 23, 2026",
    sections: [
      { title: "Executive Summary", content: "This is the **executive** summary.", section_type: "executive_summary" },
      { title: "Technical Approach", content: "## Architecture\n\nOur *approach* uses:\n- Microservices\n- Kubernetes\n\n1. Phase one\n2. Phase two", section_type: "approach" },
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

function extractXml(buf: Buffer, path: string): string {
  const zip = new PizZip(buf);
  return zip.file(path)?.asText() || "";
}

describe("generateDocx", () => {
  describe("generates valid DOCX", () => {
    it("returns a Buffer", () => {
      const buf = generateDocx(makeData());
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    it("contains required OOXML parts", () => {
      const buf = generateDocx(makeData());
      const zip = new PizZip(buf);
      expect(zip.file("[Content_Types].xml")).toBeTruthy();
      expect(zip.file("_rels/.rels")).toBeTruthy();
      expect(zip.file("word/document.xml")).toBeTruthy();
      expect(zip.file("word/styles.xml")).toBeTruthy();
      expect(zip.file("word/numbering.xml")).toBeTruthy();
      expect(zip.file("word/header1.xml")).toBeTruthy();
      expect(zip.file("word/footer1.xml")).toBeTruthy();
      expect(zip.file("word/_rels/document.xml.rels")).toBeTruthy();
    });
  });

  describe("document content", () => {
    it("includes proposal title", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("Test Proposal");
    });

    it("includes client name", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("Acme Corp");
    });

    it("includes date", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("Feb 23, 2026");
    });

    it("includes section titles", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("Executive Summary");
      expect(xml).toContain("Technical Approach");
    });

    it("includes section numbers", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("01");
      expect(xml).toContain("02");
    });

    it("converts markdown bold to OOXML bold", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("<w:b/>");
      expect(xml).toContain("executive");
    });

    it("converts markdown italic to OOXML italic", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain("<w:i/>");
      expect(xml).toContain("approach");
    });

    it("converts markdown headings to Heading styles", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain('w:val="Heading2"');
      expect(xml).toContain("Architecture");
    });

    it("converts bullet lists to ListBullet style", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain('w:val="ListBullet"');
      expect(xml).toContain("Microservices");
    });

    it("converts ordered lists to ListNumber style", () => {
      const xml = extractXml(generateDocx(makeData()), "word/document.xml");
      expect(xml).toContain('w:val="ListNumber"');
      expect(xml).toContain("Phase one");
    });
  });

  describe("default branding", () => {
    it("uses default colors in styles.xml", () => {
      const xml = extractXml(generateDocx(makeData()), "word/styles.xml");
      expect(xml).toContain("0070AD"); // primary
      expect(xml).toContain("1B365D"); // secondary
      expect(xml).toContain("12ABDB"); // accent
    });

    it("uses Inter font family", () => {
      const xml = extractXml(generateDocx(makeData()), "word/styles.xml");
      expect(xml).toContain('w:ascii="Inter"');
    });

    it("uses company name in header", () => {
      const xml = extractXml(generateDocx(makeData()), "word/header1.xml");
      expect(xml).toContain("TestCo");
    });

    it("uses Confidential in footer", () => {
      const xml = extractXml(generateDocx(makeData()), "word/footer1.xml");
      expect(xml).toContain("Confidential");
    });

    it("includes page number fields in footer", () => {
      const xml = extractXml(generateDocx(makeData()), "word/footer1.xml");
      expect(xml).toContain("PAGE");
      expect(xml).toContain("NUMPAGES");
    });
  });

  describe("custom branding", () => {
    it("applies custom colors to styles.xml", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/styles.xml");
      expect(xml).toContain("FF0000"); // primary
      expect(xml).toContain("00FF00"); // secondary
      expect(xml).toContain("0000FF"); // accent
    });

    it("applies custom font family", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/styles.xml");
      expect(xml).toContain('w:ascii="Georgia"');
    });

    it("uses header_text in header", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/header1.xml");
      expect(xml).toContain("ACME Industries");
    });

    it("uses footer_text in footer", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/footer1.xml");
      expect(xml).toContain("Top Secret");
    });

    it("uses custom accent color in numbering", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/numbering.xml");
      expect(xml).toContain("0000FF");
    });

    it("uses custom colors in section headers", () => {
      const xml = extractXml(generateDocx(makeData({ branding: customBranding })), "word/document.xml");
      expect(xml).toContain("FF0000"); // primary used for section numbers
    });
  });

  describe("partial branding", () => {
    it("falls back to company_name for header when header_text missing", () => {
      const partial: BrandingSettings = {
        primary_color: "#AA0000",
        secondary_color: "#1B365D",
        accent_color: "#12ABDB",
        font_family: "Helvetica",
      };
      const xml = extractXml(generateDocx(makeData({ branding: partial })), "word/header1.xml");
      expect(xml).toContain("TestCo");
    });

    it("falls back to Confidential for footer when footer_text missing", () => {
      const partial: BrandingSettings = {
        primary_color: "#AA0000",
        secondary_color: "#1B365D",
        accent_color: "#12ABDB",
        font_family: "Helvetica",
      };
      const xml = extractXml(generateDocx(makeData({ branding: partial })), "word/footer1.xml");
      expect(xml).toContain("Confidential");
    });
  });

  describe("table handling", () => {
    it("converts markdown tables to OOXML tables", () => {
      const data = makeData({
        sections: [
          {
            title: "Pricing",
            content: "| Item | Cost |\n|------|------|\n| Widget | $100 |\n| Gadget | $200 |",
            section_type: "pricing",
          },
        ],
      });
      const xml = extractXml(generateDocx(data), "word/document.xml");
      expect(xml).toContain("<w:tbl>");
      expect(xml).toContain("Widget");
      expect(xml).toContain("$100");
    });
  });

  describe("XML safety", () => {
    it("escapes special characters in content", () => {
      const data = makeData({
        sections: [
          {
            title: "Security & Compliance",
            content: "Use <strong> tags & \"quotes\" safely.",
            section_type: "security",
          },
        ],
      });
      const xml = extractXml(generateDocx(data), "word/document.xml");
      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;strong&gt;");
      expect(xml).not.toContain("<strong>");
    });
  });
});
