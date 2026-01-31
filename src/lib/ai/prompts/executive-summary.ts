import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildExecutiveSummaryPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write an executive summary for a ${companyName} proposal based on the following information.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling executive summary (400-600 words) that:
1. Opens with a clear understanding of the client's business challenge
2. Articulates why this engagement matters to the client's strategic goals
3. Summarizes ${companyName}'s proposed approach at a high level
4. Highlights 2-3 key differentiators
5. Closes with a confident statement about expected outcomes
${winStrategy ? "6. Weave win themes throughout — open with the primary outcome and tie differentiators to specific client value" : ""}

Use professional, client-focused language. Be specific, not generic. Reference the client by name.
Output only the executive summary text, formatted in markdown.`;
}
