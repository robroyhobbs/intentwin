import { GoogleGenerativeAI } from "@google/generative-ai";
import { createLogger } from "@/lib/utils/logger";
import { geminiHeliconeOptions } from "@/lib/observability/helicone";
import { MODELS } from "./models";

const IMAGE_MODEL = MODELS.image;

const log = createLogger({ operation: "diagramGenerator" });

/**
 * Section types that should have diagrams generated.
 * Maps section type to a function that builds the diagram prompt
 * from the section's generated content and context.
 */
const DIAGRAM_CONFIGS: Record<
  string,
  {
    label: string;
    buildPrompt: (
      sectionContent: string,
      companyName: string,
      clientName: string,
    ) => string;
  }
> = {
  team: {
    label: "Team Organization Chart",
    buildPrompt: (content, companyName, clientName) =>
      `Create a professional organizational chart diagram for a proposal from ${companyName} to ${clientName}.

Based on this team section content, create a clean org chart showing the reporting structure and key roles:

${content.slice(0, 3000)}

Requirements:
- Professional, clean design with a white background
- Use a blue/gray corporate color scheme
- Rounded rectangles for each role box
- Show role titles and reporting lines clearly
- Include 4-8 key roles (don't overcrowd)
- Top-down hierarchy layout
- Modern, minimal style suitable for a consulting proposal
- Do NOT include any text outside the diagram
- Do NOT use any placeholder text or brackets`,
  },
  approach: {
    label: "Solution Architecture",
    buildPrompt: (content, companyName, clientName) =>
      `Create a professional solution architecture or approach phases diagram for a proposal from ${companyName} to ${clientName}.

Based on this approach section content, create a visual showing the phased approach or solution design:

${content.slice(0, 3000)}

Requirements:
- Professional, clean design with a white background
- Use a blue/gray corporate color scheme
- Show phases flowing left-to-right or top-to-bottom
- Include key deliverables or milestones at each phase
- Use arrows to show progression and dependencies
- 4-6 main phases or components
- Modern, minimal style suitable for a consulting proposal
- Do NOT include any text outside the diagram
- Do NOT use any placeholder text or brackets`,
  },
  methodology: {
    label: "Methodology Process Flow",
    buildPrompt: (content, companyName, clientName) =>
      `Create a professional methodology process flow diagram for a proposal from ${companyName} to ${clientName}.

Based on this methodology section content, create a visual showing the process framework with quality gates:

${content.slice(0, 3000)}

Requirements:
- Professional, clean design with a white background
- Use a blue/gray corporate color scheme
- Show methodology phases as a clear process flow
- Include decision points and quality gates between phases
- Use diamond shapes for decision points, rounded rectangles for phases
- 5-8 nodes maximum
- Modern, minimal style suitable for a consulting proposal
- Do NOT include any text outside the diagram
- Do NOT use any placeholder text or brackets`,
  },
  timeline: {
    label: "Project Timeline",
    buildPrompt: (content, companyName, clientName) =>
      `Create a professional project timeline or roadmap diagram for a proposal from ${companyName} to ${clientName}.

Based on this timeline section content, create a visual timeline showing phases and milestones:

${content.slice(0, 3000)}

Requirements:
- Professional, clean design with a white background
- Use a blue/gray corporate color scheme
- Horizontal timeline layout showing phases and durations
- Key milestones marked clearly
- Phase labels and approximate durations visible
- 4-7 major phases
- Modern, minimal style suitable for a consulting proposal — like a Gantt chart but more visual
- Do NOT include any text outside the diagram
- Do NOT use any placeholder text or brackets`,
  },
  risk_mitigation: {
    label: "Risk Escalation Framework",
    buildPrompt: (content, companyName, clientName) =>
      `Create a professional risk escalation framework diagram for a proposal from ${companyName} to ${clientName}.

Based on this risk mitigation section content, create a visual showing risk categories and escalation paths:

${content.slice(0, 3000)}

Requirements:
- Professional, clean design with a white background
- Use a color-coded scheme (green for low risk, yellow for medium, orange for high, red for critical)
- Show escalation paths from detection through resolution
- Include monitoring triggers and responsible roles
- 5-8 nodes maximum
- Modern, minimal style suitable for a consulting proposal
- Do NOT include any text outside the diagram
- Do NOT use any placeholder text or brackets`,
  },
};

/**
 * Check if a section type should have a diagram generated.
 */
export function shouldGenerateDiagram(sectionType: string): boolean {
  return sectionType in DIAGRAM_CONFIGS;
}

/**
 * Get the diagram label for a section type.
 */
function getDiagramLabel(sectionType: string): string | null {
  return DIAGRAM_CONFIGS[sectionType]?.label ?? null;
}

/**
 * Generate a diagram image for a proposal section using Gemini image generation.
 *
 * Returns a base64 data URL string (e.g., "data:image/png;base64,...")
 * or null if generation fails (non-critical — proposal works without diagrams).
 */
export async function generateDiagram(
  sectionType: string,
  sectionContent: string,
  companyName: string,
  clientName: string,
): Promise<string | null> {
  const config = DIAGRAM_CONFIGS[sectionType];
  if (!config) return null;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    log.warn("GEMINI_API_KEY not configured, skipping diagram generation");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const heliconeOpts = geminiHeliconeOptions();
    const model = genAI.getGenerativeModel(
      {
        model: IMAGE_MODEL,
        generationConfig: {
          // @ts-expect-error -- Gemini image generation uses responseModalities
          responseModalities: ["image", "text"],
        },
      },
      heliconeOpts,
    );

    const prompt = config.buildPrompt(sectionContent, companyName, clientName);
    const result = await model.generateContent(prompt);
    const response = result.response;

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      log.warn(`No content generated for ${sectionType} diagram`);
      return null;
    }

    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        log.info(`Generated ${config.label} diagram`, {
          sectionType,
          mimeType,
          sizeKb: Math.round((data.length * 3) / 4 / 1024),
        });
        return `data:${mimeType};base64,${data}`;
      }
    }

    log.warn(`No image in response for ${sectionType} diagram`);
    return null;
  } catch (error) {
    log.error(`Failed to generate ${sectionType} diagram`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
