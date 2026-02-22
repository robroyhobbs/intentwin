import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildCaseStudiesPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
  evidenceCount?: number,
): string {
  const companyName = companyInfo?.name || "Our Company";
  const industry = (intakeData.client_industry as string) || "the target industry";
  const scope = (intakeData.scope_description as string) || "the requested scope";

  // Evidence count can come from explicit parameter OR from L1 context metadata
  const l1EvidenceMatch = l1Context?.match(/<!-- L1_EVIDENCE_COUNT: (\d+) -->/);
  const safeEvidenceCount = evidenceCount ?? (l1EvidenceMatch ? parseInt(l1EvidenceMatch[1], 10) : 0);

  // Build the evidence enforcement block based on actual data availability
  const evidenceEnforcement = safeEvidenceCount < 2
    ? `
## EVIDENCE ENFORCEMENT — INSUFFICIENT DATA

You have ${safeEvidenceCount} verified case stud${safeEvidenceCount === 1 ? "y" : "ies"} available. This is below the minimum threshold of 2.

**MANDATORY BEHAVIOR when evidence is insufficient:**
${safeEvidenceCount === 0 ? `- Do NOT write any case study narratives. Instead, output ONLY the following placeholder block for each missing case study:

\`\`\`
[CASE STUDY NEEDED: ${industry} | ${scope}]
Role: [Describe the type of engagement needed]
Required evidence: Client name, engagement scope, team size, measurable outcomes
Upload at: Settings > Evidence Library > Add Case Study
\`\`\`

- Write the Experience Overview and Summary sections normally, but explicitly state that detailed case studies will be provided upon request or after evidence upload.` : `- Present the 1 available case study using the format below.
- For any additional case studies, output the following placeholder:

\`\`\`
[CASE STUDY NEEDED: ${industry} | ${scope}]
Role: [Describe the type of engagement needed]
Required evidence: Client name, engagement scope, team size, measurable outcomes
Upload at: Settings > Evidence Library > Add Case Study
\`\`\`

- Do NOT fabricate a second or third case study to fill space.`}

This is a HARD RULE — violating it produces a non-compliant proposal.
`
    : `
## EVIDENCE STATUS — ${safeEvidenceCount} VERIFIED CASE STUDIES AVAILABLE

Use ONLY the verified evidence provided below. Do not supplement with invented examples.
`;

  return `Write the "Relevant Experience & Case Studies" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
${evidenceEnforcement}
## Instructions
Write a case studies section (500-600 words) using this EXACT structure:

### Experience Overview (2 sentences)
State ${companyName}'s breadth of relevant experience with a specific number (e.g., "47 similar engagements across 12 agencies"). One sentence on why these examples were selected for THIS client.

### Case Study 1: Use the actual client name or industry from evidence (e.g., "Department of Veterans Affairs — Cloud Migration")

Use this EXACT format for each case study:

> **Key Result**: The single most impressive metric from this engagement (use the real number from evidence)

- **Situation**: What the client faced — industry, size, specific challenge (2 sentences max)
- **Approach**: What ${companyName} did — specific methodology, team size, technology (2 sentences max)
- **Results**: Bullet list of 3-4 measurable outcomes with specific numbers
  - **Metric Name**: Number + context (e.g., "34% cost reduction in Year 1, saving $2.1M annually")
- **Relevance**: One sentence connecting this case study to the current client's specific challenge

### Case Study 2: Same heading format with real client/industry name
(Same format)

### Case Study 3: Same heading format with real client/industry name
(Same format — include if sufficient evidence exists)

### Summary: What This Means for the Client

A 2-3 sentence closing that draws explicit parallels between past engagements and this client's specific needs. Reference the client by their actual name from the opportunity details above.
${winStrategy ? `\nSelect case studies that best demonstrate ability to deliver the target outcomes.` : ""}

CRITICAL: You MUST use case studies and metrics from the "Verified Evidence" section of the Company Context above. Do NOT invent case studies, client names, or metrics. If insufficient evidence is available, use the [CASE STUDY NEEDED: ...] placeholder format instead. It is BETTER to present 1 real case study with placeholders than 3 fabricated ones.

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined)}`;
}
