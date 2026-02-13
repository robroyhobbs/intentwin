import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { regenerateSection } from "@/lib/ai/pipeline";
import { getQualityFeedbackForSection } from "@/lib/ai/quality-overseer";

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

    // Fetch quality feedback (non-blocking — null if unavailable)
    const qualityFeedback = await getQualityFeedbackForSection(
      id,
      sectionId,
    ).catch(() => null);

    // Fire-and-forget regeneration with optional quality feedback
    regenerateSection(id, sectionId, qualityFeedback).catch((err) => {
      console.error(`Section regeneration failed for ${sectionId}:`, err);
    });

    return NextResponse.json({
      status: "regenerating",
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
