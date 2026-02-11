import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDocument } from "@/lib/documents/pipeline";

/**
 * POST /api/documents/reprocess
 * Re-trigger processing for failed or stuck documents.
 * Body: { documentId?: string } — if omitted, reprocesses all failed docs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    let docs: { id: string; title: string }[];

    if (body.documentId) {
      const { data } = await supabase
        .from("documents")
        .select("id, title")
        .eq("id", body.documentId)
        .single();
      docs = data ? [data] : [];
    } else {
      const { data } = await supabase
        .from("documents")
        .select("id, title")
        .in("processing_status", ["failed", "pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(20);
      docs = data || [];
    }

    if (docs.length === 0) {
      return NextResponse.json({ message: "No documents to reprocess" });
    }

    // Reset status and kick off processing
    const results: { id: string; title: string; status: string }[] = [];

    for (const doc of docs) {
      await supabase
        .from("documents")
        .update({ processing_status: "pending", processing_error: null })
        .eq("id", doc.id);

      // Delete any existing chunks so we don't duplicate
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", doc.id);

      processDocument(doc.id).catch((err) => {
        console.error(`Reprocess failed for ${doc.id}:`, err);
      });

      results.push({ id: doc.id, title: doc.title, status: "reprocessing" });
    }

    return NextResponse.json({ reprocessed: results });
  } catch (error) {
    return NextResponse.json(
      { error: `${error}` },
      { status: 500 }
    );
  }
}
