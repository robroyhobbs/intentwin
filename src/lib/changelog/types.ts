export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: {
    new?: string[];
    improved?: string[];
    fixed?: string[];
  };
}

/** Validate a changelog entry has required fields */
export function isValidEntry(obj: unknown): obj is ChangelogEntry {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.version === "string" &&
    typeof o.date === "string" &&
    typeof o.title === "string" &&
    o.version.length > 0 &&
    o.date.length > 0 &&
    o.title.length > 0
  );
}

/** Get entries sorted by date descending (most recent first) */
export function sortEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

/** Check if user has unseen changelog entries */
export function hasUnseenEntries(
  entries: ChangelogEntry[],
  lastViewedDate: string | null,
): boolean {
  if (!lastViewedDate || entries.length === 0) return entries.length > 0;
  const sorted = sortEntries(entries);
  return sorted[0].date > lastViewedDate;
}
