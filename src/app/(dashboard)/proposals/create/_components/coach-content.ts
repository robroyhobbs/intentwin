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
  buildGapItems,
  buildStrengthItems,
} from "./coach-insights";
import { buildReadinessItems } from "./coach-insights-finalize";
import { computeCapabilityAlignment } from "@/lib/ai/pipeline/capability-alignment";

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
      nextStep: "Upload your RFP document to begin",
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
    return {
      ...emptyCoach(),
      whyItMatters: stepLabel,
      nextStep: "Processing your document...",
    };
  }

  if (state.extractedData) {
    return buildExtractionCompleteCoach(state);
  }

  return {
    ...emptyCoach(),
    whyItMatters:
      "Your files are ready. Click to begin extraction — we'll pull out requirements, evaluation criteria, and identify any gaps.",
    nextStep: "Start extraction to analyze your document",
  };
}

function buildExtractionCompleteCoach(state: CreateFlowState): CoachContent {
  const data = state.extractedData!;
  const criticalGaps = data.gaps.filter((g) => g.importance === "critical");

  const riskFlags: RiskFlag[] = [];

  const advisory =
    criticalGaps.length > 0
      ? "Extraction complete but some critical information is missing. Fill in the gaps below using the Buyer Goal field or re-upload a more complete document."
      : "Extraction looks good. Review the summary and add any context via the Buyer Goal field before moving to Strategy.";

  const nextStep =
    criticalGaps.length > 0
      ? "Critical information missing — fill in gaps below"
      : "Review extraction, then continue to Strategy";

  return {
    whyItMatters: advisory,
    riskFlags,
    insights: buildIntakeInsights(data),
    prompts: buildIntakePrompts(data),
    nextStep,
  };
}

// ── Strategy Phase ──────────────────────────────────────────────────────────

function getStrategyCoach(state: CreateFlowState): CoachContent {
  if (!state.bidEvaluation) {
    return {
      ...emptyCoach(),
      whyItMatters:
        "Analyzing your opportunity against your firm's capabilities and past performance...",
      nextStep: "Analyzing your opportunity...",
    };
  }

  const ev = state.bidEvaluation;
  const gaps = buildGapItems(ev);
  const strengths = buildStrengthItems(ev);

  let whyItMatters: string;
  if (ev.recommendation === "pass") {
    whyItMatters =
      "This opportunity has weak alignment with your capabilities. Review the gaps below — consider passing, teaming with a partner, or identifying a unique differentiator before proceeding.";
  } else if (ev.recommendation === "evaluate") {
    whyItMatters =
      "Some gaps exist but the opportunity is winnable with the right strategy. Review gaps and strengths below, then select win themes that compensate for weaker areas.";
  } else {
    whyItMatters =
      "Strong fit. Focus on selecting win themes that emphasize your best differentiators. Your strengths are shown below.";
  }

  return {
    whyItMatters,
    riskFlags: [],
    insights: buildStrategyInsights(state),
    verdict: ev.recommendation,
    gaps,
    strengths,
    nextStep: "Select win themes that emphasize your strengths",
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

  // Capability alignment risk flag
  const alignment = computeCapabilityAlignment(state.bidEvaluation);

  if (state.generationStatus === "generating") {
    const genRisks: RiskFlag[] = [];
    if (alignment.level === "low") {
      genRisks.push({
        id: "low-alignment",
        label: "Low capability alignment — sections may use general framing",
        severity: "high",
      });
    }
    return {
      ...emptyCoach(),
      whyItMatters:
        "Sections are being generated using your RFP analysis and win themes. Review each one as it completes — you can regenerate any section that needs improvement.",
      riskFlags: genRisks,
      insights,
      nextStep: "Review each section as it generates",
    };
  }

  const riskFlags: RiskFlag[] = [];
  if (alignment.level === "low")
    riskFlags.push({
      id: "low-alignment",
      label: "Low capability alignment — review sections for general framing",
      severity: "high",
    });
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

  // Count sections with low/medium grounding after generation
  const lowGroundingSections = state.sections.filter(
    (s) => s.groundingLevel === "low",
  ).length;
  const medGroundingSections = state.sections.filter(
    (s) => s.groundingLevel === "medium",
  ).length;
  if (lowGroundingSections > 0) {
    insights.push({
      id: "grounding-low",
      label: "Low Grounding Sections",
      value: `${lowGroundingSections} section(s)`,
      detail:
        "These sections used aspirational framing due to insufficient evidence. Review carefully.",
      severity: "high",
    });
  }
  if (medGroundingSections > 0) {
    insights.push({
      id: "grounding-medium",
      label: "Partial Grounding Sections",
      value: `${medGroundingSections} section(s)`,
      detail:
        "These sections have some evidence gaps and used hedged language.",
      severity: "medium",
    });
  }

  const advisory =
    failed > 0
      ? "Some sections failed to generate. Try regenerating them — the AI will attempt a different approach."
      : unreviewed > 0
        ? "Review each section before finalizing. Check that the content addresses the evaluation criteria shown in the analysis below."
        : "All sections reviewed. Continue to finalize when ready.";

  const draftNextStep =
    unreviewed > 0
      ? `${unreviewed} section(s) need review before finalizing`
      : "All sections reviewed — continue to finalize";

  return {
    whyItMatters: advisory,
    riskFlags,
    insights,
    nextStep: draftNextStep,
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

  let nextStep: string;
  if (unresolvedBlockers.length > 0) {
    nextStep = `Resolve ${unresolvedBlockers.length} blocker(s) before approving`;
  } else if (!state.finalApproved) {
    nextStep = "Approve and export your proposal";
  } else {
    nextStep = "Ready to export — download as DOCX or PDF";
  }

  const ev = state.bidEvaluation;

  return {
    whyItMatters,
    riskFlags,
    insights,
    nextStep,
    readinessItems: buildReadinessItems(state),
    verdict: ev?.recommendation,
    gaps: ev ? buildGapItems(ev) : undefined,
    strengths: ev ? buildStrengthItems(ev) : undefined,
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
    riskFlags: [],
  };
}
