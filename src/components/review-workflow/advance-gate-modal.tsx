"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ── Types ──────────────────────────────────────────────────────────────────

interface AdvanceGateModalProps {
  proposalId: string;
  stageId: string;
  stage: string;
  onAdvance: () => void;
  onClose: () => void;
}

interface GateCriterion {
  label: string;
  passed: boolean;
}

// ── Gate Criteria per Stage ────────────────────────────────────────────────

const STAGE_CRITERIA: Record<string, GateCriterion[]> = {
  pink: [
    { label: "All sections must have at least 1 review", passed: false },
  ],
  red: [
    { label: "Average score must be >= 70", passed: false },
    { label: "No section score below 50", passed: false },
  ],
  gold: [
    { label: "All reviewers must mark as complete", passed: false },
  ],
  white: [
    { label: "All sections must be reviewed", passed: false },
  ],
};

const STAGE_ORDER = ["pink", "red", "gold", "white"];

function getNextStage(current: string): string | null {
  const idx = STAGE_ORDER.indexOf(current.toLowerCase());
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    pink: "Pink Team",
    red: "Red Team",
    gold: "Gold Team",
    white: "White Glove",
  };
  return labels[stage.toLowerCase()] ?? stage;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdvanceGateModal({
  proposalId,
  stageId,
  stage,
  onAdvance,
  onClose,
}: AdvanceGateModalProps) {
  const authFetch = useAuthFetch();
  const [criteria, setCriteria] = useState<GateCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [forceMode, setForceMode] = useState(false);

  const nextStage = getNextStage(stage);
  const allPassed = criteria.length > 0 && criteria.every((c) => c.passed);
  const failedCount = criteria.filter((c) => !c.passed).length;

  // Fetch gate status from API
  const fetchGateStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages/${stageId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dry_run: true }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        // If the API returns criteria, use them; otherwise fall back to static
        if (data.criteria && Array.isArray(data.criteria)) {
          setCriteria(data.criteria);
        } else {
          // All criteria pass if dry_run succeeds without criteria detail
          const defaults = STAGE_CRITERIA[stage.toLowerCase()] ?? [];
          setCriteria(defaults.map((c) => ({ ...c, passed: true })));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        // Use failures from API or fall back to static criteria
        if (data.criteria && Array.isArray(data.criteria)) {
          setCriteria(data.criteria);
        } else {
          const defaults = STAGE_CRITERIA[stage.toLowerCase()] ?? [];
          setCriteria(defaults);
        }
      }
    } catch {
      // Fall back to static criteria (all failed)
      const defaults = STAGE_CRITERIA[stage.toLowerCase()] ?? [];
      setCriteria(defaults);
    } finally {
      setLoading(false);
    }
  }, [authFetch, proposalId, stageId, stage]);

  useEffect(() => {
    fetchGateStatus();
  }, [fetchGateStatus]);

  // Advance action
  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/review-stages/${stageId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: forceMode }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to advance stage");
      }

      toast.success(
        nextStage
          ? `Advanced to ${getStageLabel(nextStage)}`
          : "Review completed",
      );
      onAdvance();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Advance failed");
    } finally {
      setAdvancing(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[var(--warning)]" />
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Gate Review: {getStageLabel(stage)}
              </h2>
              {nextStage && (
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                  Advance to {getStageLabel(nextStage)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--card-hover)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--foreground-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking gate criteria...
            </div>
          ) : (
            <>
              {/* Criteria list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Gate Criteria
                </span>
                {criteria.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors"
                    style={{
                      borderColor: criterion.passed
                        ? "rgba(0, 255, 136, 0.2)"
                        : "rgba(255, 68, 102, 0.2)",
                      backgroundColor: criterion.passed
                        ? "rgba(0, 255, 136, 0.05)"
                        : "rgba(255, 68, 102, 0.05)",
                    }}
                  >
                    {criterion.passed ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--success)" }}
                      />
                    ) : (
                      <XCircle
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--danger)" }}
                      />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color: criterion.passed
                          ? "var(--foreground)"
                          : "var(--danger)",
                      }}
                    >
                      {criterion.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status summary */}
              {allPassed ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--success-subtle)] text-sm font-medium text-[var(--success)]">
                  <CheckCircle2 className="h-4 w-4" />
                  All gate criteria met. Ready to advance.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--danger-subtle)] text-sm text-[var(--danger)]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {failedCount} criterion{failedCount !== 1 ? "s" : ""} not
                    met. Consider completing outstanding items before advancing.
                  </div>

                  {/* Force advance toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceMode}
                      onChange={(e) => setForceMode(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--warning)]"
                    />
                    <span className="text-xs text-[var(--foreground-muted)]">
                      Force advance despite unmet criteria
                    </span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] rounded-md hover:bg-[var(--card-hover)] border border-[var(--border)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={(!allPassed && !forceMode) || advancing || loading}
            onClick={handleAdvance}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                allPassed
                  ? "var(--accent)"
                  : forceMode
                    ? "var(--warning)"
                    : "var(--background-tertiary)",
              color:
                allPassed || forceMode ? "#0a0a0a" : "var(--foreground-subtle)",
            }}
          >
            {advancing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {nextStage
              ? `Advance to ${getStageLabel(nextStage)}`
              : "Complete Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
