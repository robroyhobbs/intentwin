import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildUnderstandingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Understanding of Client Needs" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a client-focused needs analysis (400-500 words) using this EXACT structure:

### Business Context (3 sentences max)
Set the scene: what does this client do, what market forces are they navigating, and why is this initiative critical NOW? Use specific details from the intake data.

### Core Challenges
Present as a structured list. For each challenge:

- **Challenge Name**: What the client is experiencing (1 sentence)
  - **Root Cause**: Why this is happening — show you understand the WHY, not just the symptom (1 sentence)
  - **Business Impact**: What this costs them in measurable terms — dollars, time, risk, competitive position (1 sentence)

Include 4-5 challenges minimum.

### What's at Stake
A short paragraph (2-3 sentences) or blockquote articulating the cost of inaction. Be specific — not fear-mongering, but honest about consequences with real numbers where available.

> **Cost of Inaction**: [Specific consequence with measurable impact]

### How These Map to Outcomes
A brief table or bullet list connecting each challenge to a proposed outcome:

| Client Challenge | Target Outcome |
|---|---|
| Specific need | How ${companyName} addresses it |
${winStrategy ? `\nMap each pain point to a specific target outcome from the win strategy.` : ""}

When mentioning ${companyName}'s experience, cite verified evidence from the Company Context above. Do NOT make generic industry observations — everything must tie back to THIS client's specific situation.

${buildEditorialStandards((intakeData as any).solicitation_type)}`;
}
