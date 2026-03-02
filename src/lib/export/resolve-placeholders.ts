// ── Resolve Placeholders ── Auto-substitute merge fields before export ───────
// Replaces {date}, {client_name}, {signatory_name}, {signatory_title} and
// strips preflight gap markers like [CASE STUDY NEEDED: ...].

export interface PlaceholderValues {
  date: string;
  client_name: string;
  signatory_name: string;
  signatory_title: string;
}

const GAP_MARKER_PATTERNS = [
  /\[CASE STUDY NEEDED:[^\]]*\]/g,
  /\[TEAM MEMBER NEEDED:[^\]]*\]/g,
  /\[PRODUCT NEEDED:[^\]]*\]/g,
  /\$TBD/g,
];

/**
 * Replace all `{placeholder}` merge fields in section content and strip
 * preflight gap markers so the exported document is clean.
 */
export function resolvePlaceholders(
  content: string,
  values: PlaceholderValues,
): string {
  let result = content;

  // Substitute known merge fields
  result = result.replace(/\{date\}/g, values.date);
  result = result.replace(/\{client_name\}/g, values.client_name);
  result = result.replace(/\{signatory_name\}/g, values.signatory_name);

  // If no title, clean up "Name, {signatory_title}" → "Name"
  if (values.signatory_title) {
    result = result.replace(/\{signatory_title\}/g, values.signatory_title);
  } else {
    result = result.replace(/,\s*\{signatory_title\}/g, "");
    result = result.replace(/\{signatory_title\}/g, "");
  }

  // Strip preflight gap markers
  for (const pattern of GAP_MARKER_PATTERNS) {
    result = result.replace(pattern, "");
  }

  // Clean up leftover double-blank-lines from stripped markers
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}
