import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

/**
 * GET /api/proposals/[id]/review-stages/current
 * Get the current active review stage for a proposal
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

    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const { data: stage, error } = await adminClient
      .from("proposal_review_stages")
      .select("*")
      .eq("proposal_id", id)
      .eq("organization_id", context.organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Fetch current stage error:", error);
      return NextResponse.json({ error: "Failed to fetch current stage" }, { status: 500 });
    }

    return NextResponse.json({ stage: stage || null });
  } catch (error) {
    console.error("Fetch current stage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
