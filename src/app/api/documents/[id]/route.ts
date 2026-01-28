import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: document, error } = await adminClient
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch chunk count
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
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch document to get storage path
    const { data: document } = await adminClient
      .from("documents")
      .select("storage_path, uploaded_by")
      .eq("id", id)
      .single();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Storage
    await adminClient.storage
      .from("knowledge-base-documents")
      .remove([document.storage_path]);

    // Delete from DB (chunks cascade)
    const { error } = await adminClient
      .from("documents")
      .delete()
      .eq("id", id);

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
