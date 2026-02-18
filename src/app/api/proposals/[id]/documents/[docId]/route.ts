import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkProposalAccess,
} from "@/lib/supabase/auth-api";
import { DOCUMENT_ROLES } from "@/types/proposal-documents";
import type {
  DocumentRole,
  UpdateDocumentRequest,
} from "@/types/proposal-documents";

type RouteParams = { params: Promise<{ id: string; docId: string }> };

/**
 * PATCH /api/proposals/[id]/documents/[docId]
 * Update a document association (role, notes, extraction status).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: proposalId, docId: documentId } = await params;
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

    let body: UpdateDocumentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate document_role if provided
    if (
      body.document_role &&
      !DOCUMENT_ROLES.includes(body.document_role as DocumentRole)
    ) {
      return NextResponse.json(
        {
          error: `document_role must be one of: ${DOCUMENT_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Build update payload (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (body.document_role !== undefined) updates.document_role = body.document_role;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.extraction_status !== undefined) updates.extraction_status = body.extraction_status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Document association not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal_document: updated });
  } catch (error) {
    console.error("Update proposal document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id]/documents/[docId]
 * Remove a document association from a proposal (does NOT delete the document itself).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: proposalId, docId: documentId } = await params;
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

    // Delete the association
    const { error } = await adminClient
      .from("proposal_documents")
      .delete()
      .eq("proposal_id", proposalId)
      .eq("document_id", documentId)
      .eq("organization_id", context.organizationId);

    if (error) {
      console.error("Delete proposal document error:", error);
      return NextResponse.json(
        { error: "Failed to remove document" },
        { status: 500 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete proposal document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
