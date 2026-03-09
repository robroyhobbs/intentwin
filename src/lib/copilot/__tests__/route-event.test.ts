import { describe, expect, it } from "vitest";
import { routeCopilotEvent } from "../route-event";

describe("routeCopilotEvent", () => {
  it("routes retryable proposal generation failures to Reliability Overseer for auto-remediation", () => {
    const result = routeCopilotEvent({
      id: "evt-1",
      organizationId: "org-1",
      type: "proposal.generation.failed",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {
        proposalId: "proposal-1",
        retryable: true,
      },
    });

    expect(result).toEqual({
      agent: "reliability-overseer",
      actionMode: "auto",
      reason: "Retryable proposal generation failure",
    });
  });

  it("routes blocked proposal stages to Proposal Guide", () => {
    const result = routeCopilotEvent({
      id: "evt-2",
      organizationId: "11111111-1111-1111-1111-111111111111",
      type: "proposal.stage.blocked",
      source: "intentwin",
      correlationId: "corr-2",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {
        proposalId: "22222222-2222-2222-2222-222222222222",
        stage: "draft",
      },
    });

    expect(result).toEqual({
      agent: "proposal-guide",
      actionMode: "auto",
      reason: "Proposal workflow guidance required",
    });
  });

  it("routes low-quality proposal events to Compliance Guardian for approval", () => {
    const result = routeCopilotEvent({
      id: "evt-3",
      organizationId: "11111111-1111-1111-1111-111111111111",
      type: "proposal.quality.low",
      source: "intentwin",
      correlationId: "corr-3",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {
        proposalId: "22222222-2222-2222-2222-222222222222",
        score: 42,
      },
    });

    expect(result).toEqual({
      agent: "compliance-guardian",
      actionMode: "approval_required",
      reason: "Proposal quality or compliance review required",
    });
  });

  it("routes degraded health events to Reliability Overseer", () => {
    const result = routeCopilotEvent({
      id: "evt-4",
      organizationId: "11111111-1111-4111-8111-111111111111",
      type: "health.component.degraded",
      source: "monitoring",
      correlationId: "corr-4",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {
        component: "supabase",
        severity: "critical",
      },
    });

    expect(result).toEqual({
      agent: "reliability-overseer",
      actionMode: "auto",
      reason: "Reliability intervention required",
    });
  });
});
