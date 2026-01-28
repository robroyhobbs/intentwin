import type { WinStrategyData } from "@/types/outcomes";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildCaseStudiesPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null
): string {
  return `Write the "Relevant Experience & Case Studies" section for a Capgemini proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (600-800 words) presenting 2-3 relevant case studies that:
1. Are in the same or similar industry as the client
2. Involved similar technical challenges (cloud migration, app modernization)
3. Include specific metrics and outcomes (cost savings %, timeline, apps migrated, etc.)
4. Demonstrate Capgemini's ability to deliver at this scale
${winStrategy ? "5. Select and frame case studies that directly demonstrate Capgemini's ability to deliver the defined target outcomes — highlight metrics that mirror the success criteria" : ""}

Use the reference material to base the case studies on real examples where possible. If the reference material doesn't contain exact matches, create realistic composite examples that align with known Capgemini capabilities.
Format each case study with: Client Industry, Challenge, Approach, Results.
Output only the section text, formatted in markdown.`;
}
