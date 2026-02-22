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

### Line-Item Pricing Table (MANDATORY)

You MUST include a detailed line-item pricing table with EXACTLY these columns:

| Line Item | Description | Unit | Quantity | Unit Price | Total |
|-----------|-------------|------|----------|------------|-------|
| Phase 1 — Discovery & Assessment | Requirements gathering, current state analysis, migration planning | Fixed fee | 1 | $TBD | $TBD |
| Phase 2 — Implementation | Core platform build, data migration, integration work | Sprint | 6 | $TBD | $TBD |
| Phase 3 — Testing & QA | UAT, performance testing, security validation | Fixed fee | 1 | $TBD | $TBD |
| Phase 4 — Deployment & Transition | Production cutover, training, knowledge transfer | Fixed fee | 1 | $TBD | $TBD |
| Ongoing Support (Optional) | Post-go-live support, incident response, optimization | Monthly | 12 | $TBD | $TBD |
| **Total Estimated Investment** | | | | | **$TBD** |

**Pricing rules:**
- Use \`$TBD\` for any amount where specific pricing data is not available in the opportunity details
- If the RFP provides budget information, use it to inform realistic ranges
- Each line item must map to a deliverable phase or workstream from the Proposed Approach
- Include at least 4 line items covering major engagement phases
- Always include a "Total" row at the bottom
- If only a lump-sum budget is provided, still break it into line items with the total matching the lump sum

### Value Framework

Show ROI or value comparison:

| Investment Area | Expected Return | Timeframe |
|---|---|---|
| What the client invests in | Measurable outcome they get | When they see it |

### Pricing Options (if applicable)

Present 2-3 tiers or options as bullets:
- **Option A — Core**: Minimum scope to address primary requirements (1-2 sentences)
- **Option B — Enhanced**: Core + additional capability or accelerated timeline (1-2 sentences)
- **Option C — Premium**: Full scope with extended support and optimization (1-2 sentences)

### Governance & Flexibility
2-3 bullets covering change management, budget controls, and how scope changes are handled.
${winStrategy ? `\nTie investment directly to the target outcomes and success metrics — quantify the expected return.` : ""}

IMPORTANT: Use actual pricing models from the Company Context (e.g., fixed-fee, time & materials, outcome-based). Use \`$TBD\` as the placeholder for any dollar amounts not provided — do NOT invent specific dollar figures. The \`$TBD\` placeholder clearly indicates that detailed pricing will be finalized during contract negotiation.

${buildEditorialStandards((intakeData as any).solicitation_type, (intakeData as any).audience_profile, (intakeData as any)._brand_name)}`;
}
