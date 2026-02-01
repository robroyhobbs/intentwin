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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const { data: reviews, error } = await adminClient
      .from("proposal_reviews")
      .select("*")
      .eq("proposal_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute summary
    const summary = {
      total: reviews?.length || 0,
      open: reviews?.filter((r) => r.status === "open").length || 0,
      resolved: reviews?.filter((r) => r.status === "resolved").length || 0,
      dismissed: reviews?.filter((r) => r.status === "dismissed").length || 0,
      approvals:
        reviews?.filter((r) => r.annotation_type === "approval").length || 0,
    };

    return NextResponse.json({ reviews, summary });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const {
      section_id,
      annotation_type = "comment",
      content,
      selector_data = {},
      selected_text,
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: review, error } = await adminClient
      .from("proposal_reviews")
      .insert({
        proposal_id: id,
        section_id: section_id || null,
        reviewer_id: context.user.id,
        reviewer_email: context.user.email,
        annotation_type,
        content,
        selector_data,
        selected_text: selected_text || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Create review error:", error);
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

    // Verify proposal belongs to user's organization
    const proposal = await verifyProposalAccess(context, id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { review_id, status } = body;

    if (!review_id || !status) {
      return NextResponse.json(
        { error: "review_id and status are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: review, error } = await adminClient
      .from("proposal_reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", review_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
