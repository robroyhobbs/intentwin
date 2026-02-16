/**
 * Input Sanitization — Protect against XSS and injection attacks.
 *
 * Sanitizes user-provided strings before they're stored or rendered.
 * Works in conjunction with React's built-in XSS protection (JSX escaping).
 *
 * @module security/sanitize
 */

// Re-export canonical escapeHtml from email module
export { escapeHtml } from "@/lib/email/escape-html";

/**
 * Strip HTML tags from a string (preserves text content).
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for safe storage and display.
 * Trims whitespace, strips HTML, limits length.
 */
export function sanitizeString(
  input: unknown,
  maxLength: number = 10_000,
): string {
  if (typeof input !== "string") return "";
  return stripHtml(input).trim().slice(0, maxLength);
}

/**
 * Sanitize a title field (short string, no HTML).
 */
export function sanitizeTitle(input: unknown): string {
  return sanitizeString(input, 500);
}

/**
 * Sanitize an email address.
 * Returns empty string if invalid format.
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : "";
}

/**
 * Sanitize an object by recursively sanitizing all string values.
 * Preserves structure, limits depth to prevent circular references.
 */
export function sanitizeObject<T>(
  obj: T,
  maxDepth: number = 10,
): T {
  if (maxDepth <= 0) return obj;
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth - 1)) as unknown as T;
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    }
    return sanitized as T;
  }

  return obj;
}
