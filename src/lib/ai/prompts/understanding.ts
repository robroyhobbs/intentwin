import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildUnderstandingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Understanding of Client Needs" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (500-700 words) using the Problem-Agitate-Solve (PAS) framework:

1. **PROBLEM**: Clearly articulate the client's core pain points in their own language — their current business context, technical landscape, and constraints
2. **AGITATE**: Amplify the urgency — what happens if these problems go unaddressed? What's the cost of inaction? Reference their industry, scale, and competitive pressures
3. **SOLVE**: Preview how ${companyName}'s approach directly addresses each pain point — connect to desired business outcomes (not just technical outcomes) and key success criteria
${winStrategy ? "4. Frame the client's needs in terms of the defined target outcomes — show understanding of not just the technical requirements but the business results the client seeks" : ""}

This section should make the client feel heard and understood. Reference their specific industry, scale, and situation.
Output only the section text, formatted in markdown.`;
}
