// ── Finalize Insights ── Strengths, concerns, tips for the finalize phase ────
// Extracted from coach-insights.ts to stay under file-size limits.

import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type { CoachInsight, CreateFlowState } from "./create-types";
import type { ReadinessItem } from "./shared/readiness-checklist";

function buildStrengths(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): CoachInsight[] {
  return SCORING_FACTORS.filter(
    (f) => (ev.ai_scores[f.key]?.score ?? 0) >= 70,
  ).map((f) => ({
    id: `str-${f.key}`,
    label: f.label,
    value: `${ev.ai_scores[f.key].score}/100`,
    detail: ev.ai_scores[f.key].rationale.slice(0, 100),
    severity: "low" as const,
  }));
}

function buildConcerns(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): CoachInsight[] {
  return SCORING_FACTORS.filter(
    (f) => (ev.ai_scores[f.key]?.score ?? 100) < 60,
  ).map((f) => ({
    id: `con-${f.key}`,
    label: f.label,
    value: `${ev.ai_scores[f.key].score}/100`,
    detail: ev.ai_scores[f.key].rationale.slice(0, 100),
    severity: "high" as const,
  }));
}

function buildNextTimeTips(state: CreateFlowState): CoachInsight[] {
  const tips: CoachInsight[] = [];
  const ev = state.bidEvaluation;
  if (!ev) return tips;

  // Tip based on weakest factor
  const weakest = SCORING_FACTORS.reduce((min, f) => {
    const score = ev.ai_scores[f.key]?.score ?? 100;
    const minScore = ev.ai_scores[min.key]?.score ?? 100;
    return score < minScore ? f : min;
  });
  const weakScore = ev.ai_scores[weakest.key]?.score ?? 100;
  if (weakScore < 60) {
    const tipMap: Record<string, string> = {
      past_performance: "Add more case studies and evidence to your library",
      capability_alignment: "Update certifications and capabilities in Sources",
      requirement_match: "Consider teaming arrangements for capability gaps",
      timeline_feasibility: "Build in buffer time for complex deliverables",
      strategic_value: "Align your company profile with target market goals",
    };
    tips.push({
      id: "tip-weak",
      label: "For next time",
      value: tipMap[weakest.key] || "Strengthen your weakest scoring area",
      severity: "medium",
    });
  }

  // Tip about evidence library
  const evidenceCount = state.extractedData?.extracted?.key_requirements?.value;
  if (Array.isArray(evidenceCount) && evidenceCount.length > 5) {
    tips.push({
      id: "tip-evidence",
      label: "Tip",
      value: "Upload past proposals and case studies to improve future scores",
      severity: "low",
    });
  }

  return tips;
}

function buildChecklistInsights(state: CreateFlowState): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const reviewed = state.sections.filter((s) => s.reviewed).length;
  const total = state.sections.length;
  const failed = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;

  insights.push({
    id: "fin-reviewed",
    label: "Sections Reviewed",
    value: `${reviewed}/${total}`,
    severity: reviewed < total ? "medium" : "low",
  });
  if (failed > 0) {
    insights.push({
      id: "fin-failed",
      label: "Failed Sections",
      value: `${failed} need regeneration`,
      severity: "high",
    });
  }
  const deadline = state.extractedData?.extracted?.timeline?.value;
  if (deadline) {
    insights.push({
      id: "fin-deadline",
      label: "Deadline",
      value: String(deadline),
      severity: "medium",
    });
  }
  return insights;
}

function buildEvalInsights(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const strengths = buildStrengths(ev);
  const concerns = buildConcerns(ev);
  if (strengths.length > 0) {
    insights.push({
      id: "fin-strengths-header",
      label: "Your Strengths",
      value: `${strengths.length} strong areas`,
      severity: "low",
    });
    insights.push(...strengths);
  }
  if (concerns.length > 0) {
    insights.push({
      id: "fin-concerns-header",
      label: "Areas of Concern",
      value: `${concerns.length} to watch`,
      severity: "high",
    });
    insights.push(...concerns);
  }
  return insights;
}

export function buildFinalizeInsights(state: CreateFlowState): CoachInsight[] {
  const checklist = buildChecklistInsights(state);
  const evalInsights = state.bidEvaluation
    ? buildEvalInsights(state.bidEvaluation)
    : [];
  const tips = buildNextTimeTips(state);
  return [...checklist, ...evalInsights, ...tips];
}

export function buildReadinessItems(state: CreateFlowState): ReadinessItem[] {
  const completeSections = state.sections.filter(
    (s) => s.generationStatus === "complete",
  );
  const reviewedSections = state.sections.filter((s) => s.reviewed);
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);
  const totalSections = state.sections.length;

  return [
    {
      id: "all-generated",
      label: "All sections generated",
      checked: completeSections.length === totalSections && totalSections > 0,
      hint:
        completeSections.length < totalSections
          ? `${totalSections - completeSections.length} section(s) pending`
          : undefined,
    },
    {
      id: "all-reviewed",
      label: "All sections reviewed",
      checked: reviewedSections.length === totalSections && totalSections > 0,
      hint:
        reviewedSections.length < totalSections
          ? `${totalSections - reviewedSections.length} section(s) need review`
          : undefined,
    },
    {
      id: "no-blockers",
      label: "No unresolved blockers",
      checked: unresolvedBlockers.length === 0,
      hint:
        unresolvedBlockers.length > 0
          ? `${unresolvedBlockers.length} blocker(s) remaining`
          : undefined,
    },
    {
      id: "approved",
      label: "Final package approved",
      checked: state.finalApproved,
      hint: !state.finalApproved ? "Approve to enable export" : undefined,
    },
  ];
}
