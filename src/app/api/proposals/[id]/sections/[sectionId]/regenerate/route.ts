/**
 * POST /api/proposals/[id]/sections/[sectionId]/regenerate
 *
 * Regenerates a single proposal section. Returns immediately with "generating"
 * status, then uses Next.js after() to run the actual generation in the
 * background (within the same function execution). The client polls for
 * completion via the proposal detail endpoint.
 */

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSingleSection } from "@/lib/ai/pipeline/generate-single-section";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import {
  GenerationStatus,
  QualityReviewStatus,
} from "@/lib/constants/statuses";
import type { PipelineContext } from "@/lib/ai/pipeline/types";
import { createLogger } from "@/lib/utils/logger";
import {
  conflict,
  ok,
  serverError,
  withProposalRoute,
} from "@/lib/api/response";

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
        "Cannot regenerate sections while a quality review is in progress.",
      );
    }

    const supabase = createAdminClient();

    // Validate pipeline context exists
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

    // Validate section exists and belongs to this proposal
    const { data: section, error: sectionErr } = await supabase
      .from("proposal_sections")
      .select("section_type")
      .eq("id", sectionId)
      .eq("proposal_id", id)
      .single();

    if (sectionErr || !section) {
      return serverError("Section not found");
    }

    // Mark section as generating in DB
    await supabase
      .from("proposal_sections")
      .update({
        generation_status: GenerationStatus.GENERATING,
        generation_error: null,
      })
      .eq("id", sectionId);

    // Schedule the actual generation to run AFTER the response is sent.
    // This lets us return immediately while the work continues in the
    // background (within the same Vercel function execution, up to maxDuration).
    const ctx = reconstructContext(
      proposalData.generation_metadata as unknown as PipelineContext,
    );
    const sectionType = section.section_type;

    after(async () => {
      const bgLog = createLogger({
        operation: "regenerate-section-bg",
        proposalId: id,
      });

      try {
        bgLog.info("Starting background regeneration", {
          sectionId,
          sectionType,
        });

        await generateSingleSection(sectionId, sectionType, ctx);

        bgLog.info("Background regeneration completed", { sectionId });

        // Clear stale proposal-level generation_error after successful regen
        await createAdminClient()
          .from("proposals")
          .update({ generation_error: null })
          .eq("id", id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        bgLog.error("Background regeneration failed", {
          sectionId,
          error: msg,
        });

        await createAdminClient()
          .from("proposal_sections")
          .update({
            generation_status: GenerationStatus.FAILED,
            generation_error: msg,
          })
          .eq("id", sectionId);
      }
    });

    // Fetch quality feedback info for the response message
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    return ok({
      status: GenerationStatus.GENERATING,
      sectionId,
      message: qualityFeedback
        ? "Section regeneration started with quality feedback."
        : "Section regeneration started.",
    });
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
