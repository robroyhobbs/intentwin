import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, serverError, ok, created, conflict } from "@/lib/api/response";

/**
 * GET /api/proposals/[id]/review-stages
 * List all review stages for a proposal with reviewer counts and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const adminClient = createAdminClient();
    const { data: stages, error } = await adminClient
      .from("proposal_review_stages")
      .select("*")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .order("stage_order", { ascending: true });

    if (error) {
      console.error("Fetch review stages error:", error);
      return serverError("Failed to fetch review stages", error);
    }

    // For each stage, fetch reviewer counts and status breakdown
    const stagesWithReviewers = await Promise.all(
      (stages || []).map(async (stage) => {
        const { data: reviewers, error: revError } = await adminClient
          .from("stage_reviewers")
          .select("id, status")
          .eq("stage_id", stage.id);

        if (revError) {
          return { ...stage, reviewerCount: 0, reviewerStatusBreakdown: {} };
        }

        const statusBreakdown: Record<string, number> = {};
        for (const r of reviewers || []) {
          statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        }

        return {
          ...stage,
          reviewerCount: (reviewers || []).length,
          reviewerStatusBreakdown: statusBreakdown,
        };
      })
    );

    const currentStage = stagesWithReviewers.find((s) => s.status === "active") || null;

    return ok({ stages: stagesWithReviewers, currentStage });
  } catch (error) {
    console.error("Fetch review stages error:", error);
    return serverError("Failed to fetch review stages", error);
  }
}

/**
 * POST /api/proposals/[id]/review-stages
 * Initialize all 4 color team review stages for a proposal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const adminClient = createAdminClient();

    // Check if stages already exist
    const { data: existing, error: checkError } = await adminClient
      .from("proposal_review_stages")
      .select("id")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .limit(1);

    if (checkError) {
      console.error("Check existing stages error:", checkError);
      return serverError("Failed to check existing stages", checkError);
    }

    if (existing && existing.length > 0) {
      return conflict("Review stages already exist for this proposal");
    }

    const now = new Date().toISOString();

    // Insert all 4 stages: pink (active), red, gold, white (all pending)
    const { data: stages, error: insertError } = await adminClient
      .from("proposal_review_stages")
      .insert([
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "pink",
          stage_order: 1,
          status: "active",
          started_at: now,
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "red",
          stage_order: 2,
          status: "pending",
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "gold",
          stage_order: 3,
          status: "pending",
        },
        {
          proposal_id: id,
          organization_id: context.organizationId,
          stage: "white",
          stage_order: 4,
          status: "pending",
        },
      ])
      .select("*")
      .order("stage_order", { ascending: true });

    if (insertError) {
      console.error("Insert review stages error:", insertError);
      return serverError("Failed to create review stages", insertError);
    }

    return created({ stages: stages || [] });
  } catch (error) {
    console.error("Create review stages error:", error);
    return serverError("Failed to create review stages", error);
  }
}
