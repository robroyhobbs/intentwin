import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, serverError, ok } from "@/lib/api/response";

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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const adminClient = createAdminClient();
    const { data: reviews, error } = await adminClient
      .from("proposal_reviews")
      .select("*")
      .eq("proposal_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return serverError("Failed to fetch reviews", error);
    }

    // Compute summary
    const summary = {
      total: reviews?.length || 0,
      open: reviews?.filter((r) => r.status === "open").length || 0,
      resolved: reviews?.filter((r) => r.status === "resolved").length || 0,
      dismissed: reviews?.filter((r) => r.status === "dismissed").length || 0,
      approvals:
        reviews?.filter((r) => r.annotation_type === "approval").length || 0,
    };

    return ok({ reviews, summary });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return serverError("Failed to fetch reviews", error);
  }
}

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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const {
      section_id,
      annotation_type = "comment",
      content,
      selector_data = {},
      selected_text,
    } = body;

    if (!content) {
      return badRequest("Content is required");
    }

    const adminClient = createAdminClient();
    const { data: review, error } = await adminClient
      .from("proposal_reviews")
      .insert({
        proposal_id: id,
        section_id: section_id || null,
        reviewer_id: context.user.id,
        reviewer_email: context.user.email,
        annotation_type,
        content,
        selector_data,
        selected_text: selected_text || null,
      })
      .select()
      .single();

    if (error) {
      return serverError("Failed to create review", error);
    }

    return ok({ review });
  } catch (error) {
    console.error("Create review error:", error);
    return serverError("Failed to create review", error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { review_id, status } = body;

    if (!review_id || !status) {
      return badRequest("review_id and status are required");
    }

    const adminClient = createAdminClient();
    const { data: review, error } = await adminClient
      .from("proposal_reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", review_id)
      .select()
      .single();

    if (error) {
      return serverError("Failed to update review", error);
    }

    return ok({ review });
  } catch (error) {
    console.error("Update review error:", error);
    return serverError("Failed to update review", error);
  }
}
