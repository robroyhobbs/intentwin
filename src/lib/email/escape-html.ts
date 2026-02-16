/**
 * Escape HTML special characters to prevent XSS.
 * Handles the OWASP-recommended set: & < > " ' /
 *
 * Canonical implementation — import this everywhere instead of
 * duplicating inline escapeHtml functions.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
