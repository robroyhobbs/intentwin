import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildTeamPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Team & Qualifications" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a team and qualifications section (400-500 words) using this EXACT structure:

### Team Overview (2-3 sentences)
How many people, what mix of skills, and why this team structure is right for THIS engagement's scope and complexity.

### Key Roles

Present each role in this format:

**[Role Title]**
- **Responsibility**: What this role owns (1 sentence)
- **Qualifications**: Specific certifications, years of experience, clearances from Company Context
- **Why This Matters**: How this role directly addresses a specific client need (1 sentence)

Include 4-6 key roles. Tailor to the engagement type — don't use a generic org chart.

### Certifications & Partnerships

| Certification/Partnership | Level | Relevance to This Engagement |
|---|---|---|
| Specific cert from Company Context | Tier/level | How it benefits the client |

Include all relevant certifications from the Company Context.

### Talent Depth

A short paragraph (2-3 sentences) with specific numbers: total headcount in relevant practice, bench strength, average experience level, retention rate if available. Cite Company Context.

### Team Structure

Present the reporting structure as a markdown table:

| Role | Reports To | Key Responsibility |
|---|---|---|
| Program Manager | Client Stakeholder | Overall delivery accountability |
| ... | ... | ... |

Include 4-6 key roles showing the hierarchy clearly.
${winStrategy ? `\nMap team capabilities directly to the win themes and target outcomes.` : ""}

Reference ${companyName}'s actual certifications and partnership levels from the Company Context — do not invent credentials.

${buildEditorialStandards()}`;
}
