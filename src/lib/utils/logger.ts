/**
 * Structured Logger — Environment-aware logging with JSON output.
 *
 * - Development: human-readable format with colors
 * - Production: JSON lines for log aggregation (Vercel, Datadog, etc.)
 * - Errors are always logged
 * - Debug/info suppressed in production unless LOG_LEVEL is set
 * - Supports correlation IDs for request tracing
 * - Context-aware logger factory for scoped logging
 *
 * @module utils/logger
 */

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const logLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "warn");

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  if (isTest) return level === "error"; // Suppress most logs in tests
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[logLevel as LogLevel];
}

/**
 * Redact sensitive values from log context.
 */
function redactSensitive(obj: LogContext): LogContext {
  const sensitiveKeys = new Set([
    "password", "token", "secret", "api_key", "apikey",
    "authorization", "cookie", "credit_card", "ssn",
    "access_token", "refresh_token", "service_role_key",
  ]);

  const redacted: LogContext = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as LogContext);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Generate a unique correlation ID for request tracing.
 */
function generateCorrelationId(): string {
  // Use crypto.randomUUID if available (Node 19+), otherwise fallback
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Fallback: timestamp + random hex
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
  baseContext?: LogContext,
): string {
  const mergedContext = { ...baseContext, ...context };
  const hasContext = Object.keys(mergedContext).length > 0;

  if (isDev) {
    // Human-readable for development
    const prefix = `[${level.toUpperCase()}]`;
    const ctxStr = hasContext ? ` ${JSON.stringify(redactSensitive(mergedContext))}` : "";
    return `${prefix} ${message}${ctxStr}`;
  }

  // Structured JSON for production (Vercel, Datadog, etc.)
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(hasContext ? redactSensitive(mergedContext) : {}),
  };
  return JSON.stringify(entry);
}

/**
 * Core logger implementation.
 * Can be used directly or via createLogger() for scoped context.
 */
function createLoggerInstance(baseContext?: LogContext) {
  return {
    /**
     * Debug logs - development only (or LOG_LEVEL=debug)
     */
    debug: (message: string, context?: LogContext) => {
      if (shouldLog("debug")) {
        console.log(formatMessage("debug", message, context, baseContext));
      }
    },

    /**
     * Info logs - development only (or LOG_LEVEL=info)
     */
    info: (message: string, context?: LogContext) => {
      if (shouldLog("info")) {
        console.log(formatMessage("info", message, context, baseContext));
      }
    },

    /**
     * Warning logs - always shown in production
     */
    warn: (message: string, context?: LogContext) => {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", message, context, baseContext));
      }
    },

    /**
     * Error logs - always shown.
     * Optionally captures to error tracking service.
     */
    error: (message: string, error?: unknown, context?: LogContext) => {
      if (shouldLog("error")) {
        const errorContext: LogContext = { ...baseContext, ...context };
        if (error instanceof Error) {
          errorContext.error_name = error.name;
          errorContext.error_message = error.message;
          if (isDev) {
            errorContext.stack = error.stack;
          }
        } else if (error !== undefined) {
          errorContext.error = String(error);
        }
        console.error(formatMessage("error", message, errorContext));
      }
    },

    /**
     * Operational event logs - always shown.
     * For important business events (proposals created, exports, webhooks, etc.)
     */
    event: (eventType: string, details?: LogContext) => {
      const mergedDetails = { ...baseContext, ...details };
      const entry = {
        level: "event" as const,
        event: eventType,
        timestamp: new Date().toISOString(),
        ...(Object.keys(mergedDetails).length > 0
          ? { details: redactSensitive(mergedDetails) }
          : {}),
      };

      if (isDev) {
        console.log(
          `[EVENT] ${entry.timestamp} | ${eventType}`,
          Object.keys(mergedDetails).length > 0
            ? JSON.stringify(redactSensitive(mergedDetails))
            : "",
        );
      } else {
        console.log(JSON.stringify(entry));
      }
    },

    /**
     * Performance timing log.
     * Usage:
     *   const end = logger.time("generate-proposal");
     *   // ... work ...
     *   end(); // logs duration
     */
    time: (label: string, context?: LogContext) => {
      const start = performance.now();
      return (endContext?: LogContext) => {
        const durationMs = Math.round(performance.now() - start);
        const mergedCtx = { ...baseContext, ...context, ...endContext, duration_ms: durationMs };
        if (shouldLog("info")) {
          console.log(formatMessage("info", `${label} completed`, mergedCtx));
        }
        return durationMs;
      };
    },

    /**
     * Create a child logger with additional base context.
     * Useful for scoping logs to a request, operation, or component.
     */
    child: (childContext: LogContext) => {
      return createLoggerInstance({ ...baseContext, ...childContext });
    },
  };
}

/**
 * Default logger instance (no base context).
 */
export const logger = createLoggerInstance();

/**
 * Create a context-aware logger for a specific request or operation.
 *
 * Usage:
 *   const log = createLogger({
 *     requestId: correlationId,
 *     organizationId: context.organizationId,
 *     operation: "generateProposal",
 *   });
 *   log.info("Starting generation"); // automatically includes requestId, orgId
 */
export function createLogger(context: LogContext) {
  return createLoggerInstance(context);
}

/**
 * Create a request-scoped logger with automatic correlation ID.
 *
 * Usage:
 *   const { log, requestId } = createRequestLogger(request, {
 *     organizationId: context.organizationId,
 *   });
 *   // requestId is set on the response header X-Request-Id
 *   log.info("Processing request");
 */
export function createRequestLogger(
  request?: { headers?: { get?: (key: string) => string | null } },
  context?: LogContext,
) {
  // Use incoming request ID if provided (e.g., from load balancer), otherwise generate
  const requestId =
    request?.headers?.get?.("x-request-id") || generateCorrelationId();

  const log = createLoggerInstance({
    requestId,
    ...context,
  });

  return { log, requestId };
}

export { generateCorrelationId };
