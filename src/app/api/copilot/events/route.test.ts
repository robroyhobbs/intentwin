import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIngestCopilotEvent = vi.fn();

vi.mock("@/lib/copilot/ingest-event", () => ({
  ingestCopilotEvent: mockIngestCopilotEvent,
}));

const VALID_BODY = {
  id: "evt-1",
  type: "proposal.generation.failed",
  organizationId: "11111111-1111-4111-8111-111111111111",
  source: "intentwin",
  correlationId: "corr-1",
  createdAt: "2026-03-09T05:03:07.775Z",
  payload: {
    proposalId: "22222222-2222-4222-8222-222222222222",
    retryable: true,
  },
};

async function loadRoute() {
  return import("./route");
}

describe("POST /api/copilot/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("COPILOT_SERVICE_SECRET", "test-copilot-secret");
  });

  it("rejects missing or invalid auth", async () => {
    const { POST } = await loadRoute();

    const missingAuthResponse = await POST(
      new Request("http://localhost/api/copilot/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(VALID_BODY),
      }) as never,
    );

    const invalidAuthResponse = await POST(
      new Request("http://localhost/api/copilot/events", {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify(VALID_BODY),
      }) as never,
    );

    expect(missingAuthResponse.status).toBe(401);
    expect(await missingAuthResponse.json()).toEqual({
      error: "Invalid copilot service authorization",
      code: "UNAUTHORIZED",
    });

    expect(invalidAuthResponse.status).toBe(401);
    expect(await invalidAuthResponse.json()).toEqual({
      error: "Invalid copilot service authorization",
      code: "UNAUTHORIZED",
    });
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("routes a valid authenticated event and returns a created response", async () => {
    mockIngestCopilotEvent.mockResolvedValue({
      ok: true,
      deduplicated: false,
      data: {
        event: {
          id: "db-event-1",
          externalEventId: "evt-1",
          organizationId: "11111111-1111-4111-8111-111111111111",
          type: "proposal.generation.failed",
        },
        intervention: {
          id: "db-intervention-1",
          assignedAgent: "reliability-overseer",
          actionMode: "auto",
          status: "open",
          proposalId: "22222222-2222-4222-8222-222222222222",
          opportunityId: null,
        },
      },
    });

    const { POST } = await loadRoute();

    const response = await POST(
      new Request("http://localhost/api/copilot/events", {
        method: "POST",
        headers: {
          authorization: "Bearer test-copilot-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify(VALID_BODY),
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      event: {
        id: "db-event-1",
        externalEventId: "evt-1",
        organizationId: "11111111-1111-4111-8111-111111111111",
        type: "proposal.generation.failed",
      },
      intervention: {
        id: "db-intervention-1",
        assignedAgent: "reliability-overseer",
        actionMode: "auto",
        status: "open",
        proposalId: "22222222-2222-4222-8222-222222222222",
        opportunityId: null,
      },
      deduplicated: false,
    });
    expect(mockIngestCopilotEvent).toHaveBeenCalledWith(
      VALID_BODY,
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });
});
