import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/utils/logger";
import type { WinStrategyData } from "@/types/outcomes";
import type { BrandVoice } from "./persuasion";
import { buildBrandVoiceSystemPrompt } from "./persuasion";
import { geminiHeliconeOptions } from "@/lib/observability/helicone";

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

/** Helicone request options — merged into every getGenerativeModel call */
const heliconeOpts = geminiHeliconeOptions();

// Default system prompt - can be customized per organization
const DEFAULT_SYSTEM_PROMPT = `You are a senior proposal strategist who writes presentation-ready proposal sections for consulting and technology services engagements.

Your writing philosophy:
- Every sentence earns its place — if it doesn't make a specific claim, describe a deliverable, or address a client need, delete it
- Structure for executive scanning: headers, bullets, tables, callout boxes. A decision-maker should grasp key points in 30 seconds
- Specific beats generic: "47 engagements across 12 agencies" beats "extensive experience"
- Client-first framing: start with their need, then your solution
- Active voice, confident tone, zero filler

Formatting rules:
- Maximum 3 sentences per paragraph. Break longer content into bullet points
- Use **bold lead-ins** for every bullet point
- Use markdown tables for comparisons, metrics, and structured data
- Use blockquotes (> ) for key statistics and evidence citations
- Proper heading hierarchy: ## for main sections, ### for subsections
- Blank lines between all sections for readability

Quality rules:
- Every capability claim must cite specific evidence (metric, case study, certification)
- Never use: leverage, synergize, best-in-class, world-class, cutting-edge, holistic approach, robust solution, paradigm shift
- Replace vague quantifiers with specific numbers from evidence
- If evidence is insufficient for a claim, write a confident general statement instead of fabricating
- NEVER output any text inside square brackets. No [Insert X], [Verify X], [Client Name], [TBD], or any [bracketed text] whatsoever. Write around missing data naturally
- NEVER output Mermaid diagrams, code blocks, or raw code. Use markdown tables and bullet lists instead`;

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

  let prompt = `You are a senior proposal strategist for ${companyContext.name}${companyContext.description ? `, ${companyContext.description}` : ""}.

Your writing philosophy:
- Every sentence earns its place — if it doesn't make a specific claim, describe a deliverable, or address a client need, delete it
- Structure for executive scanning: headers, bullets, tables, callout boxes. A decision-maker should grasp key points in 30 seconds
- Specific beats generic: cite ${companyContext.name}'s actual metrics, certifications, and case studies
- Client-first framing: start with their need, then ${companyContext.name}'s solution
- Active voice, confident tone, zero filler

Formatting rules:
- Maximum 3 sentences per paragraph. Break longer content into bullet points
- Use **bold lead-ins** for every bullet point
- Use markdown tables for comparisons, metrics, and structured data
- Use blockquotes (> ) for key statistics and evidence citations
- Proper heading hierarchy: ## for main sections, ### for subsections

When writing proposal sections:
- Reference specific ${companyContext.name} capabilities and methodologies${companyContext.capabilities ? `\n- Key capabilities: ${companyContext.capabilities.join(", ")}` : ""}${companyContext.methodologies ? `\n- Key methodologies: ${companyContext.methodologies.join(", ")}` : ""}
- Every claim must cite evidence from the provided Company Context
- Never use: leverage, synergize, best-in-class, world-class, cutting-edge, holistic approach, robust solution
- If evidence is insufficient, write a confident general statement instead of fabricating
- NEVER output any text inside square brackets. No [Insert X], [Verify X], [Client Name], or any [bracketed text] whatsoever. Write around missing data naturally
- NEVER output Mermaid diagrams, code blocks, or raw code. Use markdown tables and bullet lists instead`;

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

const FALLBACK_MODEL = "gemini-2.0-flash";

export async function generateText(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const genAI = getClient();
  const primaryModel =
    options.model || process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

  const modelsToTry = [primaryModel];
  if (primaryModel !== FALLBACK_MODEL) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemPrompt || SYSTEM_PROMPT,
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        },
      }, heliconeOpts);

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message.toLowerCase();
      const isRetryable =
        msg.includes("503") ||
        msg.includes("service unavailable") ||
        msg.includes("overloaded") ||
        msg.includes("high demand") ||
        msg.includes("not found") ||
        msg.includes("model") ||
        msg.includes("429") ||
        msg.includes("rate limit") ||
        msg.includes("quota");

      if (isRetryable && modelName !== FALLBACK_MODEL) {
        logger.warn(`[AI] ${modelName} failed (${lastError.message.slice(0, 100)}), falling back to ${FALLBACK_MODEL}`);
        continue;
      }
      logger.error(`[AI] Generation failed on ${modelName}`, {
        error: lastError.message.slice(0, 200),
      });
      throw lastError;
    }
  }

  throw lastError || new Error("All models failed");
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
