/**
 * Generate Single Section
 *
 * Generates a single proposal section with L1 context, persuasion layers,
 * industry context, and repetition limiting. Extracted from generate-proposal.ts
 * for file size compliance.
 */

import { NonRetriableError } from "inngest";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerationStatus } from "@/lib/constants/statuses";
import { generateText } from "@/lib/ai/gemini";
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
import { retrieveContext } from "@/lib/ai/pipeline/retrieval";
import {
  shouldGenerateDiagram,
  generateDiagram,
} from "@/lib/ai/diagram-generator";
import { buildTaskResponsePrompt } from "@/lib/ai/prompts/task-response";
import type { PipelineContext } from "@/lib/ai/pipeline/types";
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
 * Extracted from the generate pipeline loop to be callable as an Inngest step.
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

    // Build prompt: task sections use buildTaskResponsePrompt, custom sections get a dynamic prompt, fixed sections use config.buildPrompt
    let basePrompt: string;
    if (isTaskSection && taskMeta) {
      const taskL1Context = buildTaskSectionL1Context(ctx.rawL1Context);
      basePrompt = buildTaskResponsePrompt({
        taskNumber: taskMeta.task_number,
        taskTitle: taskMeta.title,
        taskDescription: taskMeta.description,
        intakeData: ctx.intakeData,
        analysis: ctx.enhancedAnalysis,
        l1Context: taskL1Context,
        winStrategy: ctx.winStrategy,
        companyInfo: ctx.companyInfo,
        differentiators,
        solicitationType,
        audienceProfile: ctx.audienceProfile,
        primaryBrandName: ctx.primaryBrandName,
      });
    } else if (isCustomSection && customMeta) {
      // Custom sections from RFP analysis — build a dynamic prompt
      const companyName = ctx.companyInfo?.name || "Our Company";
      const requirementsList =
        customMeta.rfp_requirements.length > 0
          ? customMeta.rfp_requirements
              .map((r, i) => `${i + 1}. ${r}`)
              .join("\n")
          : "Address all aspects described below.";

      const sectionL1Context = buildSectionSpecificL1Context(
        ctx.rawL1Context,
        "approach",
        solicitationType,
      );
      basePrompt = `Write the **${customMeta.title}** section for a ${companyName} proposal.

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

${buildEditorialStandards(solicitationType, ctx.audienceProfile, ctx.primaryBrandName, differentiators, ctx.intakeData.tone as string | undefined)}`;
    } else {
      const sectionL1Context = buildSectionSpecificL1Context(
        ctx.rawL1Context,
        config!.type,
        solicitationType,
      );
      basePrompt = config!.buildPrompt(
        ctx.intakeData,
        ctx.enhancedAnalysis,
        context,
        ctx.winStrategy,
        ctx.companyInfo,
        sectionL1Context,
      );
    }

    // For task sections, editorial standards + repetition limiter are already in the prompt
    // For fixed/custom sections, add persuasion layers, industry context, and repetition limiter
    const effectiveType = isTaskSection
      ? "approach"
      : isCustomSection
        ? "approach"
        : config!.type;

    // Build persuasion layers
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

    const persuasionContext = [
      persuasionFramework,
      bestPractices,
      winThemesPrompt,
      competitivePrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

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
    // Agency context goes into ALL sections; pricing context only for pricing/cost sections
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

    log.info("Calling Gemini AI for content generation", {
      sectionType,
      promptLength: prompt.length,
      systemPromptLength: ctx.systemPrompt.length,
    });

    // Generate content with a timeout to prevent Gemini hangs.
    // 60s is generous for flash-lite — most sections complete in 3-8s.
    const SECTION_TIMEOUT_MS = 60_000;
    let generatedContentRaw: string;
    try {
      generatedContentRaw = await Promise.race([
        generateText(prompt, {
          systemPrompt: ctx.systemPrompt,
          maxTokens: 8192,
          thinkingLevel: "high",
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `AI generation timed out after 90s for section ${sectionType}`,
                ),
              ),
            SECTION_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (genErr) {
      const msg = genErr instanceof Error ? genErr.message : String(genErr);
      const msgLower = msg.toLowerCase();
      // Permanent AI errors should NOT retry — they just burn tokens.
      // AI_BLOCKED comes from our own generateText() validation (safety filter,
      // empty response, etc.). These won't succeed on retry with the same prompt.
      // NOTE: Timeouts ARE retriable — generateText() has built-in backoff.
      const isNonRetriable =
        msgLower.includes("ai_blocked") ||
        msgLower.includes("safety") ||
        msgLower.includes("blocked") ||
        msgLower.includes("content filter");
      if (isNonRetriable) {
        throw new NonRetriableError(msg, { cause: genErr });
      }
      throw genErr;
    }

    log.info("AI generation completed", {
      sectionType,
      rawContentLength: generatedContentRaw.length,
    });

    // Strip out Chain of Thought / thinking blocks before saving
    let generatedContent = generatedContentRaw
      .replace(/<thought_process>[\s\S]*?<\/thought_process>/, "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
    if (generatedContent.startsWith("```markdown")) {
      generatedContent = generatedContent
        .replace(/^```markdown/, "")
        .replace(/```$/, "")
        .trim();
    }

    // Editorial pass disabled — prompt engineering handles formatting/quality.
    // Re-enable if output quality needs a second polish pass:
    // const companyName = (ctx.companyInfo?.name as string) || "Our Company";
    // generatedContent = await runEditorialPass(config.type, config.title, generatedContent, companyName, ctx.systemPrompt);

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

    // Update section with content
    await supabase
      .from("proposal_sections")
      .update({
        generated_content: generatedContent,
        generation_status: GenerationStatus.COMPLETED,
        generation_prompt: prompt.slice(0, 2000),
        retrieved_context_ids: chunkIds,
      })
      .eq("id", sectionId);

    // Generate diagram image for applicable sections (non-blocking)
    // Task and custom sections don't get diagrams — they're response-focused
    if (
      !isTaskSection &&
      !isCustomSection &&
      shouldGenerateDiagram(config!.type)
    ) {
      try {
        const companyName = (ctx.companyInfo?.name as string) || "Our Company";
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
