/**
 * Differentiator Extraction
 *
 * Extracts key differentiator claims from the Executive Summary to pass
 * to subsequent sections via the repetition limiter. This prevents every
 * section from re-stating the same top-level claims.
 *
 * Differentiators are ephemeral pipeline state — never stored in DB.
 */

/**
 * Extract differentiator claims from generated executive summary content.
 * Looks for bold-prefixed bullet points which typically contain the key claims.
 *
 * Returns up to 10 differentiator strings.
 */
export function extractDifferentiators(content: string | null | undefined): string[] {
  if (!content) return [];

  // Match bullet points with bold lead-ins: "- **Label**: description"
  // This is the format our editorial standards enforce
  const bulletRegex = /^[\s]*[-*]\s+\*\*[^*]+\*\*[:\s].*$/gm;
  const matches = content.match(bulletRegex);

  if (!matches || matches.length === 0) return [];

  return matches
    .slice(0, 10)
    .map((m) => m.replace(/^[\s]*[-*]\s+/, "").trim());
}
