import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";

/**
 * GET /api/proposals/[id]/review-stages/[stageId]/reviews
 * List all section reviews for a stage, grouped by section with averages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Review stage not found" }, { status: 404 });
    }

    // Get all reviews for this stage
    const { data: reviews, error: reviewsError } = await adminClient
      .from("section_reviews")
      .select("*")
      .eq("stage_id", stageId)
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: true });

    if (reviewsError) {
      console.error("Fetch section reviews error:", reviewsError);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    // Enrich with reviewer names and section names
    const enrichedReviews = await Promise.all(
      (reviews || []).map(async (review) => {
        // Get reviewer profile via stage_reviewers
        const { data: stageReviewer } = await adminClient
          .from("stage_reviewers")
          .select("reviewer_id")
          .eq("id", review.reviewer_id)
          .single();

        let reviewerName: string | null = null;
        let reviewerEmail: string | null = null;

        if (stageReviewer) {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("full_name, email")
            .eq("id", stageReviewer.reviewer_id)
            .single();

          reviewerName = profile?.full_name || null;
          reviewerEmail = profile?.email || null;
        }

        // Get section info
        const { data: section } = await adminClient
          .from("proposal_sections")
          .select("section_type, title")
          .eq("id", review.section_id)
          .single();

        return {
          ...review,
          reviewer_name: reviewerName,
          reviewer_email: reviewerEmail,
          section_type: section?.section_type || null,
          section_title: section?.title || null,
        };
      })
    );

    // Calculate per-section averages
    const sectionAverages: Record<
      string,
      { sectionId: string; sectionTitle: string; averageScore: number | null; reviewCount: number }
    > = {};

    for (const review of enrichedReviews) {
      const sectionId = review.section_id;
      if (!sectionAverages[sectionId]) {
        sectionAverages[sectionId] = {
          sectionId,
          sectionTitle: review.section_title || review.section_type || sectionId,
          averageScore: null,
          reviewCount: 0,
        };
      }
      sectionAverages[sectionId].reviewCount += 1;
    }

    // Calculate averages from scored reviews only
    const scoredBySection: Record<string, number[]> = {};
    for (const review of enrichedReviews) {
      if (review.score != null) {
        if (!scoredBySection[review.section_id]) {
          scoredBySection[review.section_id] = [];
        }
        scoredBySection[review.section_id].push(review.score);
      }
    }

    for (const [sectionId, scores] of Object.entries(scoredBySection)) {
      if (sectionAverages[sectionId] && scores.length > 0) {
        sectionAverages[sectionId].averageScore =
          Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      }
    }

    return NextResponse.json({
      reviews: enrichedReviews,
      sectionAverages: Object.values(sectionAverages),
    });
  } catch (error) {
    console.error("Fetch section reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/proposals/[id]/review-stages/[stageId]/reviews
 * Submit a section review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { section_id, score, comment, strengths, weaknesses, recommendations } = body;

    if (!section_id) {
      return NextResponse.json({ error: "section_id is required" }, { status: 400 });
    }

    if (score != null && (typeof score !== "number" || score < 0 || score > 100)) {
      return NextResponse.json(
        { error: "score must be a number between 0 and 100" },
        { status: 400 }
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
      return NextResponse.json({ error: "Review stage not found" }, { status: 404 });
    }

    // Verify the current user is assigned as a reviewer to this stage
    const { data: stageReviewer, error: reviewerError } = await adminClient
      .from("stage_reviewers")
      .select("id, status")
      .eq("stage_id", stageId)
      .eq("reviewer_id", context.user.id)
      .eq("organization_id", context.organizationId)
      .single();

    if (reviewerError || !stageReviewer) {
      return NextResponse.json(
        { error: "You are not assigned as a reviewer for this stage" },
        { status: 403 }
      );
    }

    // Verify section belongs to this proposal
    const { data: section, error: sectionError } = await adminClient
      .from("proposal_sections")
      .select("id")
      .eq("id", section_id)
      .eq("proposal_id", id)
      .single();

    if (sectionError || !section) {
      return NextResponse.json(
        { error: "Section not found in this proposal" },
        { status: 404 }
      );
    }

    // Insert the review
    const { data: review, error: insertError } = await adminClient
      .from("section_reviews")
      .insert({
        stage_id: stageId,
        reviewer_id: stageReviewer.id,
        section_id,
        organization_id: context.organizationId,
        score: score ?? null,
        comment: comment || null,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        recommendations: recommendations || null,
      })
      .select("*")
      .single();

    if (insertError) {
      // Check for unique constraint violation (already reviewed this section)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this section for this stage" },
          { status: 409 }
        );
      }
      console.error("Create section review error:", insertError);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    // If this is the reviewer's first review, update stage_reviewers status to 'in_progress'
    if (stageReviewer.status === "pending") {
      await adminClient
        .from("stage_reviewers")
        .update({ status: "in_progress" })
        .eq("id", stageReviewer.id)
        .eq("organization_id", context.organizationId);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Create section review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
