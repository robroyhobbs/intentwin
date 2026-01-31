import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

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

    // Verify user has access to this proposal (organization check)
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Fetch sections
    const adminClient = createAdminClient();
    const { data: sections } = await adminClient
      .from("proposal_sections")
      .select("*")
      .eq("proposal_id", id)
      .order("section_order", { ascending: true });

    return NextResponse.json({ proposal, sections: sections || [] });
  } catch (error) {
    console.error("Get proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this proposal (organization check)
    const existingProposal = await verifyProposalAccess(context, id);
    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, intake_data, win_strategy_data, status } = body;

    const updates: Record<string, unknown> = {};
    if (title) updates.title = title;
    if (intake_data) updates.intake_data = intake_data;
    if (win_strategy_data) updates.win_strategy_data = win_strategy_data;
    if (status) updates.status = status;

    const adminClient = createAdminClient();
    const { data: proposal, error } = await adminClient
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Update proposal error:", error);
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

    // Verify user has access to this proposal (organization check)
    const existingProposal = await verifyProposalAccess(context, id);
    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("proposals")
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
    console.error("Delete proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
