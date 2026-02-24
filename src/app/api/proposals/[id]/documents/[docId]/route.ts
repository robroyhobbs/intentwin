import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENT_ROLES } from "@/types/proposal-documents";
import type {
  DocumentRole,
  UpdateDocumentRequest,
} from "@/types/proposal-documents";
import { withProposalRoute, notFound, badRequest, ok, serverError } from "@/lib/api/response";

/**
 * PATCH /api/proposals/[id]/documents/[docId]
 * Update a document association (role, notes, extraction status).
 */
export const PATCH = withProposalRoute(async (request, { id: proposalId, docId: documentId }, context) => {
  let body: UpdateDocumentRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body");
  }

  // Validate document_role if provided
  if (
    body.document_role &&
    !DOCUMENT_ROLES.includes(body.document_role as DocumentRole)
  ) {
    return badRequest(`document_role must be one of: ${DOCUMENT_ROLES.join(", ")}`);
  }

  // Build update payload (only include provided fields)
  const updates: Record<string, unknown> = {};
  if (body.document_role !== undefined) updates.document_role = body.document_role;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.extraction_status !== undefined) updates.extraction_status = body.extraction_status;

  if (Object.keys(updates).length === 0) {
    return badRequest("No fields to update");
  }

  const adminClient = createAdminClient();

  const { data: updated, error } = await adminClient
    .from("proposal_documents")
    .update(updates)
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId)
    .select()
    .single();

  if (error || !updated) {
    return notFound("Document association not found");
  }

  return ok({ proposal_document: updated });
});

/**
 * DELETE /api/proposals/[id]/documents/[docId]
 * Remove a document association from a proposal (does NOT delete the document itself).
 */
export const DELETE = withProposalRoute(async (request, { id: proposalId, docId: documentId }, context) => {
  const adminClient = createAdminClient();

  // Delete the association
  const { error } = await adminClient
    .from("proposal_documents")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return serverError("Failed to remove document", error);
  }

  // Log the event
  await adminClient.from("proposal_document_events").insert({
    proposal_id: proposalId,
    document_id: documentId,
    organization_id: context.organizationId,
    event_type: "removed",
    event_data: {},
    created_by: context.user.id,
  });

  return ok({ success: true });
});
