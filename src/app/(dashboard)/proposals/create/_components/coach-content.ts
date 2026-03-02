// ── Coach Content Generator ── Advisory content per phase ────────────────────
// Generates contextual guidance, risk flags, insights, and prompts.
// Does NOT duplicate status info already visible in the main workspace.

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
      whyItMatters:
        "Upload your RFP document or paste a URL to get started. We'll automatically extract requirements, evaluation criteria, deadlines, and compliance needs.",
    };
  }

  if (state.isExtracting) {
    const stepLabel =
      state.extractionStep === "uploading"
        ? "Uploading your document..."
        : state.extractionStep === "processing"
          ? "Processing document content — this can take a minute for large files."
          : state.extractionStep === "extracting"
            ? "AI is analyzing the document and extracting key details."
            : "Analyzing your document...";
    return { ...emptyCoach(), whyItMatters: stepLabel };
  }

  if (state.extractedData) {
    return buildExtractionCompleteCoach(state);
  }

  return {
    ...emptyCoach(),
    whyItMatters:
      "Your files are ready. Click to begin extraction — we'll pull out requirements, evaluation criteria, and identify any gaps.",
  };
}

function buildExtractionCompleteCoach(state: CreateFlowState): CoachContent {
  const data = state.extractedData!;
  const criticalGaps = data.gaps.filter((g) => g.importance === "critical");

  const riskFlags: RiskFlag[] = criticalGaps.map((g) => ({
    id: `gap-${g.field}`,
    label: `Missing: ${g.field.replace(/_/g, " ")}`,
    severity: "high" as const,
  }));

  const advisory =
    criticalGaps.length > 0
      ? "Extraction complete but some critical information is missing. Fill in the gaps below using the Buyer Goal field or re-upload a more complete document."
      : "Extraction looks good. Review the summary and add any context via the Buyer Goal field before moving to Strategy.";

  return {
    whyItMatters: advisory,
    signals: [],
    riskFlags,
    citations: [],
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
      whyItMatters:
        "Analyzing your opportunity against your firm's capabilities and past performance...",
    };
  }

  const score = state.bidEvaluation.weighted_total;
  const insights = buildStrategyInsights(state);

  let whyItMatters: string;
  let riskFlags: RiskFlag[];

  if (score < 40) {
    whyItMatters =
      "This opportunity has weak alignment with your capabilities. Review the factor rationales below — consider passing, teaming with a partner, or identifying a unique differentiator before proceeding.";
    riskFlags = [{ id: "low-score", label: "Low bid score", severity: "high" }];
  } else if (score <= 70) {
    whyItMatters =
      "Moderate alignment — winnable with the right strategy. Review factor rationales below and select win themes that compensate for weaker areas.";
    riskFlags = [
      { id: "moderate-score", label: "Moderate alignment", severity: "medium" },
    ];
  } else {
    whyItMatters =
      "Strong fit. Focus on selecting win themes that emphasize your best differentiators. The factor rationales below show where you excel.";
    riskFlags = [];
  }

  return {
    whyItMatters,
    signals: [],
    riskFlags,
    citations: [],
    actions: [],
    insights,
  };
}

// ── Draft Phase ─────────────────────────────────────────────────────────────

function getDraftCoach(state: CreateFlowState): CoachContent {
  const insights = buildDraftInsights(state);
  const failed = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;
  const unreviewed = state.sections.filter(
    (s) => s.generationStatus === "complete" && !s.reviewed,
  ).length;

  if (state.generationStatus === "generating") {
    return {
      ...emptyCoach(),
      whyItMatters:
        "Sections are being generated using your RFP analysis and win themes. Review each one as it completes — you can regenerate any section that needs improvement.",
      insights,
    };
  }

  const riskFlags: RiskFlag[] = [];
  if (failed > 0)
    riskFlags.push({
      id: "gen-failed",
      label: `${failed} section(s) failed`,
      severity: "high",
    });
  if (unreviewed > 0)
    riskFlags.push({
      id: "unreviewed",
      label: `${unreviewed} unreviewed`,
      severity: "medium",
    });

  const advisory =
    failed > 0
      ? "Some sections failed to generate. Try regenerating them — the AI will attempt a different approach."
      : unreviewed > 0
        ? "Review each section before finalizing. Check that the content addresses the evaluation criteria shown in the analysis below."
        : "All sections reviewed. Continue to finalize when ready.";

  return {
    whyItMatters: advisory,
    signals: [],
    riskFlags,
    citations: [],
    actions: [],
    insights,
  };
}

// ── Finalize Phase ──────────────────────────────────────────────────────────

function getFinalizeCoach(state: CreateFlowState): CoachContent {
  const unresolvedBlockers = state.blockers.filter((b) => !b.resolved);
  const insights = buildFinalizeInsights(state);

  const riskFlags: RiskFlag[] = unresolvedBlockers.map((b) => ({
    id: b.id,
    label: b.label,
    severity: "high" as const,
  }));

  const whyItMatters = buildFinalizeSummary(state);

  return {
    whyItMatters,
    signals: [],
    riskFlags,
    citations: [],
    actions: [],
    insights,
  };
}

function buildFinalizeSummary(state: CreateFlowState): string {
  const parts: string[] = [];
  const ev = state.bidEvaluation;
  const data = state.extractedData;

  // Proposal summary
  const client = data?.extracted?.client_name?.value;
  const type = data?.extracted?.solicitation_type?.value;
  if (client || type) {
    parts.push(`${type || "Proposal"} for ${client || "this opportunity"}.`);
  }

  // Bid fit vs completion distinction
  if (ev) {
    const score = Math.round(ev.weighted_total);
    const rec = ev.recommendation;
    const recLabel =
      rec === "bid" ? "Bid" : rec === "evaluate" ? "Evaluate" : "Pass";
    parts.push(
      `Bid fit: ${score}/100 (${recLabel}). This measures how well the opportunity matches your capabilities — not proposal quality.`,
    );
  }

  // Sections status
  const completed = state.sections.filter(
    (s) => s.generationStatus === "complete",
  ).length;
  const failed = state.sections.filter(
    (s) => s.generationStatus === "failed",
  ).length;
  if (failed > 0) {
    parts.push(
      `${completed} sections generated, ${failed} failed. Regenerate failed sections before exporting.`,
    );
  }

  // Final CTA
  if (state.finalApproved) {
    parts.push("Ready to export. Download as DOCX or PDF for submission.");
  } else {
    parts.push("Review the summary below, then approve to export.");
  }

  return parts.join(" ");
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
