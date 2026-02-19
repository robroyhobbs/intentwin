import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "../claude";
import {
  getPersuasionPrompt,
  getBestPracticesPrompt,
  buildWinThemesPrompt,
  buildCompetitivePrompt,
  runQualityChecks,
} from "../persuasion";
import { buildIndustryContext } from "../industry-configs";
import { logRegenerationMetric } from "@/lib/observability/metrics";
import { SECTION_CONFIGS } from "./section-configs";
import { buildPipelineContext, extractCompetitiveObjections } from "./context";
import { retrieveContext } from "./retrieval";

/**
 * Regenerate a single section of a proposal.
 * Reuses the same pipeline context (analysis, L1, persuasion) as full generation.
 */
export async function regenerateSection(
  proposalId: string,
  sectionId: string,
  qualityFeedback?: string | null,
): Promise<void> {
  const regenStartTime = performance.now();
  const supabase = createAdminClient();

  // Fetch the section to get its type
  const { data: section, error: secErr } = await supabase
    .from("proposal_sections")
    .select("*")
    .eq("id", sectionId)
    .eq("proposal_id", proposalId)
    .single();

  if (secErr || !section) {
    throw new Error("Section not found");
  }

  const config = SECTION_CONFIGS.find((c) => c.type === section.section_type);
  if (!config) {
    throw new Error(`Unknown section type: ${section.section_type}`);
  }

  // Mark as generating
  await supabase
    .from("proposal_sections")
    .update({ generation_status: "generating", generation_error: null })
    .eq("id", sectionId);

  try {
    // Build shared pipeline context (reuses same setup as generateProposal)
    const ctx = await buildPipelineContext(supabase, proposalId);
    const {
      organizationId,
      intakeData,
      winStrategy,
      companyInfo,
      brandVoice,
      systemPrompt,
      enhancedAnalysis,
      l1ContextString,
      industryConfig,
    } = ctx;

    // Generate section content (org-scoped, win-strategy-aware retrieval)
    const searchQuery = config.searchQuery(intakeData, winStrategy);
    const { context, chunkIds } = await retrieveContext(supabase, searchQuery, organizationId);

    const basePrompt = config.buildPrompt(
      intakeData,
      enhancedAnalysis,
      context,
      winStrategy,
      companyInfo,
      l1ContextString,
    );

    const persuasionFramework = getPersuasionPrompt(config.type);
    const bestPractices = getBestPracticesPrompt(config.type);
    const winThemesPrompt = winStrategy?.win_themes
      ? buildWinThemesPrompt(winStrategy.win_themes)
      : "";
    // Extract competitive objections from intake data
    const competitiveObjections = extractCompetitiveObjections(intakeData);
    const competitivePrompt = winStrategy?.differentiators
      ? buildCompetitivePrompt(winStrategy.differentiators, competitiveObjections)
      : "";

    const persuasionContext = [
      persuasionFramework,
      bestPractices,
      winThemesPrompt,
      competitivePrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Add industry-specific guidance (was missing from regeneration path)
    const industryContext = buildIndustryContext(industryConfig, config.type);

    let prompt = basePrompt;
    if (industryContext) {
      prompt += `\n\n---\n\n${industryContext}`;
    }
    if (persuasionContext) {
      prompt += `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`;
    }

    // Inject quality council feedback when available (feedback-aware regeneration)
    if (qualityFeedback) {
      prompt += `\n\n---\n\n## Quality Review Feedback (from independent reviewer council)\n\nThe previous version of this section was reviewed by a quality council. Address ALL issues identified below:\n\n${qualityFeedback}\n\nIMPORTANT: Your rewrite must specifically address each piece of feedback above. Improve specificity, evidence, client relevance, and persuasive impact based on the judges' comments.`;
    }

    const generatedContent = await generateText(prompt, { systemPrompt });

    // Quality checks (advisory)
    try {
      const avoidTerms = brandVoice?.terminology?.avoid ?? [];
      const themes = winStrategy?.win_themes ?? [];
      runQualityChecks(generatedContent, config.type, themes, avoidTerms);
    } catch {
      // Non-critical
    }

    // Update section
    await supabase
      .from("proposal_sections")
      .update({
        generated_content: generatedContent,
        edited_content: null,
        is_edited: false,
        generation_status: "completed",
        generation_prompt: prompt.slice(0, 2000),
        retrieved_context_ids: chunkIds,
        generation_error: null,
      })
      .eq("id", sectionId);

    // Store source references
    if (chunkIds.length > 0) {
      // Clear old sources first
      await supabase
        .from("section_sources")
        .delete()
        .eq("section_id", sectionId);

      const sourceInserts = chunkIds.map((chunkId: string, idx: number) => ({
        section_id: sectionId,
        chunk_id: chunkId,
        relevance_score: 1 - idx * 0.1,
      }));
      await supabase.from("section_sources").insert(sourceInserts);
    }

    // Log regeneration metric (non-critical — never break main flow)
    try {
      logRegenerationMetric({
        proposalId,
        sectionId,
        sectionType: section.section_type,
        organizationId,
        durationMs: Math.round(performance.now() - regenStartTime),
        status: "success",
        hadQualityFeedback: !!qualityFeedback,
      });
    } catch {
      // Metric logging must never break regeneration
    }
  } catch (sectionErr) {
    const errorMessage =
      sectionErr instanceof Error ? sectionErr.message : "Unknown error";

    await supabase
      .from("proposal_sections")
      .update({
        generation_status: "failed",
        generation_error: errorMessage,
      })
      .eq("id", sectionId);

    // Log regeneration failure metric (non-critical)
    try {
      logRegenerationMetric({
        proposalId,
        sectionId,
        sectionType: section.section_type,
        organizationId: "",  // proposal may not have been fetched yet
        durationMs: Math.round(performance.now() - regenStartTime),
        status: "failure",
        hadQualityFeedback: !!qualityFeedback,
        error: errorMessage,
      });
    } catch {
      // Metric logging must never break regeneration
    }

    throw sectionErr;
  }
}
