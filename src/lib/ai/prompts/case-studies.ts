import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildCaseStudiesPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Relevant Experience & Case Studies" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a case studies section (500-700 words) that:

1. Presents 2-3 relevant case studies from the Verified Evidence in the Company Context above
2. For each case study, use the STAR format: Situation, Task, Action, Result
3. Include SPECIFIC metrics from the evidence (percentages, dollar amounts, time savings) — use only metrics listed in the Company Context
4. Draw explicit parallels between each case study and the current client's challenges
5. Close with a summary of what these experiences mean for this engagement
${winStrategy ? `6. Select case studies that best demonstrate ability to deliver the target outcomes` : ""}

CRITICAL: You MUST use case studies and metrics from the "Verified Evidence" section above. Do NOT invent case studies, client names, or metrics. If insufficient evidence is available, note that additional references can be provided upon request.

Output only the section text, formatted in markdown.`;
}
