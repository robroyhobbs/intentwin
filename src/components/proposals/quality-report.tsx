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
  Users,
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

interface JudgeReviewData {
  judge_id: string;
  judge_name: string;
  provider: string;
  scores: DimensionScores;
  score: number;
  feedback: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

interface JudgeInfoData {
  judge_id: string;
  judge_name: string;
  provider: string;
  status: "completed" | "failed" | "timeout";
  error?: string;
}

interface SectionReview {
  section_id: string;
  section_type: string;
  score: number;
  dimensions: DimensionScores;
  feedback: string;
  /** Individual judge results — present only in council mode */
  judge_reviews?: JudgeReviewData[];
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
  /** Council fields — present when model === "council" */
  judges?: JudgeInfoData[];
  consensus?: "unanimous" | "majority" | "split";
}

interface QualityReportProps {
  proposalId: string;
  initialData?: QualityReviewData | null;
  /** Current proposal status — disables trigger when "generating" */
  proposalStatus?: string;
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

const JUDGE_ICONS: Record<string, string> = {
  "gpt-4o": "\u{1F916}",
  "llama-3.3-70b": "\u{1F999}",
  "mistral-small": "\u{1F300}",
};

function formatSectionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreColor(score: number): string {
  if (score >= 9) return "var(--success)";
  if (score >= 8) return "var(--warning, #f59e0b)";
  return "var(--danger)";
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[var(--background-tertiary)]">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{score}</span>
    </div>
  );
}

function ConsensusIndicator({
  consensus,
  judgeCount,
  totalJudges,
}: {
  consensus: string;
  judgeCount: number;
  totalJudges: number;
}) {
  const config: Record<string, { color: string; label: string }> = {
    unanimous: { color: "var(--success)", label: "Unanimous" },
    majority: { color: "var(--warning, #f59e0b)", label: "Majority" },
    split: { color: "var(--danger)", label: "Split" },
  };
  const c = config[consensus] || config.split;

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: c.color }}
      />
      <span className="text-xs font-medium" style={{ color: c.color }}>
        {c.label}
      </span>
      <span className="text-xs text-[var(--foreground-muted)]">
        {judgeCount}/{totalJudges} judges
      </span>
    </div>
  );
}

function JudgeCard({ judge }: { judge: JudgeInfoData & { score?: number; pass?: boolean } }) {
  const icon = JUDGE_ICONS[judge.judge_id] || "\u{1F916}";
  const isFailed = judge.status === "failed" || judge.status === "timeout";

  if (isFailed) {
    return (
      <div className="flex-1 min-w-[120px] border border-[var(--border)] rounded-lg p-3 bg-[var(--background-secondary)] opacity-70">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-[var(--foreground)] truncate">
            {judge.judge_name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <AlertTriangle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
          <span>Unavailable</span>
        </div>
        {judge.error && (
          <p className="text-[10px] text-[var(--foreground-muted)] mt-1 truncate">
            {judge.error}
          </p>
        )}
      </div>
    );
  }

  const passColor =
    judge.pass ? "var(--success)" : "var(--warning, #f59e0b)";

  return (
    <div className="flex-1 min-w-[120px] border border-[var(--border)] rounded-lg p-3 bg-[var(--card-bg)]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-[var(--foreground)] truncate">
          {judge.judge_name}
        </span>
      </div>
      <div className="text-lg font-bold font-mono" style={{ color: scoreColor(judge.score ?? 0) }}>
        {judge.score?.toFixed(1) ?? "–"}
      </div>
      <div className="flex items-center gap-1 text-xs mt-0.5">
        {judge.pass ? (
          <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
        ) : (
          <XCircle className="h-3 w-3 text-[var(--warning, #f59e0b)]" />
        )}
        <span style={{ color: passColor }}>
          {judge.pass ? "Pass" : "Needs work"}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function QualityReport({
  proposalId,
  initialData,
  proposalStatus,
}: QualityReportProps) {
  const isGenerating = proposalStatus === "generating";
  const [data, setData] = useState<QualityReviewData | null>(
    initialData || null,
  );
  const [collapsed, setCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [expandedJudges, setExpandedJudges] = useState<Set<string>>(
    new Set(),
  );
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const authFetch = useAuthFetch();

  const isCouncil = data?.model === "council";

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

  const handleTrigger = async () => {
    if (isGenerating) {
      toast.error("Please wait for proposal generation to finish first.");
      return;
    }
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
        model: "council",
        overall_score: 0,
        pass: false,
        sections: [],
        remediation: [],
      });
      setCollapsed(false);
      toast.success("Quality council review started...");
    } catch {
      toast.error("Failed to start quality review.");
    } finally {
      setTriggering(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleJudgeDetail = (key: string) => {
    setExpandedJudges((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Compute judge scores from sections for the header cards
  const judgeScoreSummaries = useCallback(() => {
    if (!isCouncil || !data?.judges || !data.sections) return [];
    const PASS_THRESHOLD = 9.0;

    return data.judges.map((judge) => {
      if (judge.status !== "completed") {
        return { ...judge, score: undefined, pass: undefined };
      }
      // Average this judge's scores across all sections
      const judgeScores = data.sections
        .map((s) => s.judge_reviews?.find((jr) => jr.judge_id === judge.judge_id))
        .filter((jr): jr is JudgeReviewData => jr != null && jr.status === "completed");

      if (judgeScores.length === 0) {
        return { ...judge, score: 0, pass: false };
      }

      const avgScore =
        judgeScores.reduce((sum, jr) => sum + jr.score, 0) / judgeScores.length;
      return {
        ...judge,
        score: Math.round(avgScore * 10) / 10,
        pass: avgScore >= PASS_THRESHOLD,
      };
    });
  }, [isCouncil, data?.judges, data?.sections]);

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
            disabled={triggering || isGenerating}
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
          {isGenerating
            ? "Quality review will be available after generation completes."
            : "No quality review yet. Run one to score your proposal sections."}
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
          {isCouncil
            ? "The quality council (GPT-4o, Llama 3.3, Mistral) is reviewing your proposal. This may take a minute."
            : "GPT-4o is reviewing your proposal sections. This may take a minute."}
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
            disabled={triggering || isGenerating}
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

  // ── Completed state ──
  const passColor = data.pass ? "var(--success)" : "var(--warning, #f59e0b)";
  const successfulJudges =
    data.judges?.filter((j) => j.status === "completed").length ?? 0;
  const totalJudges = data.judges?.length ?? 0;
  const summaries = judgeScoreSummaries();

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
          {isCouncil ? (
            <Users className="h-4 w-4" style={{ color: passColor }} />
          ) : (
            <ShieldCheck className="h-4 w-4" style={{ color: passColor }} />
          )}
          <span className="text-sm font-medium text-[var(--foreground)]">
            {isCouncil ? "Quality Council" : "Quality Review"}
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
          {isCouncil && data.consensus && (
            <ConsensusIndicator
              consensus={data.consensus}
              judgeCount={successfulJudges}
              totalJudges={totalJudges}
            />
          )}
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
          disabled={triggering || isGenerating}
          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 disabled:opacity-50"
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
          {/* Judge cards — council mode */}
          {isCouncil && summaries.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {summaries.map((judge) => (
                <JudgeCard key={judge.judge_id} judge={judge} />
              ))}
            </div>
          )}

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
                Reviewed by {isCouncil ? "Quality Council" : data.model} &bull;{" "}
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
              const hasJudgeReviews =
                section.judge_reviews && section.judge_reviews.length > 0;

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
                      {hasJudgeReviews && (
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          ({section.judge_reviews!.filter((j) => j.status === "completed").length} judges)
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-mono font-bold"
                      style={{ color: scoreColor(section.score) }}
                    >
                      {section.score}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--border)] px-3 py-2 bg-[var(--background-secondary)] space-y-3">
                      {/* Aggregated dimension scores */}
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

                      {/* Combined feedback */}
                      <div>
                        <div className="text-[10px] text-[var(--foreground-muted)] mb-0.5">
                          {hasJudgeReviews ? "Combined Feedback" : "Feedback"}
                        </div>
                        <p className="text-xs text-[var(--foreground)]">
                          {section.feedback}
                        </p>
                      </div>

                      {/* Per-judge breakdown — council mode */}
                      {hasJudgeReviews && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                            Individual Judges
                          </div>
                          {section.judge_reviews!.map((jr) => {
                            const jKey = `${section.section_id}-${jr.judge_id}`;
                            const jExpanded = expandedJudges.has(jKey);
                            const jIcon = JUDGE_ICONS[jr.judge_id] || "\u{1F916}";
                            const jFailed = jr.status !== "completed";

                            return (
                              <div
                                key={jKey}
                                className="border border-[var(--border)] rounded-md overflow-hidden"
                              >
                                <button
                                  onClick={() => toggleJudgeDetail(jKey)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[var(--background-tertiary)] transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {jExpanded ? (
                                      <ChevronDown className="h-2.5 w-2.5 text-[var(--foreground-muted)]" />
                                    ) : (
                                      <ChevronRight className="h-2.5 w-2.5 text-[var(--foreground-muted)]" />
                                    )}
                                    <span className="text-xs">{jIcon}</span>
                                    <span className="text-xs font-medium text-[var(--foreground)]">
                                      {jr.judge_name}
                                    </span>
                                    {jFailed && (
                                      <span className="text-[10px] text-[var(--warning, #f59e0b)]">
                                        ({jr.status})
                                      </span>
                                    )}
                                  </div>
                                  {!jFailed && (
                                    <span
                                      className="text-xs font-mono font-bold"
                                      style={{ color: scoreColor(jr.score) }}
                                    >
                                      {jr.score}
                                    </span>
                                  )}
                                </button>
                                {jExpanded && !jFailed && (
                                  <div className="border-t border-[var(--border)] px-2 py-1.5 bg-[var(--background-tertiary)] space-y-1.5">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {(
                                        Object.entries(jr.scores) as [
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
                                    {jr.feedback && (
                                      <div>
                                        <div className="text-[10px] text-[var(--foreground-muted)]">
                                          Feedback
                                        </div>
                                        <p className="text-[11px] text-[var(--foreground)]">
                                          {jr.feedback}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {jExpanded && jFailed && (
                                  <div className="border-t border-[var(--border)] px-2 py-1.5 bg-[var(--background-tertiary)]">
                                    <p className="text-[11px] text-[var(--foreground-muted)]">
                                      {jr.error || "Judge was unavailable for this section."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                      <span className="text-[var(--foreground-muted)]">&rarr;</span>
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
