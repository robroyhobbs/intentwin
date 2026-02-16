import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
} from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, forbidden, serverError, ok, created } from "@/lib/api/response";
import { sanitizeTitle } from "@/lib/security/sanitize";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();
    // Get all proposals for the organization (not just user's own)
    const { data: proposals, error } = await adminClient
      .from("proposals")
      .select("*")
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return serverError("Failed to fetch proposals", error);
    }

    return ok({ proposals });
  } catch (error) {
    console.error("Get proposals error:", error);
    return serverError("Failed to fetch proposals", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Check plan limits before creating
    const limitCheck = await checkPlanLimit(
      context.organizationId,
      "proposals_per_month",
    );
    if (!limitCheck.allowed) {
      return forbidden(limitCheck.message || "Proposal limit reached");
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
      return badRequest("Title is required");
    }

    const adminClient = createAdminClient();

    // Sanitize user text input
    const sanitizedTitle = sanitizeTitle(title);

    // Build proposal data with IDD fields and organization scoping
    const proposalData: Record<string, unknown> = {
      title: sanitizedTitle,
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
      return serverError("Failed to create proposal", error);
    }

    // Increment usage counter
    await incrementUsage(context.organizationId, "proposals_created");

    return created({ proposal });
  } catch (error) {
    console.error("Create proposal error:", error);
    return serverError("Failed to create proposal", error);
  }
}
