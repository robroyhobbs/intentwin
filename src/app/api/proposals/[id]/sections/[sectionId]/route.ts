import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { edited_content } = body;

    if (typeof edited_content !== "string") {
      return NextResponse.json(
        { error: "edited_content is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `Update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
