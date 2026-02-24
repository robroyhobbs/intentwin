import pptxgen from "pptxgenjs";
import type { ProposalData } from "./slides/types";

// Default brand colors
const DEFAULT_COLORS = {
  primary: "0070AD",
  dark: "1B365D",
  accent: "12ABDB",
  text: "333333",
  lightBg: "F5F7FA",
  white: "FFFFFF",
  muted: "64748B",
};

function toColorCode(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

// ============================================================
// Markdown → Rich Text Parser
// ============================================================

interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/** Parse inline markdown (bold, italic, links, code) into TextRun[] */
export function parseInlineMarkdown(text: string): TextRun[] {
  if (!text) return [];

  const runs: TextRun[] = [];
  // Strip links: [text](url) → text
  let cleaned = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Strip inline code backticks
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  // Strip strikethrough
  cleaned = cleaned.replace(/~~([^~]+)~~/g, "$1");
  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Parse bold/italic patterns
  const regex = /(\*{1,3}|_{1,3})((?:(?!\1).)+)\1/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      const before = cleaned.slice(lastIndex, match.index);
      if (before) runs.push({ text: before });
    }
    const marker = match[1];
    const inner = match[2];
    if (marker.length === 3) {
      runs.push({ text: inner, bold: true, italic: true });
    } else if (marker.length === 2) {
      runs.push({ text: inner, bold: true });
    } else {
      runs.push({ text: inner, italic: true });
    }
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < cleaned.length) {
    const remainder = cleaned.slice(lastIndex);
    if (remainder) runs.push({ text: remainder });
  }

  // If no matches at all, return the whole cleaned string
  if (runs.length === 0 && cleaned.trim()) {
    runs.push({ text: cleaned });
  }

  return runs;
}

// ============================================================
// Markdown → Slide Content Blocks
// ============================================================

export type ContentBlock =
  | { type: "heading"; text: string; level: number }
  | { type: "paragraph"; runs: TextRun[] }
  | { type: "bullet"; runs: TextRun[] }
  | { type: "blockquote"; text: string }
  | { type: "table-row"; cells: string[] };

/** Parse markdown content into structured content blocks */
export function parseMarkdownToBlocks(content: string): ContentBlock[] {
  if (!content) return [];

  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Toggle code block — skip all content inside
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip empty lines
    if (!trimmed) {
      inTable = false;
      continue;
    }

    // Skip horizontal rules
    if (/^[-*_]{3,}\s*$/.test(trimmed)) continue;

    // Skip image lines
    if (trimmed.startsWith("![")) continue;

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      inTable = false;
      blocks.push({
        type: "heading",
        text: headingMatch[2].replace(/\*{1,3}/g, "").trim(),
        level: headingMatch[1].length,
      });
      continue;
    }

    // Table rows (pipes)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // Skip separator rows like |---|---|
      if (/^\|[\s-:|]+\|$/.test(trimmed)) {
        inTable = true;
        continue;
      }
      inTable = true;
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length > 0) {
        blocks.push({ type: "table-row", cells });
      }
      continue;
    }
    if (inTable && !trimmed.startsWith("|")) {
      inTable = false;
    }

    // Blockquotes
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "").trim();
      if (quoteText) {
        blocks.push({ type: "blockquote", text: quoteText });
      }
      continue;
    }

    // Bullet points (-, *, or numbered)
    const bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        type: "bullet",
        runs: parseInlineMarkdown(bulletMatch[1]),
      });
      continue;
    }

    // Regular paragraph text
    const runs = parseInlineMarkdown(trimmed);
    if (runs.length > 0 && runs.some((r) => r.text.trim())) {
      blocks.push({ type: "paragraph", runs });
    }
  }

  return blocks;
}

// ============================================================
// Slide Splitting
// ============================================================

const MAX_ITEMS_PER_SLIDE = 8;
const MAX_CONTENT_SLIDES_PER_SECTION = 3;

/** Split content blocks into slide-sized groups */
export function splitBlocksIntoSlides(
  blocks: ContentBlock[],
): ContentBlock[][] {
  if (blocks.length === 0) return [];

  const slides: ContentBlock[][] = [];
  let currentSlide: ContentBlock[] = [];

  for (const block of blocks) {
    // Headings always start a new slide (if current has content)
    if (block.type === "heading" && currentSlide.length > 0) {
      slides.push(currentSlide);
      currentSlide = [block];
      continue;
    }

    // If current slide is full, start a new one
    if (currentSlide.length >= MAX_ITEMS_PER_SLIDE) {
      slides.push(currentSlide);
      currentSlide = [];
    }

    currentSlide.push(block);
  }

  // Push last slide if it has content
  if (currentSlide.length > 0) {
    slides.push(currentSlide);
  }

  // Cap at MAX_CONTENT_SLIDES_PER_SECTION
  if (slides.length > MAX_CONTENT_SLIDES_PER_SECTION) {
    return slides.slice(0, MAX_CONTENT_SLIDES_PER_SECTION);
  }

  return slides;
}

// ============================================================
// Render Helpers
// ============================================================

interface RenderContext {
  pptx: pptxgen;
  COLORS: typeof DEFAULT_COLORS;
  fontFamily: string;
  accentColor: string;
}

/** Convert TextRun[] to pptxgenjs TextProps[] with formatting */
function runsToTextProps(
  runs: TextRun[],
  ctx: RenderContext,
  options?: { bullet?: boolean; italic?: boolean },
): pptxgen.TextProps[] {
  return runs.map((run) => ({
    text: run.text,
    options: {
      fontSize: 16,
      fontFace: ctx.fontFamily,
      color: ctx.COLORS.text,
      bold: run.bold || false,
      italic: run.italic || options?.italic || false,
      ...(options?.bullet
        ? { bullet: { type: "bullet" as const, characterCode: "25CF" } }
        : {}),
    },
  }));
}

/** Render a content slide with rich-formatted blocks */
function addContentSlide(
  sectionTitle: string,
  slideBlocks: ContentBlock[],
  sectionIdx: number,
  slideNumber: number,
  ctx: RenderContext,
) {
  const slide = ctx.pptx.addSlide({ masterName: "BRANDED_MASTER" });
  const displayTitle =
    slideNumber > 0 ? `${sectionTitle} (cont.)` : sectionTitle;

  // Section number badge
  slide.addText(String(sectionIdx + 1).padStart(2, "0"), {
    x: 0.8,
    y: 0.3,
    w: 0.6,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: ctx.accentColor,
    fontFace: ctx.fontFamily,
  });

  // Slide title
  slide.addText(displayTitle, {
    x: 0.8,
    y: 0.55,
    w: 8.5,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: ctx.COLORS.dark,
    fontFace: ctx.fontFamily,
  });

  // Accent line
  slide.addShape(ctx.pptx.ShapeType.line, {
    x: 0.8,
    y: 1.1,
    w: 8.5,
    h: 0,
    line: { color: ctx.accentColor, width: 2 },
  });

  // Render blocks into text items
  const textItems: pptxgen.TextProps[] = [];

  for (const block of slideBlocks) {
    switch (block.type) {
      case "heading":
        textItems.push({
          text: block.text,
          options: {
            fontSize: 18,
            fontFace: ctx.fontFamily,
            color: ctx.COLORS.dark,
            bold: true,
            breakLine: true,
            lineSpacingMultiple: 1.8,
          },
        });
        break;

      case "bullet":
        textItems.push(
          ...runsToTextProps(block.runs, ctx, { bullet: true }).map((tp) => ({
            ...tp,
            options: {
              ...tp.options,
              breakLine: true,
              lineSpacingMultiple: 1.5,
            },
          })),
        );
        break;

      case "paragraph":
        textItems.push(
          ...runsToTextProps(block.runs, ctx).map((tp) => ({
            ...tp,
            options: {
              ...tp.options,
              breakLine: true,
              lineSpacingMultiple: 1.5,
            },
          })),
        );
        break;

      case "blockquote":
        textItems.push({
          text: block.text,
          options: {
            fontSize: 15,
            fontFace: ctx.fontFamily,
            color: ctx.COLORS.muted,
            italic: true,
            breakLine: true,
            lineSpacingMultiple: 1.5,
          },
        });
        break;

      case "table-row":
        if (block.cells.length >= 2) {
          textItems.push({
            text: `${block.cells[0]}: ${block.cells.slice(1).join(", ")}`,
            options: {
              fontSize: 15,
              fontFace: ctx.fontFamily,
              color: ctx.COLORS.text,
              bullet: { type: "bullet" as const, characterCode: "25CF" },
              breakLine: true,
              lineSpacingMultiple: 1.5,
            },
          });
        }
        break;
    }
  }

  if (textItems.length > 0) {
    slide.addText(textItems, {
      x: 1.0,
      y: 1.35,
      w: 8.0,
      h: 3.6,
      valign: "top",
    });
  }
}

// ============================================================
// Main Generator
// ============================================================

export async function generatePptx(data: ProposalData): Promise<Buffer> {
  const pptx = new pptxgen();
  const companyName = data.company_name || "IntentBid";

  const branding = data.branding;
  const COLORS = {
    primary: branding
      ? toColorCode(branding.primary_color)
      : DEFAULT_COLORS.primary,
    dark: branding
      ? toColorCode(branding.secondary_color)
      : DEFAULT_COLORS.dark,
    accent: branding
      ? toColorCode(branding.accent_color)
      : DEFAULT_COLORS.accent,
    text: DEFAULT_COLORS.text,
    lightBg: DEFAULT_COLORS.lightBg,
    white: DEFAULT_COLORS.white,
    muted: DEFAULT_COLORS.muted,
  };
  const fontFamily = branding?.font_family || "Arial";
  const footerText = branding?.footer_text || "Confidential";
  const headerText = branding?.header_text || companyName;

  pptx.author = companyName;
  pptx.company = companyName;
  pptx.title = data.title;

  // Define master slide with minimal footer — use header_text instead of just companyName
  pptx.defineSlideMaster({
    title: "BRANDED_MASTER",
    background: { color: COLORS.white },
    objects: [
      {
        rect: {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.06,
          fill: { color: COLORS.primary },
        },
      },
      {
        text: {
          text: `${headerText} | ${data.title} | ${footerText}`,
          options: {
            x: 0.5,
            y: "93%",
            w: "70%",
            h: 0.25,
            fontSize: 7,
            color: COLORS.muted,
          },
        },
      },
    ],
  });

  // ── Title Slide ──
  const titleSlide = pptx.addSlide({ masterName: "BRANDED_MASTER" });
  titleSlide.background = { color: COLORS.dark };

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: COLORS.primary, transparency: 85 },
  });

  // Add logo to title slide if available
  if (branding?.logo_url) {
    try {
      titleSlide.addImage({
        path: branding.logo_url,
        x: 0.8,
        y: 0.5,
        w: 2.0,
        h: 0.6,
      });
    } catch {
      // Logo fetch failed — continue without it
    }
  }

  titleSlide.addText(data.title, {
    x: 0.8,
    y: 1.8,
    w: 8.5,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: COLORS.white,
    fontFace: fontFamily,
  });

  titleSlide.addText(`Prepared for ${data.client_name}`, {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 20,
    color: COLORS.accent,
    fontFace: fontFamily,
  });

  titleSlide.addText(data.date, {
    x: 0.8,
    y: 4.0,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    color: "AAAAAA",
    fontFace: fontFamily,
  });

  // ── Agenda Slide ──
  const agendaSlide = pptx.addSlide({ masterName: "BRANDED_MASTER" });

  agendaSlide.addText("Agenda", {
    x: 0.8,
    y: 0.5,
    w: 8.5,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: COLORS.dark,
    fontFace: fontFamily,
  });

  agendaSlide.addShape(pptx.ShapeType.line, {
    x: 0.8,
    y: 1.1,
    w: 2,
    h: 0,
    line: { color: COLORS.primary, width: 3 },
  });

  const agendaItems = data.sections.slice(0, 10).map((s, i) => ({
    text: `${i + 1}. ${s.title}`,
    options: {
      fontSize: 15,
      color: COLORS.text,
      bullet: false as const,
      breakLine: true,
      fontFace: fontFamily,
    },
  }));

  agendaSlide.addText(agendaItems as pptxgen.TextProps[], {
    x: 0.8,
    y: 1.5,
    w: 8.5,
    h: 3.8,
    lineSpacingMultiple: 1.5,
  });

  // ── Section Slides ──
  const accentColors = [COLORS.primary, COLORS.accent, COLORS.dark];

  for (let sectionIdx = 0; sectionIdx < data.sections.length; sectionIdx++) {
    const section = data.sections[sectionIdx];
    const accentColor = accentColors[sectionIdx % accentColors.length];

    // Section intro slide (dark background)
    const introSlide = pptx.addSlide({ masterName: "BRANDED_MASTER" });
    introSlide.background = { color: COLORS.dark };

    introSlide.addText(String(sectionIdx + 1).padStart(2, "0"), {
      x: 0.8,
      y: 1.2,
      w: 3,
      h: 2,
      fontSize: 96,
      bold: true,
      color: COLORS.primary,
      transparency: 80,
      fontFace: fontFamily,
    });

    introSlide.addText(section.title, {
      x: 0.8,
      y: 2.2,
      w: 8.5,
      h: 1,
      fontSize: 32,
      bold: true,
      color: COLORS.white,
      fontFace: fontFamily,
    });

    introSlide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 3.4,
      w: 1.5,
      h: 0,
      line: { color: accentColor, width: 4 },
    });

    // Parse section content into blocks and split into slides
    const blocks = parseMarkdownToBlocks(section.content);
    const slideGroups = splitBlocksIntoSlides(blocks);
    const ctx: RenderContext = { pptx, COLORS, fontFamily, accentColor };

    if (slideGroups.length === 0) {
      // Fallback slide for empty/code-only content
      addContentSlide(
        section.title,
        [
          {
            type: "paragraph",
            runs: [{ text: "See proposal document for full details" }],
          },
        ],
        sectionIdx,
        0,
        ctx,
      );
    } else {
      for (let slideIdx = 0; slideIdx < slideGroups.length; slideIdx++) {
        addContentSlide(
          section.title,
          slideGroups[slideIdx],
          sectionIdx,
          slideIdx,
          ctx,
        );
      }
    }
  }

  // ── Thank You Slide ──
  const endSlide = pptx.addSlide({ masterName: "BRANDED_MASTER" });
  endSlide.background = { color: COLORS.dark };

  endSlide.addShape(pptx.ShapeType.ellipse, {
    x: 7,
    y: -1,
    w: 4,
    h: 4,
    fill: { color: COLORS.primary, transparency: 90 },
  });

  endSlide.addText("Thank You", {
    x: 0.8,
    y: 2,
    w: 8.5,
    h: 1,
    fontSize: 44,
    bold: true,
    color: COLORS.white,
    align: "center",
    fontFace: fontFamily,
  });

  endSlide.addText("We look forward to partnering with you.", {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 18,
    color: COLORS.accent,
    align: "center",
    fontFace: fontFamily,
  });

  endSlide.addText("Let's discuss next steps →", {
    x: 3.3,
    y: 4.2,
    w: 3.5,
    h: 0.5,
    fontSize: 12,
    color: COLORS.white,
    align: "center",
    fontFace: fontFamily,
    fill: { color: COLORS.primary },
    shape: pptx.ShapeType.roundRect,
    rectRadius: 0.1,
  });

  // Generate buffer
  const arrayBuffer = (await pptx.write({
    outputType: "arraybuffer",
  })) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
