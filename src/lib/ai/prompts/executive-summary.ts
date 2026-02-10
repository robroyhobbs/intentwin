import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildExecutiveSummaryPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
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
Write a compelling executive summary (400-600 words) using the AIDA framework:

1. **ATTENTION**: Open with a compelling insight about the client's situation — a bold stat, an industry shift, or a critical challenge they face
2. **INTEREST**: Show deep understanding of their specific challenges and what's at stake if they don't act
3. **DESIRE**: Paint the transformation — current state vs. future state with ${companyName}'s solution, highlighting 2-3 key differentiators
4. **ACTION**: Close with a confident partnership statement and clear next step
${winStrategy ? "5. Weave win themes throughout — open with the primary outcome and tie differentiators to specific client value" : ""}

Use professional, client-focused language. Be specific, not generic. Reference the client by name.
Output only the executive summary text, formatted in markdown.`;
}
