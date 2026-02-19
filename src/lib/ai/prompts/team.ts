import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildTeamPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Team & Qualifications" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a team and qualifications section (400-600 words) that:

1. Proposes a team structure tailored to this engagement's scope and complexity
2. Describes key roles with relevant qualifications and certifications from the Company Context
3. Highlights the depth and breadth of ${companyName}'s talent pool
4. References certifications and partnerships from the Company Context
5. Includes a Mermaid org chart showing the proposed team structure
${winStrategy ? `6. Maps team capabilities directly to the win themes and target outcomes` : ""}

Reference ${companyName}'s actual certifications and partnership levels from the Company Context — do not invent credentials.

Output only the section text, formatted in markdown.`;
}
