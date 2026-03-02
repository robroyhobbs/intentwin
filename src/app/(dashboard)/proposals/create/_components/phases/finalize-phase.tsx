"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { Blocker, CreateFlowState } from "../create-types";
import { BlockerItem } from "../shared/blocker-item";
import { ConfidencePill } from "../shared/confidence-pill";
import { ExportButtons } from "./finalize-export";
import { logger } from "@/lib/utils/logger";

// ── Blocker computation ─────────────────────────────────────────────────────

function computeBlockers(state: CreateFlowState): Blocker[] {
  const blockers: Blocker[] = [];

  if (!state.extractedData) {
    blockers.push({
      id: "no-extraction",
      label: "No RFP analyzed",
      resolved: false,
      phase: "intake",
    });
  }

  if (!state.bidDecision) {
    blockers.push({
      id: "no-bid",
      label: "No bid decision made",
      resolved: false,
      phase: "strategy",
    });
  }

  if (!state.strategyConfirmed) {
    blockers.push({
      id: "no-strategy",
      label: "Strategy not confirmed",
      resolved: false,
      phase: "strategy",
    });
  }

  if (state.winThemes.filter((t) => t.confirmed).length === 0) {
    blockers.push({
      id: "no-themes",
      label: "No win themes selected",
      resolved: false,
      phase: "strategy",
    });
  }

  const unreviewed = state.sections.filter(
    (s) => !s.reviewed && s.generationStatus === "complete",
  );
  if (unreviewed.length > 0) {
    blockers.push({
      id: "unreviewed",
      label: `${unreviewed.length} section(s) not reviewed`,
      resolved: false,
      phase: "draft",
    });
  }

  return blockers;
}

// ── Presentational sub-components ───────────────────────────────────────────

function FinalizeHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Finalize Proposal</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Review blockers, approve the final package, and export your proposal.
      </p>
    </div>
  );
}

function ConfidenceDisplay({ score }: { score: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold">Proposal Confidence</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Based on completed phases, resolved blockers, and reviewed sections.
        </p>
      </div>
      <div className="text-2xl font-bold">
        <ConfidencePill score={score} />
      </div>
    </div>
  );
}

function BlockerChecklist({
  blockers,
  onResolve,
}: {
  blockers: Blocker[];
  onResolve: (id: string) => void;
}) {
  if (blockers.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-6 text-center">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          All clear -- no blockers found.
        </p>
      </div>
    );
  }

  const unresolvedCount = blockers.filter((b) => !b.resolved).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Blockers</h3>
        {unresolvedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {unresolvedCount} unresolved
          </span>
        )}
      </div>
      {blockers.map((blocker) => (
        <BlockerItem
          key={blocker.id}
          blocker={blocker}
          onResolve={() => onResolve(blocker.id)}
        />
      ))}
    </div>
  );
}

// ── Approve button ──────────────────────────────────────────────────────────

function ApproveButton({
  disabled,
  approved,
  onApprove,
}: {
  disabled: boolean;
  approved: boolean;
  onApprove: () => void;
}) {
  if (approved) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3">
        <svg
          className="h-5 w-5 text-emerald-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Final package approved
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onApprove}
      disabled={disabled}
      className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Approve Final Package
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function FinalizePhase() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const computedRef = useRef(false);

  // Auto-compute blockers on mount
  useEffect(() => {
    if (computedRef.current) return;
    computedRef.current = true;
    const blockers = computeBlockers(state);
    dispatch({ type: "SET_BLOCKERS", blockers });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: compute once on mount

  const hasUnresolved = state.blockers.some((b) => !b.resolved);

  const handleResolve = useCallback(
    (blockerId: string) => {
      dispatch({ type: "RESOLVE_BLOCKER", blockerId });
    },
    [dispatch],
  );

  const handleApprove = useCallback(() => {
    dispatch({ type: "APPROVE_FINAL" });
    dispatch({ type: "COMPLETE_PHASE", phase: "finalize" });
    logger.info("Finalize: final package approved");
  }, [dispatch]);

  const handleExported = useCallback(
    (url: string) => {
      dispatch({ type: "SET_EXPORTED_URL", url });
    },
    [dispatch],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FinalizeHeader />
      <ConfidenceDisplay score={state.confidence} />
      <BlockerChecklist blockers={state.blockers} onResolve={handleResolve} />
      <ApproveButton
        disabled={hasUnresolved}
        approved={state.finalApproved}
        onApprove={handleApprove}
      />
      <ExportButtons
        proposalId={state.proposalId}
        enabled={state.finalApproved}
        exportedUrl={state.exportedUrl}
        onExported={handleExported}
        fetchFn={authFetch}
      />
    </div>
  );
}
