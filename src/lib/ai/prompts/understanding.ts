import type { WinStrategyData } from "@/types/outcomes";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildUnderstandingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null
): string {
  return `Write the "Understanding of Client Needs" section for a Capgemini proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (500-700 words) that demonstrates Capgemini deeply understands:
1. The client's current business context and challenges
2. Their technical landscape and constraints
3. The drivers behind this initiative
4. The desired business outcomes (not just technical outcomes)
5. Key success criteria from the client's perspective
${winStrategy ? "6. Frame the client's needs in terms of the defined target outcomes — show understanding of not just the technical requirements but the business results the client seeks" : ""}

This section should make the client feel heard and understood. Reference their specific industry, scale, and situation.
Output only the section text, formatted in markdown.`;
}
