// ── Coach Insights & Prompts ── Deep data surfacing for Decision Coach ──────
// Builds structured insight rows and gap-filling prompts from state data.

import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type {
  CoachInsight,
  CoachPrompt,
  CreateFlowState,
} from "./create-types";
import type { ExtractedIntake } from "@/types/intake";

// ── Intake Insights ─────────────────────────────────────────────────────────

function confidenceSeverity(c: number): "low" | "medium" | "high" {
  if (c >= 0.8) return "low";
  if (c >= 0.5) return "medium";
  return "high";
}

function pctLabel(c: number): string {
  return `${Math.round(c * 100)}%`;
}

const FIELD_LABELS: Record<string, string> = {
  client_name: "Client / Agency",
  scope_description: "Scope",
  budget_range: "Budget Range",
  timeline: "Timeline",
  solicitation_type: "Solicitation Type",
  key_requirements: "Requirements",
  compliance_requirements: "Compliance",
  decision_criteria: "Decision Criteria",
};

export function buildIntakeInsights(data: ExtractedIntake): CoachInsight[] {
  const insights: CoachInsight[] = [];

  // Field confidence breakdown — only show fields with <80% confidence
  const fields = data.extracted;
  for (const [key, field] of Object.entries(fields)) {
    if (!field || field.confidence >= 0.8) continue;
    const label = FIELD_LABELS[key] ?? key.replace(/_/g, " ");
    insights.push({
      id: `conf-${key}`,
      label,
      value: `${pctLabel(field.confidence)} confidence`,
      severity: confidenceSeverity(field.confidence),
    });
  }

  // Evaluation criteria summary
  const criteria = data.rfp_analysis?.evaluation_criteria;
  if (criteria && criteria.length > 0) {
    for (const crit of criteria.slice(0, 4)) {
      insights.push({
        id: `eval-${crit.name}`,
        label: crit.name,
        value: crit.weight ?? "unweighted",
        detail: crit.description.slice(0, 120),
        severity: "low",
      });
    }
  }

  // Page/submission constraints
  const analysis = data.rfp_analysis;
  if (analysis?.page_limit) {
    insights.push({
      id: "page-limit",
      label: "Page Limit",
      value: analysis.page_limit,
      severity: "medium",
    });
  }
  if (analysis?.submission_format) {
    insights.push({
      id: "sub-format",
      label: "Format",
      value: analysis.submission_format,
      severity: "low",
    });
  }

  return insights;
}

export function buildIntakePrompts(data: ExtractedIntake): CoachPrompt[] {
  return data.gaps
    .filter((g) => g.suggested_question)
    .map((g) => ({
      id: `gap-${g.field}`,
      question: g.suggested_question!,
      importance: g.importance,
    }));
}

// ── Strategy Insights ───────────────────────────────────────────────────────

function buildFactorRationales(
  ev: NonNullable<CreateFlowState["bidEvaluation"]>,
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  for (const f of SCORING_FACTORS) {
    const fs = ev.ai_scores[f.key];
    if (!fs) continue;
    insights.push({
      id: `rat-${f.key}`,
      label: `${f.label} (${fs.score})`,
      value: fs.rationale,
      severity: fs.score < 40 ? "high" : fs.score < 70 ? "medium" : "low",
    });
  }
  return insights;
}

function buildIntelInsights(
  intel: NonNullable<
    NonNullable<CreateFlowState["bidEvaluation"]>["intelligence"]
  >,
): CoachInsight[] {
  const insights: CoachInsight[] = [];
  if (intel.agency_name && intel.has_agency_profile) {
    if (intel.agency_eval_method) {
      insights.push({
        id: "intel-eval",
        label: "Evaluation Method",
        value: intel.agency_eval_method,
        severity: "low",
      });
    }
    if (intel.agency_avg_offers !== null) {
      insights.push({
        id: "intel-offers",
        label: "Avg. Competing Offers",
        value: String(intel.agency_avg_offers),
        severity: intel.agency_avg_offers > 5 ? "medium" : "low",
      });
    }
    if (intel.agency_total_awards !== null) {
      insights.push({
        id: "intel-awards",
        label: "Total Awards Tracked",
        value: String(intel.agency_total_awards),
        severity: "low",
      });
    }
  }
  const wp = intel.win_probability;
  if (wp) {
    const pct = Math.round(wp.probability * 100);
    insights.push({
      id: "win-prob",
      label: "Historical Win Rate",
      value: `${pct}%`,
      detail: `Based on ${wp.matching_awards} similar contracts`,
      severity: pct < 30 ? "high" : pct < 50 ? "medium" : "low",
    });
  }
  return insights;
}

export function buildStrategyInsights(state: CreateFlowState): CoachInsight[] {
  const ev = state.bidEvaluation;
  if (!ev) return [];
  const rationales = buildFactorRationales(ev);
  const intel = ev.intelligence ? buildIntelInsights(ev.intelligence) : [];
  return [...rationales, ...intel];
}

// ── Draft Insights ──────────────────────────────────────────────────────────

function buildDraftWordStats(state: CreateFlowState): CoachInsight[] {
  const completeSections = state.sections.filter(
    (s) => s.generationStatus === "complete" && s.content,
  );
  const totalWords = completeSections.reduce(
    (sum, s) => sum + s.content.split(/\s+/).length,
    0,
  );
  if (totalWords === 0) return [];

  const insights: CoachInsight[] = [
    {
      id: "word-count",
      label: "Total Words",
      value:
        totalWords > 1000
          ? `${(totalWords / 1000).toFixed(1)}k`
          : String(totalWords),
      severity: "low",
    },
  ];

  const pageLimit = state.extractedData?.rfp_analysis?.page_limit;
  if (pageLimit) {
    const estPages = Math.ceil(totalWords / 300);
    insights.push({
      id: "page-est",
      label: "Est. Pages",
      value: `~${estPages} pages`,
      detail: `RFP limit: ${pageLimit}`,
      severity: "medium",
    });
  }
  return insights;
}

function buildCriteriaCoverage(state: CreateFlowState): CoachInsight[] {
  const criteria = state.extractedData?.rfp_analysis?.evaluation_criteria;
  if (!criteria || criteria.length === 0) return [];

  const sectionTypes = new Set(state.sections.map((s) => s.sectionType));
  const covered = criteria.filter((c) =>
    c.mapped_sections.some((ms) => sectionTypes.has(ms)),
  );
  const uncovered = criteria.filter(
    (c) => !c.mapped_sections.some((ms) => sectionTypes.has(ms)),
  );

  const insights: CoachInsight[] = [
    {
      id: "criteria-coverage",
      label: "Eval Criteria Coverage",
      value: `${covered.length}/${criteria.length}`,
      severity: uncovered.length > 0 ? "medium" : "low",
    },
  ];
  for (const uc of uncovered.slice(0, 3)) {
    insights.push({
      id: `uncovered-${uc.name}`,
      label: `Not covered: ${uc.name}`,
      value: uc.weight ?? "unweighted",
      severity: "high",
    });
  }
  return insights;
}

export function buildDraftInsights(state: CreateFlowState): CoachInsight[] {
  return [...buildDraftWordStats(state), ...buildCriteriaCoverage(state)];
}

// ── Finalize Insights ───────────────────────────────────────────────────────

export function buildFinalizeInsights(state: CreateFlowState): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const reviewed = state.sections.filter((s) => s.reviewed).length;
  const total = state.sections.length;
  const themes = state.winThemes.filter((t) => t.confirmed).length;

  insights.push({
    id: "fin-reviewed",
    label: "Sections Reviewed",
    value: `${reviewed}/${total}`,
    severity: reviewed < total ? "medium" : "low",
  });
  insights.push({
    id: "fin-themes",
    label: "Active Win Themes",
    value: String(themes),
    severity: themes === 0 ? "high" : "low",
  });

  if (state.bidEvaluation) {
    insights.push({
      id: "fin-bid-score",
      label: "Bid Score",
      value: `${Math.round(state.bidEvaluation.weighted_total)}/100`,
      severity:
        state.bidEvaluation.weighted_total < 40
          ? "high"
          : state.bidEvaluation.weighted_total < 70
            ? "medium"
            : "low",
    });
  }

  // Blocker impact
  const unresolved = state.blockers.filter((b) => !b.resolved);
  if (unresolved.length > 0) {
    const impactPerBlocker = Math.round(15 / unresolved.length);
    for (const b of unresolved) {
      insights.push({
        id: `impact-${b.id}`,
        label: b.label,
        value: `+${impactPerBlocker}% if resolved`,
        severity: "high",
      });
    }
  }

  return insights;
}
