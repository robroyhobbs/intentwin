import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";
import { inngest } from "@/inngest/client";
import { GenerationStatus, QualityReviewStatus } from "@/lib/constants/statuses";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  try {
    const { id, sectionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Block regeneration while quality review is in progress
    const qualityReview = proposal.quality_review as { status?: string } | null;
    if (qualityReview?.status === QualityReviewStatus.REVIEWING) {
      return NextResponse.json(
        {
          error:
            "Cannot regenerate sections while a quality review is in progress. Please wait for the review to complete.",
        },
        { status: 409 },
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

    return NextResponse.json({
      status: GenerationStatus.REGENERATING,
      sectionId,
      message: qualityFeedback
        ? "Section regeneration started with quality feedback."
        : "Section regeneration started.",
    });
  } catch (error) {
    console.error("Regenerate section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
