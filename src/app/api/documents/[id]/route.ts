import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyDocumentAccess } from "@/lib/supabase/auth-api";
import { unauthorized, notFound, serverError, ok } from "@/lib/api/response";

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

    // Verify document belongs to user's organization
    const document = await verifyDocumentAccess(context, id);
    if (!document) {
      return notFound("Document not found");
    }

    // Fetch chunk count
    const adminClient = createAdminClient();
    const { count } = await adminClient
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("document_id", id);

    return ok({ ...document, chunk_count: count });
  } catch (error) {
    return serverError("Failed to get document", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Verify document belongs to user's organization
    const document = await verifyDocumentAccess(context, id);
    if (!document) {
      return notFound("Document not found");
    }

    const adminClient = createAdminClient();

    // Delete from Storage
    if (document.storage_path) {
      await adminClient.storage
        .from("knowledge-base-documents")
        .remove([document.storage_path as string]);
    }

    // Delete from DB (chunks cascade)
    const { error } = await adminClient
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("organization_id", context.organizationId);

    if (error) {
      return serverError("Failed to delete document", error);
    }

    return ok({ success: true });
  } catch (error) {
    return serverError("Failed to delete document", error);
  }
}
