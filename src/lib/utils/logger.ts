/**
 * Simple logging utility that respects environment
 * - Errors are always logged
 * - Debug/info logs are suppressed in production
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Info logs - only shown in development
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log("[INFO]", ...args);
    }
  },

  /**
   * Warning logs - always shown
   */
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },

  /**
   * Error logs - always shown
   */
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },

  /**
   * Operational logs for important events (e.g., Stripe webhooks)
   * Always shown in production for visibility
   */
  event: (eventType: string, details?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[EVENT] ${timestamp} | ${eventType}`, details ? JSON.stringify(details) : "");
  },
};
