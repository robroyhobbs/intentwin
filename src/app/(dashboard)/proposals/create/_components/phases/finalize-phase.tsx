"use client";

import { useCallback, useEffect } from "react";
import { useCreateFlow } from "../create-provider";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import type { Blocker, CreateFlowState } from "../create-types";
import { BlockerItem } from "../shared/blocker-item";
import { ConfidenceRing } from "../shared/confidence-ring";
import { PhaseIcon } from "../shared/phase-icon";
import { StatBlock } from "../shared/stat-block";
import { ExportButtons } from "./finalize-export";
import { logger } from "@/lib/utils/logger";
import {
  computeFinalizeBlockers,
  getSectionGateState,
  isAutoResolvedBlocker,
} from "./finalize-helpers";

// ── Presentational sub-components ───────────────────────────────────────────

function FinalizeHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="finalize" state="active" />
      <div>
        <h2 className="text-xl font-bold text-balance">Final Review &amp; Export</h2>
        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
          Fix blockers, approve your package, then export your final file.
        </p>
      </div>
    </div>
  );
}

function ProposalSummary({ state }: { state: CreateFlowState }) {
  const sectionCount = state.sections.length;
  const wordCount = state.sections.reduce(
    (sum, s) => sum + (s.content ? s.content.split(/\s+/).length : 0),
    0,
  );
  const reviewed = state.sections.filter((s) => s.reviewed).length;
  const themes = state.winThemes.filter((t) => t.confirmed).length;

  const stats = [
    { label: "Sections", value: String(sectionCount) },
    {
      label: "Words",
      value:
        wordCount > 1000
          ? `${(wordCount / 1000).toFixed(1)}k`
          : String(wordCount),
    },
    { label: "Reviewed", value: `${reviewed}/${sectionCount}` },
    { label: "Win Themes", value: String(themes) },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Proposal Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {stats.map((s) => (
              <StatBlock key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
        <ConfidenceRing score={state.confidence} size={72} />
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
          onResolve={
            isAutoResolvedBlocker(blocker.id)
              ? undefined
              : () => onResolve(blocker.id)
          }
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
      Approve and Unlock Export
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function FinalizePhase() {
  const { state, dispatch } = useCreateFlow();
  const authFetch = useAuthFetch();
  const sectionGate = getSectionGateState(state);

  // Keep blockers in sync with state so gating is reliable.
  useEffect(() => {
    const blockers = computeFinalizeBlockers(state);
    dispatch({ type: "SET_BLOCKERS", blockers });
  }, [
    dispatch,
    state.extractedData,
    state.bidDecision,
    state.strategyConfirmed,
    state.winThemes,
    state.sections,
  ]);

  const hasUnresolved = state.blockers.some((b) => !b.resolved);
  const approvalBlocked = hasUnresolved || sectionGate.hasBlockingSectionIssues;

  const handleResolve = useCallback(
    (blockerId: string) => {
      if (isAutoResolvedBlocker(blockerId)) return;
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
      <ProposalSummary state={state} />
      <BlockerChecklist blockers={state.blockers} onResolve={handleResolve} />
      {!state.finalApproved && approvalBlocked && sectionGate.message && (
        <p role="alert" className="text-xs text-destructive text-pretty">
          {sectionGate.message}
        </p>
      )}
      <ApproveButton
        disabled={approvalBlocked}
        approved={state.finalApproved}
        onApprove={handleApprove}
      />
      <ExportButtons
        proposalId={state.proposalId}
        enabled={state.finalApproved && !approvalBlocked}
        exportedUrl={state.exportedUrl}
        onExported={handleExported}
        fetchFn={authFetch}
      />
    </div>
  );
}
