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

/** Generate DOCX and extract a specific XML part from the zip */
async function genAndExtract(data: ProposalData, path: string): Promise<string> {
  const buf = await generateDocx(data);
  const zip = new PizZip(buf);
  return zip.file(path)?.asText() || "";
}

describe("generateDocx", () => {
  describe("generates valid DOCX", () => {
    it("returns a Buffer", async () => {
      const buf = await generateDocx(makeData());
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    it("contains required OOXML parts", async () => {
      const buf = await generateDocx(makeData());
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
    it("includes proposal title", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("Test Proposal");
    });

    it("includes client name", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("Acme Corp");
    });

    it("includes date", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("Feb 23, 2026");
    });

    it("includes section titles", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("Executive Summary");
      expect(xml).toContain("Technical Approach");
    });

    it("includes section numbers", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("01");
      expect(xml).toContain("02");
    });

    it("converts markdown bold to OOXML bold", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("<w:b/>");
      expect(xml).toContain("executive");
    });

    it("converts markdown italic to OOXML italic", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("<w:i/>");
      expect(xml).toContain("approach");
    });

    it("converts markdown headings to Heading styles", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain('w:val="Heading2"');
      expect(xml).toContain("Architecture");
    });

    it("converts bullet lists to ListBullet style", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain('w:val="ListBullet"');
      expect(xml).toContain("Microservices");
    });

    it("converts ordered lists to ListNumber style", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain('w:val="ListNumber"');
      expect(xml).toContain("Phase one");
    });
  });

  describe("default branding", () => {
    it("uses default colors in styles.xml", async () => {
      const xml = await genAndExtract(makeData(), "word/styles.xml");
      expect(xml).toContain("0070AD"); // primary
      expect(xml).toContain("1B365D"); // secondary
      expect(xml).toContain("12ABDB"); // accent
    });

    it("uses Inter font family", async () => {
      const xml = await genAndExtract(makeData(), "word/styles.xml");
      expect(xml).toContain('w:ascii="Inter"');
    });

    it("uses company name in header", async () => {
      const xml = await genAndExtract(makeData(), "word/header1.xml");
      expect(xml).toContain("TestCo");
    });

    it("uses Confidential in footer", async () => {
      const xml = await genAndExtract(makeData(), "word/footer1.xml");
      expect(xml).toContain("Confidential");
    });

    it("includes page number fields in footer", async () => {
      const xml = await genAndExtract(makeData(), "word/footer1.xml");
      expect(xml).toContain("PAGE");
      expect(xml).toContain("NUMPAGES");
    });
  });

  describe("custom branding", () => {
    it("applies custom colors to styles.xml", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/styles.xml");
      expect(xml).toContain("FF0000"); // primary
      expect(xml).toContain("00FF00"); // secondary
      expect(xml).toContain("0000FF"); // accent
    });

    it("applies custom font family", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/styles.xml");
      expect(xml).toContain('w:ascii="Georgia"');
    });

    it("uses header_text in header", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/header1.xml");
      expect(xml).toContain("ACME Industries");
    });

    it("uses footer_text in footer", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/footer1.xml");
      expect(xml).toContain("Top Secret");
    });

    it("uses custom accent color in numbering", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/numbering.xml");
      expect(xml).toContain("0000FF");
    });

    it("uses custom colors in section headers", async () => {
      const xml = await genAndExtract(makeData({ branding: customBranding }), "word/document.xml");
      expect(xml).toContain("FF0000"); // primary used for section numbers
    });
  });

  describe("partial branding", () => {
    it("falls back to company_name for header when header_text missing", async () => {
      const partial: BrandingSettings = {
        primary_color: "#AA0000",
        secondary_color: "#1B365D",
        accent_color: "#12ABDB",
        font_family: "Helvetica",
      };
      const xml = await genAndExtract(makeData({ branding: partial }), "word/header1.xml");
      expect(xml).toContain("TestCo");
    });

    it("falls back to Confidential for footer when footer_text missing", async () => {
      const partial: BrandingSettings = {
        primary_color: "#AA0000",
        secondary_color: "#1B365D",
        accent_color: "#12ABDB",
        font_family: "Helvetica",
      };
      const xml = await genAndExtract(makeData({ branding: partial }), "word/footer1.xml");
      expect(xml).toContain("Confidential");
    });
  });

  describe("table handling", () => {
    it("converts markdown tables to OOXML tables", async () => {
      const data = makeData({
        sections: [
          {
            title: "Pricing",
            content: "| Item | Cost |\n|------|------|\n| Widget | $100 |\n| Gadget | $200 |",
            section_type: "pricing",
          },
        ],
      });
      const xml = await genAndExtract(data, "word/document.xml");
      expect(xml).toContain("<w:tbl>");
      expect(xml).toContain("Widget");
      expect(xml).toContain("$100");
    });
  });

  describe("table of contents", () => {
    it("includes TOC field code in document", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("TOC");
      expect(xml).toContain("fldChar");
      expect(xml).toContain("Table of Contents");
    });

    it("includes TOC update instruction text", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      expect(xml).toContain("Update Field");
    });
  });

  describe("blockquote handling", () => {
    it("converts blockquotes to indented paragraphs with left border", async () => {
      const data = makeData({
        sections: [
          {
            title: "Testimonial",
            content: "> This solution exceeded our expectations.",
            section_type: "case_studies",
          },
        ],
      });
      const xml = await genAndExtract(data, "word/document.xml");
      expect(xml).toContain("exceeded our expectations");
      expect(xml).toContain('w:left="720"'); // left indent
      expect(xml).toContain("w:pBdr"); // paragraph border
    });
  });

  describe("cover page section break", () => {
    it("includes sectPr for cover page break", async () => {
      const xml = await genAndExtract(makeData(), "word/document.xml");
      // Should have two sectPr elements: one for cover page, one for final
      const sectPrCount = (xml.match(/<w:sectPr>/g) || []).length;
      expect(sectPrCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("XML safety", () => {
    it("escapes special characters in content", async () => {
      const data = makeData({
        sections: [
          {
            title: "Security & Compliance",
            content: "Use <strong> tags & \"quotes\" safely.",
            section_type: "security",
          },
        ],
      });
      const xml = await genAndExtract(data, "word/document.xml");
      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;strong&gt;");
      expect(xml).not.toContain("<strong>");
    });
  });
});
