import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
} from "@/lib/supabase/auth-api";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    // Get all proposals for the organization (not just user's own)
    const { data: proposals, error } = await adminClient
      .from("proposals")
      .select("*")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Get proposals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan limits before creating
    const limitCheck = await checkPlanLimit(
      context.organizationId,
      "proposals_per_month",
    );
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Proposal limit reached" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      intake_data,
      win_strategy_data,
      outcome_contract,
      intent_status,
      bid_evaluation,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Build proposal data with IDD fields and organization scoping
    const proposalData: Record<string, unknown> = {
      title,
      intake_data: intake_data || {},
      win_strategy_data: win_strategy_data || {},
      status: "intake",
      created_by: context.user.id,
      organization_id: context.organizationId,
      team_id: context.teamId,
    };

    // Add IDD fields if provided
    if (outcome_contract) {
      proposalData.outcome_contract = outcome_contract;
    }
    if (intent_status) {
      proposalData.intent_status = intent_status;
      if (intent_status === "approved") {
        proposalData.intent_approved_by = context.user.id;
        proposalData.intent_approved_at = new Date().toISOString();
      }
    }
    if (bid_evaluation) {
      proposalData.bid_evaluation = bid_evaluation;
    }

    const { data: proposal, error } = await adminClient
      .from("proposals")
      .insert(proposalData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to create proposal: ${error.message}` },
        { status: 500 },
      );
    }

    // Increment usage counter
    await incrementUsage(context.organizationId, "proposals_created");

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Create proposal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
