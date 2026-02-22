import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

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
Write a case studies section (500-600 words) using this EXACT structure:

### Experience Overview (2 sentences)
State ${companyName}'s breadth of relevant experience with a specific number (e.g., "47 similar engagements across 12 agencies"). One sentence on why these examples were selected for THIS client.

### Case Study 1: Use the actual client name or industry from evidence (e.g., "Department of Veterans Affairs — Cloud Migration")

Use this EXACT format for each case study:

> **Key Result**: The single most impressive metric from this engagement (use the real number from evidence)

- **Situation**: What the client faced — industry, size, specific challenge (2 sentences max)
- **Approach**: What ${companyName} did — specific methodology, team size, technology (2 sentences max)
- **Results**: Bullet list of 3-4 measurable outcomes with specific numbers
  - **Metric Name**: Number + context (e.g., "34% cost reduction in Year 1, saving $2.1M annually")
- **Relevance**: One sentence connecting this case study to the current client's specific challenge

### Case Study 2: Same heading format with real client/industry name
(Same format)

### Case Study 3: Same heading format with real client/industry name
(Same format — include if sufficient evidence exists)

### Summary: What This Means for the Client

A 2-3 sentence closing that draws explicit parallels between past engagements and this client's specific needs. Reference the client by their actual name from the opportunity details above.
${winStrategy ? `\nSelect case studies that best demonstrate ability to deliver the target outcomes.` : ""}

CRITICAL: You MUST use case studies and metrics from the "Verified Evidence" section of the Company Context above. Do NOT invent case studies, client names, or metrics. If insufficient evidence is available, present what exists and note that additional references can be provided upon request. It is BETTER to present 1-2 real case studies than 3 fabricated ones.

${buildEditorialStandards((intakeData as any).solicitation_type)}`;
}
