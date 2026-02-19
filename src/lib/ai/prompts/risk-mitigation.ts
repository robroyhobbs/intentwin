import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildRiskMitigationPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Risk Mitigation" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a risk mitigation section (400-500 words) using this EXACT structure:

### Risk Management Approach (2 sentences)
State ${companyName}'s risk management philosophy and how risks are continuously monitored throughout the engagement.

### Risk Register

Present as a structured table:

| Risk | Category | Likelihood | Impact | Mitigation Strategy | ${companyName} Experience |
|---|---|---|---|---|---|
| Specific risk for THIS engagement | Technical / Organizational / Timeline / Resource / Security | High/Med/Low | High/Med/Low | Concrete action to prevent or reduce | How ${companyName} has handled this before (cite evidence) |

Include 5-6 risks that are specific to THIS engagement — not generic risks. Draw from the intake data and strategic analysis.

### Proactive Safeguards

Present as bullets:
- **Safeguard Name**: What it is, how it works, when it triggers (1-2 sentences)

Include 3-4 safeguards referencing ${companyName}'s governance frameworks, certifications, and quality processes from the Company Context.

### Risk Monitoring Diagram
Include a Mermaid diagram showing risk categories, monitoring triggers, and escalation paths. Keep it focused — 5-8 nodes maximum.
${winStrategy ? `\nAddress risks that could threaten the target outcomes and explain how they're protected.` : ""}

Reference ${companyName}'s actual certifications, compliance frameworks, and governance practices from the Company Context.

${buildEditorialStandards()}`;
}
