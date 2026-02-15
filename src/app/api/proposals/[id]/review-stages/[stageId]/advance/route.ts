import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { sendStageAdvancedEmail } from "@/lib/email/review-notifications";

const STAGE_ORDER = ["pink", "red", "gold", "white"] as const;

/**
 * POST /api/proposals/[id]/review-stages/[stageId]/advance
 * Advance to the next review stage with gate check
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

    let body: { force?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine, force defaults to false
    }

    const adminClient = createAdminClient();

    // Get the current stage
    const { data: currentStage, error: stageError } = await adminClient
      .from("proposal_review_stages")
      .select("*")
      .eq("id", stageId)
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .single();

    if (stageError || !currentStage) {
      return NextResponse.json(
        { error: "Review stage not found" },
        { status: 404 },
      );
    }

    if (currentStage.status !== "active") {
      return NextResponse.json(
        { error: "Can only advance from an active stage" },
        { status: 400 },
      );
    }

    // Check if there is a next stage
    const currentIndex = STAGE_ORDER.indexOf(
      currentStage.stage as (typeof STAGE_ORDER)[number],
    );
    if (currentIndex === STAGE_ORDER.length - 1) {
      return NextResponse.json(
        { error: "No next stage. White is the final stage." },
        { status: 400 },
      );
    }

    const nextStageName = STAGE_ORDER[currentIndex + 1];

    // Gate check (unless forced)
    if (!body.force) {
      const failures = await checkGateCriteria(
        adminClient,
        currentStage,
        id,
        context.organizationId,
      );

      if (failures.length > 0) {
        return NextResponse.json({
          canAdvance: false,
          failures,
        });
      }
    }

    // Mark current stage as completed
    const now = new Date().toISOString();
    const { error: completeError } = await adminClient
      .from("proposal_review_stages")
      .update({
        status: "completed",
        completed_at: now,
        completed_by: context.user.id,
      })
      .eq("id", stageId)
      .eq("organization_id", context.organizationId);

    if (completeError) {
      console.error("Complete current stage error:", completeError);
      return NextResponse.json(
        { error: "Failed to complete current stage" },
        { status: 500 },
      );
    }

    // Activate next stage
    const { data: nextStage, error: activateError } = await adminClient
      .from("proposal_review_stages")
      .update({
        status: "active",
        started_at: now,
      })
      .eq("proposal_id", id)
      .eq("stage", nextStageName)
      .eq("organization_id", context.organizationId)
      .select("*")
      .single();

    if (activateError) {
      console.error("Activate next stage error:", activateError);
      return NextResponse.json(
        { error: "Failed to activate next stage" },
        { status: 500 },
      );
    }

    // Send email notifications to next stage reviewers (fire-and-forget)
    if (nextStage) {
      const { data: nextReviewers } = await adminClient
        .from("stage_reviewers")
        .select("reviewer_id")
        .eq("stage_id", nextStage.id)
        .eq("organization_id", context.organizationId);

      if (nextReviewers && nextReviewers.length > 0) {
        const reviewerProfiles = await Promise.all(
          nextReviewers.map(async (r) => {
            const { data: profile } = await adminClient
              .from("profiles")
              .select("full_name, email")
              .eq("id", r.reviewer_id)
              .single();
            return {
              email: profile?.email || "",
              name: profile?.full_name || "",
            };
          }),
        );

        sendStageAdvancedEmail({
          reviewers: reviewerProfiles,
          proposalTitle: (proposal as { title?: string }).title || "Untitled",
          proposalId: id,
          newStage: nextStageName,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      advanced: true,
      from: currentStage,
      to: nextStage,
    });
  } catch (error) {
    console.error("Advance review stage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Check gate criteria for the given stage.
 * Returns an array of failure reasons (empty = gate passes).
 */
async function checkGateCriteria(
  adminClient: ReturnType<typeof createAdminClient>,
  stage: { id: string; stage: string; [key: string]: unknown },
  proposalId: string,
  organizationId: string,
): Promise<string[]> {
  const failures: string[] = [];

  // Get all sections for this proposal
  const { data: sections } = await adminClient
    .from("proposal_sections")
    .select("id, section_type, title")
    .eq("proposal_id", proposalId);

  const sectionIds = (sections || []).map((s) => s.id);

  if (sectionIds.length === 0) {
    failures.push("Proposal has no sections to review");
    return failures;
  }

  switch (stage.stage) {
    case "pink": {
      // All sections must have at least 1 review in section_reviews for this stage
      const { data: reviews } = await adminClient
        .from("section_reviews")
        .select("section_id")
        .eq("stage_id", stage.id)
        .eq("organization_id", organizationId);

      const reviewedSectionIds = new Set(
        (reviews || []).map((r) => r.section_id),
      );
      const unreviewedSections = (sections || []).filter(
        (s) => !reviewedSectionIds.has(s.id),
      );

      if (unreviewedSections.length > 0) {
        failures.push(
          `${unreviewedSections.length} section(s) have no reviews: ${unreviewedSections
            .map((s) => s.title || s.section_type)
            .join(", ")}`,
        );
      }
      break;
    }

    case "red": {
      // Average score across all section_reviews >= 70, no section avg < 50
      const { data: reviews } = await adminClient
        .from("section_reviews")
        .select("section_id, score")
        .eq("stage_id", stage.id)
        .eq("organization_id", organizationId)
        .not("score", "is", null);

      if (!reviews || reviews.length === 0) {
        failures.push("No scored reviews exist for this stage");
        break;
      }

      // Calculate overall average
      const allScores = reviews.map((r) => r.score as number);
      const overallAvg =
        allScores.reduce((a, b) => a + b, 0) / allScores.length;

      if (overallAvg < 70) {
        failures.push(
          `Overall average score is ${overallAvg.toFixed(1)}, minimum required is 70`,
        );
      }

      // Calculate per-section averages
      const sectionScores: Record<string, number[]> = {};
      for (const review of reviews) {
        if (!sectionScores[review.section_id]) {
          sectionScores[review.section_id] = [];
        }
        sectionScores[review.section_id].push(review.score as number);
      }

      for (const [sectionId, scores] of Object.entries(sectionScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < 50) {
          const section = (sections || []).find((s) => s.id === sectionId);
          failures.push(
            `Section "${section?.title || section?.section_type || sectionId}" has average score ${avg.toFixed(1)}, minimum required is 50`,
          );
        }
      }
      break;
    }

    case "gold": {
      // All stage_reviewers must have status = 'completed'
      const { data: reviewers } = await adminClient
        .from("stage_reviewers")
        .select("id, status, reviewer_id")
        .eq("stage_id", stage.id)
        .eq("organization_id", organizationId);

      if (!reviewers || reviewers.length === 0) {
        failures.push("No reviewers assigned to this stage");
        break;
      }

      const incomplete = reviewers.filter((r) => r.status !== "completed");
      if (incomplete.length > 0) {
        failures.push(
          `${incomplete.length} reviewer(s) have not completed their review`,
        );
      }
      break;
    }

    case "white": {
      // All sections must have at least 1 review
      const { data: reviews } = await adminClient
        .from("section_reviews")
        .select("section_id")
        .eq("stage_id", stage.id)
        .eq("organization_id", organizationId);

      const reviewedSectionIds = new Set(
        (reviews || []).map((r) => r.section_id),
      );
      const unreviewedSections = (sections || []).filter(
        (s) => !reviewedSectionIds.has(s.id),
      );

      if (unreviewedSections.length > 0) {
        failures.push(
          `${unreviewedSections.length} section(s) have no reviews: ${unreviewedSections
            .map((s) => s.title || s.section_type)
            .join(", ")}`,
        );
      }
      break;
    }
  }

  return failures;
}
