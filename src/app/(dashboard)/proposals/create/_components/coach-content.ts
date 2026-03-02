// ── Coach Content Generator ── Rule-based content per phase ─────────────────

import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type { CoachContent, CreateFlowState, RiskFlag } from "./create-types";

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
  const base: CoachContent = {
    whyItMatters: "",
    signals: [],
    riskFlags: [],
    citations: [],
    actions: [],
  };

  if (state.files.length === 0 && !state.extractedData) {
    return {
      ...base,
      whyItMatters: "Upload your RFP to get started.",
      signals: ["No documents uploaded yet"],
    };
  }

  if (state.isExtracting) {
    return {
      ...base,
      whyItMatters: "Analyzing your documents...",
      signals: [`Processing ${state.files.length} file(s)`],
    };
  }

  if (state.extractedData) {
    return buildExtractionCompleteCoach(state);
  }

  return {
    ...base,
    whyItMatters: `${state.files.length} file(s) ready for extraction.`,
    signals: [`${state.files.length} document(s) uploaded`],
  };
}

function buildExtractionCompleteCoach(state: CreateFlowState): CoachContent {
  const data = state.extractedData;
  if (!data) {
    return emptyCoach();
  }

  const reqCount = data.extracted.key_requirements?.value?.length ?? 0;
  const evalCount = data.rfp_analysis?.evaluation_criteria?.length ?? 0;
  const clientName = data.extracted.client_name?.value ?? "Unknown";

  const signals: string[] = [];
  signals.push(`${reqCount} requirement(s) found`);
  signals.push(`${evalCount} evaluation criteria`);
  if (clientName !== "Unknown") {
    signals.push(`Agency: ${clientName}`);
  }

  const riskFlags: RiskFlag[] = [];
  const criticalGaps = data.gaps.filter((g) => g.importance === "critical");
  for (const gap of criticalGaps) {
    riskFlags.push({
      id: `gap-${gap.field}`,
      label: `Missing: ${gap.field.replace(/_/g, " ")}`,
      severity: "high",
    });
  }

  const citations = buildSourceCitations(data.source_documents);

  return {
    whyItMatters: `Found ${reqCount} requirements, ${evalCount} eval criteria. Agency: ${clientName}.`,
    signals,
    riskFlags,
    citations,
    actions: [],
  };
}

// ── Strategy Phase ──────────────────────────────────────────────────────────

function getStrategyCoach(state: CreateFlowState): CoachContent {
  const base = emptyCoach();

  if (!state.bidEvaluation) {
    return {
      ...base,
      whyItMatters: "Evaluating opportunity fit...",
      signals: ["Scoring in progress"],
    };
  }

  const score = state.bidEvaluation.weighted_total;
  const content = buildStrategyContent(score, state);

  // Add citations from confirmed win themes
  const citations = state.winThemes
    .filter((t) => t.confirmed)
    .map((t) => ({ id: t.id, label: t.label }));

  return { ...content, citations };
}

function buildStrategyContent(
  score: number,
  state: CreateFlowState,
): CoachContent {
  const factorSignals = buildFactorSignals(state);
  const base = emptyCoach();

  if (score < 40) {
    return {
      ...base,
      whyItMatters: "Below typical win threshold. Consider passing or teaming.",
      signals: [`Bid score: ${score}`, ...factorSignals],
      riskFlags: [
        { id: "low-score", label: "Low bid score", severity: "high" },
      ],
    };
  }

  if (score <= 70) {
    return {
      ...base,
      whyItMatters: "Moderate fit. Review factors carefully.",
      signals: [`Bid score: ${score}`, ...factorSignals],
      riskFlags: [
        {
          id: "moderate-score",
          label: "Moderate bid score",
          severity: "medium",
        },
      ],
    };
  }

  return {
    ...base,
    whyItMatters: "Strong fit. Past performance aligns well.",
    signals: [`Bid score: ${score}`, ...factorSignals],
    riskFlags: [
      { id: "good-score", label: "Strong alignment", severity: "low" },
    ],
  };
}

function buildFactorSignals(state: CreateFlowState): string[] {
  if (!state.bidEvaluation) return [];
  const scores = state.bidEvaluation.ai_scores;
  return SCORING_FACTORS.map((f) => {
    const factorScore = scores[f.key]?.score ?? 0;
    return `${f.label}: ${factorScore}`;
  });
}

// ── Draft Phase ─────────────────────────────────────────────────────────────

function getDraftCoach(state: CreateFlowState): CoachContent {
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

  if (state.generationStatus === "generating") {
    return buildDraftGeneratingCoach(complete, total);
  }

  return buildDraftCompleteCoach(state, complete, total, failed, unreviewed);
}

function buildDraftGeneratingCoach(
  complete: number,
  total: number,
): CoachContent {
  return {
    whyItMatters: "Sections are being generated...",
    signals: [`${complete}/${total} sections complete`],
    riskFlags: [],
    citations: [],
    actions: [],
  };
}

function buildDraftCompleteCoach(
  state: CreateFlowState,
  complete: number,
  total: number,
  failed: number,
  unreviewed: number,
): CoachContent {
  const riskFlags: RiskFlag[] = [];
  if (failed > 0) {
    riskFlags.push({
      id: "gen-failed",
      label: `Generation failed for ${failed} section(s)`,
      severity: "high",
    });
  }
  if (unreviewed > 0) {
    riskFlags.push({
      id: "unreviewed",
      label: `${unreviewed} section(s) not yet reviewed`,
      severity: "medium",
    });
  }

  const citations = buildSourceCitations(state.extractedData?.source_documents);

  return {
    whyItMatters:
      complete === total && failed === 0
        ? "All sections generated. Review each section."
        : `${complete}/${total} sections generated.`,
    signals: [
      `${complete}/${total} sections complete`,
      ...(failed > 0 ? [`${failed} failed`] : []),
    ],
    riskFlags,
    citations,
    actions: [],
  };
}

// ── Finalize Phase ──────────────────────────────────────────────────────────

function getFinalizeCoach(state: CreateFlowState): CoachContent {
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);

  if (unresolvedBlockers.length > 0) {
    return buildFinalizeBlockedCoach(unresolvedBlockers);
  }

  return {
    whyItMatters: `Confidence: ${state.confidence}%. Ready to export.`,
    signals: [`Confidence score: ${state.confidence}%`],
    riskFlags: [],
    citations: [],
    actions: [{ label: "Export DOCX", actionType: "export_docx" }],
  };
}

function buildFinalizeBlockedCoach(
  blockers: CreateFlowState["blockers"],
): CoachContent {
  const riskFlags: RiskFlag[] = blockers.map((b) => ({
    id: b.id,
    label: b.label,
    severity: "high" as const,
  }));

  return {
    whyItMatters: `Address ${blockers.length} issue(s) before export.`,
    signals: blockers.map((b) => b.label),
    riskFlags,
    citations: [],
    actions: [],
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
