export type CopilotNotificationStatus =
  | "open"
  | "awaiting_approval"
  | "resolved";

export type CopilotNotificationFilter =
  | "active"
  | "all"
  | CopilotNotificationStatus;

export interface CopilotNotification {
  id: string;
  title: string;
  message: string;
  status: CopilotNotificationStatus;
  assignedAgent: string;
  actionMode: string;
  createdAt: string;
  href: string;
  hrefLabel: string;
  requiresApproval: boolean;
}

export interface CopilotNotificationResponse {
  notifications: CopilotNotification[];
  activeCount: number;
  canManageInterventions: boolean;
}

interface CopilotNotificationRow {
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

export const ACTIVE_NOTIFICATION_STATUSES: CopilotNotificationStatus[] = [
  "open",
  "awaiting_approval",
];

export function canManageCopilotInterventions(role: string) {
  return role === "admin" || role === "manager";
}

export function mapCopilotNotification(
  row: CopilotNotificationRow,
): CopilotNotification {
  return {
    id: row.id,
    title: row.user_safe_title ?? "IntentBid Copilot update",
    message:
      row.user_safe_message ??
      "IntentBid Copilot detected an update that may need your attention.",
    status: row.status,
    assignedAgent: row.assigned_agent,
    actionMode: row.action_mode,
    createdAt: row.created_at,
    href: getNotificationHref(row),
    hrefLabel: getNotificationHrefLabel(row),
    requiresApproval: row.status === "awaiting_approval",
  };
}

function getNotificationHref(row: CopilotNotificationRow) {
  if (row.proposal_id) {
    return `/proposals/${row.proposal_id}`;
  }

  if (row.opportunity_id) {
    return "/intelligence/opportunities";
  }

  return "/notifications";
}

function getNotificationHrefLabel(row: CopilotNotificationRow) {
  if (row.proposal_id) {
    return "View proposal";
  }

  if (row.opportunity_id) {
    return "View opportunity";
  }

  return "View notification";
}
