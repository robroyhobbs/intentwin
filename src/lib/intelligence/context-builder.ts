/**
 * Intelligence context builder.
 *
 * Pure functions that convert intelligence data into prompt strings
 * for injection into LLM prompts (bid scoring, section generation, etc.).
 *
 * Design: these are pure functions with no side effects, no DB calls,
 * and no external dependencies. Input intelligence data, output strings.
 */

import type {
  AgencyProfileResponse,
  PricingLookupResponse,
  WinProbabilityResponse,
  CompetitiveLandscapeResponse,
} from "./types";
import {
  buildAgencySectionLines,
  buildPricingBenchmarkMap,
  buildPricingSectionLines,
} from "./context-builder-helpers";

/**
 * Build a context string from agency and pricing intelligence for LLM prompts.
 *
 * Returns empty string if both inputs are null (graceful no-op).
 * Does NOT include awardee names or internal IDs.
 */
export function buildIntelligenceContext(
  agency: AgencyProfileResponse | null,
  pricing: PricingLookupResponse | null,
): string {
  const parts: string[] = [];

  if (agency) {
    parts.push(...buildAgencySectionLines(agency));
  }

  if (pricing) {
    const pricingSection = buildPricingSectionLines(pricing);
    if (pricingSection.length > 0) {
      parts.push(...pricingSection);
    }
  }

  return parts.join("\n");
}

/**
 * Build a prompt context string from win probability data.
 *
 * Includes the probability percentage, confidence level,
 * factor breakdown (helps/hurts), and comparable awards summary.
 */
export function buildWinProbabilityContext(
  prob: WinProbabilityResponse,
): string {
  const lines: string[] = [];

  lines.push("## Win Probability Analysis (Data-Driven)");
  lines.push(
    `Estimated win probability: ${(prob.probability * 100).toFixed(0)}% (confidence: ${prob.confidence})`,
  );
  lines.push(`Based on ${prob.matching_awards} similar historical awards`);

  // Factor breakdown
  const factors = Array.isArray(prob.factors) ? prob.factors : [];
  const helpingFactors = factors.filter((f) => f.impact > 0);
  const hurtingFactors = factors.filter((f) => f.impact < 0);

  if (helpingFactors.length > 0) {
    lines.push("\nFactors that help:");
    for (const f of helpingFactors) {
      lines.push(`  + ${f.name}: ${f.description} (+${(f.impact * 100).toFixed(0)}%)`);
    }
  }

  if (hurtingFactors.length > 0) {
    lines.push("\nFactors that hurt:");
    for (const f of hurtingFactors) {
      lines.push(`  - ${f.name}: ${f.description} (${(f.impact * 100).toFixed(0)}%)`);
    }
  }

  // Comparable awards summary (without awardee names to avoid LLM referencing competitors)
  if (Array.isArray(prob.comparable_awards) && prob.comparable_awards.length > 0) {
    lines.push(
      `\n${prob.comparable_awards.length} comparable awards found (avg competition: ${prob.comparable_awards.map((a) => a.competition_type).filter(Boolean).join(", ")})`,
    );
  }

  return lines.join("\n");
}

/**
 * Build a pricing suggestions context string for cost/pricing section prompts.
 *
 * Formats GSA CALC+ rate benchmarks as "Market Rate: $X/hr" for each
 * extracted labor category. Only includes categories that have matching
 * benchmarks with valid median rates.
 *
 * Returns empty string if pricing is null, no labor categories, or no matches.
 */
export function buildPricingSuggestionsContext(
  pricing: PricingLookupResponse | null,
  laborCategories: string[],
): string {
  if (!pricing || laborCategories.length === 0) return "";
  if (!Array.isArray(pricing.rate_benchmarks)) return "";

  // Build a case-insensitive lookup map from category name → benchmark
  const benchmarkMap = buildPricingBenchmarkMap(pricing);

  // Match requested labor categories against available benchmarks
  const matchedBenchmarks: (typeof pricing.rate_benchmarks)[0][] = [];
  for (const category of laborCategories) {
    const match = benchmarkMap.get(category.toLowerCase());
    if (match) {
      matchedBenchmarks.push(match);
    }
  }

  if (matchedBenchmarks.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Pricing Benchmarks (GSA CALC+ Data)");
  lines.push("Use these market rates as reference when discussing pricing:");
  lines.push("");

  for (const benchmark of matchedBenchmarks) {
    let line = `- **${benchmark.category}**: Market Rate: $${benchmark.gsa_median}/hr`;
    if (benchmark.gsa_range) {
      line += ` (Range: $${benchmark.gsa_range[0]}-$${benchmark.gsa_range[1]})`;
    }
    line += ` — ${benchmark.data_points} data points`;
    lines.push(line);
  }

  if (Array.isArray(pricing.cost_realism_notes) && pricing.cost_realism_notes.length > 0) {
    lines.push("");
    lines.push("Pricing notes:");
    for (const note of pricing.cost_realism_notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

/**
 * Build an agency-specific evaluation guidance context for section generation prompts.
 *
 * Includes the agency's preferred eval method, criteria weights, common contract types,
 * and competition level. Framed as guidance so the LLM can tailor section content
 * to what this specific agency cares about.
 *
 * Returns empty string if agency is null.
 */
export function buildAgencySectionContext(
  agency: AgencyProfileResponse | null,
): string {
  if (!agency) return "";

  const lines: string[] = [];
  lines.push("## Agency Evaluation Guidance (Data-Driven)");
  lines.push(`Agency: ${agency.agency_name} (${agency.agency_level})`);

  if (agency.preferred_eval_method) {
    lines.push(
      `This agency typically evaluates using the "${agency.preferred_eval_method}" method.`,
    );
  }

  if (agency.typical_criteria_weights) {
    const sortedWeights = Object.entries(agency.typical_criteria_weights)
      .sort(([, a], [, b]) => b - a);
    lines.push("Evaluation criteria emphasis (tailor content accordingly):");
    for (const [factor, weight] of sortedWeights) {
      lines.push(`  - ${factor}: ${weight}%`);
    }
  }

  if (agency.common_contract_types && agency.common_contract_types.length > 0) {
    lines.push(
      `Common contract types: ${agency.common_contract_types.join(", ")}`,
    );
  }

  if (agency.avg_num_offers != null) {
    lines.push(`Average competing offers: ${agency.avg_num_offers}`);
    if (agency.avg_num_offers > 5) {
      lines.push(
        "NOTE: This is a highly competitive environment — emphasize differentiation and concrete evidence.",
      );
    }
  }

  return lines.join("\n");
}

/**
 * Build a prompt context string from competitive landscape data.
 *
 * Includes top competitors, average award size, and competition breakdown.
 * Intentionally includes competitor names — this is for internal analysis,
 * not for injecting into generated proposal text.
 */
export function buildCompetitiveLandscapeContext(
  landscape: CompetitiveLandscapeResponse,
): string {
  const lines: string[] = [];

  lines.push("## Competitive Landscape (Data-Driven)");
  lines.push(
    `Total similar awards in this agency/NAICS: ${landscape.total_similar_awards}`,
  );

  if (landscape.avg_award_amount != null) {
    lines.push(
      `Average award amount: $${landscape.avg_award_amount.toLocaleString()}`,
    );
  }

  if (landscape.avg_offers != null) {
    lines.push(
      `Average competing offers: ${landscape.avg_offers.toFixed(1)}`,
    );
  }

  // Top competitors
  if (landscape.top_competitors.length > 0) {
    lines.push("\nTop competitors (by wins):");
    for (const comp of landscape.top_competitors.slice(0, 5)) {
      lines.push(
        `  - ${comp.name}: ${comp.wins} wins, $${comp.total_value.toLocaleString()} total value`,
      );
    }
  }

  // Competition type breakdown
  const mixEntries = Object.entries(landscape.competition_mix);
  if (mixEntries.length > 0) {
    lines.push("\nCompetition type breakdown:");
    for (const [type, count] of mixEntries) {
      lines.push(`  - ${type}: ${count} awards`);
    }
  }

  return lines.join("\n");
}
