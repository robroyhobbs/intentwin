/**
 * AI Pipeline Metrics — Timing, token usage, and success/failure tracking.
 *
 * Collects metrics for AI generation operations with structured logging
 * for Vercel/Datadog ingestion. Metrics are logged as structured JSON events
 * that can be queried in log aggregation platforms.
 *
 * @module observability/metrics
 */

import { logger } from "@/lib/utils/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

interface SectionMetric {
  sectionType: string;
  durationMs: number;
  status: "success" | "failure";
  tokenUsage?: TokenUsage;
  ragChunksRetrieved: number;
  error?: string;
}

interface PipelineMetric {
  proposalId: string;
  organizationId: string;
  totalDurationMs: number;
  status: "success" | "partial" | "failure";
  sectionsGenerated: number;
  sectionsFailed: number;
  totalTokens: number;
  sections: SectionMetric[];
  model: string;
  industry?: string;
  opportunityType?: string;
}

interface RegenerationMetric {
  proposalId: string;
  sectionId: string;
  sectionType: string;
  organizationId: string;
  durationMs: number;
  status: "success" | "failure";
  tokenUsage?: TokenUsage;
  hadQualityFeedback: boolean;
  error?: string;
}

interface QualityReviewMetric {
  proposalId: string;
  organizationId: string;
  durationMs: number;
  status: "success" | "failure";
  overallScore?: number;
  sectionScores?: Record<string, number>;
  judgesUsed?: number;
  error?: string;
}

// ─── Metric Collectors ──────────────────────────────────────────────────────

/**
 * Create a pipeline metric collector.
 * Call start(), then track each section, then finish().
 */
export function createPipelineMetrics(
  proposalId: string,
  organizationId: string,
  options?: { model?: string; industry?: string; opportunityType?: string },
) {
  const startTime = performance.now();
  const sections: SectionMetric[] = [];
  let totalTokens = 0;

  return {
    /**
     * Track a section generation.
     * Returns a function to call when the section is done.
     */
    trackSection(sectionType: string) {
      const sectionStart = performance.now();

      return {
        success(opts?: { tokenUsage?: TokenUsage; ragChunks?: number }) {
          const durationMs = Math.round(performance.now() - sectionStart);
          const metric: SectionMetric = {
            sectionType,
            durationMs,
            status: "success",
            tokenUsage: opts?.tokenUsage,
            ragChunksRetrieved: opts?.ragChunks || 0,
          };
          sections.push(metric);

          if (opts?.tokenUsage) {
            totalTokens += opts.tokenUsage.totalTokens;
          }

          logger.info(`section.generated`, {
            proposalId,
            sectionType,
            durationMs,
            tokens: opts?.tokenUsage?.totalTokens,
            ragChunks: opts?.ragChunks,
          });
        },

        failure(error: string, opts?: { ragChunks?: number }) {
          const durationMs = Math.round(performance.now() - sectionStart);
          const metric: SectionMetric = {
            sectionType,
            durationMs,
            status: "failure",
            ragChunksRetrieved: opts?.ragChunks || 0,
            error,
          };
          sections.push(metric);

          logger.warn(`section.failed`, {
            proposalId,
            sectionType,
            durationMs,
            error,
          });
        },
      };
    },

    /**
     * Finalize and log the complete pipeline metric.
     */
    finish(): PipelineMetric {
      const totalDurationMs = Math.round(performance.now() - startTime);
      const sectionsFailed = sections.filter((s) => s.status === "failure").length;
      const sectionsGenerated = sections.filter((s) => s.status === "success").length;

      const status: PipelineMetric["status"] =
        sectionsFailed === 0
          ? "success"
          : sectionsGenerated === 0
            ? "failure"
            : "partial";

      const metric: PipelineMetric = {
        proposalId,
        organizationId,
        totalDurationMs,
        status,
        sectionsGenerated,
        sectionsFailed,
        totalTokens,
        sections,
        model: options?.model || process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
        industry: options?.industry,
        opportunityType: options?.opportunityType,
      };

      logger.event("pipeline.completed", {
        proposalId,
        organizationId,
        totalDurationMs,
        status,
        sectionsGenerated,
        sectionsFailed,
        totalTokens,
        model: metric.model,
        industry: metric.industry,
        opportunityType: metric.opportunityType,
      });

      return metric;
    },
  };
}

/**
 * Log a section regeneration metric.
 */
export function logRegenerationMetric(metric: RegenerationMetric): void {
  logger.event("section.regenerated", {
    proposalId: metric.proposalId,
    sectionId: metric.sectionId,
    sectionType: metric.sectionType,
    organizationId: metric.organizationId,
    durationMs: metric.durationMs,
    status: metric.status,
    tokens: metric.tokenUsage?.totalTokens,
    hadQualityFeedback: metric.hadQualityFeedback,
    error: metric.error,
  });
}

/**
 * Log a quality review metric.
 */
export function logQualityReviewMetric(metric: QualityReviewMetric): void {
  logger.event("quality.review.completed", {
    proposalId: metric.proposalId,
    organizationId: metric.organizationId,
    durationMs: metric.durationMs,
    status: metric.status,
    overallScore: metric.overallScore,
    judgesUsed: metric.judgesUsed,
    error: metric.error,
  });
}

/**
 * Log an embedding/RAG retrieval metric.
 */
export function logRagMetric(opts: {
  proposalId: string;
  sectionType: string;
  query: string;
  chunksRetrieved: number;
  embeddingDurationMs: number;
  searchDurationMs: number;
}): void {
  logger.info("rag.retrieval", {
    proposalId: opts.proposalId,
    sectionType: opts.sectionType,
    queryLength: opts.query.length,
    chunksRetrieved: opts.chunksRetrieved,
    embeddingDurationMs: opts.embeddingDurationMs,
    searchDurationMs: opts.searchDurationMs,
    totalDurationMs: opts.embeddingDurationMs + opts.searchDurationMs,
  });
}

/**
 * Log an API route request metric.
 */
export function logApiMetric(opts: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  organizationId?: string;
  error?: string;
}): void {
  const level = opts.statusCode >= 500 ? "error" : opts.statusCode >= 400 ? "warn" : "info";

  if (level === "error") {
    logger.error("api.request", undefined, {
      method: opts.method,
      path: opts.path,
      statusCode: opts.statusCode,
      durationMs: opts.durationMs,
      userId: opts.userId,
      organizationId: opts.organizationId,
      error: opts.error,
    });
  } else if (level === "warn") {
    logger.warn("api.request", {
      method: opts.method,
      path: opts.path,
      statusCode: opts.statusCode,
      durationMs: opts.durationMs,
      userId: opts.userId,
      organizationId: opts.organizationId,
      error: opts.error,
    });
  } else {
    logger.info("api.request", {
      method: opts.method,
      path: opts.path,
      statusCode: opts.statusCode,
      durationMs: opts.durationMs,
      userId: opts.userId,
      organizationId: opts.organizationId,
    });
  }
}
