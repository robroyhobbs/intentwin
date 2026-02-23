import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest, ok, serverError, withProposalRoute } from "@/lib/api/response";

export const PATCH = withProposalRoute(
  async (request, id, _context) => {
    // Extract sectionId from URL: /api/proposals/[id]/sections/[sectionId]
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const sectionId = segments[segments.indexOf("sections") + 1];

    if (!sectionId) {
      return badRequest("sectionId is required");
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
  },
);
