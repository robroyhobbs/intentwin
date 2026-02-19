import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

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
Write a commercial framework section (400-500 words) using this EXACT structure:

### Investment Philosophy (2-3 sentences)
Frame ${companyName}'s pricing approach: value-based, outcome-aligned, transparent. State the pricing model being proposed and why it fits this engagement.

### Pricing Structure

Use a table showing the pricing model:

| Component | Model | Scope | Notes |
|---|---|---|---|
| Specific service component | Fixed-fee / T&M / Outcome-based | What's included | Key assumptions |

Include 3-5 components that map to the phased approach.

### Value Framework

Show ROI or value comparison:

| Investment Area | Expected Return | Timeframe |
|---|---|---|
| What the client invests in | Measurable outcome they get | When they see it |

### Pricing Options (if applicable)

Present 2-3 tiers or options as bullets:
- **Option A — [Name]**: Scope summary, key inclusions (1-2 sentences)
- **Option B — [Name]**: Scope summary, what's different (1-2 sentences)
- **Option C — [Name]**: Scope summary, premium inclusions (1-2 sentences)

### Governance & Flexibility
2-3 bullets covering change management, budget controls, and how scope changes are handled.
${winStrategy ? `\nTie investment directly to the target outcomes and success metrics — quantify the expected return.` : ""}

IMPORTANT: Use actual pricing models from the Company Context (e.g., fixed-fee, time & materials, outcome-based). Do not invent specific dollar amounts unless provided in the opportunity details — use placeholder ranges and note that detailed pricing will be provided in a separate commercial response.

${buildEditorialStandards()}`;
}
