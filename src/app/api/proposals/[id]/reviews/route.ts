import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest, serverError, ok, withProposalRoute } from "@/lib/api/response";
import { ReviewStatus, AnnotationType } from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";

export const GET = withProposalRoute(
  async (_request, { id }, _context) => {
    const adminClient = createAdminClient();
    const { data: reviews, error } = await adminClient
      .from("proposal_reviews")
      .select("id, proposal_id, section_id, reviewer_id, reviewer_email, annotation_type, content, selector_data, selected_text, status, created_at, updated_at")
      .eq("proposal_id", id)
      .limit(500)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Fetch reviews error", error);
      return serverError("Failed to fetch reviews", error);
    }

    // Compute summary
    const summary = {
      total: reviews?.length || 0,
      open: reviews?.filter((r) => r.status === ReviewStatus.OPEN).length || 0,
      resolved: reviews?.filter((r) => r.status === ReviewStatus.RESOLVED).length || 0,
      dismissed: reviews?.filter((r) => r.status === ReviewStatus.DISMISSED).length || 0,
      approvals:
        reviews?.filter((r) => r.annotation_type === AnnotationType.APPROVAL).length || 0,
    };

    return ok({ reviews, summary });
  },
);

export const POST = withProposalRoute(
  async (request, { id }, context) => {
    const body = await request.json();
    const {
      section_id,
      annotation_type = AnnotationType.COMMENT,
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
      logger.error("Create review error", error);
      return serverError("Failed to create review", error);
    }

    return ok({ review });
  },
);

export const PATCH = withProposalRoute(
  async (request, { id }, _context) => {
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
      .eq("proposal_id", id)
      .select()
      .single();

    if (error) {
      logger.error("Update review error", error);
      return serverError("Failed to update review", error);
    }

    return ok({ review });
  },
);
