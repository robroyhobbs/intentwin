import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth-api";

/**
 * GET /api/proposals/[id]/versions/[versionId]
 * Get a specific version with full section content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify user owns this proposal
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the version
    const { data: version, error: versionError } = await supabase
      .from("proposal_versions")
      .select("*")
      .eq("id", versionId)
      .eq("proposal_id", id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Get sections for this version
    const { data: sections } = await supabase
      .from("section_versions")
      .select("*")
      .eq("proposal_version_id", versionId)
      .order("section_order", { ascending: true });

    return NextResponse.json({
      version: {
        ...version,
        sections: sections || [],
      },
    });
  } catch (error) {
    console.error("Version get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]/versions/[versionId]
 * Update version metadata (label, change_summary)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { label, change_summary } = body;

    const supabase = createAdminClient();

    // Verify user owns this proposal
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the version
    const updateData: Record<string, string | null> = {};
    if (label !== undefined) updateData.label = label;
    if (change_summary !== undefined) updateData.change_summary = change_summary;

    const { data: version, error } = await supabase
      .from("proposal_versions")
      .update(updateData)
      .eq("id", versionId)
      .eq("proposal_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating version:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Version update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
