/**
 * Generate Single Section
 *
 * Generates a single proposal section with L1 context, persuasion layers,
 * industry context, and repetition limiting. Extracted from generate-proposal.ts
 * for file size compliance.
 */

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
import { extractCompetitiveObjections, buildSectionSpecificL1Context } from "@/lib/ai/pipeline/context";
import { retrieveContext } from "@/lib/ai/pipeline/retrieval";
import { shouldGenerateDiagram, generateDiagram } from "@/lib/ai/diagram-generator";
import type { PipelineContext } from "@/lib/ai/pipeline/types";

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
  const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
  if (!config) {
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
    // Retrieve relevant context (org-scoped)
    const searchQuery = config.searchQuery(ctx.intakeData, ctx.winStrategy);
    const { context, chunkIds } = await retrieveContext(
      supabase,
      searchQuery,
      ctx.organizationId,
    );

    
    const solicitationType = (ctx.intakeData.solicitation_type as string) || "RFP";
    const sectionL1Context = buildSectionSpecificL1Context(ctx.rawL1Context, config.type, solicitationType);

    // Build prompt with L1 context
    const basePrompt = config.buildPrompt(
      ctx.intakeData,
      ctx.enhancedAnalysis,
      context,
      ctx.winStrategy,
      ctx.companyInfo,
      sectionL1Context,
    );

    // Build persuasion layers
    const persuasionFramework = getPersuasionPrompt(config.type);
    const bestPractices = getBestPracticesPrompt(config.type);
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
      config.type,
    );

    // Repetition limiter — only applied to sections after executive_summary
    const repetitionBlock = (sectionType !== "executive_summary" && differentiators?.length)
      ? buildRepetitionLimiterBlock(differentiators)
      : "";

    const prompt = [
      basePrompt,
      industryContext ? `\n\n---\n\n${industryContext}` : "",
      persuasionContext
        ? `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
        : "",
      repetitionBlock,
    ]
      .filter(Boolean)
      .join("");

    
    // Generate content
    const generatedContentRaw = await generateText(prompt, {
      systemPrompt: ctx.systemPrompt,
    });

    // Strip out the Chain of Thought block before saving
    let generatedContent = generatedContentRaw.replace(/<thought_process>[\s\S]*?<\/thought_process>/, '').trim();
    if (generatedContent.startsWith('```markdown')) {
      generatedContent = generatedContent.replace(/^```markdown/, '').replace(/```$/, '').trim();
    }


    // Editorial pass disabled — prompt engineering handles formatting/quality.
    // Re-enable if output quality needs a second polish pass:
    // const companyName = (ctx.companyInfo?.name as string) || "Our Company";
    // generatedContent = await runEditorialPass(config.type, config.title, generatedContent, companyName, ctx.systemPrompt);

    // Quality checks (advisory)
    try {
      const avoidTerms = ctx.brandVoice?.terminology?.avoid ?? [];
      const themes = ctx.winStrategy?.win_themes ?? [];
      runQualityChecks(generatedContent, config.type, themes, avoidTerms);
    } catch {
      log.warn(`Quality check failed for ${config.type}`);
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
    if (shouldGenerateDiagram(config.type)) {
      try {
        const companyName = (ctx.companyInfo?.name as string) || "Our Company";
        const clientName = (ctx.intakeData?.client_name as string) || "the Client";
        const diagramImage = await generateDiagram(
          config.type,
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
        log.warn(`Diagram generation failed for ${config.type} — continuing without diagram`);
      }
    }

    // Store source references (non-blocking)
    if (chunkIds.length > 0) {
      try {
        const sourceInserts = chunkIds.map(
          (chunkId: string, idx: number) => ({
            section_id: sectionId,
            chunk_id: chunkId,
            relevance_score: 1 - idx * 0.1,
          }),
        );
        await supabase.from("section_sources").insert(sourceInserts);
      } catch {
        log.warn(`Source tracking failed for ${config.type}`);
      }
    }

    return { chunkCount: chunkIds.length, generatedContent };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("proposal_sections")
      .update({
        generation_status: GenerationStatus.FAILED,
        generation_error: errorMessage,
      })
      .eq("id", sectionId);

    throw err;
  }
}
