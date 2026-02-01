import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyDocumentAccess } from "@/lib/supabase/auth-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify document belongs to user's organization
    const document = await verifyDocumentAccess(context, id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch chunk count
    const adminClient = createAdminClient();
    const { count } = await adminClient
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("document_id", id);

    return NextResponse.json({ ...document, chunk_count: count });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify document belongs to user's organization
    const document = await verifyDocumentAccess(context, id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
