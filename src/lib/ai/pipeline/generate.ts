import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "../claude";
import { createProposalVersion } from "@/lib/versioning/create-version";
import { runQualityReview } from "../quality-overseer";
import { runComplianceAssessment } from "../compliance-assessor";
import {
  getPersuasionPrompt,
  getBestPracticesPrompt,
  buildWinThemesPrompt,
  buildCompetitivePrompt,
  runQualityChecks,
} from "../persuasion";
import { buildIndustryContext } from "../industry-configs";
import { createLogger } from "@/lib/utils/logger";
import { createPipelineMetrics } from "@/lib/observability/metrics";
import { SECTION_CONFIGS } from "./section-configs";
import { buildPipelineContext } from "./context";
import { retrieveContext, parallelBatch, PIPELINE_CONCURRENCY } from "./retrieval";

export async function generateProposal(proposalId: string): Promise<void> {
  const supabase = createAdminClient();

  // Note: proposal status is already set to "generating" by the route handler's atomic claim.
  // Safety timeout: must fit within Vercel's maxDuration (300s).
  // Use 280s to leave 20s buffer for cleanup and status updates.
  const GENERATION_TIMEOUT_MS = 280 * 1000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    GENERATION_TIMEOUT_MS,
  );

  try {
    // Check for abort periodically during the generation loop
    if (timeoutController.signal.aborted) {
      throw new Error("Generation timed out");
    }

    // Build shared pipeline context (proposal fetch, L1, analysis, etc.)
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
      serviceLine,
      industry,
      industryConfig,
    } = ctx;

    // Delete any existing sections from prior attempts (idempotent generation)
    await supabase
      .from("proposal_sections")
      .delete()
      .eq("proposal_id", proposalId);

    // Create all section rows (pending)
    const sectionInserts = SECTION_CONFIGS.map((config) => ({
      proposal_id: proposalId,
      section_type: config.type,
      section_order: config.order,
      title: config.title,
      generation_status: "pending" as const,
    }));

    const { data: sections, error: sectionError } = await supabase
      .from("proposal_sections")
      .insert(sectionInserts)
      .select();

    if (sectionError || !sections) {
      throw new Error(`Failed to create sections: ${sectionError?.message}`);
    }

    // Stage 2 & 3: Retrieve context and generate sections in parallel batches
    // Sections are independent — no cross-section dependencies — so we can
    // safely generate multiple sections concurrently for ~3x speedup.
    const log = createLogger({
      operation: "generateProposal",
      proposalId,
      organizationId,
      concurrency: PIPELINE_CONCURRENCY,
    });
    const metrics = createPipelineMetrics(proposalId, organizationId, {
      industry: industry,
      opportunityType: serviceLine,
    });

    log.info("Starting parallel section generation", {
      sectionCount: SECTION_CONFIGS.length,
      concurrency: PIPELINE_CONCURRENCY,
    });

    // Build the list of section work items
    const sectionWork = SECTION_CONFIGS.map((config) => ({
      config,
      section: sections.find((s) => s.section_type === config.type),
    })).filter((item) => item.section !== undefined);

    await parallelBatch(
      sectionWork,
      PIPELINE_CONCURRENCY,
      async ({ config, section }) => {
        // Check timeout before each section
        if (timeoutController.signal.aborted) {
          throw new Error("Generation timed out");
        }

        const sectionTracker = metrics.trackSection(config.type);

        // Update section status to generating
        await supabase
          .from("proposal_sections")
          .update({ generation_status: "generating" })
          .eq("id", section!.id);

        try {
          // Retrieve relevant context (org-scoped, win-strategy-aware)
          const searchQuery = config.searchQuery(intakeData, winStrategy);
          const { context, chunkIds } = await retrieveContext(
            supabase,
            searchQuery,
            organizationId,
          );

          // Build the base prompt with L1 context as a first-class section
          const basePrompt = config.buildPrompt(
            intakeData,
            enhancedAnalysis,
            context,
            winStrategy,
            companyInfo,
            l1ContextString,
          );

          // Build persuasion layers for this section type
          const persuasionFramework = getPersuasionPrompt(config.type);
          const bestPractices = getBestPracticesPrompt(config.type);
          const winThemesPrompt = winStrategy?.win_themes
            ? buildWinThemesPrompt(winStrategy.win_themes)
            : "";
          const competitivePrompt = winStrategy?.differentiators
            ? buildCompetitivePrompt(winStrategy.differentiators, [])
            : "";

          // Combine base prompt with persuasion context
          const persuasionContext = [
            persuasionFramework,
            bestPractices,
            winThemesPrompt,
            competitivePrompt,
          ]
            .filter(Boolean)
            .join("\n\n");

          // Build industry intelligence context for this section
          const industryContext = buildIndustryContext(
            industryConfig,
            config.type,
          );

          const prompt = [
            basePrompt,
            industryContext ? `\n\n---\n\n${industryContext}` : "",
            persuasionContext
              ? `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
              : "",
          ]
            .filter(Boolean)
            .join("");

          // Generate the section content with organization-aware system prompt
          const generatedContent = await generateText(prompt, {
            systemPrompt,
          });

          // Run quality checks (advisory — log results, don't block generation)
          try {
            const avoidTerms = brandVoice?.terminology?.avoid ?? [];
            const themes = winStrategy?.win_themes ?? [];
            const qualityResult = runQualityChecks(
              generatedContent,
              config.type,
              themes,
              avoidTerms,
            );
            log.debug(`Quality check for ${config.type}`, {
              sectionType: config.type,
              qualityResult,
            });
          } catch (qcError) {
            log.warn(`Quality check failed for ${config.type}`, {
              sectionType: config.type,
              error: qcError instanceof Error ? qcError.message : String(qcError),
            });
          }

          // Update section with generated content
          await supabase
            .from("proposal_sections")
            .update({
              generated_content: generatedContent,
              generation_status: "completed",
              generation_prompt: prompt.slice(0, 2000), // Store truncated prompt for debugging
              retrieved_context_ids: chunkIds,
            })
            .eq("id", section!.id);

          // Store source references (non-blocking — don't fail the section for metadata)
          if (chunkIds.length > 0) {
            try {
              const sourceInserts = chunkIds.map(
                (chunkId: string, idx: number) => ({
                  section_id: section!.id,
                  chunk_id: chunkId,
                  relevance_score: 1 - idx * 0.1, // Approximate scoring by rank
                }),
              );

              await supabase.from("section_sources").insert(sourceInserts);
            } catch (sourceErr) {
              log.warn(`Source tracking failed for ${config.type}`, {
                error: sourceErr instanceof Error ? sourceErr.message : String(sourceErr),
              });
            }
          }

          sectionTracker.success({ ragChunks: chunkIds.length });
        } catch (sectionErr) {
          const errorMessage =
            sectionErr instanceof Error ? sectionErr.message : "Unknown error";

          await supabase
            .from("proposal_sections")
            .update({
              generation_status: "failed",
              generation_error: errorMessage,
            })
            .eq("id", section!.id);

          sectionTracker.failure(errorMessage);
        }
      },
    );

    const pipelineResult = metrics.finish();

    // Count actual section outcomes from DB (source of truth, not just metrics)
    const { data: finalSections } = await supabase
      .from("proposal_sections")
      .select("generation_status")
      .eq("proposal_id", proposalId);

    const completedCount = finalSections?.filter(
      (s) => s.generation_status === "completed",
    ).length ?? 0;
    const failedCount = finalSections?.filter(
      (s) => s.generation_status === "failed",
    ).length ?? 0;

    log.info("Section generation complete", {
      status: pipelineResult.status,
      generated: completedCount,
      failed: failedCount,
      totalDurationMs: pipelineResult.totalDurationMs,
      totalTokens: pipelineResult.totalTokens,
    });

    if (completedCount === 0) {
      // All sections failed — treat as a generation failure
      throw new Error(
        `All ${failedCount} sections failed to generate`,
      );
    }

    // Set status to review — even partial results are useful.
    // Store failure metadata so the UI can warn the user.
    await supabase
      .from("proposals")
      .update({
        status: "review",
        generation_completed_at: new Date().toISOString(),
        ...(failedCount > 0
          ? {
              generation_error: `${failedCount} of ${completedCount + failedCount} sections failed. You can regenerate failed sections individually.`,
            }
          : { generation_error: null }),
      })
      .eq("id", proposalId);

    // Create a version snapshot after generation completes (non-blocking)
    try {
      await createProposalVersion({
        proposalId,
        triggerEvent: "generation_complete",
        changeSummary: `AI generation completed: ${completedCount} sections${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        label: "Initial Generation",
      });
    } catch (versionErr) {
      log.warn("Version snapshot failed (non-blocking)", {
        error: versionErr instanceof Error ? versionErr.message : String(versionErr),
      });
    }

    // Auto-trigger quality review only if all sections succeeded
    if (failedCount === 0) {
      runQualityReview(proposalId, "auto_post_generation").catch((err) => {
        const reviewLog = createLogger({ operation: "qualityReview", proposalId });
        reviewLog.error("Auto quality review failed", err);
      });
    }

    // Auto-trigger compliance assessment (runs in parallel with quality review)
    runComplianceAssessment(proposalId, "auto_post_generation").catch((err) => {
      const assessLog = createLogger({ operation: "complianceAssessment", proposalId });
      assessLog.error("Auto compliance assessment failed", err);
    });
  } catch (error) {
    const _errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorLog = createLogger({ operation: "generateProposal", proposalId });
    errorLog.error("Proposal generation failed", error);

    await supabase
      .from("proposals")
      .update({ status: "draft" })
      .eq("id", proposalId);

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
