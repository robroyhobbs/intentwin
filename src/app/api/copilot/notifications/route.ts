import { NextRequest } from "next/server";
import {
  badRequest,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import {
  ACTIVE_NOTIFICATION_STATUSES,
  canManageCopilotInterventions,
  type CopilotNotification,
  mapCopilotNotification,
  type CopilotNotificationFilter,
  type CopilotNotificationStatus,
} from "@/lib/copilot/notifications";
import {
  fetchCompatibilityNotifications,
  isMissingCopilotSchemaError,
} from "@/lib/copilot/compatibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createRequestLogger } from "@/lib/utils/logger";

interface NotificationRow {
  id: string;
  assigned_agent: string;
  action_mode: string;
  status: CopilotNotificationStatus;
  user_safe_title: string | null;
  user_safe_message: string | null;
  proposal_id: string | null;
  opportunity_id: string | null;
  created_at: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SELECT_FIELDS =
  "id, assigned_agent, action_mode, status, user_safe_title, user_safe_message, proposal_id, opportunity_id, created_at";

export async function GET(request: NextRequest): Promise<Response> {
  const { log } = createRequestLogger(request, {
    route: "/api/copilot/notifications",
  });

  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const filters = parseFilters(request);
    if (!filters.ok) {
      return badRequest(filters.message);
    }

    const result = await fetchNotificationData(context.organizationId, filters);
    if (result.error) {
      log.error("Failed to fetch copilot notifications", result.error);
      return serverError("Failed to fetch copilot notifications", result.error);
    }

    return ok({
      notifications: result.notifications,
      activeCount: result.activeCount,
      canManageInterventions: canManageCopilotInterventions(context.role),
    });
  } catch (error) {
    log.error("Unhandled copilot notifications error", error);
    return serverError("Internal server error", error);
  }
}

async function fetchNotificationData(
  organizationId: string,
  filters: { status: CopilotNotificationFilter; limit: number },
) {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("copilot_interventions")
    .select(SELECT_FIELDS)
    .eq("organization_id", organizationId);

  if (filters.status === "active") {
    query = query.in("status", ACTIVE_NOTIFICATION_STATUSES);
  } else if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const [{ data, error }, activeCountResult] = await Promise.all([
    query.order("created_at", { ascending: false }).limit(filters.limit),
    adminClient
      .from("copilot_interventions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ACTIVE_NOTIFICATION_STATUSES),
  ]);

  if (error || activeCountResult.error) {
    if (isMissingCopilotSchemaError(error ?? activeCountResult.error)) {
      const fallbackLimit =
        filters.status === "all" || filters.status === "active" || filters.status === "open"
          ? filters.limit
          : 0;
      return fetchCompatibilityNotifications(
        adminClient,
        organizationId,
        fallbackLimit,
      );
    }

    return {
      error: error ?? activeCountResult.error,
      notifications: [] as CopilotNotification[],
      activeCount: 0,
    };
  }

  return {
    error: null,
    notifications: (data ?? []).map((row) =>
      mapCopilotNotification(row as NotificationRow),
    ),
    activeCount: activeCountResult.count ?? 0,
  };
}

function parseFilters(
  request: NextRequest,
):
  | { ok: true; status: CopilotNotificationFilter; limit: number }
  | { ok: false; message: string } {
  const statusValue = request.nextUrl.searchParams.get("status") ?? "active";
  const limitValue = request.nextUrl.searchParams.get("limit");

  if (
    statusValue !== "active" &&
    statusValue !== "all" &&
    statusValue !== "open" &&
    statusValue !== "awaiting_approval" &&
    statusValue !== "resolved"
  ) {
    return { ok: false, message: "Invalid notification status filter" };
  }

  const parsedLimit = limitValue ? Number.parseInt(limitValue, 10) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
    return { ok: false, message: "Invalid notification limit" };
  }

  return {
    ok: true,
    status: statusValue,
    limit: parsedLimit,
  };
}
