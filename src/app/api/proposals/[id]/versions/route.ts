import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

/**
 * GET /api/proposals/[id]/versions
 * List all versions of a proposal
 */
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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const supabase = createAdminClient();

    // Get all versions with section counts
    const { data: versions, error } = await supabase
      .from("proposal_versions")
      .select(`
        *,
        section_versions(count)
      `)
      .eq("proposal_id", id)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to include section count
    const versionsWithCount = versions?.map((v) => ({
      ...v,
      section_count: v.section_versions?.[0]?.count || 0,
      section_versions: undefined,
    }));

    return NextResponse.json({ versions: versionsWithCount || [] });
  } catch (error) {
    console.error("Versions list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals/[id]/versions
 * Create a new version (manual save)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { change_summary, label } = body;

    const supabase = createAdminClient();

    // Create version using the database function
    const { data, error } = await supabase.rpc("create_proposal_version", {
      p_proposal_id: id,
      p_trigger_event: "manual_save",
      p_change_summary: change_summary || null,
      p_label: label || null,
      p_user_id: context.user.id,
    });

    if (error) {
      console.error("Error creating version:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the created version
    const { data: version } = await supabase
      .from("proposal_versions")
      .select("*")
      .eq("id", data)
      .single();

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Version create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
