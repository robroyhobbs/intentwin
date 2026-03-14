"use client";

import { useEffect, useState } from "react";
import { Bookmark, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useMatchAlerts } from "@/hooks/use-match-alerts";
import type { OpportunityMatchFeedbackStatus } from "@/lib/intelligence";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { MatchAlertSummary } from "../_components/match-alert-summary";
import { NotConfigured } from "../_components/not-configured-view";
import { SavedMatchCard } from "./_components/saved-match-card";

interface SavedMatchItem {
  opportunity_id: string;
  source: string;
  title: string;
  agency: string | null;
  portal_url: string | null;
  status: "saved" | "reviewing" | "proposal_started";
  updated_at: string;
  proposal_id: string | null;
  proposal: {
    id: string;
    title: string;
    status: string;
    updated_at: string;
  } | null;
}

interface SavedMatchResponse {
  saved_matches: SavedMatchItem[];
}

export default function SavedMatchesPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { response: matchAlerts } = useMatchAlerts();
  const [data, setData] = useState<SavedMatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [pendingByOpportunityId, setPendingByOpportunityId] = useState<
    Record<string, boolean>
  >({});
  const [actionErrorByOpportunityId, setActionErrorByOpportunityId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadSavedMatches() {
      setLoading(true);
      setError(null);

      try {
        const res = await authFetch("/api/intelligence/matches/saved");

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

        setData((await res.json()) as SavedMatchResponse);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSavedMatches();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  async function updateSavedMatch(
    item: SavedMatchItem,
    nextStatus: OpportunityMatchFeedbackStatus,
  ) {
    const previousData = data;

    setActionErrorByOpportunityId((current) => ({
      ...current,
      [item.opportunity_id]: "",
    }));
    setPendingByOpportunityId((current) => ({
      ...current,
      [item.opportunity_id]: true,
    }));

    setData((current) => {
      if (!current) return current;

      if (nextStatus === "dismissed") {
        return {
          saved_matches: current.saved_matches.filter(
            (savedItem) => savedItem.opportunity_id !== item.opportunity_id,
          ),
        };
      }

      return {
        saved_matches: current.saved_matches.map((savedItem) =>
          savedItem.opportunity_id === item.opportunity_id
            ? {
                ...savedItem,
                status: nextStatus as SavedMatchItem["status"],
                updated_at: new Date().toISOString(),
              }
            : savedItem,
        ),
      };
    });

    try {
      const res = await authFetch("/api/intelligence/matches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opportunity_id: item.opportunity_id,
          status: nextStatus,
          opportunity: {
            id: item.opportunity_id,
            source: item.source,
            title: item.title,
            agency: item.agency,
            portal_url: item.portal_url,
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

      setData((current) => {
        if (!current) return current;
        const feedback = result.feedback;
        if (!feedback || feedback.status === "dismissed") {
          return {
            saved_matches: current.saved_matches.filter(
              (savedItem) => savedItem.opportunity_id !== item.opportunity_id,
            ),
          };
        }

        return {
          saved_matches: current.saved_matches.map((savedItem) =>
            savedItem.opportunity_id === item.opportunity_id
              ? {
                  ...savedItem,
                  status: feedback.status as SavedMatchItem["status"],
                  updated_at: feedback.updated_at,
                }
              : savedItem,
          ),
        };
      });
    } catch (err) {
      setData(previousData);
      setActionErrorByOpportunityId((current) => ({
        ...current,
        [item.opportunity_id]:
          err instanceof Error ? err.message : "Failed to update saved match",
      }));
    } finally {
      setPendingByOpportunityId((current) => ({
        ...current,
        [item.opportunity_id]: false,
      }));
    }
  }

  if (loading && !data) {
    return <IntelligenceLoading icon={Bookmark} label="saved matches" />;
  }

  if (!configured) {
    return <NotConfigured />;
  }

  const savedMatches = data?.saved_matches ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Bookmark className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-balance text-2xl font-bold text-[var(--foreground)]">
            Saved Matches
          </h1>
          <p className="mt-0.5 text-pretty text-sm text-[var(--foreground-muted)]">
            Triage saved opportunities and reopen proposals already started from a match
          </p>
        </div>
      </div>

      <div className="card p-5">
        <p className="text-pretty text-sm text-[var(--foreground-muted)]">
          Saved matches stay here after they drop out of the ranked feed, so your team can review, revisit,
          and continue active opportunities without searching again.
        </p>
      </div>

      {matchAlerts && matchAlerts.summary.urgent_saved_count > 0 && (
        <MatchAlertSummary
          response={matchAlerts}
          onOpenMatches={() => router.push("/intelligence/matches")}
        />
      )}

      {error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--foreground-muted)]">
          {error}
        </div>
      )}

      {!error && savedMatches.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-subtle)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            No saved matches yet
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm text-[var(--foreground-muted)]">
            Save strong opportunities from the matches feed to keep a working shortlist here.
          </p>
          <button
            onClick={() => router.push("/intelligence/matches")}
            className="btn-primary mt-4 text-sm"
          >
            Browse opportunity matches
          </button>
        </div>
      )}

      {!error && savedMatches.length > 0 && (
        <div className="space-y-4">
          {savedMatches.map((item) => (
            <SavedMatchCard
              key={item.opportunity_id}
              item={item}
              pending={pendingByOpportunityId[item.opportunity_id] ?? false}
              error={actionErrorByOpportunityId[item.opportunity_id] ?? null}
              onOpenProposal={(proposalId) => router.push(`/proposals/${proposalId}`)}
              onOpenMatches={() => router.push("/intelligence/matches")}
              onMarkReviewing={() => void updateSavedMatch(item, "reviewing")}
              onDismiss={() => void updateSavedMatch(item, "dismissed")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
