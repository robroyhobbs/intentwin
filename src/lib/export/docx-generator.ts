import type { BrandingSettings, ProposalData } from "./slides/types";

/** Default branding matching the original theme */
const DEFAULT_BRANDING: Required<BrandingSettings> = {
  logo_url: "",
  primary_color: "#0070AD",
  secondary_color: "#1B365D",
  accent_color: "#12ABDB",
  font_family: "Inter",
  header_text: "",
  footer_text: "Confidential",
};

/** Convert #RRGGBB hex to OOXML color string (RRGGBB without #) */
function toOoxmlColor(hex: string): string {
  return hex.replace("#", "");
}

/** XML-escape text for safe embedding in OOXML */
function escXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build a single OOXML run element with optional formatting */
function run(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string; sz?: number }): string {
  const rPr: string[] = [];
  if (opts?.bold) rPr.push("<w:b/>");
  if (opts?.italic) rPr.push("<w:i/>");
  if (opts?.color) rPr.push(`<w:color w:val="${opts.color}"/>`);
  if (opts?.sz) rPr.push(`<w:sz w:val="${opts.sz}"/><w:szCs w:val="${opts.sz}"/>`);
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
  return `<w:r>${rPrXml}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

/** Build a paragraph with optional style */
function para(content: string, style?: string, props?: string): string {
  const pPr = style || props
    ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${props || ""}</w:pPr>`
    : "";
  return `<w:p>${pPr}${content}</w:p>`;
}

/**
 * Convert inline markdown formatting (**bold**, *italic*, `code`) to OOXML runs.
 * Returns concatenated <w:r> elements.
 */
function inlineToRuns(text: string): string {
  const parts: string[] = [];
  // Process bold, italic, and code spans
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([^*`]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      parts.push(run(match[1], { bold: true }));
    } else if (match[2]) {
      parts.push(run(match[2], { italic: true }));
    } else if (match[3]) {
      parts.push(run(match[3], { sz: 18 }));
    } else if (match[4]) {
      parts.push(run(match[4]));
    }
  }
  return parts.join("");
}

/**
 * Convert markdown content to OOXML paragraphs.
 * Handles headings, bold/italic, unordered/ordered lists, tables, and plain text.
 */
function markdownToOoxml(md: string, primaryColor: string): string {
  const lines = md.split("\n");
  const paragraphs: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  function flushTable() {
    if (!inTable || tableRows.length === 0) return;
    // Build a simple OOXML table
    const rows = tableRows.map((cells, rowIdx) => {
      const tcs = cells.map((cell) => {
        const shading = rowIdx === 0
          ? `<w:shd w:val="clear" w:color="auto" w:fill="${primaryColor}"/>`
          : "";
        const rProps = rowIdx === 0 ? { bold: true, color: "FFFFFF" } : {};
        return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${shading}</w:tcPr>${para(run(cell.trim(), rProps))}</w:tc>`;
      }).join("");
      return `<w:tr>${tcs}</w:tr>`;
    });
    paragraphs.push(
      `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblBorders>` +
      `<w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `<w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `<w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `<w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>` +
      `</w:tblBorders></w:tblPr>${rows.join("")}</w:tbl>`,
    );
    tableRows = [];
    inTable = false;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Skip separator rows
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
      if (!inTable) inTable = true;
      const cells = trimmed.slice(1, -1).split("|");
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Empty line
    if (!trimmed) {
      paragraphs.push(para(""));
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      paragraphs.push(para(inlineToRuns(trimmed.slice(4)), "Heading3"));
      continue;
    }
    if (trimmed.startsWith("## ")) {
      paragraphs.push(para(inlineToRuns(trimmed.slice(3)), "Heading2"));
      continue;
    }
    if (trimmed.startsWith("# ")) {
      paragraphs.push(para(inlineToRuns(trimmed.slice(2)), "Heading1"));
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(trimmed)) {
      paragraphs.push(para(
        inlineToRuns(trimmed.slice(2)),
        "ListBullet",
      ));
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(para(
        inlineToRuns(trimmed.replace(/^\d+\.\s/, "")),
        "ListNumber",
      ));
      continue;
    }

    // Normal paragraph
    paragraphs.push(para(inlineToRuns(trimmed)));
  }

  flushTable();
  return paragraphs.join("\n");
}

/** Build styles.xml with branding colors and fonts */
function buildStylesXml(b: Required<BrandingSettings>): string {
  const primary = toOoxmlColor(b.primary_color);
  const secondary = toOoxmlColor(b.secondary_color);
  const accent = toOoxmlColor(b.accent_color);
  const font = escXml(b.font_family);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  mc:Ignorable="w14">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:color w:val="333333"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="200"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="56"/>
      <w:szCs w:val="56"/>
      <w:color w:val="${secondary}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="240"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:color w:val="${primary}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="360" w:after="120"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
      <w:color w:val="${secondary}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="240" w:after="80"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:color w:val="${primary}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="200" w:after="60"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
      <w:color w:val="${accent}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:numPr><w:numId w:val="1"/></w:numPr>
      <w:spacing w:after="60"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber">
    <w:name w:val="List Number"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:numPr><w:numId w:val="2"/></w:numPr>
      <w:spacing w:after="60"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Header">
    <w:name w:val="header"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:tabs><w:tab w:val="center" w:pos="4680"/><w:tab w:val="right" w:pos="9360"/></w:tabs>
      <w:spacing w:after="0"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="18"/>
      <w:szCs w:val="18"/>
      <w:color w:val="${primary}"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Footer">
    <w:name w:val="footer"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:tabs><w:tab w:val="center" w:pos="4680"/><w:tab w:val="right" w:pos="9360"/></w:tabs>
      <w:spacing w:after="0"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="16"/>
      <w:szCs w:val="16"/>
      <w:color w:val="999999"/>
    </w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;
}

/** Build numbering.xml for bullet and numbered lists */
function buildNumberingXml(accentColor: string): string {
  const accent = toOoxmlColor(accentColor);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="\u2022"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:color w:val="${accent}"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:color w:val="${accent}"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;
}

/** Build header1.xml with company name */
function buildHeaderXml(headerText: string, primaryColor: string): string {
  const color = toOoxmlColor(primaryColor);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:jc w:val="right"/>
      <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="${color}"/></w:pBdr>
    </w:pPr>
    ${run(escXml(headerText), { bold: true, color, sz: 18 })}
  </w:p>
</w:hdr>`;
}

/** Build footer1.xml with footer text and page numbers */
function buildFooterXml(footerText: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/></w:pBdr>
      <w:tabs>
        <w:tab w:val="center" w:pos="4680"/>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
    </w:pPr>
    ${run(escXml(footerText), { sz: 16 })}
    ${run("\t", { sz: 16 })}
    ${run("Page ", { sz: 16 })}
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
    ${run(" of ", { sz: 16 })}
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:ftr>`;
}

/**
 * Generate a branded DOCX document from proposal data.
 * Builds pure OOXML with PizZip — no external template dependency.
 */
export function generateDocx(data: ProposalData): Buffer {
  const PizZip = require("pizzip");

  const companyName = data.company_name || "IntentBid";

  // Resolve branding with defaults
  const b: Required<BrandingSettings> = {
    ...DEFAULT_BRANDING,
    ...data.branding,
    header_text: data.branding?.header_text || companyName,
    footer_text: data.branding?.footer_text || DEFAULT_BRANDING.footer_text,
    logo_url: data.branding?.logo_url || "",
  };

  const primary = toOoxmlColor(b.primary_color);
  const secondary = toOoxmlColor(b.secondary_color);

  // Build section content
  const sectionsXml = data.sections
    .map((section, idx) => {
      const sectionNum = String(idx + 1).padStart(2, "0");
      const heading = para(
        run(`${sectionNum}  `, { color: primary, bold: true }) +
        run(escXml(section.title), { bold: true }),
        "Heading1",
      );
      const content = markdownToOoxml(section.content, primary);
      return heading + "\n" + content;
    })
    .join("\n");

  // Title page + body
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${para(run(escXml(data.title)), "Title")}
    ${para(run(`Prepared for ${escXml(data.client_name)}`, { color: primary, sz: 28 }), "Subtitle")}
    ${para(run(escXml(data.date), { sz: 22 }))}
    ${para(run(`${escXml(b.header_text)}`, { color: secondary, bold: true, sz: 22 }))}
    ${para("")}
    <w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/><w:pgNumType w:start="0"/></w:sectPr></w:pPr></w:p>
    ${sectionsXml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  // Assemble OOXML zip
  const zip = new PizZip();

  // Content Types
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`,
  );

  // Root relationships
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );

  // Word relationships (link to styles, numbering, header, footer)
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`,
  );

  // Document parts
  zip.file("word/document.xml", documentXml);
  zip.file("word/styles.xml", buildStylesXml(b));
  zip.file("word/numbering.xml", buildNumberingXml(b.accent_color));
  zip.file("word/header1.xml", buildHeaderXml(b.header_text, b.primary_color));
  zip.file("word/footer1.xml", buildFooterXml(b.footer_text));

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
