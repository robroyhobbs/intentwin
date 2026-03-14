"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Search, Settings2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import { NaicsCombobox } from "@/components/naics-combobox";
import type { NaicsEntry } from "@/lib/naics/lookup";
import {
  buildOpportunityProposalPrefill,
  type OpportunityMatchFeedbackStatus,
} from "@/lib/intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import { SourceAttribution } from "../_components/source-attribution";
import { OpportunityDetailPanel } from "../opportunities/_components/opportunity-detail-panel";
import { MatchCard } from "./_components/match-card";
import type {
  OpportunityMatch,
  OpportunityMatchesResponse,
  OpportunityRecord,
} from "../_components/types";

interface OpportunityMatchesApiResponse extends OpportunityMatchesResponse {
  profile_summary: {
    productCount: number;
    serviceLineCount: number;
    capabilityCount: number;
    certificationCount: number;
    naicsCount: number;
  };
  feedback_by_opportunity_id: Record<
    string,
    { status: OpportunityMatchFeedbackStatus; updated_at: string }
  >;
}

function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return searchParams.toString();
}

export default function OpportunityMatchesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authFetch = useAuthFetch();

  const initialNaicsCsv = searchParams.get("naics") ?? "";
  const initialNaicsCodes = initialNaicsCsv
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [naicsCsv, setNaicsCsv] = useState(initialNaicsCsv);
  const [selectedNaics, setSelectedNaics] = useState<NaicsEntry[]>(
    initialNaicsCodes.map((code) => ({ code, description: "" })),
  );
  const [data, setData] = useState<OpportunityMatchesApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<OpportunityRecord | null>(null);
  const [feedbackByOpportunityId, setFeedbackByOpportunityId] = useState<
    Record<string, { status: OpportunityMatchFeedbackStatus; updated_at: string }>
  >({});
  const [pendingFeedbackByOpportunityId, setPendingFeedbackByOpportunityId] =
    useState<Record<string, boolean>>({});

  const debouncedKeyword = useDebounce(keyword);
  const debouncedCity = useDebounce(city);
  const debouncedState = useDebounce(state);
  const debouncedNaics = useDebounce(naicsCsv);

  const requestParams = useMemo(
    () => ({
      q: debouncedKeyword.trim(),
      city: debouncedCity.trim(),
      state: debouncedState.trim(),
      naics: debouncedNaics.trim(),
      limit: "12",
    }),
    [debouncedKeyword, debouncedCity, debouncedState, debouncedNaics],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);

      try {
        const query = buildQuery(requestParams);
        const res = await authFetch(`/api/intelligence/matches?${query}`);

        if (cancelled) return;

        if (res.status === 503) {
          setConfigured(false);
          setData(null);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Request failed (${res.status})`);
          setData(null);
          return;
        }

        const result = (await res.json()) as OpportunityMatchesApiResponse;
        setData(result);
        setFeedbackByOpportunityId(result.feedback_by_opportunity_id ?? {});
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, [authFetch, requestParams]);

  function handleStartProposal(opp: OpportunityRecord) {
    sessionStorage.setItem(
      "opportunity-prefill",
      JSON.stringify(buildOpportunityProposalPrefill(opp)),
    );
    router.push("/proposals/create");
  }

  async function updateFeedback(
    opportunity: OpportunityRecord,
    nextStatus: OpportunityMatchFeedbackStatus | null,
  ) {
    const previous = feedbackByOpportunityId[opportunity.id];
    const optimistic =
      nextStatus === null
        ? { ...feedbackByOpportunityId }
        : {
            ...feedbackByOpportunityId,
            [opportunity.id]: {
              status: nextStatus,
              updated_at: new Date().toISOString(),
            },
          };

    if (nextStatus === null) {
      delete optimistic[opportunity.id];
    }

    setFeedbackByOpportunityId(optimistic);
    setPendingFeedbackByOpportunityId((current) => ({
      ...current,
      [opportunity.id]: true,
    }));

    try {
      const res = await authFetch("/api/intelligence/matches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          status: nextStatus,
          opportunity: {
            id: opportunity.id,
            source: opportunity.source,
            title: opportunity.title,
            agency: opportunity.agency,
            portal_url: opportunity.portal_url,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const result = (await res.json()) as {
        feedback: {
          opportunity_id: string;
          status: OpportunityMatchFeedbackStatus;
          updated_at: string;
        } | null;
      };

      setFeedbackByOpportunityId((current) => {
        const next = { ...current };
        if (result.feedback) {
          next[opportunity.id] = {
            status: result.feedback.status,
            updated_at: result.feedback.updated_at,
          };
        } else {
          delete next[opportunity.id];
        }
        return next;
      });

      if (nextStatus === "saved") {
        toast.success("Match saved");
      } else if (nextStatus === "dismissed") {
        toast.success("Match dismissed");
        if (selectedOpportunity?.id === opportunity.id) {
          setSelectedOpportunity(null);
        }
      } else {
        toast.success("Match feedback cleared");
      }
    } catch (err) {
      setFeedbackByOpportunityId((current) => {
        const next = { ...current };
        if (previous) {
          next[opportunity.id] = previous;
        } else {
          delete next[opportunity.id];
        }
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Failed to update match");
    } finally {
      setPendingFeedbackByOpportunityId((current) => ({
        ...current,
        [opportunity.id]: false,
      }));
    }
  }

  function handleSave(opportunity: OpportunityRecord) {
    const existing = feedbackByOpportunityId[opportunity.id];
    void updateFeedback(opportunity, existing?.status === "saved" ? null : "saved");
  }

  function handleDismiss(opportunity: OpportunityRecord) {
    void updateFeedback(opportunity, "dismissed");
  }

  if (loading && !data) {
    return <IntelligenceLoading icon={Sparkles} label="opportunity matches" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  const matches = (data?.matches ?? [])
    .filter((match) => feedbackByOpportunityId[match.opportunity_id]?.status !== "dismissed")
    .sort((a, b) => {
      const aSaved = feedbackByOpportunityId[a.opportunity_id]?.status === "saved";
      const bSaved = feedbackByOpportunityId[b.opportunity_id]?.status === "saved";
      if (aSaved === bSaved) return 0;
      return aSaved ? -1 : 1;
    });
  const profileSummary = data?.profile_summary ?? {
    productCount: 0,
    serviceLineCount: 0,
    capabilityCount: 0,
    certificationCount: 0,
    naicsCount: 0,
  };
  const profileIsThin =
    profileSummary.productCount === 0 &&
    profileSummary.capabilityCount === 0 &&
    profileSummary.certificationCount === 0 &&
    profileSummary.naicsCount === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Sparkles className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Opportunity Matches
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Local opportunities ranked against your products, capabilities, and certifications
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Match profile built from {profileSummary.productCount} products,{" "}
              {profileSummary.capabilityCount} capabilities,{" "}
              {profileSummary.certificationCount} certifications, and{" "}
              {profileSummary.naicsCount} selected NAICS codes.
            </p>
            {profileIsThin && (
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Your L1 profile is still thin. Add products, service lines, and certifications to improve ranking quality.
              </p>
            )}
          </div>
          <Link
            href="/settings/company"
            className="btn-ghost inline-flex items-center gap-2 text-sm"
          >
            <Settings2 className="h-4 w-4" />
            Improve company profile
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            <Search className="mr-1 inline h-3 w-3" />
            Keyword
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
            <input
              type="text"
              placeholder="cloud, cybersecurity, ERP..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        <div className="w-32">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            City
          </label>
          <input
            type="text"
            placeholder="Seattle"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>

        <div className="w-24">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            State
          </label>
          <input
            type="text"
            placeholder="WA"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm uppercase"
            maxLength={2}
          />
        </div>

        <div className="min-w-[280px] flex-[1.4]">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            NAICS Focus
          </label>
          <NaicsCombobox
            selected={selectedNaics}
            onChange={(entries) => {
              setSelectedNaics(entries);
              setNaicsCsv(entries.map((entry) => entry.code).join(","));
            }}
            placeholder="Match against selected NAICS codes"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
          {error}
        </div>
      )}

      {!error && matches.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-subtle)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            No strong matches yet
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
            Try adding a state, city, or NAICS focus. If your profile is still sparse, add products and certifications in company settings before reviewing matches.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/settings/company" className="btn-primary text-sm">
              Add company data
            </Link>
            <Link href="/intelligence/opportunities" className="btn-ghost text-sm">
              Browse all opportunities
            </Link>
          </div>
        </div>
      )}

      {!error && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((match: OpportunityMatch) => (
            <MatchCard
              key={match.opportunity_id}
              match={match}
              feedbackStatus={
                feedbackByOpportunityId[match.opportunity_id]?.status ?? null
              }
              feedbackPending={
                pendingFeedbackByOpportunityId[match.opportunity_id] ?? false
              }
              onViewDetails={() => setSelectedOpportunity(match.opportunity)}
              onStartProposal={() => handleStartProposal(match.opportunity)}
              onSave={() => handleSave(match.opportunity)}
              onDismiss={() => handleDismiss(match.opportunity)}
            />
          ))}
        </div>
      )}

      <SourceAttribution />

      {selectedOpportunity && (
        <OpportunityDetailPanel
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onStartProposal={handleStartProposal}
          onAgencyClick={(agency) =>
            router.push(`/intelligence/agencies?select=${encodeURIComponent(agency)}`)
          }
          onNaicsClick={(code) => router.push(`/intelligence/naics/${code}`)}
          feedbackStatus={feedbackByOpportunityId[selectedOpportunity.id]?.status ?? null}
          feedbackPending={pendingFeedbackByOpportunityId[selectedOpportunity.id] ?? false}
          onSaveMatch={handleSave}
          onDismissMatch={handleDismiss}
        />
      )}
    </div>
  );
}
