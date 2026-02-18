import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkProposalAccess,
  checkDocumentAccess,
} from "@/lib/supabase/auth-api";
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

/**
 * GET /api/proposals/[id]/documents
 * List all documents associated with a proposal, including document metadata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, proposalId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

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
      console.error("List proposal documents error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    const response: ListDocumentsResponse = {
      documents: rows || [],
      count: rows?.length ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("List proposal documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals/[id]/documents
 * Associate a document with a proposal, assigning it a role.
 * The document must already exist (uploaded via /api/documents/upload).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await checkProposalAccess(context, proposalId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    let body: AddDocumentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { document_id, document_role, notes } = body;

    // Validate required fields
    if (!document_id) {
      return NextResponse.json(
        { error: "document_id is required" },
        { status: 400 }
      );
    }

    if (!document_role || !DOCUMENT_ROLES.includes(document_role as DocumentRole)) {
      return NextResponse.json(
        { error: `document_role must be one of: ${DOCUMENT_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify document exists and belongs to org
    const docExists = await checkDocumentAccess(context, document_id);
    if (!docExists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();

    // Check document limit
    const { count } = await adminClient
      .from("proposal_documents")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", proposalId)
      .eq("organization_id", context.organizationId);

    if ((count ?? 0) >= MAX_DOCUMENTS_PER_PROPOSAL) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_DOCUMENTS_PER_PROPOSAL} documents per proposal`,
        },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Document is already associated with this proposal" },
          { status: 409 }
        );
      }
      console.error("Insert proposal document error:", insertError);
      return NextResponse.json(
        { error: "Failed to associate document" },
        { status: 500 }
      );
    }

    // Log the event
    const { data: event } = await adminClient
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

    const response: AddDocumentResponse = {
      proposal_document: proposalDoc,
      event: event!,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Add proposal document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
