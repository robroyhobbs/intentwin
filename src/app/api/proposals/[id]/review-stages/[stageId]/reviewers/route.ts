import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { sendReviewerAssignedEmail } from "@/lib/email/review-notifications";

/**
 * GET /api/proposals/[id]/review-stages/[stageId]/reviewers
 * List all reviewers assigned to a review stage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  try {
    const { id, stageId } = await params;
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

    const adminClient = createAdminClient();

    // Verify stage exists and belongs to this proposal/org
    const { data: stage, error: stageError } = await adminClient
      .from("proposal_review_stages")
      .select("id")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (stageError || !stage) {
      return NextResponse.json(
        { error: "Review stage not found" },
        { status: 404 },
      );
    }

    // Get reviewers with profile info
    const { data: reviewers, error } = await adminClient
      .from("stage_reviewers")
      .select("id, reviewer_id, status, assigned_at, completed_at")
      .eq("stage_id", stageId)
      .eq("organization_id", context.organizationId)
      .order("assigned_at", { ascending: true });

    if (error) {
      console.error("Fetch stage reviewers error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviewers" },
        { status: 500 },
      );
    }

    // Enrich with profile names
    const enrichedReviewers = await Promise.all(
      (reviewers || []).map(async (reviewer) => {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("full_name, email")
          .eq("id", reviewer.reviewer_id)
          .single();

        return {
          ...reviewer,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
        };
      }),
    );

    return NextResponse.json({ reviewers: enrichedReviewers });
  } catch (error) {
    console.error("Fetch stage reviewers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/proposals/[id]/review-stages/[stageId]/reviewers
 * Assign a reviewer to a review stage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> },
) {
  try {
    const { id, stageId } = await params;
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

    const body = await request.json();
    const { reviewer_id } = body;

    if (!reviewer_id) {
      return NextResponse.json(
        { error: "reviewer_id is required" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Verify stage exists and belongs to this proposal/org
    const { data: stageRecord, error: stageError } = await adminClient
      .from("proposal_review_stages")
      .select("id, stage")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (stageError || !stageRecord) {
      return NextResponse.json(
        { error: "Review stage not found" },
        { status: 404 },
      );
    }

    // Validate reviewer is an org member
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", reviewer_id)
      .eq("organization_id", context.organizationId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Reviewer not found in your organization" },
        { status: 404 },
      );
    }

    // Insert reviewer assignment
    const { data: reviewer, error: insertError } = await adminClient
      .from("stage_reviewers")
      .insert({
        stage_id: stageId,
        organization_id: context.organizationId,
        reviewer_id: reviewer_id,
      })
      .select("id, reviewer_id, status, assigned_at, completed_at")
      .single();

    if (insertError) {
      // Check for unique constraint violation (already assigned)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Reviewer is already assigned to this stage" },
          { status: 409 },
        );
      }
      console.error("Assign reviewer error:", insertError);
      return NextResponse.json(
        { error: "Failed to assign reviewer" },
        { status: 500 },
      );
    }

    // Send assignment email notification (fire-and-forget)
    sendReviewerAssignedEmail({
      reviewerEmail: profile.email || "",
      reviewerName: profile.full_name || "",
      proposalTitle: (proposal as { title?: string }).title || "Untitled",
      proposalId: id,
      stage: stageRecord.stage,
    }).catch(() => {});

    return NextResponse.json(
      {
        reviewer: {
          ...reviewer,
          full_name: profile.full_name,
          email: profile.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Assign reviewer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
