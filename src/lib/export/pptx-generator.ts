import pptxgen from "pptxgenjs";

interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

interface ProposalData {
  title: string;
  client_name: string;
  company_name?: string;
  date: string;
  sections: ProposalSection[];
}

// Brand colors (default ProposalAI theme)
const COLORS = {
  primary: "0070AD", // Primary blue
  dark: "1B365D", // Dark blue
  accent: "12ABDB", // Light blue accent
  text: "333333",
  lightBg: "F5F7FA",
  white: "FFFFFF",
  muted: "64748B",
};

/**
 * Extracts key points from verbose content for concise slide bullets
 * Following the "slides are for discussion, not details" principle
 */
function extractKeyPoints(content: string, maxPoints: number = 4): string[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets: string[] = [];

  for (const line of lines) {
    // Skip markdown headers
    if (line.startsWith('#')) continue;

    // Extract bullet points
    if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
      const text = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      // Keep bullets concise - max 60 chars for PPTX readability
      if (text && text.length > 0) {
        bullets.push(text.length > 60 ? text.substring(0, 57) + '...' : text);
      }
    }
    // Extract key value proposition sentences
    else if (
      line.includes('will') ||
      line.includes('deliver') ||
      line.includes('enable') ||
      line.includes('reduce') ||
      line.includes('increase') ||
      line.includes('improve') ||
      line.includes('%')
    ) {
      const shortened = line.length > 60 ? line.substring(0, 57) + '...' : line;
      if (!bullets.includes(shortened)) {
        bullets.push(shortened);
      }
    }

    if (bullets.length >= maxPoints) break;
  }

  // If we didn't find enough bullets, extract first sentences
  if (bullets.length < 2) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    for (const sentence of sentences) {
      const clean = sentence.trim().replace(/^[-*#\d.]\s*/, '');
      if (clean.length > 15 && clean.length < 80 && !bullets.includes(clean)) {
        const shortened = clean.length > 60 ? clean.substring(0, 57) + '...' : clean;
        bullets.push(shortened);
        if (bullets.length >= maxPoints) break;
      }
    }
  }

  return bullets.slice(0, maxPoints);
}

export async function generatePptx(data: ProposalData): Promise<Buffer> {
  const pptx = new pptxgen();
  const companyName = data.company_name || "ProposalAI";

  pptx.author = `${companyName} Proposal Generator`;
  pptx.company = companyName;
  pptx.title = data.title;

  // Define master slide with minimal footer
  pptx.defineSlideMaster({
    title: "CAPGEMINI_MASTER",
    background: { color: COLORS.white },
    objects: [
      // Top accent bar
      {
        rect: {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.06,
          fill: { color: COLORS.primary },
        },
      },
      // Footer
      {
        text: {
          text: `${companyName} | ${data.title} | Confidential`,
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

  // Title slide
  const titleSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
  titleSlide.background = {
    color: COLORS.dark,
  };

  // Add gradient overlay effect with shapes
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: COLORS.primary, transparency: 85 },
  });

  titleSlide.addText(data.title, {
    x: 0.8,
    y: 1.8,
    w: 8.5,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: COLORS.white,
    fontFace: "Arial",
  });

  titleSlide.addText(`Prepared for ${data.client_name}`, {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 20,
    color: COLORS.accent,
    fontFace: "Arial",
  });

  titleSlide.addText(data.date, {
    x: 0.8,
    y: 4.0,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    color: "AAAAAA",
    fontFace: "Arial",
  });

  // Agenda slide
  const agendaSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });

  agendaSlide.addText("Agenda", {
    x: 0.8,
    y: 0.5,
    w: 8.5,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: COLORS.dark,
    fontFace: "Arial",
  });

  // Accent line under title
  agendaSlide.addShape(pptx.ShapeType.line, {
    x: 0.8,
    y: 1.1,
    w: 2,
    h: 0,
    line: { color: COLORS.primary, width: 3 },
  });

  // Agenda items
  const agendaItems = data.sections.slice(0, 7).map((s, i) => ({
    text: `${i + 1}. ${s.title}`,
    options: {
      fontSize: 16,
      color: COLORS.text,
      bullet: false,
      breakLine: true,
      fontFace: "Arial",
    },
  }));

  agendaSlide.addText(agendaItems as pptxgen.TextProps[], {
    x: 0.8,
    y: 1.5,
    w: 8.5,
    h: 3.5,
    lineSpacingMultiple: 1.6,
  });

  // Section slides
  const accentColors = [COLORS.primary, COLORS.accent, COLORS.dark];

  for (let sectionIdx = 0; sectionIdx < data.sections.length; sectionIdx++) {
    const section = data.sections[sectionIdx];
    const accentColor = accentColors[sectionIdx % accentColors.length];

    // Section intro slide (dark background)
    const introSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
    introSlide.background = { color: COLORS.dark };

    // Large section number (watermark style)
    introSlide.addText(String(sectionIdx + 1).padStart(2, "0"), {
      x: 0.8,
      y: 1.2,
      w: 3,
      h: 2,
      fontSize: 96,
      bold: true,
      color: COLORS.primary,
      transparency: 80,
      fontFace: "Arial",
    });

    // Section title
    introSlide.addText(section.title, {
      x: 0.8,
      y: 2.2,
      w: 8.5,
      h: 1,
      fontSize: 32,
      bold: true,
      color: COLORS.white,
      fontFace: "Arial",
    });

    // Accent line
    introSlide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 3.4,
      w: 1.5,
      h: 0,
      line: { color: accentColor, width: 4 },
    });

    // Content slide with extracted key points
    const bullets = extractKeyPoints(section.content, 4);

    if (bullets.length > 0) {
      const contentSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });

      // Section number badge
      contentSlide.addText(String(sectionIdx + 1).padStart(2, "0"), {
        x: 0.8,
        y: 0.4,
        w: 0.6,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: accentColor,
        fontFace: "Arial",
      });

      // Section title
      contentSlide.addText(section.title, {
        x: 0.8,
        y: 0.7,
        w: 8.5,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: COLORS.dark,
        fontFace: "Arial",
      });

      // Accent line
      contentSlide.addShape(pptx.ShapeType.line, {
        x: 0.8,
        y: 1.35,
        w: 8.5,
        h: 0,
        line: { color: accentColor, width: 2 },
      });

      // Bullet points - concise and readable
      const bulletItems = bullets.map((bullet) => ({
        text: bullet,
        options: {
          fontSize: 18,
          color: COLORS.text,
          bullet: {
            type: "bullet" as const,
            code: "25CF", // Filled circle
            color: accentColor,
          },
          breakLine: true,
          fontFace: "Arial",
          indentLevel: 0,
        },
      }));

      contentSlide.addText(bulletItems as pptxgen.TextProps[], {
        x: 0.8,
        y: 1.6,
        w: 8.5,
        h: 3.5,
        lineSpacingMultiple: 1.8,
        valign: "top",
      });
    }
  }

  // Thank you slide
  const endSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
  endSlide.background = { color: COLORS.dark };

  // Decorative accent
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
    fontFace: "Arial",
  });

  endSlide.addText("We look forward to partnering with you.", {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 18,
    color: COLORS.accent,
    align: "center",
    fontFace: "Arial",
  });

  // CTA
  endSlide.addText("Let's discuss next steps →", {
    x: 3.3,
    y: 4.2,
    w: 3.5,
    h: 0.5,
    fontSize: 12,
    color: COLORS.white,
    align: "center",
    fontFace: "Arial",
    fill: { color: COLORS.primary },
    shape: pptx.ShapeType.roundRect,
    rectRadius: 0.1,
  });

  // Generate buffer
  const arrayBuffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
