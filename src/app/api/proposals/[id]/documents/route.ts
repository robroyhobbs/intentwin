import {
  checkDocumentAccess,
} from "@/lib/supabase/auth-api";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DOCUMENT_ROLES,
  MAX_DOCUMENTS_PER_PROPOSAL,
} from "@/types/proposal-documents";
import type {
  DocumentRole,
  AddDocumentRequest,
  AddDocumentResponse,
  ListDocumentsResponse,
} from "@/types/proposal-documents";
import { notFound, badRequest, conflict, ok, serverError, created, withProposalRoute } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/proposals/[id]/documents
 * List all documents associated with a proposal, including document metadata.
 */
export const GET = withProposalRoute(
  async (_request, { id: proposalId }, context) => {
    const adminClient = createAdminClient();

    const { data: rows, error } = await adminClient
      .from("proposal_documents")
      .select(
        `
        *,
        document:documents (
          id, title, file_name, file_type,
          file_size_bytes, processing_status, chunk_count
        )
      `
      )
      .eq("proposal_id", proposalId)
      .eq("organization_id", context.organizationId)
      .order("upload_order", { ascending: true });

    if (error) {
      return serverError("Failed to fetch documents", error);
    }

    const response: ListDocumentsResponse = {
      documents: rows || [],
      count: rows?.length ?? 0,
    };

    return ok(response);
  },
);

/**
 * POST /api/proposals/[id]/documents
 * Associate a document with a proposal, assigning it a role.
 * The document must already exist (uploaded via /api/documents/upload).
 */
export const POST = withProposalRoute(
  async (request, { id: proposalId }, context) => {
    let body: AddDocumentRequest;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid request body");
    }

    const { document_id, document_role, notes } = body;

    // Validate required fields
    if (!document_id) {
      return badRequest("document_id is required");
    }

    if (!document_role || !DOCUMENT_ROLES.includes(document_role as DocumentRole)) {
      return badRequest(`document_role must be one of: ${DOCUMENT_ROLES.join(", ")}`);
    }

    // Verify document exists and belongs to org
    const docExists = await checkDocumentAccess(context, document_id);
    if (!docExists) {
      return notFound("Document not found");
    }

    const adminClient = createAdminClient();

    // Check document limit
    const { count } = await adminClient
      .from("proposal_documents")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", proposalId)
      .eq("organization_id", context.organizationId);

    if ((count ?? 0) >= MAX_DOCUMENTS_PER_PROPOSAL) {
      return badRequest(`Maximum ${MAX_DOCUMENTS_PER_PROPOSAL} documents per proposal`);
    }

    // Determine upload_order (next sequential value)
    const { data: maxOrder } = await adminClient
      .from("proposal_documents")
      .select("upload_order")
      .eq("proposal_id", proposalId)
      .eq("organization_id", context.organizationId)
      .order("upload_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.upload_order ?? -1) + 1;

    // Insert the association
    const { data: proposalDoc, error: insertError } = await adminClient
      .from("proposal_documents")
      .insert({
        proposal_id: proposalId,
        document_id,
        organization_id: context.organizationId,
        document_role,
        upload_order: nextOrder,
        added_by: context.user.id,
        notes: notes || null,
        extraction_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate
      if (insertError.code === "23505") {
        return conflict("Document is already associated with this proposal");
      }
      return serverError("Failed to associate document", insertError);
    }

    // Log the event
    const { data: event, error: eventError } = await adminClient
      .from("proposal_document_events")
      .insert({
        proposal_id: proposalId,
        document_id,
        organization_id: context.organizationId,
        event_type: "added",
        event_data: { document_role, notes },
        created_by: context.user.id,
      })
      .select()
      .single();

    if (eventError) {
      logger.warn("Failed to log document add event", { error: eventError });
    }

    const response: AddDocumentResponse = {
      proposal_document: proposalDoc,
      event: event ?? null,
    };

    return created(response);
  },
);
