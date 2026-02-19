import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildExecutiveSummaryPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";
  const companyDesc = companyInfo?.description
    ? `\n${companyName} is ${companyInfo.description}.`
    : "";

  return `Write an executive summary for a ${companyName} proposal.${companyDesc}

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling executive summary (400-600 words) that:

1. Opens with a compelling insight about the client's situation — a bold stat, an industry shift, or a critical challenge they face
2. Shows deep understanding of their specific challenges and what's at stake
3. Paints the transformation — current state vs. future state with ${companyName}'s solution
4. Closes with a confident partnership statement and clear next step
${winStrategy ? `5. Weaves win themes throughout — opens with the primary outcome and ties differentiators to specific client value` : ""}

CRITICAL: You MUST reference specific ${companyName} capabilities and evidence from the Company Context above. Every claim must be grounded in verified data — do not invent metrics or capabilities.

Use professional, client-focused language. Be specific, not generic. Reference the client by name.
Output only the executive summary text, formatted in markdown.`;
}
