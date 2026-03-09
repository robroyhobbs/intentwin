import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUserContext = vi.fn();
const mockEmitHealthDegradationEvents = vi.fn();
const mockGenerateText = vi.fn();
const mockLogger = {
  event: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

interface MockSupabaseOptions {
  organizationError?: { message: string } | null;
  documentsData?: unknown[];
  documentsError?: { message: string } | null;
  vectorError?: { message: string } | null;
  bucketData?: { public: boolean } | null;
  bucketError?: { message: string } | null;
}

let mockSupabase: ReturnType<typeof createMockSupabase>;

vi.mock("@/lib/supabase/auth-api", () => ({
  getUserContext: mockGetUserContext,
}));

vi.mock("@/lib/copilot/health-degradation-event", () => ({
  emitHealthDegradationEvents: mockEmitHealthDegradationEvents,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateText: mockGenerateText,
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: mockLogger,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

function createChain(resolveData: unknown = null, resolveError: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "in", "order", "limit"];

  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.then = vi.fn((resolve: (value: unknown) => unknown) =>
    Promise.resolve(resolve({ data: resolveData, error: resolveError })),
  );

  return chain;
}

function createMockSupabase(options: MockSupabaseOptions = {}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        return createChain(null, options.organizationError ?? null);
      }

      if (table === "documents") {
        return createChain(options.documentsData ?? [], options.documentsError);
      }

      return createChain();
    }),
    rpc: vi.fn().mockResolvedValue({ error: options.vectorError ?? null }),
    storage: {
      getBucket: vi.fn().mockResolvedValue({
        data: options.bucketData ?? { public: false },
        error: options.bucketError ?? null,
      }),
    },
  };
}

async function loadRoute() {
  return import("./route");
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    mockGetUserContext.mockResolvedValue({
      organizationId: "11111111-1111-4111-8111-111111111111",
      user: { id: "user-1" },
    });
    mockEmitHealthDegradationEvents.mockResolvedValue({ ok: true, emitted: 0 });
    mockGenerateText.mockResolvedValue("OK");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini");
    vi.stubEnv("VOYAGE_API_KEY", "test-voyage");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "OK",
      }),
    );
  });

  it("returns minimal unauthenticated health without emitting copilot events", async () => {
    mockGetUserContext.mockResolvedValueOnce(null);
    const { GET } = await loadRoute();

    const response = await GET(new NextRequest("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body).not.toHaveProperty("checks");
    expect(mockEmitHealthDegradationEvents).not.toHaveBeenCalled();
  });

  it("returns healthy status without emitting degradation events", async () => {
    const { GET } = await loadRoute();

    const response = await GET(new NextRequest("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(mockEmitHealthDegradationEvents).not.toHaveBeenCalled();
  });

  it("emits throttled degradation events when critical checks fail", async () => {
    mockSupabase = createMockSupabase({
      organizationError: { message: "database unavailable" },
    });
    const { GET } = await loadRoute();

    const response = await GET(new NextRequest("http://localhost/api/health"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.failedChecks).toContain("supabase");
    expect(mockEmitHealthDegradationEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "11111111-1111-4111-8111-111111111111",
        totalResponseTimeMs: expect.any(Number),
        checks: expect.objectContaining({
          supabase: expect.objectContaining({
            ok: false,
            message: expect.stringContaining("database unavailable"),
          }),
        }),
      }),
    );
  });

  it("logs but does not fail the health response when event emission fails", async () => {
    mockSupabase = createMockSupabase({
      vectorError: { message: "rpc unavailable" },
    });
    mockEmitHealthDegradationEvents.mockResolvedValueOnce({
      ok: false,
      emitted: 0,
      failures: [{ component: "vector_search", message: "insert failed" }],
    });
    const { GET } = await loadRoute();

    const response = await GET(new NextRequest("http://localhost/api/health"));

    expect(response.status).toBe(503);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Health degradation event emission failed",
      expect.objectContaining({
        emittedCount: 0,
        failedComponents: ["vector_search"],
      }),
    );
  });
});
