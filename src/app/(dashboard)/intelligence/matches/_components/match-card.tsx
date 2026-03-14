"use client";

import {
  ArrowRight,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  CircleAlert,
  EyeOff,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { OpportunityMatchFeedbackStatus } from "@/lib/intelligence/types";
import type { OpportunityMatch } from "../../_components/types";

interface MatchCardProps {
  match: OpportunityMatch;
  feedbackStatus: OpportunityMatchFeedbackStatus | null;
  feedbackPending: boolean;
  onViewDetails: () => void;
  onStartProposal: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

function formatDeadline(value: string | null): string {
  if (!value) return "Deadline not listed";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(value: number | null): string {
  if (value == null) return "Value not disclosed";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const CONFIDENCE_STYLES = {
  high: "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "border-zinc-500/20 bg-zinc-500/10 text-zinc-500",
} as const;

export function MatchCard({
  match,
  feedbackStatus,
  feedbackPending,
  onViewDetails,
  onStartProposal,
  onSave,
  onDismiss,
}: MatchCardProps) {
  const opportunity = match.opportunity;
  const saveLabel = feedbackPending
    ? "Saving..."
    : feedbackStatus === "saved"
      ? "Saved"
      : "Save match";

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--accent-muted)] bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
              Match {match.score}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${CONFIDENCE_STYLES[match.confidence]}`}
            >
              {match.confidence} confidence
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background-tertiary)] px-2.5 py-1 text-xs text-[var(--foreground-muted)]">
              <Sparkles className="h-3.5 w-3.5" />
              {opportunity.source}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {opportunity.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--foreground-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {opportunity.agency}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[opportunity.city, opportunity.state].filter(Boolean).join(", ") || "Location not listed"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDeadline(opportunity.response_deadline)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[var(--foreground-muted)]">
              {formatValue(opportunity.estimated_value)}
            </span>
            {opportunity.naics_code && (
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[var(--accent)]">
                NAICS {opportunity.naics_code}
              </span>
            )}
            {opportunity.set_aside_type && (
              <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[var(--foreground-muted)]">
                {opportunity.set_aside_type}
              </span>
            )}
          </div>
        </div>

        <div className="grid min-w-[200px] grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-tertiary)] p-3 text-center text-xs">
          <Metric label="NAICS" value={match.breakdown.naics} />
          <Metric label="Fit" value={match.breakdown.capabilities} />
          <Metric label="Geo" value={match.breakdown.geography} />
          <Metric label="Certs" value={match.breakdown.certifications} />
          <Metric label="Set-Aside" value={match.breakdown.set_aside} />
          <Metric label="Time" value={match.breakdown.deadline} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Why this fits
          </div>
          {match.reasons.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
              {match.reasons.slice(0, 3).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">
              No strong fit signals were found yet.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <CircleAlert className="h-4 w-4 text-amber-500" />
            Risks to review
          </div>
          {match.risks.length > 0 ? (
            <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
              {match.risks.slice(0, 3).map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">
              No major match risks surfaced in the first pass.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onSave}
          disabled={feedbackPending}
          className="btn-ghost inline-flex items-center gap-2 text-sm"
        >
          <Bookmark className="h-4 w-4" />
          {saveLabel}
        </button>
        <button
          onClick={onDismiss}
          disabled={feedbackPending}
          className="btn-ghost inline-flex items-center gap-2 text-sm"
        >
          <EyeOff className="h-4 w-4" />
          Dismiss
        </button>
        <button onClick={onViewDetails} className="btn-ghost text-sm">
          View details
        </button>
        <button
          onClick={onStartProposal}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          Start proposal
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] px-2 py-3">
      <div className="text-base font-semibold text-[var(--foreground)]">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--foreground-subtle)]">
        {label}
      </div>
    </div>
  );
}
