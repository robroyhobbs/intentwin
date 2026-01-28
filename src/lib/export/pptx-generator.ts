import pptxgen from "pptxgenjs";

interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

interface ProposalData {
  title: string;
  client_name: string;
  date: string;
  sections: ProposalSection[];
}

// Capgemini brand colors
const COLORS = {
  primary: "0070AD", // Capgemini blue
  dark: "1B365D", // Dark blue
  text: "333333",
  lightBg: "F5F7FA",
  white: "FFFFFF",
  accent: "12ABDB",
};

export async function generatePptx(data: ProposalData): Promise<Buffer> {
  const pptx = new pptxgen();

  pptx.author = "Capgemini Proposal Generator";
  pptx.company = "Capgemini";
  pptx.title = data.title;

  // Define slide master
  pptx.defineSlideMaster({
    title: "CAPGEMINI_MASTER",
    background: { color: COLORS.white },
    objects: [
      // Top bar
      {
        rect: {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.05,
          fill: { color: COLORS.primary },
        },
      },
      // Footer
      {
        text: {
          text: `Capgemini | ${data.title} | Confidential`,
          options: {
            x: 0.5,
            y: "92%",
            w: "80%",
            h: 0.3,
            fontSize: 8,
            color: "999999",
          },
        },
      },
    ],
  });

  // Title slide
  const titleSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
  titleSlide.background = { color: COLORS.dark };

  titleSlide.addText(data.title, {
    x: 0.8,
    y: 1.5,
    w: 8.5,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: COLORS.white,
  });

  titleSlide.addText(`Prepared for ${data.client_name}`, {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 18,
    color: COLORS.accent,
  });

  titleSlide.addText(data.date, {
    x: 0.8,
    y: 4.0,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    color: "AAAAAA",
  });

  // Table of contents slide
  const tocSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
  tocSlide.addText("Agenda", {
    x: 0.8,
    y: 0.4,
    w: 8.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: COLORS.dark,
  });

  const tocItems = data.sections.map((s, i) => ({
    text: `${i + 1}. ${s.title}`,
    options: { fontSize: 16, color: COLORS.text, bullet: false, breakLine: true },
  }));

  tocSlide.addText(tocItems as pptxgen.TextProps[], {
    x: 0.8,
    y: 1.4,
    w: 8.5,
    h: 4,
    lineSpacingMultiple: 1.5,
  });

  // Content slides — one or more per section
  for (const section of data.sections) {
    const contentLines = section.content.split("\n").filter((l) => l.trim());
    const maxLinesPerSlide = 12;

    for (let i = 0; i < contentLines.length; i += maxLinesPerSlide) {
      const slide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
      const slideLines = contentLines.slice(i, i + maxLinesPerSlide);

      // Section title
      slide.addText(
        i === 0 ? section.title : `${section.title} (cont.)`,
        {
          x: 0.8,
          y: 0.3,
          w: 8.5,
          h: 0.6,
          fontSize: 24,
          bold: true,
          color: COLORS.dark,
        }
      );

      // Divider line
      slide.addShape(pptx.ShapeType.line, {
        x: 0.8,
        y: 0.95,
        w: 8.5,
        h: 0,
        line: { color: COLORS.primary, width: 2 },
      });

      // Content
      const textItems = slideLines.map((line) => {
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
        const isHeading = line.trim().startsWith("#");
        const cleanLine = line.replace(/^[#*-]\s*/, "").trim();

        return {
          text: cleanLine,
          options: {
            fontSize: isHeading ? 16 : 13,
            bold: isHeading,
            color: COLORS.text,
            bullet: isBullet ? { type: "bullet" as const } : undefined,
            breakLine: true,
          },
        };
      });

      slide.addText(textItems as pptxgen.TextProps[], {
        x: 0.8,
        y: 1.2,
        w: 8.5,
        h: 4.2,
        lineSpacingMultiple: 1.3,
        valign: "top",
      });
    }
  }

  // Thank you slide
  const endSlide = pptx.addSlide({ masterName: "CAPGEMINI_MASTER" });
  endSlide.background = { color: COLORS.dark };

  endSlide.addText("Thank You", {
    x: 0.8,
    y: 2,
    w: 8.5,
    h: 1,
    fontSize: 36,
    bold: true,
    color: COLORS.white,
    align: "center",
  });

  endSlide.addText("We look forward to partnering with you.", {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.5,
    fontSize: 18,
    color: COLORS.accent,
    align: "center",
  });

  // Generate buffer
  const arrayBuffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}
