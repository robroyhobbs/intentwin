import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildWhyUsPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";
  const companyDesc = companyInfo?.description
    ? `\n${companyName}: ${companyInfo.description}`
    : "";

  return `Write the "Why ${companyName}" section for a ${companyName} proposal.${companyDesc}

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a compelling differentiators section (400-500 words) using this EXACT structure:

### The ${companyName} Difference (2-3 sentences)
One crisp statement of ${companyName}'s unique value proposition for THIS specific engagement. Not a company overview — a direct answer to "why should this client choose ${companyName} for THIS project?"

### Key Differentiators

Present 4-5 differentiators, each in this format:

**[Differentiator Name]**
- **What**: The specific capability or asset (1 sentence)
- **Evidence**: Concrete proof — certification level, case study metric, partnership tier (1 sentence citing Company Context)
- **Client Value**: What this means for the client's specific outcome (1 sentence starting with "For" + the actual client name from the opportunity details above + ", this means...")

### Competitive Advantages Table

| Evaluation Criteria | ${companyName} Advantage | Evidence |
|---|---|---|
| Criteria relevant to this RFP | Specific advantage | Metric or certification from Company Context |

Include 4-5 rows aligned to likely evaluation criteria for this engagement type.

### Partnership Commitment (2-3 sentences)
Close with a forward-looking partnership statement. Be specific about what the client can expect in the first 90 days. End with a concrete next step.
${winStrategy ? `\nMap each differentiator to a specific target outcome — make an explicit connection between "why ${companyName}" and the client's success metrics.` : ""}

CRITICAL: Every differentiator claim MUST be backed by evidence from the Company Context (certifications, case study metrics, partnership levels). Do not make unsupported claims. It is better to have 3 well-evidenced differentiators than 6 generic ones.

${buildEditorialStandards()}`;
}
