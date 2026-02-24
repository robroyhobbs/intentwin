// Docxtemplater and PizZip are require()'d dynamically in buildDocxContent()
import type { ProposalData } from "./slides/types";

export function generateDocx(data: ProposalData): Buffer {
  // Create a minimal DOCX from scratch using docxtemplater
  // In production, load a branded template from Supabase Storage
  const content = buildDocxContent(data);
  return content;
}

function buildDocxContent(data: ProposalData): Buffer {
  // Create a simple DOCX structure
  // For Phase 1, we build a basic document
  // Phase 2 will use branded templates
  const Docx = require("docxtemplater");
  const PizZip = require("pizzip");

  // Minimal DOCX template (word/document.xml inside a zip)
  const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>{title}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Prepared for: {client_name}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Date: {date}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t></w:t></w:r>
    </w:p>
    {#sections}
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>{title}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{content}</w:t></w:r>
    </w:p>
    {/sections}
  </w:body>
</w:document>`;

  // Build minimal OOXML zip
  const zip = new PizZip();

  // Content types
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // Root relationships
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // Word relationships
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  );

  // Document content (template)
  zip.file("word/document.xml", templateXml);

  // Apply template
  const doc = new Docx(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    title: data.title,
    client_name: data.client_name,
    date: data.date,
    sections: data.sections.map((s) => ({
      title: s.title,
      content: s.content,
    })),
  });

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buf;
}
