import { NextRequest } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import { inngest } from "@/inngest/client";
import { GenerationStatus, QualityReviewStatus } from "@/lib/constants/statuses";
import { unauthorized, notFound, conflict, ok, serverError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  try {
    const { id, sectionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    // Block regeneration while quality review is in progress
    const qualityReview = proposal.quality_review as { status?: string } | null;
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
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
