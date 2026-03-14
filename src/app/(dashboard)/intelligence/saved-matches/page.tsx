"use client";

import { useEffect, useState } from "react";
import { Bookmark, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { IntelligenceLoading } from "../_components/intelligence-loading";
import { NotConfigured } from "../_components/not-configured-view";
import { SavedMatchCard } from "./_components/saved-match-card";

interface SavedMatchResponse {
  saved_matches: Array<{
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
  }>;
}

export default function SavedMatchesPage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [data, setData] = useState<SavedMatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Saved Matches
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Triage saved opportunities and reopen proposals already started from a match
          </p>
        </div>
      </div>

      <div className="card p-5">
        <p className="text-sm text-[var(--foreground-muted)]">
          Saved matches stay here after they drop out of the ranked feed, so your team can review, revisit,
          and continue active opportunities without searching again.
        </p>
      </div>

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
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
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
              onOpenProposal={(proposalId) => router.push(`/proposals/${proposalId}`)}
              onOpenMatches={() => router.push("/intelligence/matches")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
