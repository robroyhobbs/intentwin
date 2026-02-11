import { GoogleGenerativeAI } from "@google/generative-ai";
import type { WinStrategyData } from "@/types/outcomes";
import type { BrandVoice } from "./persuasion";
import { buildBrandVoiceSystemPrompt } from "./persuasion";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// Default system prompt - can be customized per organization
const DEFAULT_SYSTEM_PROMPT = `You are an expert proposal writer specializing in creating winning proposals for consulting and technology services engagements.

Your writing style is:
- Professional and authoritative, but not stuffy
- Specific and concrete, avoiding vague generalities
- Client-focused, always tying capabilities back to client outcomes
- Structured with clear headings and bullet points where appropriate
- Confident without being arrogant

When writing proposal sections:
- Reference specific company capabilities and methodologies when provided
- Use concrete examples and metrics from provided context
- Address the client's specific situation and needs as described in the intake data
- Maintain consistency in tone and terminology across sections
- Use industry-standard terminology appropriate to the engagement type`;

/**
 * Build a system prompt with organization-specific context and optional brand voice
 */
export function buildSystemPrompt(companyContext?: {
  name?: string;
  description?: string;
  capabilities?: string[];
  methodologies?: string[];
  brandVoice?: BrandVoice | null;
}): string {
  if (!companyContext?.name) {
    return DEFAULT_SYSTEM_PROMPT;
  }

  let prompt = `You are an expert proposal writer for ${companyContext.name}${companyContext.description ? `, ${companyContext.description}` : ""}.

Your writing style is:
- Professional and authoritative, but not stuffy
- Specific and concrete, avoiding vague generalities
- Client-focused, always tying capabilities back to client outcomes
- Structured with clear headings and bullet points where appropriate
- Confident without being arrogant

When writing proposal sections:
- Reference specific ${companyContext.name} capabilities and methodologies where relevant${companyContext.capabilities ? `\n- Key capabilities: ${companyContext.capabilities.join(", ")}` : ""}${companyContext.methodologies ? `\n- Key methodologies: ${companyContext.methodologies.join(", ")}` : ""}
- Use concrete examples and metrics from provided context
- Address the client's specific situation and needs as described in the intake data
- Maintain consistency in tone and terminology across sections
- Use industry-standard terminology appropriate to the engagement type`;

  // Inject brand voice if provided
  if (companyContext.brandVoice) {
    const brandVoiceFragment = buildBrandVoiceSystemPrompt(
      companyContext.brandVoice,
    );
    if (brandVoiceFragment) {
      prompt += `\n${brandVoiceFragment}`;
    }
  }

  return prompt;
}

const SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT;

export interface GenerateOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const genAI = getClient();
  const modelName =
    options.model || process.env.GEMINI_MODEL || "gemini-3-pro-preview";

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: options.systemPrompt || SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function generateStructuredAnalysis(
  intakeData: Record<string, unknown>,
  rfpRequirements?: Record<string, unknown>,
  winStrategy?: WinStrategyData | null,
): Promise<string> {
  const hasWinStrategy = winStrategy && winStrategy.win_themes?.length > 0;
  const winStrategySection = hasWinStrategy
    ? `
## Defined Win Strategy & Target Outcomes (User-Defined North Star)
The proposal team has defined the following outcomes. Align all analysis with these:

### Win Themes
${winStrategy.win_themes.map((t) => `- ${t}`).join("\n")}

### Target Outcomes
${(winStrategy.target_outcomes ?? []).map((o) => `- [${o.priority.toUpperCase()}] ${o.outcome} (${o.category.replace(/_/g, " ")})`).join("\n")}

### Key Differentiators
${(winStrategy.differentiators ?? []).map((d) => `- ${d}`).join("\n")}

### Success Metrics
${(winStrategy.success_metrics ?? []).map((m) => `- ${m}`).join("\n")}
`
    : "";

  const prompt = `Analyze the following proposal opportunity and provide a structured analysis.

## Intake Data
${JSON.stringify(intakeData, null, 2)}

${rfpRequirements ? `## RFP Requirements\n${JSON.stringify(rfpRequirements, null, 2)}` : ""}
${winStrategySection}

Provide your analysis in the following structure:
1. **Key Themes**: The 3-5 most important themes this proposal should emphasize${winStrategy ? " (align with defined win themes)" : ""}
2. **Competitive Positioning**: How to differentiate against likely competitors${winStrategy ? " (leverage defined differentiators)" : ""}
3. **Technical Approach Summary**: High-level recommended technical approach
4. **Risk Factors**: Key risks to address proactively
5. **Win Strategy**: What will make this proposal stand out${winStrategy ? " (build on defined target outcomes)" : ""}
6. **Required Sections**: List of proposal sections needed, in order of importance`;

  return generateText(prompt, { temperature: 0.5 });
}
