import { NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import { sanitizeString } from "@/lib/security/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createRequestLogger } from "@/lib/utils/logger";

type InterventionStatus = "open" | "awaiting_approval" | "resolved";
type ResolutionDecision = "approve" | "reject";

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
  resolution_decision: ResolutionDecision | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const resolutionSelect =
  "id, assigned_agent, action_mode, status, user_safe_title, user_safe_message, internal_reason, proposal_id, opportunity_id, resolution_decision, resolution_notes, resolved_by, resolved_at, created_at, updated_at";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { log } = createRequestLogger(request, {
    route: "/api/copilot/interventions/[id]/approve",
  });

  try {
    const access = await authorizeRequest(request);
    if (!access.ok) {
      return access.response;
    }

    const body = await parseBody(request);
    if (!body.ok) {
      return badRequest(body.message);
    }

    const { id } = await params;
    const { data, error } = await resolveIntervention({
      interventionId: id,
      organizationId: access.context.organizationId,
      userId: access.context.user.id,
      action: body.action,
      notes: body.notes,
    });

    if (error || !data) {
      if (error?.code === "PGRST116" || !data) {
        return notFound("Copilot intervention not found");
      }

      log.error("Failed to resolve copilot intervention", error, {
        interventionId: id,
      });
      return serverError("Failed to resolve copilot intervention", error);
    }

    return ok({
      intervention: mapIntervention(data as CopilotInterventionRow),
    });
  } catch (error) {
    log.error("Unhandled copilot intervention approval error", error);
    return serverError("Internal server error", error);
  }
}

async function authorizeRequest(
  request: NextRequest,
): Promise<
  | { ok: true; context: NonNullable<Awaited<ReturnType<typeof getUserContext>>> }
  | { ok: false; response: Response }
> {
  const context = await getUserContext(request);
  if (!context) {
    return { ok: false, response: unauthorized() };
  }

  if (context.role !== "admin" && context.role !== "manager") {
    return {
      ok: false,
      response: forbidden("Only admins and managers can resolve copilot interventions"),
    };
  }

  return { ok: true, context };
}

async function resolveIntervention(input: {
  interventionId: string;
  organizationId: string;
  userId: string;
  action: ResolutionDecision;
  notes: string | null;
}) {
  return createAdminClient()
    .from("copilot_interventions")
    .update({
      status: "resolved",
      resolution_decision: input.action,
      resolution_notes: input.notes,
      resolved_by: input.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.interventionId)
    .eq("organization_id", input.organizationId)
    .eq("status", "awaiting_approval")
    .select(resolutionSelect)
    .single();
}

async function parseBody(
  request: NextRequest,
): Promise<
  | { ok: true; action: ResolutionDecision; notes: string | null }
  | { ok: false; message: string }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { ok: false, message: "Invalid JSON body" };
  }

  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Invalid JSON body" };
  }

  const action = "action" in body ? body.action : undefined;
  if (action !== "approve" && action !== "reject") {
    return { ok: false, message: "Action must be 'approve' or 'reject'" };
  }

  const rawNotes = "notes" in body ? body.notes : undefined;
  if (rawNotes !== undefined && typeof rawNotes !== "string") {
    return { ok: false, message: "Notes must be a string" };
  }

  const notes = typeof rawNotes === "string" ? sanitizeString(rawNotes, 2000) : null;
  return { ok: true, action, notes };
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
    resolutionDecision: row.resolution_decision,
    resolutionNotes: row.resolution_notes,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
