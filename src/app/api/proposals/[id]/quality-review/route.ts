import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { getReviewModelLabel } from "@/lib/ai/quality-overseer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/utils/logger";
import { inngest } from "@/inngest/client";
import { ProposalStatus, QualityReviewStatus, GenerationStatus } from "@/lib/constants/statuses";

/** If a review has been "reviewing" for longer than this, treat it as stale/zombie. */
const STALE_REVIEW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Reset a stuck quality_review status to "failed" so future reviews can proceed.
 */
async function resetStaleReview(proposalId: string, existingReview: Record<string, unknown>) {
  const supabase = createAdminClient();
  await supabase
    .from("proposals")
    .update({
      quality_review: {
        ...existingReview,
        status: "failed",
        error: "Review timed out and was automatically reset.",
      },
    })
    .eq("id", proposalId);
}

/**
 * POST /api/proposals/[id]/quality-review
 * Triggers async quality review via Inngest. Returns immediately.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Parse and validate body
    let trigger: "manual" | "auto_post_generation" = "manual";
    try {
      const body = await request.json();
      if (
        body.trigger === "manual" ||
        body.trigger === "auto_post_generation"
      ) {
        trigger = body.trigger;
      } else if (body.trigger !== undefined) {
        return NextResponse.json(
          {
            error:
              "Invalid trigger value. Must be 'manual' or 'auto_post_generation'.",
          },
          { status: 400 },
        );
      }
    } catch {
      // No body or invalid JSON — use default "manual"
    }

    // Block reviews while proposal is still generating
    if (proposal.status === ProposalStatus.GENERATING) {
      return NextResponse.json(
        {
          error:
            "Cannot run quality review while the proposal is still generating. Please wait for generation to complete.",
        },
        { status: 409 },
      );
    }

    // Check if review is already in progress (prevent concurrent reviews)
    const qualityReview = proposal.quality_review as {
      status?: string;
      run_at?: string;
    } | null;

    if (qualityReview?.status === QualityReviewStatus.REVIEWING) {
      // Auto-reset stale/zombie reviews instead of permanently blocking
      const runAt = qualityReview.run_at ? new Date(qualityReview.run_at).getTime() : 0;
      const elapsed = Date.now() - runAt;

      if (elapsed < STALE_REVIEW_MS) {
        return NextResponse.json(
          { error: "Quality review is already in progress" },
          { status: 409 },
        );
      }

      // Stale review — reset it and allow re-trigger
      const log = createLogger({ operation: "qualityReviewRoute", proposalId: id });
      log.warn("Resetting stale review, allowing re-trigger", {
        elapsed: Math.round(elapsed / 1000),
      });
      await resetStaleReview(id, qualityReview as Record<string, unknown>);
    }

    // Block reviews while any section is being regenerated
    const supabaseCheck = createAdminClient();
    const { count: regeneratingCount } = await supabaseCheck
      .from("proposal_sections")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", id)
      .eq("generation_status", GenerationStatus.GENERATING);

    if (regeneratingCount && regeneratingCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot run quality review while sections are being regenerated. Please wait for regeneration to complete.",
        },
        { status: 409 },
      );
    }

    // Set initial "reviewing" status immediately
    const supabase = createAdminClient();
    const modelLabel = getReviewModelLabel();
    await supabase
      .from("proposals")
      .update({
        quality_review: {
          status: QualityReviewStatus.REVIEWING,
          run_at: new Date().toISOString(),
          trigger,
          model: modelLabel,
          overall_score: 0,
          pass: false,
          sections: [],
          remediation: [],
        },
      })
      .eq("id", id);

    // Send event to Inngest for durable background execution
    await inngest.send({
      name: "proposal/quality-review.requested",
      data: { proposalId: id, trigger },
    });

    return NextResponse.json({
      status: QualityReviewStatus.REVIEWING,
      proposalId: id,
      message: "Quality review started.",
    });
  } catch (error) {
    console.error("Quality review trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/proposals/[id]/quality-review
 * Returns the current quality_review JSONB from the proposals table.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    return NextResponse.json(proposal.quality_review || null);
  } catch (error) {
    console.error("Quality review fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
