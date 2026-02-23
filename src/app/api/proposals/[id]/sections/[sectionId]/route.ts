import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, checkProposalAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, badRequest, ok, serverError } from "@/lib/api/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const hasAccess = await checkProposalAccess(context, id);
    if (!hasAccess) {
      return notFound("Proposal not found");
    }

    const body = await request.json();
    const { edited_content } = body;

    if (typeof edited_content !== "string") {
      return badRequest("edited_content is required");
    }

    const adminClient = createAdminClient();
    const { data: section, error } = await adminClient
      .from("proposal_sections")
      .update({
        edited_content,
        is_edited: true,
      })
      .eq("id", sectionId)
      .eq("proposal_id", id)
      .select()
      .single();

    if (error) {
      return serverError("Failed to update section", error);
    }

    return ok({ section });
  } catch (error) {
    return serverError("Internal server error", error);
  }
}
