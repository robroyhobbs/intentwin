"use client";

import { BellRing, Bookmark, Clock3, Sparkles } from "lucide-react";
import type { OpportunityMatchAlertsResponse } from "@/lib/intelligence";

function formatDeadlineLabel(daysUntilDeadline: number | null): string {
  if (daysUntilDeadline == null) return "Deadline not listed";
  if (daysUntilDeadline <= 0) return "Due now";
  if (daysUntilDeadline === 1) return "Due in 1 day";
  return `Due in ${daysUntilDeadline} days`;
}

interface MatchAlertSummaryProps {
  response: OpportunityMatchAlertsResponse;
  onOpenMatches?: () => void;
  onOpenSavedMatches?: () => void;
}

export function MatchAlertSummary({
  response,
  onOpenMatches,
  onOpenSavedMatches,
}: MatchAlertSummaryProps) {
  const { summary } = response;

  if (summary.total_attention_count === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <BellRing className="h-4 w-4 text-[var(--accent)]" />
            Match alerts
          </div>
          <h2 className="mt-2 text-balance text-lg font-semibold text-[var(--foreground)]">
            {summary.total_attention_count} opportunities need attention
          </h2>
          <p className="mt-2 text-pretty text-sm text-[var(--foreground-muted)]">
            {summary.new_high_signal_count > 0
              ? `${summary.new_high_signal_count} new high-signal matches scored ${summary.high_signal_threshold}+ against your profile. `
              : ""}
            {summary.urgent_saved_count > 0
              ? `${summary.urgent_saved_count} saved matches are due within ${summary.urgent_deadline_days} days.`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {summary.new_high_signal_count > 0 && onOpenMatches && (
            <button
              onClick={onOpenMatches}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Review matches
            </button>
          )}
          {summary.urgent_saved_count > 0 && onOpenSavedMatches && (
            <button
              onClick={onOpenSavedMatches}
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              <Bookmark className="h-4 w-4" />
              Open saved matches
            </button>
          )}
        </div>
      </div>

      {response.urgent_saved_matches.length > 0 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {response.urgent_saved_matches.slice(0, 4).map((item) => (
            <div
              key={item.opportunity_id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-subtle)]">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDeadlineLabel(item.days_until_deadline)}
              </div>
              <div className="mt-2 text-balance text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </div>
              <div className="mt-1 text-pretty text-sm text-[var(--foreground-muted)]">
                {item.agency || "Agency not listed"}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
