/**
 * Shared outcome/win-strategy generation logic.
 *
 * Used by both:
 * - POST /api/proposals/[id]/outcomes (proposal-scoped)
 * - POST /api/proposals/temp/outcomes (pre-proposal)
 *
 * @module ai/generate-outcomes
 */

import { generateText } from "./gemini";
import { buildOutcomesPrompt } from "./prompts/outcomes";
import { getIndustryConfig } from "./industry-configs";
import type { WinStrategyData } from "@/types/outcomes";

/**
 * Generate win strategy outcomes from intake data.
 * Returns the structured WinStrategyData or throws on parse failure.
 */
export async function generateWinStrategy(
  intakeData: Record<string, unknown>,
): Promise<WinStrategyData> {
  // Build prompt with industry-specific win themes if available
  const industryConfig = getIndustryConfig(
    (intakeData.client_industry as string) || "",
  );
  let prompt = buildOutcomesPrompt(intakeData);
  if (industryConfig && industryConfig.winThemes.length > 0) {
    prompt += `\n\n## Industry Win Themes\nFor the ${industryConfig.displayName} sector, consider incorporating these proven win themes:\n${industryConfig.winThemes.map((t) => `- ${t}`).join("\n")}\n\nWeave these into the win_themes and differentiators you generate.`;
  }

  const rawResponse = await generateText(prompt, { temperature: 0.5 });

  // Parse the JSON response
  let parsed: Omit<WinStrategyData, "generated_at">;
  try {
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```$/m, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    throw new OutcomeParseError("Failed to parse AI-generated outcomes", parseError);
  }

  // Add IDs and metadata to target outcomes
  return {
    win_themes: parsed.win_themes || [],
    success_metrics: parsed.success_metrics || [],
    differentiators: parsed.differentiators || [],
    target_outcomes: (parsed.target_outcomes || []).map((o, i) => ({
      id: `outcome-${Date.now()}-${i}`,
      outcome: o.outcome,
      category: o.category || "cost_optimization",
      priority: o.priority || "medium",
      ai_suggested: true,
      user_edited: false,
    })),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Custom error for outcome parsing failures.
 * Allows callers to distinguish parse errors from other failures.
 */
export class OutcomeParseError extends Error {
  public readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "OutcomeParseError";
    this.cause = cause;
  }
}
