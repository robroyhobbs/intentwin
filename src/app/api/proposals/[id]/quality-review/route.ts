import { NextRequest, NextResponse } from "next/server";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { runQualityReview } from "@/lib/ai/quality-overseer";
import { createAdminClient } from "@/lib/supabase/admin";

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
          { error: "Invalid trigger value. Must be 'manual' or 'auto_post_generation'." },
          { status: 400 },
        );
      }
    } catch {
      // No body or invalid JSON — use default "manual"
    }

    // Check if review is already in progress (prevent concurrent reviews)
    const qualityReview = proposal.quality_review as
      | { status?: string }
      | null;
    if (qualityReview?.status === "reviewing") {
      return NextResponse.json(
        { error: "Quality review is already in progress" },
        { status: 409 },
      );
    }

    // Set initial "reviewing" status immediately
    const supabase = createAdminClient();
    await supabase
      .from("proposals")
      .update({
        quality_review: {
          status: "reviewing",
          run_at: new Date().toISOString(),
          trigger,
          model: "gpt-4o",
          overall_score: 0,
          pass: false,
          sections: [],
          remediation: [],
        },
      })
      .eq("id", id);

    // Fire-and-forget: run quality review in background
    runQualityReview(id, trigger).catch((err) => {
      console.error(`Quality review failed for proposal ${id}:`, err);
      // Attempt to set status to "failed" so it doesn't stay stuck
      supabase
        .from("proposals")
        .update({
          quality_review: {
            status: "failed",
            run_at: new Date().toISOString(),
            trigger,
            model: "gpt-4o",
            overall_score: 0,
            pass: false,
            sections: [],
            remediation: [],
          },
        })
        .eq("id", id)
        .then(() => {});
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
