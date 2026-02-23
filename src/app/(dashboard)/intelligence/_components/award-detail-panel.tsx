"use client";

import { X, ExternalLink, MapPin, Calendar, Hash, Building2, Users, FileText } from "lucide-react";
import type { AwardRecord } from "./types";

interface Props {
  award: AwardRecord;
  onClose: () => void;
  onAgencyClick?: (agency: string) => void;
  onAwardeeClick?: (awardee: string) => void;
  onNaicsClick?: (code: string) => void;
}

export function AwardDetailPanel({ award, onClose, onAgencyClick, onAwardeeClick, onNaicsClick }: Props) {
  const formatAmount = (v: number | null) => {
    if (v == null) return "N/A";
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

  const formatCompetition = (v: string | null) => {
    if (!v) return "N/A";
    return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const usaSpendingUrl = award.source === "usaspending" && award.source_id
    ? `https://www.usaspending.gov/award/${award.source_id}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[var(--background)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--foreground)] leading-tight">
              {award.title ?? "Untitled Award"}
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {formatDate(award.award_date)}
            </p>
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
          {/* Amount banner */}
          <div className="rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] p-4 text-center">
            <p className="text-3xl font-bold text-[var(--accent)]">
              {formatAmount(award.award_amount)}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wide">
              Award Amount
            </p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={Building2}
              label="Agency"
              value={award.awarding_agency}
              onClick={award.awarding_agency && onAgencyClick ? () => onAgencyClick(award.awarding_agency!) : undefined}
            />
            <DetailItem
              icon={Users}
              label="Awardee"
              value={award.awardee_name}
              onClick={award.awardee_name && onAwardeeClick ? () => onAwardeeClick(award.awardee_name!) : undefined}
            />
            <DetailItem
              icon={Hash}
              label="NAICS Code"
              value={award.naics_code}
              onClick={award.naics_code && onNaicsClick ? () => onNaicsClick(award.naics_code!) : undefined}
            />
            <DetailItem icon={FileText} label="PSC Code" value={award.psc_code} />
          </div>

          {/* Description */}
          {award.description && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {award.description}
              </p>
            </div>
          )}

          {/* Contract details */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Contract Details
            </h3>
            <div className="space-y-2">
              <DetailRow label="Contract Type" value={award.contract_type} />
              <DetailRow label="Pricing Type" value={award.pricing_type} />
              <DetailRow label="Competition" value={formatCompetition(award.competition_type)} />
              <DetailRow label="Offers Received" value={award.num_offers_received?.toString()} />
              <DetailRow label="Set-Aside" value={award.set_aside_type} />
              <DetailRow label="Source Selection" value={formatCompetition(award.source_selection_method)} />
              <DetailRow label="Solicitation #" value={award.solicitation_number} />
            </div>
          </div>

          {/* Period of performance */}
          {(award.period_of_performance_start || award.period_of_performance_end) && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                Period of Performance
              </h3>
              <div className="space-y-2">
                <DetailRow label="Start" value={formatDate(award.period_of_performance_start)} />
                <DetailRow label="End" value={formatDate(award.period_of_performance_end)} />
              </div>
            </div>
          )}

          {/* Place of performance */}
          {(award.place_of_performance_city || award.place_of_performance_state) && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
                <MapPin className="h-3.5 w-3.5 inline mr-1" />
                Place of Performance
              </h3>
              <p className="text-sm text-[var(--foreground)]">
                {[award.place_of_performance_city, award.place_of_performance_state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Source link */}
          <div className="border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Data Source
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="badge badge-default">{award.source}</span>
              {usaSpendingUrl && (
                <a
                  href={usaSpendingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 text-sm"
                >
                  View on USAspending.gov
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
    <div className={`rounded-xl border border-[var(--border)] px-3 py-2.5 ${onClick ? "cursor-pointer hover:border-[var(--accent)] transition-colors" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-[var(--foreground-subtle)]" />
        <span className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={`text-sm font-medium truncate ${onClick ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
        {value ?? "N/A"}
      </p>
    </div>
  );

  return onClick ? <button onClick={onClick} className="text-left w-full">{content}</button> : content;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--foreground-muted)]">{label}</span>
      <span className="text-[var(--foreground)] font-medium">{value ?? "N/A"}</span>
    </div>
  );
}
