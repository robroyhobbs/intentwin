import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildApproachPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Approach" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a clear, actionable approach section (500-600 words) using this EXACT structure:

### Approach Overview (3 sentences max)
One crisp paragraph stating ${companyName}'s approach philosophy for THIS engagement. What is the core strategy? Why this approach vs. alternatives?

### Phased Delivery Plan

For each phase, use this format:

#### Phase N: [Phase Name] (Weeks X-Y)
**Objective**: One sentence — what this phase achieves for the client.
**Key Activities**:
- **Activity Name**: What ${companyName} does and what the client gets (1 sentence each)
**Deliverables**: Bullet list of tangible outputs
**Outcome**: Which target outcome this phase advances

Include 3-5 phases. Each phase should be concrete and time-bound.

### Capability-to-Need Mapping

| Client Need | ${companyName} Capability | How It Solves the Problem |
|---|---|---|
| Specific need from intake | Specific capability from Company Context | Concrete mechanism |

Include at least 4 rows.

### Approach Phases

Present the approach as a phased summary table:

| Phase | Duration | Key Activities | Deliverables |
|---|---|---|---|
| Phase 1: ... | X weeks | ... | ... |

Include 3-5 phases showing the logical flow from discovery through delivery.
${winStrategy ? `\nTie each phase explicitly to a target outcome from the win strategy.` : ""}

IMPORTANT: Reference specific ${companyName} products, methodologies, and capabilities from the Company Context. Do not describe generic industry approaches — describe ${companyName}'s specific approach.

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined)}`;
}
