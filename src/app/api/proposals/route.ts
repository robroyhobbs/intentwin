import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserContext,
  checkPlanLimit,
  incrementUsage,
} from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, forbidden, serverError, ok, created } from "@/lib/api/response";
import { sanitizeTitle } from "@/lib/security/sanitize";
import { ProposalStatus, IntentStatus, ComplianceStatus } from "@/lib/constants/statuses";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();

    // Parse optional pagination params (default: page 1, 50 per page)
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // Select only list-view columns (exclude large JSONB blobs like intake_data, quality_review)
    const { data: proposals, error, count } = await adminClient
      .from("proposals")
      .select(
        "id, title, status, created_at, updated_at, created_by, organization_id, intent_status, deal_outcome",
        { count: "exact" }
      )
      .eq("organization_id", context.organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return serverError("Failed to fetch proposals", error);
    }

    return ok({
      proposals,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    logger.error("Get proposals error", error);
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
      client_research,
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
      status: ProposalStatus.INTAKE,
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
      if (intent_status === IntentStatus.APPROVED) {
        proposalData.intent_approved_by = context.user.id;
        proposalData.intent_approved_at = new Date().toISOString();
      }
    }
    if (bid_evaluation) {
      proposalData.bid_evaluation = bid_evaluation;
    }
    if (client_research) {
      proposalData.client_research = client_research;
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

    // Auto-seed compliance requirements from intake data
    if (proposal && intake_data?.compliance_requirements) {
      const complianceReqs = Array.isArray(intake_data.compliance_requirements)
        ? intake_data.compliance_requirements
        : typeof intake_data.compliance_requirements === "string"
          ? intake_data.compliance_requirements.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean)
          : [];

      if (complianceReqs.length > 0) {
        const seedRows = complianceReqs.map((req: string) => ({
          proposal_id: proposal.id,
          organization_id: context.organizationId,
          requirement_text: req,
          category: "mandatory",
          requirement_type: "certification",
          compliance_status: ComplianceStatus.NOT_ADDRESSED,
          is_extracted: false,
        }));

        await adminClient
          .from("proposal_requirements")
          .insert(seedRows)
          .then(({ error: seedErr }) => {
            if (seedErr) {
              logger.error("Failed to seed compliance requirements", seedErr);
            }
          });
      }
    }

    return created({ proposal });
  } catch (error) {
    logger.error("Create proposal error", error);
    return serverError("Failed to create proposal", error);
  }
}
