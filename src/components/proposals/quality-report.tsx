"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ============================================================
// Types
// ============================================================

interface DimensionScores {
  content_quality: number;
  client_fit: number;
  evidence: number;
  brand_voice: number;
}

interface SectionReview {
  section_id: string;
  section_type: string;
  score: number;
  dimensions: DimensionScores;
  feedback: string;
}

interface RemediationEntry {
  section_id: string;
  round: number;
  original_score: number;
  issues: string[];
  new_score: number;
}

interface QualityReviewData {
  status: "reviewing" | "completed" | "failed";
  run_at: string;
  trigger: "auto_post_generation" | "manual";
  model: string;
  overall_score: number;
  pass: boolean;
  sections: SectionReview[];
  remediation: RemediationEntry[];
}

interface QualityReportProps {
  proposalId: string;
  initialData?: QualityReviewData | null;
}

// ============================================================
// Helpers
// ============================================================

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  content_quality: "Content Quality",
  client_fit: "Client Fit",
  evidence: "Evidence",
  brand_voice: "Brand Voice",
};

function formatSectionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color =
    score >= 9
      ? "var(--success)"
      : score >= 8
        ? "var(--warning, #f59e0b)"
        : "var(--danger)";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[var(--background-tertiary)]">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{score}</span>
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function QualityReport({ proposalId, initialData }: QualityReportProps) {
  const [data, setData] = useState<QualityReviewData | null>(
    initialData || null,
  );
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const authFetch = useAuthFetch();

  // Poll for results when status is "reviewing"
  const pollResults = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/quality-review`,
      );
      if (!res.ok) return;
      const result = await res.json();
      if (result) {
        setData(result);
        if (result.status !== "reviewing") {
          // Stop polling
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (result.status === "completed") {
            toast.success(
              result.pass
                ? `Quality review passed! Score: ${result.overall_score}/10`
                : `Quality review complete. Score: ${result.overall_score}/10`,
            );
          } else if (result.status === "failed") {
            toast.error("Quality review failed. Try again.");
          }
        }
      }
    } catch {
      // Polling error — silently continue
    }
  }, [authFetch, proposalId]);

  // Start polling when data is in "reviewing" state
  useEffect(() => {
    if (data?.status === "reviewing" && !pollRef.current) {
      pollRef.current = setInterval(pollResults, 3000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [data?.status, pollResults]);

  // Load initial data on mount
  useEffect(() => {
    if (!initialData) {
      authFetch(`/api/proposals/${proposalId}/quality-review`)
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (result) setData(result);
        })
        .catch(() => {});
    }
  }, [proposalId, authFetch, initialData]);

  // Trigger quality review
  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/quality-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger: "manual" }),
        },
      );

      if (res.status === 409) {
        toast.error("Quality review is already in progress.");
        return;
      }

      if (!res.ok) {
        toast.error("Failed to start quality review.");
        return;
      }

      setData({
        status: "reviewing",
        run_at: new Date().toISOString(),
        trigger: "manual",
        model: "gpt-4o",
        overall_score: 0,
        pass: false,
        sections: [],
        remediation: [],
      });
      setCollapsed(false);
      toast.success("Quality review started...");
    } catch {
      toast.error("Failed to start quality review.");
    } finally {
      setTriggering(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // ── Render states ──

  // Not run state
  if (!data) {
    return (
      <div className="border border-[var(--border)] rounded-xl bg-[var(--card-bg)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--foreground-muted)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Quality Review
            </span>
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {triggering ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Run Quality Review"
            )}
          </button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mt-2">
          No quality review yet. Run one to score your proposal sections.
        </p>
      </div>
    );
  }

  // Reviewing state
  if (data.status === "reviewing") {
    return (
      <div className="border border-[var(--border)] rounded-xl bg-[var(--card-bg)] p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            Quality review in progress...
          </span>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mt-2">
          GPT-4o is reviewing your proposal sections. This may take a minute.
        </p>
      </div>
    );
  }

  // Failed state
  if (data.status === "failed") {
    return (
      <div className="border border-[var(--danger)]/20 rounded-xl bg-[var(--card-bg)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-[var(--danger)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              Quality review failed
            </span>
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {triggering ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Retry"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  const passColor = data.pass ? "var(--success)" : "var(--warning, #f59e0b)";

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--card-bg)] overflow-hidden">
      {/* Header — always visible */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
          )}
          <ShieldCheck className="h-4 w-4" style={{ color: passColor }} />
          <span className="text-sm font-medium text-[var(--foreground)]">
            Quality Review
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${passColor}18`,
              color: passColor,
            }}
          >
            {data.pass ? "PASS" : "NEEDS WORK"} — {data.overall_score}/10
          </span>
          {data.remediation.length > 0 && (
            <span className="text-xs text-[var(--foreground-muted)]">
              ({data.remediation.length} auto-improved)
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTrigger();
          }}
          disabled={triggering}
          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <RefreshCw
            className={`h-3 w-3 ${triggering ? "animate-spin" : ""}`}
          />
          Re-evaluate
        </button>
      </div>

      {/* Expandable content */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] p-4 space-y-4">
          {/* Overall score */}
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold" style={{ color: passColor }}>
              {data.overall_score}
            </div>
            <div>
              <div className="text-xs text-[var(--foreground-muted)]">
                Overall Score (pass threshold: 9.0)
              </div>
              <div className="text-xs text-[var(--foreground-muted)]">
                Reviewed by {data.model} •{" "}
                {new Date(data.run_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Section breakdown */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
              Section Scores
            </h4>
            {data.sections.map((section) => {
              const isExpanded = expandedSections.has(section.section_id);
              const isRemediated = data.remediation.some(
                (r) => r.section_id === section.section_id,
              );

              return (
                <div
                  key={section.section_id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.section_id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--background-secondary)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-[var(--foreground-muted)]" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-[var(--foreground-muted)]" />
                      )}
                      <span className="text-sm text-[var(--foreground)]">
                        {formatSectionType(section.section_type)}
                      </span>
                      {isRemediated && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">
                          auto-improved
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color:
                          section.score >= 9
                            ? "var(--success)"
                            : section.score >= 8.5
                              ? "var(--warning, #f59e0b)"
                              : "var(--danger)",
                      }}
                    >
                      {section.score}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--border)] px-3 py-2 bg-[var(--background-secondary)] space-y-2">
                      {/* Dimension scores */}
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          Object.entries(section.dimensions) as [
                            keyof DimensionScores,
                            number,
                          ][]
                        ).map(([key, value]) => (
                          <div key={key}>
                            <div className="text-[10px] text-[var(--foreground-muted)]">
                              {DIMENSION_LABELS[key]}
                            </div>
                            <ScoreBar score={value} />
                          </div>
                        ))}
                      </div>
                      {/* Feedback */}
                      <div>
                        <div className="text-[10px] text-[var(--foreground-muted)] mb-0.5">
                          Feedback
                        </div>
                        <p className="text-xs text-[var(--foreground)]">
                          {section.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Remediation log */}
          {data.remediation.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Auto-Improvements
              </h4>
              {data.remediation.map((entry, i) => {
                const improved = entry.new_score > entry.original_score;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 border border-[var(--border)] rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {improved ? (
                        <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
                      )}
                      <span className="text-[var(--foreground)]">
                        {formatSectionType(
                          data.sections.find(
                            (s) => s.section_id === entry.section_id,
                          )?.section_type || entry.section_id,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-[var(--danger)]">
                        {entry.original_score}
                      </span>
                      <span className="text-[var(--foreground-muted)]">→</span>
                      <span
                        style={{
                          color: improved
                            ? "var(--success)"
                            : "var(--warning, #f59e0b)",
                        }}
                      >
                        {entry.new_score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
