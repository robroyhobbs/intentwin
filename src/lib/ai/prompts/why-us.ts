import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildWhyUsPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Why ${companyName}" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling differentiators section (400-600 words) that:
1. Highlights ${companyName}'s unique value proposition for this specific engagement
2. References strategic partnerships (AWS, Azure, GCP, SAP, etc.) if relevant
3. Mentions relevant industry recognition and awards if available
4. Describes the scale and depth of ${companyName}'s practice
5. Ties differentiators directly to client outcomes
6. Addresses competitive positioning points from the analysis
${winStrategy ? `7. Map each defined differentiator to a specific target outcome — make an explicit connection between 'why ${companyName}' and the client's defined success metrics` : ""}

This should be persuasive without being salesy. Focus on what makes ${companyName} the right choice for THIS client.
Output only the section text, formatted in markdown.`;
}
