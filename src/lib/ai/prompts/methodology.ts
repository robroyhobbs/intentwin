import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildMethodologyPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Methodology" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a methodology section (500-600 words) using this EXACT structure:

### Methodology Overview (2-3 sentences)
Name the methodology. State why it's the right fit for this engagement type. Reference where it has been successfully applied before (cite evidence).

### Process Framework

Present as a numbered workflow. For each step:

**Step N: [Step Name]**
- **What**: What happens in this step (1 sentence)
- **Who**: Key roles involved
- **Output**: Tangible deliverable produced
- **Quality Gate**: What must be true before moving to the next step

Include 4-6 steps.

### Governance & Quality Controls

Use a table:

| Control | Frequency | Purpose | Stakeholders |
|---|---|---|---|
| Specific governance mechanism | How often | What it prevents/ensures | Who's involved |

Include at least 4 controls (e.g., steering committee, sprint reviews, quality audits, risk reviews).

### Methodology Phases

Present the methodology as a structured flow using a table:

| Phase | Gate Criteria | Key Decision Point | Output |
|---|---|---|---|
| Phase 1: ... | What must be true to proceed | Decision that gates the next phase | Deliverable |

Include 4-6 phases with clear progression and quality gates.

### Proven Results

> **Track Record**: Cite a specific metric achieved using this methodology from the Company Context
${winStrategy ? `\nMap methodology phases to target outcomes and success metrics.` : ""}

Use ${companyName}'s actual methodology names and frameworks from the Company Context — do not invent generic methodology names.

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined)}`;
}
