/**
 * Error Tracking — Sentry-ready error capture and context management.
 *
 * Provides a unified API for error tracking that works with or without Sentry.
 * When Sentry is not installed, errors are logged via the structured logger.
 * When Sentry IS installed, this module delegates to it automatically.
 *
 * To enable Sentry:
 *   1. npm install @sentry/nextjs
 *   2. Set SENTRY_DSN env var
 *   3. Run `npx @sentry/wizard@latest -i nextjs`
 *
 * @module observability/error-tracking
 */

type ErrorSeverity = "fatal" | "error" | "warning" | "info";
type ErrorContext = Record<string, unknown>;

interface ErrorTrackingConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  release?: string;
  sampleRate: number;
}

interface CaptureOptions {
  severity?: ErrorSeverity;
  tags?: Record<string, string>;
  context?: ErrorContext;
  user?: {
    id?: string;
    email?: string;
    organizationId?: string;
  };
  fingerprint?: string[];
}

// Sentry-compatible interface (avoids hard dependency on @sentry/nextjs types)
interface SentryLike {
  withScope: (callback: (scope: SentryScopeLike) => void) => void;
  captureException: (error: Error) => void;
  captureMessage: (message: string) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
  setTag: (key: string, value: string) => void;
  addBreadcrumb: (breadcrumb: {
    category: string;
    message: string;
    level?: string;
    data?: Record<string, unknown>;
  }) => void;
}

interface SentryScopeLike {
  setLevel: (level: string) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
  setFingerprint: (fingerprint: string[]) => void;
}

// Lazy-loaded Sentry module (only if installed)
let _sentry: SentryLike | null = null;
let _sentryChecked = false;

async function getSentry(): Promise<SentryLike | null> {
  if (_sentryChecked) return _sentry;
  _sentryChecked = true;

  try {
    // Dynamic import — succeeds only if @sentry/nextjs is installed
    // @ts-expect-error — optional dependency, not installed by default
    const mod = await import("@sentry/nextjs");
    _sentry = mod as unknown as SentryLike;
    return _sentry;
  } catch {
    // Sentry not installed — that's fine
    return null;
  }
}

function getConfig(): ErrorTrackingConfig {
  return {
    enabled: !!process.env.SENTRY_DSN,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || "1.0"),
  };
}

/**
 * Capture an error for tracking.
 * Sends to Sentry if configured, otherwise logs via console.error.
 */
export async function captureError(
  error: Error | string,
  options: CaptureOptions = {},
): Promise<string | undefined> {
  const config = getConfig();
  const err = typeof error === "string" ? new Error(error) : error;

  // Always log locally
  const logContext: ErrorContext = {
    severity: options.severity || "error",
    ...(options.tags || {}),
    ...(options.context || {}),
  };

  if (options.user?.id) logContext.userId = options.user.id;
  if (options.user?.organizationId) logContext.organizationId = options.user.organizationId;

  // If Sentry is configured, send there
  if (config.enabled) {
    const sentry = await getSentry();
    if (sentry) {
      sentry.withScope((scope) => {
        if (options.severity) {
          scope.setLevel(options.severity);
        }
        if (options.tags) {
          for (const [key, value] of Object.entries(options.tags)) {
            scope.setTag(key, value);
          }
        }
        if (options.context) {
          scope.setContext("custom", options.context);
        }
        if (options.user) {
          scope.setUser({
            id: options.user?.id,
            email: options.user?.email,
          });
          if (options.user?.organizationId) {
            scope.setTag("organization_id", options.user.organizationId);
          }
        }
        if (options.fingerprint) {
          scope.setFingerprint(options.fingerprint);
        }
        sentry.captureException(err);
      });

      return undefined; // Sentry generates its own event ID
    }
  }

  // Fallback: structured log
  console.error(
    JSON.stringify({
      level: "error",
      message: err.message,
      error_name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      ...logContext,
    }),
  );

  return undefined;
}

/**
 * Capture a message (non-error) for tracking.
 */
export async function captureMessage(
  message: string,
  severity: ErrorSeverity = "info",
  context?: ErrorContext,
): Promise<void> {
  const config = getConfig();

  if (config.enabled) {
    const sentry = await getSentry();
    if (sentry) {
      sentry.withScope((scope) => {
        scope.setLevel(severity);
        if (context) {
          scope.setContext("custom", context);
        }
        sentry.captureMessage(message);
      });
      return;
    }
  }

  // Fallback: structured log
  const logFn = severity === "error" || severity === "fatal" ? console.error : console.warn;
  logFn(
    JSON.stringify({
      level: severity,
      message,
      timestamp: new Date().toISOString(),
      ...(context || {}),
    }),
  );
}

/**
 * Set the current user context for error tracking.
 * All subsequent errors will be associated with this user.
 */
export async function setUser(user: {
  id: string;
  email?: string;
  organizationId?: string;
}): Promise<void> {
  const sentry = await getSentry();
  if (sentry) {
    sentry.setUser({
      id: user.id,
      email: user.email,
    });
    if (user.organizationId) {
      sentry.setTag("organization_id", user.organizationId);
    }
  }
}

/**
 * Clear the current user context.
 */
export async function clearUser(): Promise<void> {
  const sentry = await getSentry();
  if (sentry) {
    sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb for error context trail.
 */
export async function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: ErrorSeverity;
  data?: ErrorContext;
}): Promise<void> {
  const sentry = await getSentry();
  if (sentry) {
    sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level || "info",
      data: breadcrumb.data,
    });
  }
}

/**
 * Wrap an async function with automatic error capture.
 * Useful for API route handlers.
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: { operation?: string; tags?: Record<string, string> },
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await captureError(error instanceof Error ? error : new Error(String(error)), {
        tags: {
          operation: options?.operation || fn.name || "unknown",
          ...options?.tags,
        },
      });
      throw error; // Re-throw so caller can handle
    }
  }) as T;
}

export const errorTracking = {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  withErrorTracking,
};
