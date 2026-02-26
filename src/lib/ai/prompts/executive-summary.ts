import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

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
Write a compelling executive summary (400-500 words) using this EXACT structure:

### Opening Hook (2-3 sentences)
Start with a bold, specific insight about the client's situation — a concrete stat, an industry shift with real numbers, or a critical challenge with measurable stakes. Name the client. No generic openings.

### The Challenge (1 short paragraph + bullets)
In 2-3 sentences, frame the core problem. Then list 3-4 specific challenges as bullets with **bold lead-ins**:
- **Challenge Name**: One sentence description tied to a specific business impact

### The Transformation (1 short paragraph + table)
Describe what changes with ${companyName}. Include a before/after comparison table:

| Current State | Future State with ${companyName} |
|---|---|
| Specific pain point | Specific measurable outcome |

### Why ${companyName} (2-3 bullets with evidence)
Each bullet must cite a specific metric or case study from the Company Context:
- **Differentiator**: Specific evidence (e.g., "47 similar engagements, 99.9% SLA achievement")

### Call to Action (2 sentences max)
Confident partnership statement with a specific next step.
${winStrategy ? `\nWeave win themes throughout — open with the primary outcome and tie differentiators to specific client value.` : ""}

CRITICAL: Reference specific ${companyName} capabilities and evidence from the Company Context above. Every claim must cite verified data — do not invent metrics or capabilities.

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined, undefined, intakeData.tone as string | undefined)}`;
}
