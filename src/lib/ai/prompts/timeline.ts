import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildTimelinePrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Timeline & Milestones" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a timeline and milestones section (400-500 words) using this EXACT structure:

### Timeline Overview (2 sentences)
State the total engagement duration and number of phases. Reference the client's stated timeline constraints from the intake data.

### Milestone Summary Table

| Milestone | Timeframe | Key Deliverables | Success Criteria | Outcome Achieved |
|---|---|---|---|---|
| Specific milestone name | Weeks/months X-Y | Tangible deliverables | How we know it's done | Which target outcome |

Include 5-8 milestones that cover the full engagement lifecycle.

### Early Wins (First 30/60/90 Days)

Present as bullets with **bold lead-ins**:
- **Day 30 — [Win Name]**: What the client sees and why it matters (1 sentence)
- **Day 60 — [Win Name]**: Tangible progress with measurable indicator (1 sentence)
- **Day 90 — [Win Name]**: First major deliverable or outcome achieved (1 sentence)

### Accelerators
A short paragraph (2-3 sentences) or bullets describing specific ${companyName} tools, templates, or accelerators from the Company Context that reduce time-to-value. Cite actual tool names and past results.

### Project Timeline

Present the timeline as a milestone table showing phases, durations, and dependencies:

| Phase | Start | Duration | Key Milestone | Dependencies |
|---|---|---|---|---|
| Phase 1: ... | Week 1 | 4 weeks | Milestone name | None |
| Phase 2: ... | Week 5 | 6 weeks | Milestone name | Phase 1 complete |

Include 4-6 phases. Use relative timing (Week 1, Month 2) unless specific dates are available from the intake.
${winStrategy ? `\nMap milestones to target outcomes and success metrics — show WHEN each outcome is achieved.` : ""}

Reference actual ${companyName} accelerators and tools from the Company Context that speed delivery.

${buildEditorialStandards((intakeData as any).solicitation_type, (intakeData as any).audience_profile, (intakeData as any)._brand_name)}`;
}
