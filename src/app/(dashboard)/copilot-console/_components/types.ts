export type InterventionStatus = "open" | "awaiting_approval" | "resolved";
export type ResolutionDecision = "approve" | "reject";

export interface ConsoleCounts {
  total: number;
  open: number;
  awaitingApproval: number;
  resolved: number;
}

export interface ConsoleActionError {
  interventionId: string;
  message: string;
}

export interface CopilotIntervention {
  id: string;
  assignedAgent: string;
  actionMode: string;
  status: InterventionStatus;
  userSafeTitle: string | null;
  userSafeMessage: string | null;
  internalReason: string;
  proposalId: string | null;
  opportunityId: string | null;
  resolutionDecision?: ResolutionDecision | null;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
