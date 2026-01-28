import type { WinStrategyData } from "@/types/outcomes";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildWhyCapgeminiPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null
): string {
  return `Write the "Why Capgemini" section for a Capgemini proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling differentiators section (400-600 words) that:
1. Highlights Capgemini's unique value proposition for this specific engagement
2. References strategic partnerships (AWS, Azure, GCP, SAP, etc.)
3. Mentions relevant industry recognition and awards
4. Describes the scale and depth of Capgemini's cloud practice
5. Ties differentiators directly to client outcomes
6. Addresses competitive positioning points from the analysis
${winStrategy ? "7. Map each defined differentiator to a specific target outcome — make an explicit connection between 'why Capgemini' and the client's defined success metrics" : ""}

This should be persuasive without being salesy. Focus on what makes Capgemini the right choice for THIS client.
Output only the section text, formatted in markdown.`;
}
