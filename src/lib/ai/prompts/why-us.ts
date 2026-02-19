import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildWhyUsPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";
  const companyDesc = companyInfo?.description
    ? `\n${companyName}: ${companyInfo.description}`
    : "";

  return `Write the "Why ${companyName}" section for a ${companyName} proposal.${companyDesc}

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling differentiators section (400-600 words) that:

1. Articulates ${companyName}'s unique value proposition for THIS specific engagement
2. References specific partnerships, certifications, and industry recognition from the Company Context
3. Describes the scale, depth, and track record of ${companyName}'s practice with concrete evidence
4. Ties every differentiator directly to a client outcome — "we're certified in X, which means you get Y"
5. Addresses why ${companyName} is uniquely positioned vs. alternatives (without naming competitors)
${winStrategy ? `6. Maps each differentiator to a specific target outcome — make an explicit connection between "why ${companyName}" and the client's success metrics` : ""}

CRITICAL: Every differentiator claim MUST be backed by evidence from the Company Context (certifications, case study metrics, partnership levels). Do not make unsupported claims.

This should be persuasive without being salesy. Focus on what makes ${companyName} the right choice for THIS client.
Output only the section text, formatted in markdown.`;
}
