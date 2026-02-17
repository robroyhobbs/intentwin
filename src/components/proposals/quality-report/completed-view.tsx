"use client";

import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { QualityReviewData, JudgeInfoData } from "./types";
import { ConsensusIndicator, JudgeCard } from "./helpers";
import { SectionBreakdown } from "./section-breakdown";
import { RemediationLog } from "./remediation-log";

interface CompletedViewProps {
  data: QualityReviewData;
  isCouncil: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  expandedJudges: Set<string>;
  toggleJudgeDetail: (key: string) => void;
  triggering: boolean;
  isGenerating: boolean;
  handleTrigger: () => void;
  judgeSummaries: (JudgeInfoData & { score?: number; pass?: boolean })[];
}

export function CompletedView({
  data,
  isCouncil,
  collapsed,
  setCollapsed,
  expandedSections,
  toggleSection,
  expandedJudges,
  toggleJudgeDetail,
  triggering,
  isGenerating,
  handleTrigger,
  judgeSummaries,
}: CompletedViewProps) {
  const passColor = data.pass ? "var(--success)" : "var(--warning, #f59e0b)";
  const successfulJudges =
    data.judges?.filter((j) => j.status === "completed").length ?? 0;
  const totalJudges = data.judges?.length ?? 0;

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
          {isCouncil && judgeSummaries.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {judgeSummaries.map((judge) => (
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
          <SectionBreakdown
            sections={data.sections}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            expandedJudges={expandedJudges}
            toggleJudgeDetail={toggleJudgeDetail}
            remediation={data.remediation}
          />

          {/* Remediation log */}
          <RemediationLog
            remediation={data.remediation}
            sections={data.sections}
          />
        </div>
      )}
    </div>
  );
}
