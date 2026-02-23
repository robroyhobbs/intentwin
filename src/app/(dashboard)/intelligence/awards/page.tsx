"use client";

import { useState, useMemo } from "react";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useIntelligence } from "../_components/use-intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import type { AwardsSearchResponse, AwardRecord } from "../_components/types";

const PAGE_SIZE = 20;

export default function AwardSearchPage() {
  const [agency, setAgency] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [competitionType, setCompetitionType] = useState("");
  const [offset, setOffset] = useState(0);

  const params = useMemo(() => {
    const p: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String(offset),
    };
    if (agency.trim()) p.agency = agency.trim();
    if (naicsCode.trim()) p.naics_code = naicsCode.trim();
    if (competitionType) p.competition_type = competitionType;
    return p;
  }, [agency, naicsCode, competitionType, offset]);

  const { data, loading, error, configured } = useIntelligence<AwardsSearchResponse>(
    "/api/v1/awards/search",
    params,
  );

  if (loading && offset === 0) {
    return <IntelligenceLoading icon={FileText} label="federal awards" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  const awards = data?.awards ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <FileText className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Award Search</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Search the federal contract awards database
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            Agency
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
            <input
              type="text"
              placeholder="e.g., Department of Defense"
              value={agency}
              onChange={(e) => { setAgency(e.target.value); setOffset(0); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>
        <div className="w-40">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            NAICS Code
          </label>
          <input
            type="text"
            placeholder="e.g., 541512"
            value={naicsCode}
            onChange={(e) => { setNaicsCode(e.target.value); setOffset(0); }}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="w-48">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            Competition
          </label>
          <select
            value={competitionType}
            onChange={(e) => { setCompetitionType(e.target.value); setOffset(0); }}
            className="w-full py-2.5 rounded-xl text-sm"
          >
            <option value="">All Types</option>
            <option value="full_and_open">Full & Open</option>
            <option value="not_competed">Not Competed</option>
            <option value="competed_under_sap">SAP</option>
            <option value="follow_on_to_competed_action">Follow-on</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--foreground-muted)]">
          {total.toLocaleString()} awards found
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-[var(--foreground-muted)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {awards.length > 0 && (
        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide bg-[var(--background-tertiary)]">
            <span className="col-span-3">Title</span>
            <span className="col-span-2">Agency</span>
            <span className="col-span-2">Awardee</span>
            <span className="col-span-1 text-right">Amount</span>
            <span className="col-span-1">NAICS</span>
            <span className="col-span-1">Competition</span>
            <span className="col-span-1">Set-Aside</span>
            <span className="col-span-1 text-right">Date</span>
          </div>
          {awards.map((award) => (
            <AwardRow key={award.id} award={award} />
          ))}
        </div>
      )}

      {awards.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--foreground-muted)]">
            No awards match your filters
          </p>
        </div>
      )}

      {loading && offset > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">Loading...</p>
        </div>
      )}
    </div>
  );
}

function AwardRow({ award }: { award: AwardRecord }) {
  const formatAmount = (v: number | null) => {
    if (v == null) return "-";
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toLocaleString()}`;
  };

  const formatCompetition = (v: string | null) => {
    if (!v) return "-";
    return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-[var(--background-tertiary)] transition-colors">
      <span className="col-span-3 text-[var(--foreground)] truncate" title={award.title ?? ""}>
        {award.title ?? "Untitled"}
      </span>
      <span className="col-span-2 text-[var(--foreground-muted)] truncate" title={award.awarding_agency ?? ""}>
        {award.awarding_agency ?? "-"}
      </span>
      <span className="col-span-2 text-[var(--foreground-muted)] truncate" title={award.awardee_name ?? ""}>
        {award.awardee_name ?? "-"}
      </span>
      <span className="col-span-1 text-right font-mono text-[var(--accent)]">
        {formatAmount(award.award_amount)}
      </span>
      <span className="col-span-1 font-mono text-xs text-[var(--foreground-subtle)]">
        {award.naics_code ?? "-"}
      </span>
      <span className="col-span-1 text-xs text-[var(--foreground-subtle)] truncate">
        {formatCompetition(award.competition_type)}
      </span>
      <span className="col-span-1 text-xs text-[var(--foreground-subtle)] truncate">
        {award.set_aside_type ?? "-"}
      </span>
      <span className="col-span-1 text-right text-[var(--foreground-muted)]">
        {award.award_date ? new Date(award.award_date).toLocaleDateString() : "-"}
      </span>
    </div>
  );
}
