"use client";

import { useCallback, useMemo } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { SectionCard } from "../shared/section-card";
import { regenerateSection } from "./draft-helpers";
import { cn } from "@/lib/utils/cn";

// ── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
        Complete
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Failed
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Generating
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Pending
    </span>
  );
}

// ── Compact section row ─────────────────────────────────────────────────────

interface SectionRowProps {
  section: { id: string; title: string; generationStatus: string };
  index: number;
}

function CompactSectionRow({ section, index }: SectionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        index > 0 ? "border-t border-border/60" : "",
        section.generationStatus === "generating"
          ? "bg-primary/5"
          : "bg-transparent",
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-md bg-background/60 text-xs text-muted-foreground tabular-nums shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 truncate text-sm font-medium">
        {section.title}
      </span>
      <StatusPill status={section.generationStatus} />
    </div>
  );
}

// ── Section list ────────────────────────────────────────────────────────────

export function DraftSectionList({ compact }: { compact: boolean }) {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const sorted = useMemo(
    () => [...state.sections].sort((a, b) => a.order - b.order),
    [state.sections],
  );

  const handleMarkReviewed = useCallback(
    (sectionId: string) => {
      dispatch({ type: "MARK_SECTION_REVIEWED", sectionId });
    },
    [dispatch],
  );

  const handleRegenerate = useCallback(
    (sectionId: string) => {
      if (!state.proposalId) return;
      void regenerateSection(
        state.proposalId,
        sectionId,
        dispatch,
        authFetch,
        state.sections,
      );
    },
    [state.proposalId, dispatch, authFetch, state.sections],
  );

  if (sorted.length === 0) return null;

  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/70 bg-background/40 px-4 py-2 text-[11px] uppercase text-muted-foreground">
          <span>Section</span>
          <span>Status</span>
        </div>
        {sorted.map((section, idx) => (
          <CompactSectionRow key={section.id} section={section} index={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          onMarkReviewed={handleMarkReviewed}
          onRegenerate={state.proposalId ? handleRegenerate : undefined}
          defaultExpanded={false}
        />
      ))}
    </div>
  );
}
