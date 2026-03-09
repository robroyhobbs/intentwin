"use client";

import { useState, useEffect } from "react";
import changelogData from "@/data/changelog.json";
import { isValidEntry, hasUnseenEntries, type ChangelogEntry } from "@/lib/changelog/types";

const validEntries = (changelogData as unknown[]).filter(isValidEntry) as ChangelogEntry[];

/**
 * Hook that checks if the user has unseen changelog entries.
 * Returns `true` while loading or if there are unseen entries.
 */
export function useChangelogBadge(): boolean {
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (validEntries.length === 0) return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/user/changelog-viewed");
        if (!res.ok || cancelled) return;
        const { last_viewed_changelog } = await res.json();
        if (!cancelled) {
          setShowBadge(hasUnseenEntries(validEntries, last_viewed_changelog));
        }
      } catch {
        // Silently fail — badge just won't show
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return showBadge;
}

/** Mark changelog as viewed. Call when user visits the changelog page. */
export async function markChangelogViewed(): Promise<void> {
  try {
    await fetch("/api/user/changelog-viewed", { method: "PATCH" });
  } catch {
    // Best-effort — non-critical
  }
}
