"use client";

import { useState, useMemo } from "react";
import { Building2, Search, ChevronRight } from "lucide-react";
import { useIntelligence } from "../_components/use-intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import type { AgencyListResponse, AgencyListItem } from "../_components/types";
import { AgencyDetail } from "./_components/agency-detail";

export default function AgencyExplorerPage() {
  const [search, setSearch] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = { limit: "100" };
    if (search.trim()) p.search = search.trim();
    return p;
  }, [search]);

  const { data, loading, configured } = useIntelligence<AgencyListResponse>(
    "/api/v1/agency",
    params,
  );

  if (loading) {
    return <IntelligenceLoading icon={Building2} label="agency profiles" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  if (selectedAgency) {
    return (
      <AgencyDetail
        agencyName={selectedAgency}
        onBack={() => setSelectedAgency(null)}
      />
    );
  }

  const agencies = data?.agencies ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Building2 className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Agency Explorer</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Browse federal agency procurement profiles
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
        <input
          type="text"
          placeholder="Search agencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
        />
      </div>

      {/* Results */}
      {agencies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--foreground-muted)]">
            {search ? "No agencies match your search" : "No agency profiles available"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--foreground-muted)]">
            {data?.total ?? agencies.length} agencies
          </p>
          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            {agencies.map((agency) => (
              <AgencyRow
                key={agency.agency_name}
                agency={agency}
                onClick={() => setSelectedAgency(agency.agency_name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgencyRow({ agency, onClick }: { agency: AgencyListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--background-tertiary)] group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {agency.agency_name}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-[var(--foreground-muted)]">
            {agency.total_awards_tracked.toLocaleString()} awards
          </span>
          {agency.avg_award_amount && (
            <span className="text-xs text-[var(--foreground-subtle)]">
              Avg ${(agency.avg_award_amount / 1_000_000).toFixed(1)}M
            </span>
          )}
          {agency.preferred_eval_method && (
            <span className="badge badge-accent text-[10px]">
              {agency.preferred_eval_method}
            </span>
          )}
          {agency.avg_num_offers && (
            <span className="text-xs text-[var(--foreground-subtle)]">
              ~{agency.avg_num_offers.toFixed(1)} offers
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--foreground-subtle)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
    </button>
  );
}
