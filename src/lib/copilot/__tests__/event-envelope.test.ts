import { describe, expect, it } from "vitest";
import { validateCopilotEventEnvelope } from "../event-envelope";

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const PROPOSAL_ID = "22222222-2222-4222-8222-222222222222";

describe("validateCopilotEventEnvelope", () => {
  it("accepts a valid envelope and sanitizes free-form payload text", () => {
    const result = validateCopilotEventEnvelope({
      id: "evt-1",
      type: "proposal.stage.blocked",
      organizationId: ORGANIZATION_ID,
      source: "intentwin",
      correlationId: "corr-1",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {
        proposalId: PROPOSAL_ID,
        stage: "<strong>draft</strong>",
      },
    });

    expect(result).toEqual({
      ok: true,
      data: {
        id: "evt-1",
        type: "proposal.stage.blocked",
        organizationId: ORGANIZATION_ID,
        source: "intentwin",
        correlationId: "corr-1",
        createdAt: "2026-03-09T05:03:07.775Z",
        payload: {
          proposalId: PROPOSAL_ID,
          stage: "draft",
        },
      },
    });
  });

  it("rejects unknown copilot event types with a stable validation error", () => {
    const result = validateCopilotEventEnvelope({
      id: "evt-2",
      type: "proposal.unknown",
      organizationId: ORGANIZATION_ID,
      source: "intentwin",
      correlationId: "corr-2",
      createdAt: "2026-03-09T05:03:07.775Z",
      payload: {},
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      code: "UNKNOWN_COPILOT_EVENT_TYPE",
      message: "Unknown copilot event type",
    });
  });
});
