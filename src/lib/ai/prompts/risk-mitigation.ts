import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildRiskMitigationPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Risk Mitigation" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a risk mitigation section (400-600 words) that:

1. Identifies 4-6 specific risks relevant to THIS engagement (technical, organizational, timeline, resource)
2. For each risk: acknowledge it honestly, describe the mitigation strategy, and reference ${companyName}'s experience handling it
3. Reference ${companyName}'s governance frameworks, certifications, and quality processes from the Company Context
4. Demonstrate proactive risk management — show you've anticipated issues before they arise
5. Include a Mermaid diagram showing risk categories and mitigation approaches
${winStrategy ? `6. Address risks that could threaten the target outcomes and explain how they're protected` : ""}

Reference ${companyName}'s actual certifications, compliance frameworks, and governance practices from the Company Context.

Output only the section text, formatted in markdown.`;
}
