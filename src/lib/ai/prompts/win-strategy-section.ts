import type { WinStrategyData } from "@/types/outcomes";

/**
 * Builds the "Win Strategy & Target Outcomes" section to inject into any prompt.
 * Returns empty string if no win strategy is provided.
 */
export function buildWinStrategySection(
  winStrategy?: WinStrategyData | null,
): string {
  if (!winStrategy || !winStrategy.win_themes?.length) return "";

  return `
## Win Strategy & Target Outcomes (NORTH STAR)
These outcomes were defined by the proposal team. Every part of this section should directly support achieving these outcomes.

### Win Themes: ${winStrategy.win_themes.join(", ")}

### Target Outcomes:
${(winStrategy.target_outcomes ?? []).map((o) => `- [${o.priority.toUpperCase()}] ${o.outcome}`).join("\n")}

### Key Differentiators: ${(winStrategy.differentiators ?? []).join(", ")}

### Success Metrics: ${(winStrategy.success_metrics ?? []).join(", ")}
`;
}
