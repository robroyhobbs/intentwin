import type {
  CopilotEventEnvelope,
} from "./event-envelope";

export type CopilotAgent =
  | "copilot-coordinator"
  | "reliability-overseer"
  | "proposal-guide"
  | "compliance-guardian"
  | "opportunity-scout"
  | "bid-strategist"
  | "user-success-sentinel";

export type CopilotActionMode = "auto" | "approval_required";

export type CopilotEvent = CopilotEventEnvelope;

export interface RoutedCopilotEvent {
  agent: CopilotAgent;
  actionMode: CopilotActionMode;
  reason: string;
}

export function routeCopilotEvent(event: CopilotEvent): RoutedCopilotEvent {
  switch (event.type) {
    case "proposal.created":
    case "proposal.stage.blocked":
    case "proposal.inputs.missing":
      return {
        agent: "proposal-guide",
        actionMode: "auto",
        reason: "Proposal workflow guidance required",
      };
    case "proposal.generation.failed":
      return getProposalGenerationFailureRoute(event.payload);
    case "proposal.quality.low":
    case "proposal.compliance.gap_critical":
      return {
        agent: "compliance-guardian",
        actionMode: "approval_required",
        reason: "Proposal quality or compliance review required",
      };
    case "opportunity.match.high":
    case "opportunity.deadline.near":
      return {
        agent: "opportunity-scout",
        actionMode: "auto",
        reason: "Opportunity follow-up required",
      };
    case "health.component.degraded":
    case "api.latency.threshold_exceeded":
      return {
        agent: "reliability-overseer",
        actionMode: "auto",
        reason: "Reliability intervention required",
      };
    case "user.stuck.detected":
      return {
        agent: "user-success-sentinel",
        actionMode: "approval_required",
        reason: "User assistance review required",
      };
  }
}

function getProposalGenerationFailureRoute(
  payload: Record<string, unknown>,
): RoutedCopilotEvent {
  if (payload.retryable === true) {
    return {
      agent: "reliability-overseer",
      actionMode: "auto",
      reason: "Retryable proposal generation failure",
    };
  }

  return {
    agent: "reliability-overseer",
    actionMode: "approval_required",
    reason: "Proposal generation failure requires review",
  };
}
