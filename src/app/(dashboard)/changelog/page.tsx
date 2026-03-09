"use client";

import { useEffect } from "react";
import changelogData from "@/data/changelog.json";
import {
  isValidEntry,
  sortEntries,
  type ChangelogEntry,
} from "@/lib/changelog/types";
import { markChangelogViewed } from "@/hooks/use-changelog-badge";

const CATEGORY_CONFIG = {
  new: { label: "New", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  improved: { label: "Improved", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  fixed: { label: "Fixed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
} as const;

type Category = keyof typeof CATEGORY_CONFIG;

function EntryCard({ entry }: { entry: ChangelogEntry }) {
  const categories: Category[] = ["new", "improved", "fixed"];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full">
          v{entry.version}
        </span>
        <h2 className="text-lg font-semibold">{entry.title}</h2>
        <span className="text-xs text-[var(--foreground-muted)] ml-auto">
          {entry.date}
        </span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const items = entry.items[cat];
          if (!items?.length) return null;
          const config = CATEGORY_CONFIG[cat];

          return (
            <div key={cat}>
              <span
                className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${config.bg} ${config.color} mb-1.5`}
              >
                {config.label}
              </span>
              <ul className="space-y-1 ml-1">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--foreground-muted)] flex items-start gap-2"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${config.bg}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  const validEntries = (changelogData as unknown[])
    .filter(isValidEntry) as ChangelogEntry[];
  const sorted = sortEntries(validEntries);

  useEffect(() => {
    markChangelogViewed();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">What&apos;s New</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Recent updates and improvements to IntentBid
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          No updates yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((entry) => (
            <EntryCard key={entry.version} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
