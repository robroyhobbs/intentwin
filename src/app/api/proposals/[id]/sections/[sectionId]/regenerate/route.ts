import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import { inngest } from "@/inngest/client";
import { GenerationStatus, QualityReviewStatus } from "@/lib/constants/statuses";
import { conflict, ok, withProposalRoute } from "@/lib/api/response";

export const POST = withProposalRoute(
  async (_request, { id, sectionId }, _context, proposal) => {
    // Block regeneration while quality review is in progress
    const qualityReview = proposal!.quality_review as { status?: string } | null;
    if (qualityReview?.status === QualityReviewStatus.REVIEWING) {
      return conflict(
        "Cannot regenerate sections while a quality review is in progress. Please wait for the review to complete.",
      );
    }

    // Fetch quality feedback (non-blocking — null if unavailable)
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    // Send event to Inngest for durable background execution
    await inngest.send({
      name: "section/regenerate.requested",
      data: {
        proposalId: id,
        sectionId,
        qualityFeedback: qualityFeedback ?? null,
      },
    });

    return ok({
      status: GenerationStatus.REGENERATING,
      sectionId,
      message: qualityFeedback
        ? "Section regeneration started with quality feedback."
        : "Section regeneration started.",
    });
  },
  { requireFullProposal: true },
);
