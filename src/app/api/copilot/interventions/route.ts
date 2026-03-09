import { NextRequest } from "next/server";
import { badRequest, forbidden, ok, serverError, unauthorized } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createRequestLogger } from "@/lib/utils/logger";

type InterventionStatus = "open" | "awaiting_approval" | "resolved";

interface CopilotInterventionRow {
  id: string;
  assigned_agent: string;
  action_mode: string;
  status: InterventionStatus;
  user_safe_title: string | null;
  user_safe_message: string | null;
  internal_reason: string;
  proposal_id: string | null;
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

const ALLOWED_STATUSES: InterventionStatus[] = [
  "open",
  "awaiting_approval",
  "resolved",
];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<Response> {
  const { log } = createRequestLogger(request, {
    route: "/api/copilot/interventions",
  });

  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    if (context.role !== "admin" && context.role !== "manager") {
      return forbidden("Only admins and managers can view copilot interventions");
    }

    const filters = parseFilters(request);
    if (!filters.ok) {
      return badRequest(filters.message);
    }

    const adminClient = createAdminClient();
    let query = adminClient
      .from("copilot_interventions")
      .select(
        "id, assigned_agent, action_mode, status, user_safe_title, user_safe_message, internal_reason, proposal_id, opportunity_id, created_at, updated_at",
      )
      .eq("organization_id", context.organizationId);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.assignedAgent) {
      query = query.eq("assigned_agent", filters.assignedAgent);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(filters.limit);

    if (error) {
      log.error("Failed to fetch copilot interventions", error);
      return serverError("Failed to fetch copilot interventions", error);
    }

    return ok({
      interventions: (data ?? []).map((row) =>
        mapIntervention(row as CopilotInterventionRow),
      ),
    });
  } catch (error) {
    log.error("Unhandled copilot interventions error", error);
    return serverError("Internal server error", error);
  }
}

function parseFilters(
  request: NextRequest,
):
  | { ok: true; status: InterventionStatus | null; assignedAgent: string | null; limit: number }
  | { ok: false; message: string } {
  const status = request.nextUrl.searchParams.get("status");
  const assignedAgent = request.nextUrl.searchParams.get("assignedAgent");
  const limitValue = request.nextUrl.searchParams.get("limit");

  if (status && !ALLOWED_STATUSES.includes(status as InterventionStatus)) {
    return { ok: false, message: "Invalid intervention status filter" };
  }

  const parsedLimit = limitValue ? Number.parseInt(limitValue, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
    return { ok: false, message: "Invalid intervention limit" };
  }

  return {
    ok: true,
    status: (status as InterventionStatus | null) ?? null,
    assignedAgent: assignedAgent?.trim() || null,
    limit: parsedLimit,
  };
}

function mapIntervention(row: CopilotInterventionRow) {
  return {
    id: row.id,
    assignedAgent: row.assigned_agent,
    actionMode: row.action_mode,
    status: row.status,
    userSafeTitle: row.user_safe_title,
    userSafeMessage: row.user_safe_message,
    internalReason: row.internal_reason,
    proposalId: row.proposal_id,
    opportunityId: row.opportunity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
