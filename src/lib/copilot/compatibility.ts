import type { SupabaseClient } from "@supabase/supabase-js";

interface SchemaErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

interface ProposalFailureRow {
  id: string;
  title: string | null;
  generation_error: string | null;
  updated_at: string;
}

export interface CompatibilityNotification {
  id: string;
  title: string;
  message: string;
  status: "open";
  assignedAgent: "reliability-overseer";
  actionMode: "automatic";
  createdAt: string;
  href: string;
  hrefLabel: "View proposal";
  requiresApproval: false;
}

export interface CompatibilityIntervention {
  id: string;
  assignedAgent: "reliability-overseer";
  actionMode: "automatic";
  status: "open";
  userSafeTitle: string;
  userSafeMessage: string;
  internalReason: string;
  proposalId: string;
  opportunityId: null;
  createdAt: string;
  updatedAt: string;
}

export function isMissingCopilotSchemaError(error: SchemaErrorLike | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("copilot_interventions") === true ||
    error.message?.includes("copilot_events") === true ||
    error.details?.includes("copilot_interventions") === true
  );
}

export async function fetchCompatibilityNotifications(
  adminClient: SupabaseClient,
  organizationId: string,
  limit: number,
): Promise<{ notifications: CompatibilityNotification[]; activeCount: number; error: SchemaErrorLike | null }> {
  const fallback = await fetchCompatibilityProposalFailures(adminClient, organizationId, limit);
  return {
    error: fallback.error,
    activeCount: fallback.activeCount,
    notifications: fallback.rows.map(mapCompatibilityNotification),
  };
}

export async function fetchCompatibilityInterventions(
  adminClient: SupabaseClient,
  organizationId: string,
  limit: number,
): Promise<{ interventions: CompatibilityIntervention[]; error: SchemaErrorLike | null }> {
  const fallback = await fetchCompatibilityProposalFailures(adminClient, organizationId, limit);
  return {
    error: fallback.error,
    interventions: fallback.rows.map(mapCompatibilityIntervention),
  };
}

async function fetchCompatibilityProposalFailures(
  adminClient: SupabaseClient,
  organizationId: string,
  limit: number,
): Promise<{ rows: ProposalFailureRow[]; activeCount: number; error: SchemaErrorLike | null }> {
  const rowsPromise =
    limit > 0
      ? adminClient
          .from("proposals")
          .select("id, title, generation_error, updated_at")
          .eq("organization_id", organizationId)
          .not("generation_error", "is", null)
          .order("updated_at", { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as ProposalFailureRow[], error: null });
  const [{ data, error }, countResult] = await Promise.all([
    rowsPromise,
    adminClient
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("generation_error", "is", null),
  ]);

  if (error || countResult.error) {
    return {
      rows: [],
      activeCount: 0,
      error: error ?? countResult.error,
    };
  }

  return {
    rows: (data ?? []) as ProposalFailureRow[],
    activeCount: countResult.count ?? 0,
    error: null,
  };
}

function mapCompatibilityNotification(row: ProposalFailureRow): CompatibilityNotification {
  return {
    id: `compat-${row.id}`,
    title: "Proposal generation issue detected",
    message: buildCompatibilityMessage(row.title),
    status: "open",
    assignedAgent: "reliability-overseer",
    actionMode: "automatic",
    createdAt: row.updated_at,
    href: `/proposals/${row.id}`,
    hrefLabel: "View proposal",
    requiresApproval: false,
  };
}

function mapCompatibilityIntervention(row: ProposalFailureRow): CompatibilityIntervention {
  return {
    id: `compat-${row.id}`,
    assignedAgent: "reliability-overseer",
    actionMode: "automatic",
    status: "open",
    userSafeTitle: "Proposal generation issue detected",
    userSafeMessage: buildCompatibilityMessage(row.title),
    internalReason: row.generation_error ?? "Proposal generation failed.",
    proposalId: row.id,
    opportunityId: null,
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
  };
}

function buildCompatibilityMessage(title: string | null) {
  if (!title) {
    return "A proposal hit a generation issue. Open the proposal to review the latest error and retry failed sections.";
  }

  return `${title} hit a generation issue. Open the proposal to review the latest error and retry failed sections.`;
}
