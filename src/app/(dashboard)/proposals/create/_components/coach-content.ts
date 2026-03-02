// ── Coach Content Generator ── Rule-based content per phase ─────────────────

import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type { CoachContent, CreateFlowState, RiskFlag } from "./create-types";
import {
  buildIntakeInsights,
  buildIntakePrompts,
  buildStrategyInsights,
  buildDraftInsights,
  buildFinalizeInsights,
} from "./coach-insights";

// ── Public API ──────────────────────────────────────────────────────────────

export function getCoachContent(state: CreateFlowState): CoachContent {
  switch (state.phase) {
    case "intake":
      return getIntakeCoach(state);
    case "strategy":
      return getStrategyCoach(state);
    case "draft":
      return getDraftCoach(state);
    case "finalize":
      return getFinalizeCoach(state);
  }
}

// ── Intake Phase ────────────────────────────────────────────────────────────

function getIntakeCoach(state: CreateFlowState): CoachContent {
  if (state.files.length === 0 && !state.extractedData) {
    return {
      ...emptyCoach(),
      whyItMatters: "Waiting for your RFP document to begin analysis.",
      signals: ["Supports PDF, DOCX, TXT, and XLSX formats"],
    };
  }

  if (state.isExtracting) {
    const stepLabel =
      state.extractionStep === "uploading"
        ? "Uploading"
        : state.extractionStep === "processing"
          ? "Processing document content"
          : state.extractionStep === "extracting"
            ? "AI is extracting key details"
            : "Analyzing";
    return {
      ...emptyCoach(),
      whyItMatters: stepLabel,
      signals: [`${state.files.length} file(s) being analyzed`],
    };
  }

  if (state.extractedData) {
    return buildExtractionCompleteCoach(state);
  }

  return {
    ...emptyCoach(),
    whyItMatters: `${state.files.length} file(s) ready for extraction.`,
    signals: [`${state.files.length} document(s) uploaded`],
  };
}

function buildExtractionCompleteCoach(state: CreateFlowState): CoachContent {
  const data = state.extractedData!;
  const reqCount = data.extracted.key_requirements?.value?.length ?? 0;
  const evalCount = data.rfp_analysis?.evaluation_criteria?.length ?? 0;
  const clientName = data.extracted.client_name?.value ?? "Unknown";

  const signals: string[] = [
    `${reqCount} requirement(s) found`,
    `${evalCount} evaluation criteria`,
  ];
  if (clientName !== "Unknown") signals.push(`Agency: ${clientName}`);

  const solType =
    data.extracted.solicitation_type?.value ??
    data.inferred.solicitation_type?.value;
  if (solType) signals.push(`Type: ${solType}`);

  const riskFlags: RiskFlag[] = data.gaps
    .filter((g) => g.importance === "critical")
    .map((g) => ({
      id: `gap-${g.field}`,
      label: `Missing: ${g.field.replace(/_/g, " ")}`,
      severity: "high" as const,
    }));

  return {
    whyItMatters: `Found ${reqCount} requirements, ${evalCount} eval criteria. Agency: ${clientName}.`,
    signals,
    riskFlags,
    citations: buildSourceCitations(data.source_documents),
    actions: [],
    insights: buildIntakeInsights(data),
    prompts: buildIntakePrompts(data),
  };
}

// ── Strategy Phase ──────────────────────────────────────────────────────────

function getStrategyCoach(state: CreateFlowState): CoachContent {
  if (!state.bidEvaluation) {
    return {
      ...emptyCoach(),
      whyItMatters: "Evaluating opportunity fit...",
      signals: ["Scoring in progress"],
    };
  }

  const score = state.bidEvaluation.weighted_total;
  const factorSignals = buildFactorSignals(state);
  const insights = buildStrategyInsights(state);

  const citations = state.winThemes
    .filter((t) => t.confirmed)
    .map((t) => ({ id: t.id, label: t.label }));

  let whyItMatters: string;
  let riskFlags: RiskFlag[];

  if (score < 40) {
    whyItMatters =
      "Score is below typical win threshold. Consider passing, teaming, or identifying a strong differentiator.";
    riskFlags = [{ id: "low-score", label: "Low bid score", severity: "high" }];
  } else if (score <= 70) {
    whyItMatters =
      "Moderate alignment. Strong win themes can bridge the gap — select themes that highlight your unique strengths.";
    riskFlags = [
      { id: "moderate-score", label: "Moderate bid score", severity: "medium" },
    ];
  } else {
    whyItMatters =
      "Strong alignment with opportunity. Focus win themes on your best differentiators.";
    riskFlags = [
      { id: "good-score", label: "Strong alignment", severity: "low" },
    ];
  }

  return {
    whyItMatters,
    signals: [`Bid score: ${score}/100`, ...factorSignals],
    riskFlags,
    citations,
    actions: [],
    insights,
  };
}

function buildFactorSignals(state: CreateFlowState): string[] {
  if (!state.bidEvaluation) return [];
  const scores = state.bidEvaluation.ai_scores;
  return SCORING_FACTORS.map((f) => `${f.label}: ${scores[f.key]?.score ?? 0}`);
}

// ── Draft Phase ─────────────────────────────────────────────────────────────

function draftSectionStats(state: CreateFlowState) {
  const total = state.sections.length;
  const complete = state.sections.filter(
    (s) => s.generationStatus === "complete",
  ).length;
  const failed = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;
  const unreviewed = state.sections.filter(
    (s) => s.generationStatus === "complete" && !s.reviewed,
  ).length;
  return { total, complete, failed, unreviewed };
}

function getDraftCoach(state: CreateFlowState): CoachContent {
  const { total, complete, failed, unreviewed } = draftSectionStats(state);
  const insights = buildDraftInsights(state);

  if (state.generationStatus === "generating") {
    const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
    return {
      ...emptyCoach(),
      whyItMatters:
        "AI is generating your proposal sections. Each section is tailored to your RFP and win themes.",
      signals: [`${complete}/${total} sections complete (${pct}%)`],
      insights,
    };
  }

  return buildDraftCompleteCoach(
    state,
    { complete, total, failed, unreviewed },
    insights,
  );
}

function buildDraftCompleteCoach(
  state: CreateFlowState,
  stats: {
    complete: number;
    total: number;
    failed: number;
    unreviewed: number;
  },
  insights: CoachContent["insights"],
): CoachContent {
  const { complete, total, failed, unreviewed } = stats;
  const riskFlags: RiskFlag[] = [];
  if (failed > 0)
    riskFlags.push({
      id: "gen-failed",
      label: `Generation failed for ${failed} section(s)`,
      severity: "high",
    });
  if (unreviewed > 0)
    riskFlags.push({
      id: "unreviewed",
      label: `${unreviewed} section(s) not yet reviewed`,
      severity: "medium",
    });

  return {
    whyItMatters:
      complete === total && failed === 0
        ? "All sections generated. Review each section before continuing to finalize."
        : `${complete}/${total} sections generated. Review completed sections while others finish.`,
    signals: [
      `${complete}/${total} sections complete`,
      ...(failed > 0 ? [`${failed} failed`] : []),
    ],
    riskFlags,
    citations: buildSourceCitations(state.extractedData?.source_documents),
    actions: [],
    insights,
  };
}

// ── Finalize Phase ──────────────────────────────────────────────────────────

function getFinalizeCoach(state: CreateFlowState): CoachContent {
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);
  const insights = buildFinalizeInsights(state);

  if (unresolvedBlockers.length > 0) {
    const riskFlags: RiskFlag[] = unresolvedBlockers.map((b) => ({
      id: b.id,
      label: b.label,
      severity: "high" as const,
    }));

    return {
      whyItMatters: `Address ${unresolvedBlockers.length} issue(s) before export.`,
      signals: unresolvedBlockers.map((b) => b.label),
      riskFlags,
      citations: [],
      actions: [],
      insights,
    };
  }

  return {
    whyItMatters: `Confidence: ${state.confidence}%. Ready to export.`,
    signals: [`Confidence score: ${state.confidence}%`],
    riskFlags: [],
    citations: [],
    actions: [{ label: "Export DOCX", actionType: "export_docx" }],
    insights,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptyCoach(): CoachContent {
  return {
    whyItMatters: "",
    signals: [],
    riskFlags: [],
    citations: [],
    actions: [],
  };
}

function buildSourceCitations(
  docs?: { id: string; name: string; type: string }[],
): CoachContent["citations"] {
  if (!docs || docs.length === 0) return [];
  return docs.map((d) => ({ id: d.id, label: d.name }));
}
