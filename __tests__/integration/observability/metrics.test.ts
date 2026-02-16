import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the logger module before importing metrics
vi.mock("@/lib/utils/logger", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    event: vi.fn(),
    time: vi.fn(() => vi.fn()),
    child: vi.fn(() => mockLogger),
  };
  return {
    logger: mockLogger,
    createLogger: vi.fn(() => mockLogger),
    createRequestLogger: vi.fn(() => ({ log: mockLogger, requestId: "test-req" })),
  };
});

import {
  createPipelineMetrics,
  logRegenerationMetric,
  logQualityReviewMetric,
  logRagMetric,
  logApiMetric,
} from "@/lib/observability/metrics";
import { logger } from "@/lib/utils/logger";

describe("Pipeline Metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPipelineMetrics", () => {
    it("should track successful section generation", () => {
      const metrics = createPipelineMetrics("proposal-1", "org-1", {
        model: "claude-sonnet-4-20250514",
        industry: "healthcare",
      });

      const section = metrics.trackSection("executive_summary");
      section.success({ tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300, model: "claude-sonnet-4-20250514" }, ragChunks: 5 });

      expect(logger.info).toHaveBeenCalledWith("section.generated", expect.objectContaining({
        proposalId: "proposal-1",
        sectionType: "executive_summary",
        tokens: 300,
        ragChunks: 5,
      }));
    });

    it("should track failed section generation", () => {
      const metrics = createPipelineMetrics("proposal-1", "org-1");

      const section = metrics.trackSection("pricing");
      section.failure("AI provider timeout", { ragChunks: 3 });

      expect(logger.warn).toHaveBeenCalledWith("section.failed", expect.objectContaining({
        proposalId: "proposal-1",
        sectionType: "pricing",
        error: "AI provider timeout",
      }));
    });

    it("should produce correct final metric on success", () => {
      const metrics = createPipelineMetrics("proposal-1", "org-1", {
        industry: "finance",
        opportunityType: "cloud_migration",
      });

      // Track 3 successful sections
      for (const type of ["executive_summary", "approach", "timeline"]) {
        const s = metrics.trackSection(type);
        s.success({ tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300, model: "test" }, ragChunks: 2 });
      }

      const result = metrics.finish();

      expect(result.status).toBe("success");
      expect(result.sectionsGenerated).toBe(3);
      expect(result.sectionsFailed).toBe(0);
      expect(result.totalTokens).toBe(900);
      expect(result.industry).toBe("finance");
      expect(result.opportunityType).toBe("cloud_migration");

      expect(logger.event).toHaveBeenCalledWith("pipeline.completed", expect.objectContaining({
        status: "success",
        sectionsGenerated: 3,
        sectionsFailed: 0,
        totalTokens: 900,
      }));
    });

    it("should report 'partial' status when some sections fail", () => {
      const metrics = createPipelineMetrics("proposal-2", "org-1");

      const s1 = metrics.trackSection("executive_summary");
      s1.success({ ragChunks: 2 });

      const s2 = metrics.trackSection("pricing");
      s2.failure("timeout");

      const result = metrics.finish();

      expect(result.status).toBe("partial");
      expect(result.sectionsGenerated).toBe(1);
      expect(result.sectionsFailed).toBe(1);
    });

    it("should report 'failure' status when all sections fail", () => {
      const metrics = createPipelineMetrics("proposal-3", "org-1");

      const s1 = metrics.trackSection("executive_summary");
      s1.failure("error 1");

      const s2 = metrics.trackSection("pricing");
      s2.failure("error 2");

      const result = metrics.finish();

      expect(result.status).toBe("failure");
      expect(result.sectionsGenerated).toBe(0);
      expect(result.sectionsFailed).toBe(2);
    });
  });

  describe("logRegenerationMetric", () => {
    it("should log a regeneration event", () => {
      logRegenerationMetric({
        proposalId: "p-1",
        sectionId: "s-1",
        sectionType: "approach",
        organizationId: "org-1",
        durationMs: 5000,
        status: "success",
        tokenUsage: { promptTokens: 150, completionTokens: 250, totalTokens: 400, model: "claude-sonnet-4-20250514" },
        hadQualityFeedback: true,
      });

      expect(logger.event).toHaveBeenCalledWith("section.regenerated", expect.objectContaining({
        proposalId: "p-1",
        sectionType: "approach",
        status: "success",
        tokens: 400,
        hadQualityFeedback: true,
      }));
    });
  });

  describe("logQualityReviewMetric", () => {
    it("should log a quality review event", () => {
      logQualityReviewMetric({
        proposalId: "p-1",
        organizationId: "org-1",
        durationMs: 15000,
        status: "success",
        overallScore: 8.5,
        judgesUsed: 3,
      });

      expect(logger.event).toHaveBeenCalledWith("quality.review.completed", expect.objectContaining({
        proposalId: "p-1",
        status: "success",
        overallScore: 8.5,
        judgesUsed: 3,
      }));
    });
  });

  describe("logRagMetric", () => {
    it("should log a RAG retrieval event", () => {
      logRagMetric({
        proposalId: "p-1",
        sectionType: "case_studies",
        query: "healthcare case study outcomes",
        chunksRetrieved: 5,
        embeddingDurationMs: 200,
        searchDurationMs: 150,
      });

      expect(logger.info).toHaveBeenCalledWith("rag.retrieval", expect.objectContaining({
        proposalId: "p-1",
        sectionType: "case_studies",
        chunksRetrieved: 5,
        totalDurationMs: 350,
      }));
    });
  });

  describe("logApiMetric", () => {
    it("should log successful API requests at info level", () => {
      logApiMetric({
        method: "GET",
        path: "/api/proposals",
        statusCode: 200,
        durationMs: 50,
        userId: "user-1",
        organizationId: "org-1",
      });

      expect(logger.info).toHaveBeenCalledWith("api.request", expect.objectContaining({
        method: "GET",
        path: "/api/proposals",
        statusCode: 200,
      }));
    });

    it("should log 4xx errors at warn level", () => {
      logApiMetric({
        method: "POST",
        path: "/api/proposals",
        statusCode: 400,
        durationMs: 10,
        error: "Validation error",
      });

      expect(logger.warn).toHaveBeenCalledWith("api.request", expect.objectContaining({
        statusCode: 400,
        error: "Validation error",
      }));
    });

    it("should log 5xx errors at error level", () => {
      logApiMetric({
        method: "POST",
        path: "/api/proposals/generate",
        statusCode: 500,
        durationMs: 1000,
        error: "Internal server error",
      });

      expect(logger.error).toHaveBeenCalledWith("api.request", undefined, expect.objectContaining({
        statusCode: 500,
        error: "Internal server error",
      }));
    });
  });
});
