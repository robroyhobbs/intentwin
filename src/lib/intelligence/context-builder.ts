/**
 * Intelligence context builder.
 *
 * Pure functions that convert intelligence data into prompt strings
 * for injection into LLM prompts (bid scoring, section generation, etc.).
 *
 * Design: these are pure functions with no side effects, no DB calls,
 * and no external dependencies. Input intelligence data, output strings.
 */

import type { AgencyProfileResponse, PricingLookupResponse } from "./types";

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
    parts.push(...buildAgencySection(agency));
  }

  if (pricing) {
    const pricingSection = buildPricingSection(pricing);
    if (pricingSection.length > 0) {
      parts.push(...pricingSection);
    }
  }

  return parts.join("\n");
}

function buildAgencySection(agency: AgencyProfileResponse): string[] {
  const lines: string[] = [];

  lines.push("## Agency Intelligence (Data-Driven)");
  lines.push(`Agency: ${agency.agency_name} (${agency.agency_level})`);

  if (agency.preferred_eval_method) {
    lines.push(
      `Preferred evaluation method: ${agency.preferred_eval_method}`,
    );
  }

  if (agency.typical_criteria_weights) {
    lines.push("Typical evaluation weights:");
    for (const [factor, weight] of Object.entries(
      agency.typical_criteria_weights,
    )) {
      lines.push(`  - ${factor}: ${weight}%`);
    }
  }

  if (agency.avg_num_offers != null) {
    lines.push(
      `Average competing offers: ${agency.avg_num_offers}`,
    );
  }

  if (agency.total_awards_tracked > 0) {
    lines.push(
      `Based on ${agency.total_awards_tracked} tracked awards`,
    );
  }

  if (agency.avg_award_amount != null) {
    lines.push(
      `Average award amount: $${agency.avg_award_amount.toLocaleString()}`,
    );
  }

  if (agency.protest_insights && agency.protest_insights.length > 0) {
    lines.push("Key insights from procurement protests:");
    for (const insight of agency.protest_insights.slice(0, 5)) {
      lines.push(`  - ${insight}`);
    }
  }

  // Intentionally NOT including recent_awards awardee names
  // to prevent the LLM from referencing specific competitors.

  return lines;
}

function buildPricingSection(pricing: PricingLookupResponse): string[] {
  // Only include if there are benchmarks with actual data
  const validBenchmarks = pricing.rate_benchmarks.filter(
    (r) => r.gsa_median != null,
  );

  if (validBenchmarks.length === 0) return [];

  const lines: string[] = [];

  lines.push("\n## Pricing Intelligence (GSA Data)");
  for (const rate of validBenchmarks) {
    const range = rate.gsa_range
      ? ` (range: $${rate.gsa_range[0]}-$${rate.gsa_range[1]})`
      : "";
    lines.push(
      `${rate.category}: Median $${rate.gsa_median}/hr${range} (${rate.data_points} data points)`,
    );
  }

  if (pricing.cost_realism_notes.length > 0) {
    lines.push("\nPricing notes:");
    for (const note of pricing.cost_realism_notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines;
}
