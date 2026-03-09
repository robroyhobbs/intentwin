/**
 * NAICS Code Lookup — Static data for searchable multi-select.
 *
 * Uses bundled naics-2022.json (~160 common gov contracting codes).
 * All operations are pure functions against the static dataset.
 */

import naicsData from "@/data/naics-2022.json";

export interface NaicsEntry {
  code: string;
  description: string;
}

const ALL_ENTRIES: NaicsEntry[] = naicsData as NaicsEntry[];

// Pre-build lookup map for O(1) validation
const CODE_MAP = new Map<string, NaicsEntry>(
  ALL_ENTRIES.map((e) => [e.code, e]),
);

/** Search NAICS codes by code number or description keyword */
export function searchNaics(query: string, limit = 20): NaicsEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return top-level categories (2-digit prefixes, deduped)
    const seen = new Set<string>();
    const results: NaicsEntry[] = [];
    for (const entry of ALL_ENTRIES) {
      const prefix = entry.code.slice(0, 2);
      if (!seen.has(prefix)) {
        seen.add(prefix);
        results.push(entry);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  const results: NaicsEntry[] = [];
  for (const entry of ALL_ENTRIES) {
    if (
      entry.code.startsWith(q) ||
      entry.code.includes(q) ||
      entry.description.toLowerCase().includes(q)
    ) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Validate a NAICS code exists in our dataset */
export function isValidNaicsCode(code: string): boolean {
  return CODE_MAP.has(code.trim());
}

/** Get entry for a specific code */
export function getNaicsEntry(code: string): NaicsEntry | undefined {
  return CODE_MAP.get(code.trim());
}

/** Parse comma-separated codes and return valid ones */
export function parseNaicsCodes(input: string): {
  valid: NaicsEntry[];
  invalid: string[];
} {
  const parts = input
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const valid: NaicsEntry[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    // Only accept numeric codes
    if (!/^\d+$/.test(part)) {
      invalid.push(part);
      continue;
    }
    const entry = CODE_MAP.get(part);
    if (entry) {
      valid.push(entry);
    } else {
      invalid.push(part);
    }
  }

  return { valid, invalid };
}

/** Extract NAICS codes mentioned in text (e.g., RFP content) */
export function extractNaicsFromText(text: string): NaicsEntry[] {
  // Match 6-digit numeric codes that exist in our dataset
  const codePattern = /\b(\d{6})\b/g;
  const found = new Set<string>();
  const results: NaicsEntry[] = [];

  let match;
  while ((match = codePattern.exec(text)) !== null) {
    const code = match[1];
    if (!found.has(code)) {
      found.add(code);
      const entry = CODE_MAP.get(code);
      if (entry) {
        results.push(entry);
      }
    }
  }

  return results;
}
