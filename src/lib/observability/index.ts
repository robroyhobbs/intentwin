/**
 * Observability — Unified exports for logging, metrics, and error tracking.
 *
 * @module observability
 */

// Logger (re-export from utils for convenience)
export { logger, createLogger, createRequestLogger, generateCorrelationId } from "@/lib/utils/logger";

// Error tracking
export {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  withErrorTracking,
  errorTracking,
} from "./error-tracking";

// Metrics
export {
  createPipelineMetrics,
  logRegenerationMetric,
  logQualityReviewMetric,
  logRagMetric,
  logApiMetric,
} from "./metrics";
