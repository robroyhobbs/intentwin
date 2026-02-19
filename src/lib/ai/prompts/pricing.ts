import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildPricingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Commercial Framework" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a commercial framework section (400-600 words) that:

1. Proposes a pricing structure aligned with ${companyName}'s actual pricing models from the Company Context
2. Frames the investment in terms of value delivered and ROI, not just cost
3. Presents pricing tiers or options that give the client flexibility
4. Addresses total cost of ownership vs. alternatives
5. Includes governance and change management provisions
${winStrategy ? `6. Ties investment directly to the target outcomes and success metrics — quantify the expected return` : ""}

IMPORTANT: Use actual pricing models from the Company Context (e.g., fixed-fee, time & materials, outcome-based). Do not invent specific dollar amounts unless provided in the opportunity details — use placeholder ranges and note that detailed pricing will be provided in a separate commercial response.

Output only the section text, formatted in markdown.`;
}
