"use client";

import { ArrowRight, Bookmark, Clock3, ExternalLink, FileText } from "lucide-react";

type SavedMatchStatus = "saved" | "reviewing" | "proposal_started";

interface Props {
  item: {
    opportunity_id: string;
    title: string;
    agency: string | null;
    source: string;
    portal_url: string | null;
    status: SavedMatchStatus;
    updated_at: string;
    proposal: {
      id: string;
      title: string;
      status: string;
      updated_at: string;
    } | null;
  };
  onOpenProposal: (proposalId: string) => void;
  onOpenMatches: () => void;
}

const STATUS_LABELS: Record<SavedMatchStatus, string> = {
  saved: "Saved",
  reviewing: "Reviewing",
  proposal_started: "Proposal started",
};

export function SavedMatchCard({
  item,
  onOpenProposal,
  onOpenMatches,
}: Props) {
  const updatedLabel = new Date(item.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-muted)] bg-[var(--accent-subtle)] px-2.5 py-1 font-semibold text-[var(--accent)]">
              <Bookmark className="h-3.5 w-3.5" />
              {STATUS_LABELS[item.status]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background-tertiary)] px-2.5 py-1 text-[var(--foreground-muted)]">
              {item.source}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background-tertiary)] px-2.5 py-1 text-[var(--foreground-muted)]">
              <Clock3 className="h-3.5 w-3.5" />
              Updated {updatedLabel}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {item.agency || "Agency not listed"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {item.proposal ? (
            <button
              onClick={() => onOpenProposal(item.proposal!.id)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <FileText className="h-4 w-4" />
              Open proposal
            </button>
          ) : (
            <button
              onClick={onOpenMatches}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Continue review
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {item.portal_url && (
            <a
              href={item.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              View source
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {item.proposal && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
            Linked proposal
          </div>
          <div className="mt-2 text-sm text-[var(--foreground)]">{item.proposal.title}</div>
          <div className="mt-1 text-sm text-[var(--foreground-muted)] capitalize">
            {item.proposal.status.replaceAll("_", " ")}
          </div>
        </div>
      )}
    </div>
  );
}
