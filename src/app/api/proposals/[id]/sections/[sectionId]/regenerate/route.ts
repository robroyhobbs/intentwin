/**
 * POST /api/proposals/[id]/sections/[sectionId]/regenerate
 *
 * Regenerates a single proposal section using the stored pipeline context.
 * Calls generateSingleSection directly (no Inngest dependency).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateSingleSection } from "@/lib/ai/pipeline/generate-single-section";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import { GenerationStatus, QualityReviewStatus } from "@/lib/constants/statuses";
import type { PipelineContext } from "@/lib/ai/pipeline/types";
import { createLogger } from "@/lib/utils/logger";
import { conflict, ok, serverError, withProposalRoute } from "@/lib/api/response";

export const maxDuration = 60;

export const POST = withProposalRoute(
  async (_request, { id, sectionId }, _context, proposal) => {
    const log = createLogger({
      operation: "regenerate-section",
      proposalId: id,
    });

    // Block regeneration while quality review is in progress
    const qualityReview = proposal!.quality_review as {
      status?: string;
    } | null;
    if (qualityReview?.status === QualityReviewStatus.REVIEWING) {
      return conflict(
        "Cannot regenerate sections while a quality review is in progress. Please wait for the review to complete.",
      );
    }

    const supabase = createAdminClient();

    // Read pipeline context from generation_metadata
    const { data: proposalData, error: fetchError } = await supabase
      .from("proposals")
      .select("generation_metadata")
      .eq("id", id)
      .single();

    if (fetchError || !proposalData?.generation_metadata) {
      log.error("Pipeline context not found for regeneration", {
        error: fetchError?.message,
      });
      return serverError(
        "Pipeline context not available. Please regenerate the full proposal.",
      );
    }

    const ctx = reconstructContext(
      proposalData.generation_metadata as unknown as PipelineContext,
    );

    // Fetch quality feedback (non-blocking — null if unavailable)
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    // Look up section type from DB
    const { data: section, error: sectionErr } = await supabase
      .from("proposal_sections")
      .select("section_type")
      .eq("id", sectionId)
      .eq("proposal_id", id)
      .single();

    if (sectionErr || !section) {
      return serverError("Section not found");
    }

    // Mark section as regenerating
    await supabase
      .from("proposal_sections")
      .update({ generation_status: GenerationStatus.GENERATING })
      .eq("id", sectionId);

    log.info("Regenerating section", {
      sectionType: section.section_type,
      hasQualityFeedback: !!qualityFeedback,
    });

    try {
      const result = await generateSingleSection(
        sectionId,
        section.section_type,
        ctx,
      );

      return ok({
        status: GenerationStatus.COMPLETED,
        sectionId,
        content: result.generatedContent ?? "",
        message: qualityFeedback
          ? "Section regenerated with quality feedback."
          : "Section regenerated successfully.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      log.error("Section regeneration failed", { sectionId, error: msg });

      await supabase
        .from("proposal_sections")
        .update({
          generation_status: GenerationStatus.FAILED,
          generation_error: msg,
        })
        .eq("id", sectionId);

      return ok({
        status: GenerationStatus.FAILED,
        sectionId,
        error: msg,
      });
    }
  },
  { requireFullProposal: true },
);

function reconstructContext(ctx: PipelineContext): PipelineContext {
  return {
    ...ctx,
    serviceLine: ctx.serviceLine ?? undefined,
    industry: ctx.industry ?? undefined,
    primaryBrandName: ctx.primaryBrandName ?? undefined,
    audienceProfile: ctx.audienceProfile ?? undefined,
    brandVoice: ctx.brandVoice ?? null,
    winStrategy: ctx.winStrategy ?? null,
    outcomeContract: ctx.outcomeContract ?? null,
    industryConfig: ctx.industryConfig ?? null,
  };
}
