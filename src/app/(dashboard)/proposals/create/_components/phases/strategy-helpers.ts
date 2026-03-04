import type { Dispatch } from "react";
import type { CreateAction } from "../create-types";
import type { WinTheme } from "../create-types";
import type { ExtractedIntake } from "@/types/intake";
import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { logger } from "@/lib/utils/logger";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

// ── API response types ──────────────────────────────────────────────────────

interface BidEvaluationApiResponse {
  status: string;
  evaluation: BidEvaluation;
}

interface WinStrategyApiResponse {
  win_strategy: {
    win_themes: string[];
    success_metrics: string[];
    differentiators: string[];
    target_outcomes: {
      id: string;
      outcome: string;
      category: string;
      priority: string;
    }[];
    generated_at: string;
  };
}

// ── Flatten extracted data into bid-evaluation request shape ─────────────────

export function buildRfpRequirements(extracted: ExtractedIntake) {
  const ext = extracted.extracted;
  return {
    title: ext.scope_description?.value ?? "",
    client_name: ext.client_name?.value ?? "",
    agency: ext.client_name?.value ?? "",
    scope: ext.scope_description?.value ?? "",
    requirements: ext.key_requirements?.value ?? [],
    budget_range: ext.budget_range?.value ?? "",
    evaluation_criteria: ext.decision_criteria?.value ?? [],
    compliance_requirements: ext.compliance_requirements?.value ?? [],
    technical_environment: ext.technical_environment?.value ?? "",
    source_text: extracted.source_text ?? "",
  };
}

// ── Flatten extracted data into win-strategy request shape ───────────────────

export function buildIntakeData(extracted: ExtractedIntake) {
  const ext = extracted.extracted;
  return {
    client_name: ext.client_name?.value ?? "",
    client_industry: ext.client_industry?.value ?? "",
    scope_description: ext.scope_description?.value ?? "",
    current_state_pains: ext.current_state_pains?.value ?? [],
    desired_outcomes: ext.desired_outcomes?.value ?? [],
    budget_range: ext.budget_range?.value ?? "",
    timeline_expectation: ext.timeline?.value ?? "",
  };
}

// ── Map API win_themes (string[]) to WinTheme[] ─────────────────────────────

function mapWinThemes(themes: string[]): WinTheme[] {
  return themes.map((label, i) => ({
    id: `theme-${i}`,
    label,
    description: "",
    confirmed: true,
  }));
}

// ── Fetch bid evaluation from API ───────────────────────────────────────────

export async function fetchBidEvaluation(
  extractedData: ExtractedIntake,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<void> {
  try {
    const rfpRequirements = buildRfpRequirements(extractedData);

    const res = await fetchFn("/api/intake/bid-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfp_requirements: rfpRequirements }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as Record<string, string>).message ?? res.statusText;
      throw new Error(`Bid evaluation failed: ${msg}`);
    }

    const data = (await res.json()) as BidEvaluationApiResponse;
    dispatch({ type: "SET_BID_EVALUATION", evaluation: data.evaluation });

    logger.info("Bid evaluation complete", {
      weightedTotal: data.evaluation.weighted_total,
      recommendation: data.evaluation.recommendation,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Bid evaluation failed";
    logger.error("Bid evaluation error", { error: message });
    throw err;
  }
}

// ── Fetch win strategy from API ─────────────────────────────────────────────

export async function fetchWinStrategy(
  extractedData: ExtractedIntake,
  dispatch: Dispatch<CreateAction>,
  fetchFn: FetchFn,
): Promise<void> {
  try {
    const intakeData = buildIntakeData(extractedData);

    const res = await fetchFn("/api/proposals/temp/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake_data: intakeData }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as Record<string, string>).message ?? res.statusText;
      throw new Error(`Win strategy generation failed: ${msg}`);
    }

    const data = (await res.json()) as WinStrategyApiResponse;
    const themes = mapWinThemes(data.win_strategy.win_themes);
    dispatch({ type: "SET_WIN_THEMES", themes });

    logger.info("Win strategy generated", {
      themeCount: themes.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Win strategy generation failed";
    logger.error("Win strategy error", { error: message });
    throw err;
  }
}

// ── Score color helpers ─────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score > 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-300";
  return "text-red-400";
}

export function getScoreBgColor(score: number): string {
  if (score > 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

export function getRecommendationBadge(rec: string): {
  label: string;
  className: string;
} {
  switch (rec) {
    case "bid":
      return {
        label: "Bid",
        className:
          "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      };
    case "evaluate":
      return {
        label: "Evaluate",
        className: "border border-amber-500/30 bg-amber-500/15 text-amber-200",
      };
    default:
      return {
        label: "Pass",
        className: "border border-red-500/30 bg-red-500/15 text-red-300",
      };
  }
}
