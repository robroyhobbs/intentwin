"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

import type {
  QualityReviewData,
  QualityReportProps,
  JudgeReviewData,
} from "./quality-report/types";
import { CompletedView } from "./quality-report/completed-view";

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
  return (
    <CompletedView
      data={data}
      isCouncil={isCouncil}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
      expandedSections={expandedSections}
      toggleSection={toggleSection}
      expandedJudges={expandedJudges}
      toggleJudgeDetail={toggleJudgeDetail}
      triggering={triggering}
      isGenerating={isGenerating}
      handleTrigger={handleTrigger}
      judgeSummaries={judgeScoreSummaries()}
    />
  );
}
