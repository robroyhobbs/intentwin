"use client";

import { useState, useMemo } from "react";
import { Briefcase, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useIntelligence } from "../_components/use-intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import { SourceAttribution } from "../_components/source-attribution";
import { OpportunityDetailPanel } from "./_components/opportunity-detail-panel";
import { OpportunityRow } from "./_components/opportunity-row";
import type { OpportunitySearchResponse, OpportunityRecord } from "../_components/types";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "awarded", label: "Awarded" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OpportunitySearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [agency, setAgency] = useState(searchParams.get("agency") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [naicsCode, setNaicsCode] = useState(searchParams.get("naics") ?? "");
  const [offset, setOffset] = useState(0);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityRecord | null>(null);

  // Debounce text inputs so we don't fire a request on every keystroke
  const debouncedKeyword = useDebounce(keyword);
  const debouncedAgency = useDebounce(agency);
  const debouncedCity = useDebounce(city);
  const debouncedState = useDebounce(state);
  const debouncedNaics = useDebounce(naicsCode);

  // Derive a filter key — when it changes, offset resets to 0
  const filterKey = `${debouncedKeyword}|${debouncedAgency}|${debouncedCity}|${debouncedState}|${status}|${debouncedNaics}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    if (offset !== 0) setOffset(0);
  }

  const params = useMemo(() => {
    const p: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String(offset),
    };
    if (debouncedKeyword.trim()) p.q = debouncedKeyword.trim();
    if (debouncedAgency.trim()) p.agency = debouncedAgency.trim();
    if (debouncedCity.trim()) p.city = debouncedCity.trim();
    if (debouncedState.trim()) p.state = debouncedState.trim();
    if (status) p.status = status;
    if (debouncedNaics.trim()) p.naics_code = debouncedNaics.trim();
    return p;
  }, [debouncedKeyword, debouncedAgency, debouncedCity, debouncedState, status, debouncedNaics, offset]);

  const { data, loading, error, configured } = useIntelligence<OpportunitySearchResponse>(
    "/api/v1/opportunities/search",
    params,
  );

  function handleStartProposal(opp: OpportunityRecord) {
    sessionStorage.setItem(
      "opportunity-prefill",
      JSON.stringify({
        client_name: opp.agency,
        scope_description: opp.description ?? opp.title,
        solicitation_type: "RFP",
        timeline_expectation: opp.response_deadline ?? "",
        opportunity_source: {
          id: opp.id,
          title: opp.title,
          portal_url: opp.portal_url,
        },
      }),
    );
    router.push("/proposals/new");
  }

  if (loading && offset === 0) {
    return <IntelligenceLoading icon={Briefcase} label="opportunities" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  const opportunities = data?.opportunities ?? [];
  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Briefcase className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Opportunity Search
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Browse open solicitations from city procurement portals
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <Briefcase className="h-10 w-10 text-[var(--foreground-subtle)] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
            Opportunity Search Coming Soon
          </h3>
          <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto">
            Live opportunity search across government procurement portals is under development.
            In the meantime, use the <span className="font-medium text-[var(--accent)]">Awards</span> and <span className="font-medium text-[var(--accent)]">Agencies</span> tabs to research past performance data.
          </p>
        </div>
      )}

      {!error && <>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            <Search className="h-3 w-3 inline mr-1" />
            Keyword
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
            <input
              type="text"
              placeholder="Search titles and descriptions..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            Agency
          </label>
          <input
            type="text"
            placeholder="e.g., Department of..."
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            City
          </label>
          <input
            type="text"
            placeholder="e.g., NYC"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="w-24">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            State
          </label>
          <input
            type="text"
            placeholder="e.g., NY"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="w-36">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-2.5 rounded-xl text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide block mb-1.5">
            NAICS
          </label>
          <input
            type="text"
            placeholder="e.g., 541512"
            value={naicsCode}
            onChange={(e) => setNaicsCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Results count + pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--foreground-muted)]">
          {total.toLocaleString()} opportunities found
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
      {opportunities.length > 0 && (
        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide bg-[var(--background-tertiary)]">
            <span className="col-span-3">Title</span>
            <span className="col-span-2">Agency</span>
            <span className="col-span-1">City</span>
            <span className="col-span-1">State</span>
            <span className="col-span-1 text-right">Est. Value</span>
            <span className="col-span-1">NAICS</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Deadline</span>
          </div>
          {opportunities.map((opp) => (
            <OpportunityRow
              key={opp.id}
              opportunity={opp}
              onClick={() => setSelectedOpportunity(opp)}
            />
          ))}
        </div>
      )}

      {opportunities.length === 0 && !loading && (
        <div className="text-center py-12">
          <Filter className="h-8 w-8 text-[var(--foreground-subtle)] mx-auto mb-3" />
          <p className="text-sm text-[var(--foreground-muted)]">
            No opportunities match your filters
          </p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-1">
            Try adjusting your search criteria or clearing filters
          </p>
        </div>
      )}

      {loading && offset > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-[var(--foreground-muted)] animate-pulse">Loading...</p>
        </div>
      )}

      <SourceAttribution />

      {/* Detail slide-out */}
      {selectedOpportunity && (
        <OpportunityDetailPanel
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onStartProposal={handleStartProposal}
          onAgencyClick={(name) => {
            setSelectedOpportunity(null);
            setAgency(name);
            setOffset(0);
          }}
          onNaicsClick={(code) => {
            setSelectedOpportunity(null);
            router.push(`/intelligence/naics/${code}`);
          }}
        />
      )}
      </>}
    </div>
  );
}
