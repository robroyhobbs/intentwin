"use client";

import {
  Bookmark,
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Hash,
  Building2,
  Phone,
  Mail,
  User,
  Briefcase,
  EyeOff,
} from "lucide-react";
import type { OpportunityMatchFeedbackStatus } from "@/lib/intelligence/types";
import type { OpportunityRecord } from "../../_components/types";

interface Props {
  opportunity: OpportunityRecord;
  onClose: () => void;
  onStartProposal: (opp: OpportunityRecord) => void;
  onAgencyClick?: (agency: string) => void;
  onNaicsClick?: (code: string) => void;
  feedbackStatus?: OpportunityMatchFeedbackStatus | null;
  feedbackPending?: boolean;
  onSaveMatch?: (opp: OpportunityRecord) => void;
  onDismissMatch?: (opp: OpportunityRecord) => void;
}

export function OpportunityDetailPanel({
  opportunity,
  onClose,
  onStartProposal,
  onAgencyClick,
  onNaicsClick,
  feedbackStatus = null,
  feedbackPending = false,
  onSaveMatch,
  onDismissMatch,
}: Props) {
  const formatValue = (v: number | null) => {
    if (v == null) return "Not disclosed";
    return `$${v.toLocaleString()}`;
  };

  const formatDate = (v: string | null) => {
    if (!v) return "N/A";
    return new Date(v).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const deadlinePassed =
    opportunity.response_deadline &&
    new Date(opportunity.response_deadline) < new Date();

  const statusColor: Record<string, string> = {
    open: "bg-green-500/10 text-green-500 border-green-500/20",
    closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    awarded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[var(--background)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColor[opportunity.status] ?? ""}`}
              >
                {opportunity.status}
              </span>
              <span className="text-xs text-[var(--foreground-subtle)]">
                {opportunity.source}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] leading-tight">
              {opportunity.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Start Proposal CTA */}
          <div className="grid gap-3">
            {opportunity.status === "open" && !deadlinePassed && (
              <button
                onClick={() => onStartProposal(opportunity)}
                className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Start Proposal
              </button>
            )}
            {(onSaveMatch || onDismissMatch) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {onSaveMatch && (
                  <button
                    onClick={() => onSaveMatch(opportunity)}
                    disabled={feedbackPending}
                    className="btn-ghost inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Bookmark className="h-4 w-4" />
                    {feedbackPending
                      ? "Saving..."
                      : feedbackStatus === "saved"
                        ? "Saved"
                        : "Save match"}
                  </button>
                )}
                {onDismissMatch && (
                  <button
                    onClick={() => onDismissMatch(opportunity)}
                    disabled={feedbackPending}
                    className="btn-ghost inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <EyeOff className="h-4 w-4" />
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Estimated value banner */}
          <div className="rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] p-4 text-center">
            <p className="text-3xl font-bold text-[var(--accent)]">
              {formatValue(opportunity.estimated_value)}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wide">
              Estimated Value
            </p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={Building2}
              label="Agency"
              value={opportunity.agency}
              onClick={
                onAgencyClick
                  ? () => onAgencyClick(opportunity.agency)
                  : undefined
              }
            />
            <DetailItem
              icon={MapPin}
              label="Location"
              value={
                [opportunity.city, opportunity.state]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            <DetailItem
              icon={Hash}
              label="NAICS Code"
              value={opportunity.naics_code}
              onClick={
                opportunity.naics_code && onNaicsClick
                  ? () => onNaicsClick(opportunity.naics_code!)
                  : undefined
              }
            />
            <DetailItem
              icon={Calendar}
              label="Deadline"
              value={formatDate(opportunity.response_deadline)}
            />
          </div>

          {/* Description */}
          {opportunity.description && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                {opportunity.description.length > 1000
                  ? `${opportunity.description.slice(0, 1000)}...`
                  : opportunity.description}
              </p>
            </div>
          )}

          {/* Dates */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Key Dates
            </h3>
            <div className="space-y-2">
              <DetailRow
                label="Posted"
                value={formatDate(opportunity.posted_date)}
              />
              <DetailRow
                label="Response Deadline"
                value={formatDate(opportunity.response_deadline)}
              />
            </div>
          </div>

          {/* Contact info */}
          {(opportunity.contact_name ||
            opportunity.contact_email ||
            opportunity.contact_phone) && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
                Contact
              </h3>
              <div className="space-y-2">
                {opportunity.contact_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
                    <span className="text-[var(--foreground)]">
                      {opportunity.contact_name}
                    </span>
                  </div>
                )}
                {opportunity.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
                    <a
                      href={`mailto:${opportunity.contact_email}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {opportunity.contact_email}
                    </a>
                  </div>
                )}
                {opportunity.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
                    <span className="text-[var(--foreground)]">
                      {opportunity.contact_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional details */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Additional Details
            </h3>
            <div className="space-y-2">
              <DetailRow label="Set-Aside" value={opportunity.set_aside_type} />
              <DetailRow
                label="Category"
                value={opportunity.native_category_name}
              />
              <DetailRow label="Jurisdiction" value={opportunity.jurisdiction} />
              <DetailRow label="Agency Level" value={opportunity.agency_level} />
            </div>
          </div>

          {/* Portal link */}
          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Data Source
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="badge badge-default">{opportunity.source}</span>
              {opportunity.portal_url && (
                <a
                  href={opportunity.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 text-sm"
                >
                  View on Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Building2;
  label: string;
  value: string | null;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={`rounded-xl border border-[var(--border)] px-3 py-2.5 ${onClick ? "cursor-pointer hover:border-[var(--accent)] transition-colors" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-[var(--foreground-subtle)]" />
        <span className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-medium truncate ${onClick ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
      >
        {value ?? "N/A"}
      </p>
    </div>
  );

  return onClick ? (
    <button onClick={onClick} className="text-left w-full">
      {content}
    </button>
  ) : (
    content
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--foreground-muted)]">{label}</span>
      <span className="text-[var(--foreground)] font-medium">
        {value ?? "N/A"}
      </span>
    </div>
  );
}
