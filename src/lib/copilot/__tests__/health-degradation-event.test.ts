import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitHealthDegradationEvents } from "../health-degradation-event";

const { mockIngestCopilotEvent } = vi.hoisted(() => ({
  mockIngestCopilotEvent: vi.fn(),
}));

vi.mock("@/lib/copilot/ingest-event", () => ({
  ingestCopilotEvent: mockIngestCopilotEvent,
}));

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const EMITTED_AT = new Date("2026-03-09T18:32:08.074Z");

describe("emitHealthDegradationEvents", () => {
  beforeEach(() => {
    mockIngestCopilotEvent.mockReset();
    mockIngestCopilotEvent.mockResolvedValue({ ok: true });
  });

  it("emits one throttled monitoring event per failed component", async () => {
    const result = await emitHealthDegradationEvents({
      organizationId: ORGANIZATION_ID,
      totalResponseTimeMs: 16300,
      emittedAt: EMITTED_AT,
      checks: {
        supabase: {
          ok: false,
          message: "DB error: connection refused",
          responseTimeMs: 210,
        },
        storage: { ok: true, message: "Connected", responseTimeMs: 12 },
        gemini: {
          ok: false,
          message: "Gemini error: timed out",
          responseTimeMs: 15000,
        },
      },
    });

    expect(result).toEqual({ ok: true, emitted: 2 });
    expect(mockIngestCopilotEvent).toHaveBeenCalledTimes(2);
    expect(mockIngestCopilotEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: `health-component-degraded:${ORGANIZATION_ID}:supabase:2026-03-09T18:30:00.000Z`,
        type: "health.component.degraded",
        organizationId: ORGANIZATION_ID,
        source: "monitoring",
        correlationId: `health-component-degraded:${ORGANIZATION_ID}:supabase`,
        createdAt: EMITTED_AT.toISOString(),
        payload: expect.objectContaining({
          component: "supabase",
          severity: "critical",
          message: "DB error: connection refused",
          responseTimeMs: 210,
          totalResponseTimeMs: 16300,
          bucketStart: "2026-03-09T18:30:00.000Z",
        }),
      }),
      {},
    );
    expect(mockIngestCopilotEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: `health-component-degraded:${ORGANIZATION_ID}:gemini:2026-03-09T18:30:00.000Z`,
        payload: expect.objectContaining({
          component: "gemini",
          severity: "critical",
          message: "Gemini error: timed out",
        }),
      }),
      {},
    );
  });

  it("skips emission when all checks are healthy", async () => {
    const result = await emitHealthDegradationEvents({
      organizationId: ORGANIZATION_ID,
      totalResponseTimeMs: 120,
      emittedAt: EMITTED_AT,
      checks: {
        supabase: { ok: true, message: "Connected", responseTimeMs: 10 },
      },
    });

    expect(result).toEqual({ ok: true, emitted: 0 });
    expect(mockIngestCopilotEvent).not.toHaveBeenCalled();
  });

  it("reports per-component ingestion failures without stopping the batch", async () => {
    mockIngestCopilotEvent
      .mockResolvedValueOnce({ ok: false, message: "write failed" })
      .mockResolvedValueOnce({ ok: true });

    const result = await emitHealthDegradationEvents({
      organizationId: ORGANIZATION_ID,
      totalResponseTimeMs: 8000,
      emittedAt: EMITTED_AT,
      checks: {
        supabase: { ok: false, message: "DB error" },
        documents: { ok: false, message: "Queue stalled" },
      },
    });

    expect(result).toEqual({
      ok: false,
      emitted: 1,
      failures: [{ component: "supabase", message: "write failed" }],
    });
    expect(mockIngestCopilotEvent).toHaveBeenCalledTimes(2);
  });
});
