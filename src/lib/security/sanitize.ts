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

