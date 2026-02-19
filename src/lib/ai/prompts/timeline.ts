import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildTimelinePrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Timeline & Milestones" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a timeline and milestones section (400-600 words) that:

1. Proposes a realistic, phased timeline aligned with the client's stated constraints
2. Defines clear milestones with specific deliverables and acceptance criteria
3. Highlights early wins — what value the client sees in the first 30/60/90 days
4. References ${companyName}'s methodology and accelerators that reduce time-to-value
5. Includes a Mermaid Gantt chart showing the project timeline
${winStrategy ? `6. Maps milestones to target outcomes and success metrics — show when each outcome is achieved` : ""}

Reference actual ${companyName} accelerators and tools from the Company Context that speed delivery.

Output only the section text, formatted in markdown.`;
}
