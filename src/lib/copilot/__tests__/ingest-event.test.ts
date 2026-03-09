import { describe, expect, it } from "vitest";
import { ingestCopilotEvent } from "../ingest-event";
import { InMemoryCopilotRepository } from "./helpers/in-memory-copilot-repository";

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORGANIZATION_ID = "33333333-3333-4333-8333-333333333333";
const PROPOSAL_ID = "22222222-2222-4222-8222-222222222222";

function buildProposalFailureEvent(retryable: boolean) {
  return {
    id: "evt-1",
    type: "proposal.generation.failed" as const,
    organizationId: ORGANIZATION_ID,
    source: "intentwin" as const,
    correlationId: "corr-1",
    createdAt: "2026-03-09T05:03:07.775Z",
    payload: {
      proposalId: PROPOSAL_ID,
      retryable,
    },
  };
}

function buildHealthDegradedEvent() {
  return {
    id: "evt-health-1",
    type: "health.component.degraded" as const,
    organizationId: ORGANIZATION_ID,
    source: "monitoring" as const,
    correlationId: "corr-health-1",
    createdAt: "2026-03-09T05:03:07.775Z",
    payload: {
      component: "supabase",
      severity: "critical",
      message: "DB error: connection refused",
    },
  };
}

describe("ingestCopilotEvent", () => {
  it("routes a valid event and persists a minimal intervention record", async () => {
    const repository = new InMemoryCopilotRepository();
    repository.seedProposal(PROPOSAL_ID, ORGANIZATION_ID);

    const result = await ingestCopilotEvent(buildProposalFailureEvent(true), {
      repository,
    });

    expect(result).toEqual({
      ok: true,
      deduplicated: false,
      data: {
        event: {
          id: "db-event-1",
          externalEventId: "evt-1",
          organizationId: ORGANIZATION_ID,
          type: "proposal.generation.failed",
        },
        intervention: {
          id: "db-intervention-1",
          assignedAgent: "reliability-overseer",
          actionMode: "auto",
          status: "open",
          proposalId: PROPOSAL_ID,
          opportunityId: null,
        },
      },
    });
  });

  it("handles duplicate event delivery idempotently", async () => {
    const repository = new InMemoryCopilotRepository();
    repository.seedProposal(PROPOSAL_ID, ORGANIZATION_ID);

    const first = await ingestCopilotEvent(buildProposalFailureEvent(true), {
      repository,
    });
    const second = await ingestCopilotEvent(buildProposalFailureEvent(true), {
      repository,
    });

    expect(first).toMatchObject({ ok: true, deduplicated: false });
    expect(second).toMatchObject({ ok: true, deduplicated: true });

    if (first.ok && second.ok) {
      expect(second.data.event.id).toBe(first.data.event.id);
      expect(second.data.intervention.id).toBe(first.data.intervention.id);
    }
  });

  it("rejects proposal events that cross organization boundaries", async () => {
    const repository = new InMemoryCopilotRepository();
    repository.seedProposal(PROPOSAL_ID, OTHER_ORGANIZATION_ID);

    const result = await ingestCopilotEvent(buildProposalFailureEvent(true), {
      repository,
    });

    expect(result).toEqual({
      ok: false,
      status: 403,
      code: "ORG_SCOPE_VIOLATION",
      message: "Proposal does not belong to organization",
    });
  });

  it("marks approval-required interventions as awaiting approval", async () => {
    const repository = new InMemoryCopilotRepository();
    repository.seedProposal(PROPOSAL_ID, ORGANIZATION_ID);

    const result = await ingestCopilotEvent(
      {
        id: "evt-2",
        type: "proposal.quality.low",
        organizationId: ORGANIZATION_ID,
        source: "intentwin",
        correlationId: "corr-2",
        createdAt: "2026-03-09T05:03:07.775Z",
        payload: {
          proposalId: PROPOSAL_ID,
          score: 42,
        },
      },
      { repository },
    );

    expect(result).toMatchObject({
      ok: true,
      deduplicated: false,
      data: {
        intervention: {
          assignedAgent: "compliance-guardian",
          actionMode: "approval_required",
          status: "awaiting_approval",
        },
      },
    });
  });

  it("stores user-safe copy for degraded health events", async () => {
    const repository = new InMemoryCopilotRepository();

    const result = await ingestCopilotEvent(buildHealthDegradedEvent(), {
      repository,
    });

    expect(result).toMatchObject({
      ok: true,
      deduplicated: false,
      data: {
        intervention: {
          assignedAgent: "reliability-overseer",
          actionMode: "auto",
          status: "open",
          proposalId: null,
          opportunityId: null,
        },
      },
    });
    expect(repository.listNotificationRows(ORGANIZATION_ID)).toEqual([
      expect.objectContaining({
        user_safe_title: "Service reliability issue detected",
        user_safe_message:
          "IntentBid Copilot detected a reliability issue and opened an intervention for follow-up.",
      }),
    ]);
  });
});
