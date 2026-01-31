import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildTeamPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Team & Qualifications" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (400-600 words) that:
1. Proposes a team structure appropriate for the engagement size and type
2. Describes key roles (Engagement Lead, Solution Architect, Cloud Architects, DevOps Engineers, etc.)
3. Highlights relevant certifications (AWS, Azure, GCP partnerships)
4. Mentions the depth of ${companyName}'s talent pool
5. Describes the governance model and escalation paths
${winStrategy ? `6. Map team capabilities to each key differentiator — show why this specific team is uniquely positioned to deliver the defined outcomes` : ""}

Use placeholder names like [Engagement Lead Name] for specific individuals.

Include a Mermaid org chart showing the team structure. Use a \`\`\`mermaid code block. Example:
\`\`\`mermaid
graph TD
  EL[Engagement Lead] --> SA[Solution Architect]
  EL --> PM[Project Manager]
  SA --> CA1[Cloud Architect]
  SA --> CA2[DevOps Lead]
  PM --> D1[Dev Team 1]
  PM --> D2[Dev Team 2]
\`\`\`
Reflect the actual team structure described in the section.

Output only the section text, formatted in markdown.`;
}
