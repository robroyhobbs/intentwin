"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { DimensionScores, SectionReview, RemediationEntry } from "./types";
import {
  DIMENSION_LABELS,
  JUDGE_ICONS,
  formatSectionType,
  scoreColor,
  ScoreBar,
} from "./helpers";

interface SectionBreakdownProps {
  sections: SectionReview[];
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  expandedJudges: Set<string>;
  toggleJudgeDetail: (key: string) => void;
  remediation: RemediationEntry[];
}

export function SectionBreakdown({
  sections,
  expandedSections,
  toggleSection,
  expandedJudges,
  toggleJudgeDetail,
  remediation,
}: SectionBreakdownProps) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">
        Section Scores
      </h4>
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.section_id);
        const isRemediated = remediation.some(
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
                  <JudgeBreakdown
                    sectionId={section.section_id}
                    judgeReviews={section.judge_reviews!}
                    expandedJudges={expandedJudges}
                    toggleJudgeDetail={toggleJudgeDetail}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Per-judge breakdown sub-component ──

function JudgeBreakdown({
  sectionId,
  judgeReviews,
  expandedJudges,
  toggleJudgeDetail,
}: {
  sectionId: string;
  judgeReviews: NonNullable<SectionReview["judge_reviews"]>;
  expandedJudges: Set<string>;
  toggleJudgeDetail: (key: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
        Individual Judges
      </div>
      {judgeReviews.map((jr) => {
        const jKey = `${sectionId}-${jr.judge_id}`;
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
  );
}
