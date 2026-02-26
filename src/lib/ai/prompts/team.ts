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

  // Until team_members table exists (Phase 1), there are never named personnel.
  // Check L1 context for any personnel data markers (future-proofing).
  const hasNamedPersonnel = l1Context?.includes("## Team Members") ?? false;

  const personnelEnforcement = hasNamedPersonnel
    ? `
## PERSONNEL STATUS — NAMED TEAM MEMBERS AVAILABLE

Use ONLY the named team members from the Company Context below. Do not invent names, bios, or credentials.
`
    : `
## PERSONNEL ENFORCEMENT — NO NAMED TEAM MEMBERS REGISTERED

No named personnel are registered in the system. You do NOT have real names, bios, or resumes.

**MANDATORY BEHAVIOR when no named personnel exist:**
- For each key role, output the following placeholder block INSTEAD of inventing a person:

\`\`\`
[TEAM MEMBER NEEDED: Role Title]
Required: Name, years of experience, relevant certifications, clearance level
Qualifications to look for: [Describe ideal qualifications for this role]
Upload at: Settings > Team Members > Add Team Member
\`\`\`

- You MAY still describe the role's responsibilities, required qualifications, and why the role matters.
- You MUST NOT invent specific people, names, bios, or personal credentials.
- You MAY reference company-wide certifications and partnership levels from the Company Context.

This is a HARD RULE — fabricated personnel names in government proposals are grounds for disqualification.
`;

  return `Write the "Proposed Team & Qualifications" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
${personnelEnforcement}
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

Reference ${companyName}'s actual certifications and partnership levels from the Company Context — do not invent credentials. For named personnel, use ONLY registered team members. If no team members are registered, use the [TEAM MEMBER NEEDED: ...] placeholder format.

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined, undefined, intakeData.tone as string | undefined)}`;
}
