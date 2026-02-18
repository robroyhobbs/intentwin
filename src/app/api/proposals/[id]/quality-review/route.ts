import { NextRequest, NextResponse, after } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import {
  runQualityReview,
  getReviewModelLabel,
} from "@/lib/ai/quality-overseer";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

/** Max wall-clock time for the quality review background task (seconds). */
const REVIEW_TIMEOUT_MS = 270_000; // 270s — leaves 30s buffer before Vercel's 300s hard kill

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
 * Triggers async quality review. Returns immediately.
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
    if (proposal.status === "generating") {
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

    if (qualityReview?.status === "reviewing") {
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
      console.warn(
        `[QualityReview] Resetting stale review for proposal ${id} (elapsed: ${Math.round(elapsed / 1000)}s)`,
      );
      await resetStaleReview(id, qualityReview as Record<string, unknown>);
    }

    // Block reviews while any section is being regenerated
    const supabaseCheck = createAdminClient();
    const { count: regeneratingCount } = await supabaseCheck
      .from("proposal_sections")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", id)
      .eq("generation_status", "generating");

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
          status: "reviewing",
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

    // Run quality review after response is sent (extends serverless function lifetime)
    after(async () => {
      try {
        // Race the review against a safety timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Quality review timed out")),
            REVIEW_TIMEOUT_MS,
          );
        });

        await Promise.race([
          runQualityReview(id, trigger),
          timeoutPromise,
        ]);
      } catch (err) {
        console.error(`Quality review failed for proposal ${id}:`, err);

        // Ensure we don't leave the DB in "reviewing" state
        try {
          const cleanup = createAdminClient();
          const { data: current } = await cleanup
            .from("proposals")
            .select("quality_review")
            .eq("id", id)
            .single();

          const qr = (current?.quality_review as Record<string, unknown>) || {};
          if (qr.status === "reviewing") {
            await cleanup
              .from("proposals")
              .update({
                quality_review: {
                  ...qr,
                  status: "failed",
                  error: err instanceof Error ? err.message : "Review failed unexpectedly",
                },
              })
              .eq("id", id);
          }
        } catch (cleanupErr) {
          console.error(`Failed to clean up review status for ${id}:`, cleanupErr);
        }
      }
    });

    return NextResponse.json({
      status: "reviewing",
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
