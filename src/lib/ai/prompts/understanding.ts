import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildUnderstandingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Understanding of Client Needs" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a client-focused analysis (400-600 words) that:

1. Demonstrates deep understanding of the client's business context, challenges, and strategic priorities
2. Identifies the root causes behind their stated needs — show you understand WHY, not just WHAT
3. Articulates what's at stake if these challenges go unaddressed (urgency without fear-mongering)
4. Subtly positions ${companyName}'s experience by referencing similar challenges solved for other clients
${winStrategy ? `5. Maps each pain point to a specific target outcome from the win strategy` : ""}

Reference specific industry trends and challenges from the analysis. When mentioning ${companyName}'s experience, cite verified evidence from the Company Context above.

Output only the section text, formatted in markdown.`;
}
