export function buildOutcomesPrompt(
  intakeData: Record<string, unknown>
): string {
  return `Analyze the following proposal opportunity and generate a win strategy with specific outcomes.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Instructions
Based on this opportunity, generate a comprehensive win strategy. Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

{
  "win_themes": ["theme1", "theme2", "theme3"],
  "success_metrics": ["metric1", "metric2", "metric3", "metric4"],
  "differentiators": ["diff1", "diff2", "diff3"],
  "target_outcomes": [
    {
      "outcome": "Specific measurable outcome description",
      "category": "cost_optimization",
      "priority": "high"
    }
  ]
}

Requirements:
- **win_themes** (3-5): High-level strategic themes that should run through the entire proposal. These are the "big ideas" that resonate with the client.
- **success_metrics** (4-6): Specific, measurable metrics the client cares about. Be concrete (e.g., "Reduce infrastructure costs by 30%" not "Save money").
- **differentiators** (3-4): What makes your company uniquely positioned for THIS engagement. Tie to the client's specific situation.
- **target_outcomes** (5-8): Specific outcomes organized by category. Each must be:
  - Specific to the client's industry and situation
  - Measurable or observable
  - Categorized as one of: cost_optimization, speed_to_value, quality_improvement, risk_reduction, innovation, compliance
  - Prioritized as high, medium, or low

Make everything specific to the client's industry (${intakeData.client_industry}), engagement type (${intakeData.opportunity_type}), and stated needs. Avoid generic consulting language.`;
}
