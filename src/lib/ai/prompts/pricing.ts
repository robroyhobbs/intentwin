import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildPricingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Commercial Framework" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (300-500 words) that:
1. Describes the pricing model approach (T&M, fixed price, outcome-based, or hybrid)
2. Outlines the cost structure categories (discovery, migration, optimization, support)
3. Describes any phased investment approach
4. Mentions assumptions that underpin the commercial framework
5. Includes placeholder markers like [INSERT PRICING TABLE] for actual numbers
${winStrategy ? "6. Frame the investment in terms of ROI against the defined success metrics — position costs as investments toward the target outcomes" : ""}

Do NOT include specific dollar amounts. This is a framework that the proposal team will fill in.
Output only the section text, formatted in markdown.`;
}
