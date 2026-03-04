/**
 * Generate Single Section
 *
 * Generates a single proposal section with L1 context, persuasion layers,
 * industry context, and repetition limiting. Extracted from generate-proposal.ts
 * for file size compliance.
 *
 * Moved from src/inngest/functions/generate-single-section.ts to decouple
 * from Inngest runtime. This is a pure async function with no Inngest dependencies.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { GenerationStatus } from "@/lib/constants/statuses";
import { generateText } from "@/lib/ai/gemini";
import {
  canUseKimi,
  generateKimiText,
  getKimiCircuitState,
  recordKimiFailure,
  recordKimiSuccess,
} from "@/lib/ai/kimi";
import {
  getPersuasionPrompt,
  getBestPracticesPrompt,
  buildWinThemesPrompt,
  buildCompetitivePrompt,
  runQualityChecks,
} from "@/lib/ai/persuasion";
import { buildIndustryContext } from "@/lib/ai/industry-configs";
import { createLogger } from "@/lib/utils/logger";
import { SECTION_CONFIGS } from "@/lib/ai/pipeline/section-configs";
import {
  extractCompetitiveObjections,
  buildSectionSpecificL1Context,
  buildTaskSectionL1Context,
} from "@/lib/ai/pipeline/context";
import { buildEditorialStandards } from "@/lib/ai/prompts/editorial-standards";
import {
  parseL1Metadata,
  computeGroundingLevel,
  buildGroundingInstructions,
} from "@/lib/ai/prompts/grounding-instructions";
import { retrieveContext } from "@/lib/ai/pipeline/retrieval";
import {
  shouldGenerateDiagram,
  generateDiagram,
} from "@/lib/ai/diagram-generator";
import { buildTaskResponsePrompt } from "@/lib/ai/prompts/task-response";
import type { PipelineContext } from "@/lib/ai/pipeline/types";
import type { GroundingLevel } from "@/lib/ai/prompts/grounding-instructions";
import type { BidEvaluation, FactorKey } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";

/** Metadata stored on rfp_task section rows */
interface TaskSectionMeta {
  task_number: string;
  title: string;
  description: string;
  category: string;
  parent_task_number: string | null;
}

// ── Bid Evaluation → Section Mapping ─────────────────────────────────────────

/** Map bid scoring factor keys to the section types they most affect */
const FACTOR_SECTION_MAP: Record<FactorKey, string[]> = {
  requirement_match: ["approach", "compliance_matrix_section", "rfp_task"],
  past_performance: ["case_studies", "why_us"],
  capability_alignment: ["approach", "team", "why_us"],
  timeline_feasibility: ["timeline", "approach"],
  strategic_value: ["executive_summary", "cover_letter", "why_us"],
};

/** Weak factor threshold — factors scoring below this get injected as risk guidance */
const WEAK_FACTOR_THRESHOLD = 60;

/**
 * Build a prompt block from bid evaluation weak factors relevant to this section type.
 * Returns empty string if no weak factors affect this section.
 */
export function buildBidEvalRiskBlock(
  bidEvaluation: BidEvaluation | null | undefined,
  sectionType: string,
): string {
  if (!bidEvaluation?.ai_scores) return "";

  // Find weak factors that affect this section type
  const weakFactors = SCORING_FACTORS.filter((factor) => {
    const score = bidEvaluation.ai_scores[factor.key]?.score ?? 100;
    if (score >= WEAK_FACTOR_THRESHOLD) return false;
    // Check if this factor maps to the current section type
    const relevantSections = FACTOR_SECTION_MAP[factor.key] || [];
    return relevantSections.includes(sectionType);
  });

  if (weakFactors.length === 0) return "";

  const factorLines = weakFactors
    .map((factor) => {
      const data = bidEvaluation.ai_scores[factor.key];
      return `  - **${factor.label}** (score: ${data.score}/100): ${data.rationale}`;
    })
    .join("\n");

  return `\n\n---\n\n## BID RISK AREAS — ADDRESS IN THIS SECTION
The bid evaluation identified these areas as weak for this opportunity:
${factorLines}

IMPORTANT: This section should proactively address these concerns by:
- Providing specific evidence, metrics, or examples that counter the weakness
- Framing your response to directly mitigate evaluator concerns in these areas
- If a gap genuinely exists, acknowledge it honestly and describe your mitigation plan`;
}

/**
 * Build the repetition limiter prompt block from extracted differentiators.
 * Returns empty string if no differentiators are available.
 */
export function buildRepetitionLimiterBlock(differentiators: string[]): string {
  if (!differentiators.length) return "";
  const diffList = differentiators.map((d) => `  - ${d}`).join("\n");
  return `\n\n---\n\n## REPETITION LIMITER (MANDATORY)
The following differentiators were already stated in the Executive Summary:
${diffList}

DO NOT re-state these claims verbatim. Instead:
- Demonstrate each differentiator through specific examples relevant to THIS section
- Show, don't tell — add new evidence, metrics, or detail rather than echoing the same points
- Each section should contribute NEW information that builds on the Executive Summary`;
}

/**
 * Generate a single proposal section.
 * Pure async function — no Inngest dependency.
 */
export async function generateSingleSection(
  sectionId: string,
  sectionType: string,
  ctx: PipelineContext,
  differentiators?: string[],
): Promise<{ chunkCount: number; generatedContent?: string }> {
  const supabase = createAdminClient();

  // For rfp_task sections, we don't look up SECTION_CONFIGS — we use task metadata
  // For custom sections (prefixed "custom_"), we build prompts from RFP analysis
  const isTaskSection = sectionType === "rfp_task";
  const isCustomSection = sectionType.startsWith("custom_");
  const config =
    isTaskSection || isCustomSection
      ? null
      : SECTION_CONFIGS.find((c) => c.type === sectionType);
  if (!isTaskSection && !isCustomSection && !config) {
    throw new Error(`Unknown section type: ${sectionType}`);
  }

  const log = createLogger({
    operation: "generateSection",
    proposalId: ctx.proposal.id as string,
    sectionType,
  });

  // Mark as generating
  await supabase
    .from("proposal_sections")
    .update({ generation_status: GenerationStatus.GENERATING })
    .eq("id", sectionId);

  try {
    // For task sections, read metadata from the section row
    let taskMeta: TaskSectionMeta | null = null;
    if (isTaskSection) {
      const { data: sectionRow } = await supabase
        .from("proposal_sections")
        .select("metadata")
        .eq("id", sectionId)
        .single();
      taskMeta = (sectionRow?.metadata as TaskSectionMeta | null) ?? null;
      if (!taskMeta?.task_number) {
        throw new Error(`Task section ${sectionId} is missing task metadata`);
      }
    }

    // For custom sections, read metadata from the section row (same pattern as task sections)
    let customMeta: {
      title: string;
      description: string;
      rfp_requirements: string[];
    } | null = null;
    if (isCustomSection) {
      const { data: sectionRow } = await supabase
        .from("proposal_sections")
        .select("title, metadata")
        .eq("id", sectionId)
        .single();
      const meta = sectionRow?.metadata as Record<string, unknown> | null;
      customMeta = {
        title: sectionRow?.title || sectionType,
        description: (meta?.custom_description as string) || "",
        rfp_requirements: (meta?.rfp_requirements as string[]) || [],
      };
    }

    log.info("Building search query for RAG retrieval", {
      isTaskSection,
      isCustomSection,
      sectionType,
      taskNumber: taskMeta?.task_number,
    });

    // Build search query for RAG retrieval
    const searchQuery = isTaskSection
      ? `${taskMeta!.title} ${taskMeta!.description.slice(0, 100)} ${ctx.intakeData.client_industry || ""}`
      : isCustomSection
        ? `${customMeta!.title} ${customMeta!.description.slice(0, 100)} ${ctx.intakeData.client_industry || ""}`
        : config!.searchQuery(ctx.intakeData, ctx.winStrategy);

    // Retrieve relevant context (org-scoped)
    const { context, chunkIds } = await retrieveContext(
      supabase,
      searchQuery,
      ctx.organizationId,
    );

    const solicitationType =
      (ctx.intakeData.solicitation_type as string) || "RFP";

    // Compute effective section type early — needed for grounding + persuasion
    const effectiveType = isTaskSection
      ? "approach"
      : isCustomSection
        ? "approach"
        : config!.type;

    // Compute grounding level before basePrompt so it can be passed to buildEditorialStandards
    const sectionL1ForGrounding = isTaskSection
      ? buildTaskSectionL1Context(ctx.rawL1Context)
      : buildSectionSpecificL1Context(
          ctx.rawL1Context,
          effectiveType,
          solicitationType,
        );
    const l1Data = parseL1Metadata(sectionL1ForGrounding);
    const groundingLevel = computeGroundingLevel(effectiveType, l1Data);
    const companyName = (ctx.companyInfo?.name as string) || "Our Company";
    const groundingBlock = buildGroundingInstructions(
      effectiveType,
      l1Data,
      companyName,
    );

    // Build prompt: task sections use buildTaskResponsePrompt, custom sections get a dynamic prompt, fixed sections use config.buildPrompt
    const basePrompt = buildBasePrompt({
      isTaskSection,
      isCustomSection,
      taskMeta,
      customMeta,
      config,
      ctx,
      context,
      sectionL1ForGrounding,
      companyName,
      solicitationType,
      differentiators,
      groundingLevel,
    });

    // Build persuasion layers
    const persuasionContext = buildPersuasionContext(ctx, effectiveType);

    const industryContext = buildIndustryContext(
      ctx.industryConfig,
      effectiveType,
    );

    // Repetition limiter — applied to all sections except executive_summary
    // For task sections, it's already embedded via buildTaskResponsePrompt's differentiators param
    const repetitionBlock =
      !isTaskSection &&
      sectionType !== "executive_summary" &&
      differentiators?.length
        ? buildRepetitionLimiterBlock(differentiators)
        : "";

    // Bid evaluation risk guidance — injects weak factor rationale for relevant sections
    const bidEvalBlock = buildBidEvalRiskBlock(
      ctx.bidEvaluation,
      isTaskSection ? "rfp_task" : sectionType,
    );

    // Inject intelligence context from pipeline (Stream A: Deeper Pipeline)
    const agencyBlock = ctx.agencyContext
      ? `\n\n---\n\n${ctx.agencyContext}`
      : "";
    const pricingBlock =
      (sectionType === "pricing" || sectionType === "rfp_task") &&
      ctx.pricingContext
        ? `\n\n---\n\n${ctx.pricingContext}`
        : "";

    const prompt = [
      basePrompt,
      groundingBlock ? `\n\n---\n\n${groundingBlock}` : "",
      agencyBlock,
      pricingBlock,
      industryContext ? `\n\n---\n\n${industryContext}` : "",
      persuasionContext
        ? `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
        : "",
      repetitionBlock,
      bidEvalBlock,
    ]
      .filter(Boolean)
      .join("");

    log.info("Calling AI for content generation", {
      sectionType,
      promptLength: prompt.length,
      systemPromptLength: ctx.systemPrompt.length,
    });

    // Generate content with timeout guard
    const generatedContentRaw = await generateWithProviders(
      prompt,
      ctx,
      sectionType,
      log,
    );

    log.info("AI generation completed", {
      sectionType,
      rawContentLength: generatedContentRaw.content.length,
      provider: generatedContentRaw.provider,
    });

    // Strip out Chain of Thought / thinking blocks before saving
    let generatedContent = generatedContentRaw.content
      .replace(/<thought_process>[\s\S]*?<\/thought_process>/, "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
    if (generatedContent.startsWith("```markdown")) {
      generatedContent = generatedContent
        .replace(/^```markdown/, "")
        .replace(/```$/, "")
        .trim();
    }

    // Strip AI-generated bracket placeholders that violate editorial rules.
    generatedContent = generatedContent
      .replace(
        /\[(?:Insert|TBD|TODO|Verify|VERIFY|Check|Confirm|Add|Your|Needs?|Provide|Specify|Enter|Fill|Include|Update|Replace|Placeholder)[^\]]*\]/gi,
        "",
      )
      .replace(/\[[A-Z][A-Z\s]{2,}[A-Z]\]/g, "")
      .replace(/\n{3,}/g, "\n\n");

    // Quality checks (advisory)
    try {
      const avoidTerms = ctx.brandVoice?.terminology?.avoid ?? [];
      const themes = ctx.winStrategy?.win_themes ?? [];
      runQualityChecks(generatedContent, effectiveType, themes, avoidTerms);
    } catch {
      log.warn(
        `Quality check failed for ${sectionType}${taskMeta ? ` (task ${taskMeta.task_number})` : ""}`,
      );
    }

    // Build merged metadata — preserve existing task/custom metadata, add grounding_level
    const existingMeta = (taskMeta ?? customMeta ?? {}) as Record<
      string,
      unknown
    >;
    const mergedMeta: Record<string, unknown> = {
      ...existingMeta,
      grounding_level: groundingLevel,
      generation_provider: generatedContentRaw.provider,
    };
    if (generatedContentRaw.fallbackReason) {
      mergedMeta.provider_fallback_reason =
        generatedContentRaw.fallbackReason.slice(0, 300);
    }

    // Update section with content + grounding metadata
    await supabase
      .from("proposal_sections")
      .update({
        generated_content: generatedContent,
        generation_status: GenerationStatus.COMPLETED,
        generation_prompt: prompt.slice(0, 2000),
        retrieved_context_ids: chunkIds,
        metadata: mergedMeta,
      })
      .eq("id", sectionId);

    // Generate diagram image for applicable sections (non-blocking)
    if (
      !isTaskSection &&
      !isCustomSection &&
      shouldGenerateDiagram(config!.type)
    ) {
      try {
        const clientName =
          (ctx.intakeData?.client_name as string) || "the Client";
        const diagramImage = await generateDiagram(
          config!.type,
          generatedContent,
          companyName,
          clientName,
        );
        if (diagramImage) {
          await supabase
            .from("proposal_sections")
            .update({ diagram_image: diagramImage })
            .eq("id", sectionId);
        }
      } catch {
        log.warn(
          `Diagram generation failed for ${config!.type} — continuing without diagram`,
        );
      }
    }

    // Store source references (non-blocking)
    if (chunkIds.length > 0) {
      try {
        const sourceInserts = chunkIds.map((chunkId: string, idx: number) => ({
          section_id: sectionId,
          chunk_id: chunkId,
          relevance_score: 1 - idx * 0.1,
        }));
        await supabase.from("section_sources").insert(sourceInserts);
      } catch {
        log.warn(
          `Source tracking failed for ${sectionType}${taskMeta ? ` (task ${taskMeta.task_number})` : ""}`,
        );
      }
    }

    return { chunkCount: chunkIds.length, generatedContent };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;

    log.error("Section generation FAILED", {
      sectionId,
      sectionType,
      proposalId: ctx.proposal.id,
      error: errorMessage,
      stack: errorStack?.slice(0, 500),
    });

    await supabase
      .from("proposal_sections")
      .update({
        generation_status: GenerationStatus.FAILED,
        generation_error: errorMessage.slice(0, 1000),
      })
      .eq("id", sectionId);

    throw err;
  }
}

// ── Helpers extracted to keep generateSingleSection under 50 lines of logic ──

interface BuildBasePromptArgs {
  isTaskSection: boolean;
  isCustomSection: boolean;
  taskMeta: TaskSectionMeta | null;
  customMeta: {
    title: string;
    description: string;
    rfp_requirements: string[];
  } | null;
  config: (typeof SECTION_CONFIGS)[number] | null | undefined;
  ctx: PipelineContext;
  context: string;
  sectionL1ForGrounding: string;
  companyName: string;
  solicitationType: string;
  differentiators?: string[];
  groundingLevel: GroundingLevel;
}

function buildBasePrompt(args: BuildBasePromptArgs): string {
  const {
    isTaskSection,
    isCustomSection,
    taskMeta,
    customMeta,
    config,
    ctx,
    context,
    sectionL1ForGrounding,
    companyName,
    solicitationType,
    differentiators,
    groundingLevel,
  } = args;

  if (isTaskSection && taskMeta) {
    return buildTaskResponsePrompt({
      taskNumber: taskMeta.task_number,
      taskTitle: taskMeta.title,
      taskDescription: taskMeta.description,
      intakeData: ctx.intakeData,
      analysis: ctx.enhancedAnalysis,
      l1Context: sectionL1ForGrounding,
      winStrategy: ctx.winStrategy,
      companyInfo: ctx.companyInfo,
      differentiators,
      solicitationType,
      audienceProfile: ctx.audienceProfile,
      primaryBrandName: ctx.primaryBrandName,
    });
  }

  if (isCustomSection && customMeta) {
    const requirementsList =
      customMeta.rfp_requirements.length > 0
        ? customMeta.rfp_requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")
        : "Address all aspects described below.";

    const sectionL1Context = buildSectionSpecificL1Context(
      ctx.rawL1Context,
      "approach",
      solicitationType,
    );
    return `Write the **${customMeta.title}** section for a ${companyName} proposal.

## Section Requirements (from RFP)
${customMeta.description || `The RFP requires a "${customMeta.title}" section.`}

### Specific Requirements to Address:
${requirementsList}

## Opportunity Details
${JSON.stringify(ctx.intakeData, null, 2)}

## Strategic Analysis
${ctx.enhancedAnalysis}

## Reference Material from Past Winning Proposals
${context}
${sectionL1Context || ""}

## Instructions
Write a thorough, evidence-backed response (400-600 words) for the "${customMeta.title}" section.

**Structure your response to directly address each requirement listed above.**

- Lead with the most critical requirement
- Support every claim with evidence from the Company Context
- Use specific metrics, certifications, and case studies where relevant
- Address the evaluator's concerns proactively

IMPORTANT: Reference specific ${companyName} capabilities from the Company Context. Do not make generic claims.

${buildEditorialStandards(solicitationType, ctx.audienceProfile, ctx.primaryBrandName, differentiators, ctx.intakeData.tone as string | undefined, groundingLevel)}`;
  }

  const sectionL1Context = buildSectionSpecificL1Context(
    ctx.rawL1Context,
    config!.type,
    solicitationType,
  );
  return config!.buildPrompt(
    ctx.intakeData,
    ctx.enhancedAnalysis,
    context,
    ctx.winStrategy,
    ctx.companyInfo,
    sectionL1Context,
  );
}

function buildPersuasionContext(
  ctx: PipelineContext,
  effectiveType: string,
): string {
  const persuasionFramework = getPersuasionPrompt(effectiveType);
  const bestPractices = getBestPracticesPrompt(effectiveType);
  const winThemesPrompt = ctx.winStrategy?.win_themes
    ? buildWinThemesPrompt(ctx.winStrategy.win_themes)
    : "";
  const competitiveObjections = extractCompetitiveObjections(ctx.intakeData);
  const competitivePrompt = ctx.winStrategy?.differentiators
    ? buildCompetitivePrompt(
        ctx.winStrategy.differentiators,
        competitiveObjections,
      )
    : "";

  return [
    persuasionFramework,
    bestPractices,
    winThemesPrompt,
    competitivePrompt,
  ]
    .filter(Boolean)
    .join("\n\n");
}

interface GenerationResult {
  content: string;
  provider: "kimi" | "gemini";
  fallbackReason: string | null;
}

/**
 * Section generation timeout. Set to 55s to leave 5s headroom
 * within Vercel Hobby's 60s function execution limit.
 */
const SECTION_TIMEOUT_MS = 55_000;

/**
 * Sentinel error class for non-retriable AI failures (safety blocks, content filters).
 * Inngest callers can detect this to avoid burning tokens on retries.
 * Direct API callers simply catch and return a failure response.
 */
export class GenerationNonRetriableError extends Error {
  readonly nonRetriable = true;
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "GenerationNonRetriableError";
  }
}

async function generateWithProviders(
  prompt: string,
  ctx: PipelineContext,
  sectionType: string,
  log: ReturnType<typeof createLogger>,
): Promise<GenerationResult> {
  let provider: "kimi" | "gemini" = "gemini";
  let fallbackReason: string | null = null;

  const generateWithGemini = async () =>
    generateText(prompt, {
      systemPrompt: ctx.systemPrompt,
      maxTokens: 8192,
      thinkingLevel: "none",
    });

  const timeoutPromise = () =>
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `AI generation timed out after ${SECTION_TIMEOUT_MS / 1000}s for section ${sectionType}`,
            ),
          ),
        SECTION_TIMEOUT_MS,
      ),
    );

  let content: string;

  try {
    if (canUseKimi()) {
      try {
        content = await Promise.race([
          generateKimiText(prompt, {
            systemPrompt: ctx.systemPrompt,
            maxTokens: 8192,
          }),
          timeoutPromise(),
        ]);
        provider = "kimi";
        recordKimiSuccess();
      } catch (kimiErr) {
        const kimiFailure = recordKimiFailure(kimiErr);
        fallbackReason =
          kimiErr instanceof Error ? kimiErr.message : String(kimiErr);
        log.warn("Kimi generation failed — falling back to Gemini", {
          sectionType,
          error: fallbackReason,
          circuitOpened: kimiFailure.opened,
          permanent: kimiFailure.permanent,
          disabledUntil: kimiFailure.disabledUntil,
        });
        content = await Promise.race([generateWithGemini(), timeoutPromise()]);
        provider = "gemini";
      }
    } else {
      const kimiCircuit = getKimiCircuitState();
      if (process.env.KIMI_API_KEY?.trim() && kimiCircuit.isOpen) {
        log.info("Skipping Kimi due to open provider circuit", {
          sectionType,
          disabledUntil: kimiCircuit.disabledUntil,
          lastReason: kimiCircuit.lastReason,
          consecutiveFailures: kimiCircuit.consecutiveFailures,
        });
      }
      content = await Promise.race([generateWithGemini(), timeoutPromise()]);
    }
  } catch (genErr) {
    const msg = genErr instanceof Error ? genErr.message : String(genErr);
    const msgLower = msg.toLowerCase();
    // Permanent AI errors should NOT retry — they just burn tokens.
    const isNonRetriable =
      msgLower.includes("ai_blocked") ||
      msgLower.includes("safety") ||
      msgLower.includes("blocked") ||
      msgLower.includes("content filter");
    if (isNonRetriable) {
      throw new GenerationNonRetriableError(msg, { cause: genErr });
    }
    throw genErr;
  }

  return { content, provider, fallbackReason };
}
