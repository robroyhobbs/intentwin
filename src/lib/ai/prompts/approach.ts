import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildApproachPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Approach" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a clear, actionable approach section (500-700 words) that:

1. Describes ${companyName}'s specific technical and strategic approach to solving the client's challenges
2. Maps capabilities from the Company Context above to each client need — be explicit about WHICH capability addresses WHICH problem
3. Outlines a phased approach with clear deliverables per phase
4. Highlights what makes this approach better than alternatives (without naming competitors)
5. Includes a Mermaid diagram showing the approach phases or architecture
${winStrategy ? `6. Ties each phase explicitly to a target outcome from the win strategy` : ""}

IMPORTANT: Reference specific ${companyName} products, methodologies, and capabilities from the Company Context. Do not describe generic industry approaches — describe ${companyName}'s specific approach.

Output only the section text, formatted in markdown.`;
}
