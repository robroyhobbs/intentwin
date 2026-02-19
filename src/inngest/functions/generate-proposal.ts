import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/claude";
import { createProposalVersion } from "@/lib/versioning/create-version";
import {
  getPersuasionPrompt,
  getBestPracticesPrompt,
  buildWinThemesPrompt,
  buildCompetitivePrompt,
  runQualityChecks,
} from "@/lib/ai/persuasion";
import { buildIndustryContext } from "@/lib/ai/industry-configs";
import { createLogger } from "@/lib/utils/logger";
import { createPipelineMetrics } from "@/lib/observability/metrics";
import { SECTION_CONFIGS } from "@/lib/ai/pipeline/section-configs";
import {
  buildPipelineContext,
  extractCompetitiveObjections,
} from "@/lib/ai/pipeline/context";
import { retrieveContext } from "@/lib/ai/pipeline/retrieval";
// Editorial pass import — kept for future re-enablement
// import { runEditorialPass } from "@/lib/ai/editorial-pass";
import type { PipelineContext } from "@/lib/ai/pipeline/types";

/**
 * Generate a single proposal section.
 * Extracted from the generate pipeline loop to be callable as an Inngest step.
 */
async function generateSingleSection(
  sectionId: string,
  sectionType: string,
  ctx: PipelineContext,
): Promise<{ chunkCount: number }> {
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
    .update({ generation_status: "generating" })
    .eq("id", sectionId);

  try {
    // Retrieve relevant context (org-scoped)
    const searchQuery = config.searchQuery(ctx.intakeData, ctx.winStrategy);
    const { context, chunkIds } = await retrieveContext(
      supabase,
      searchQuery,
      ctx.organizationId,
    );

    // Build prompt with L1 context
    const basePrompt = config.buildPrompt(
      ctx.intakeData,
      ctx.enhancedAnalysis,
      context,
      ctx.winStrategy,
      ctx.companyInfo,
      ctx.l1ContextString,
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

    const prompt = [
      basePrompt,
      industryContext ? `\n\n---\n\n${industryContext}` : "",
      persuasionContext
        ? `\n\n---\n\n## Persuasion & Quality Guidance\n\n${persuasionContext}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    // Generate content
    const generatedContent = await generateText(prompt, {
      systemPrompt: ctx.systemPrompt,
    });

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
        generation_status: "completed",
        generation_prompt: prompt.slice(0, 2000),
        retrieved_context_ids: chunkIds,
      })
      .eq("id", sectionId);

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

    return { chunkCount: chunkIds.length };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("proposal_sections")
      .update({
        generation_status: "failed",
        generation_error: errorMessage,
      })
      .eq("id", sectionId);

    throw err;
  }
}

/**
 * Inngest function: Generate a full proposal.
 *
 * Triggered by: proposal/generate.requested
 * Steps:
 *   1. Build pipeline context + create section rows
 *   2-11. Generate each section (fan-out, individually retryable)
 *   12. Finalize proposal status
 *   13. Send proposal/generated event (triggers quality review + compliance)
 */
export const generateProposalFn = inngest.createFunction(
  {
    id: "generate-proposal",
    retries: 3,
    cancelOn: [
      {
        event: "proposal/generate.cancelled",
        match: "data.proposalId",
      },
    ],
  },
  { event: "proposal/generate.requested" },
  async ({ event, step }) => {
    const { proposalId } = event.data;

    // Step 1: Build context and create section rows
    const setup = await step.run("build-context", async () => {
      const supabase = createAdminClient();

      const ctx = await buildPipelineContext(supabase, proposalId);

      // Delete existing sections (idempotent)
      await supabase
        .from("proposal_sections")
        .delete()
        .eq("proposal_id", proposalId);

      // Create all section rows
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
        .select("id, section_type");

      if (sectionError || !sections) {
        throw new Error(
          `Failed to create sections: ${sectionError?.message}`,
        );
      }

      // Return serializable context for subsequent steps
      return {
        pipelineContext: ctx,
        sections: sections.map((s) => ({
          id: s.id,
          sectionType: s.section_type,
        })),
      };
    });

    const { pipelineContext: serializedCtx, sections } = setup;

    // Inngest step serialization can strip `undefined` values from the context.
    // Reconstruct with explicit defaults to satisfy PipelineContext type.
    const ctx: PipelineContext = {
      ...serializedCtx,
      serviceLine: serializedCtx.serviceLine ?? undefined,
      industry: serializedCtx.industry ?? undefined,
    };

    const metrics = createPipelineMetrics(
      proposalId,
      ctx.organizationId,
      {
        industry: ctx.industry,
        opportunityType: ctx.serviceLine,
      },
    );

    // Steps 2-11: Generate each section individually (fan-out)
    // Each section is its own retryable step.
    const sectionResults = await Promise.allSettled(
      sections.map((section) =>
        step.run(`section-${section.sectionType}`, async () => {
          return generateSingleSection(
            section.id,
            section.sectionType,
            ctx,
          );
        }),
      ),
    );

    // Step 12: Finalize proposal status
    const result = await step.run("finalize", async () => {
      const supabase = createAdminClient();

      // Count outcomes from DB (source of truth)
      const { data: finalSections } = await supabase
        .from("proposal_sections")
        .select("generation_status")
        .eq("proposal_id", proposalId);

      const completedCount =
        finalSections?.filter((s) => s.generation_status === "completed")
          .length ?? 0;
      const failedCount =
        finalSections?.filter((s) => s.generation_status === "failed")
          .length ?? 0;

      const log = createLogger({
        operation: "generateProposal",
        proposalId,
      });

      if (completedCount === 0) {
        await supabase
          .from("proposals")
          .update({ status: "draft" })
          .eq("id", proposalId);
        throw new Error(
          `All ${failedCount} sections failed to generate`,
        );
      }

      // Set status to review
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

      // Version snapshot (non-blocking)
      try {
        await createProposalVersion({
          proposalId,
          triggerEvent: "generation_complete",
          changeSummary: `AI generation completed: ${completedCount} sections${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
          label: "Initial Generation",
        });
      } catch (versionErr) {
        log.warn("Version snapshot failed", {
          error:
            versionErr instanceof Error
              ? versionErr.message
              : String(versionErr),
        });
      }

      return { completedCount, failedCount };
    });

    metrics.finish();

    // Step 13: Send completion event (triggers quality review + compliance in parallel)
    // Only send if at least some sections succeeded
    if (result.completedCount > 0) {
      const allSucceeded =
        result.failedCount === 0;
      await step.sendEvent("send-completion", {
        name: "proposal/generated",
        data: {
          proposalId,
          allSectionsSucceeded: allSucceeded,
        },
      });
    }

    return {
      proposalId,
      completed: result.completedCount,
      failed: result.failedCount,
      sectionResults: sectionResults.map((r, i) => ({
        section: sections[i].sectionType,
        status: r.status,
        ...(r.status === "rejected"
          ? { error: r.reason?.message || "Unknown" }
          : {}),
      })),
    };
  },
);
