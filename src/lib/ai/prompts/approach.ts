import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildApproachPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Proposed Approach" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a detailed approach section (800-1200 words) that:
1. Describes the phased approach ${companyName} will take
2. For cloud migration: reference the 6R framework (Rehost, Replatform, Repurchase, Refactor, Retire, Retain) where appropriate
3. For app modernization: reference patterns like strangler fig, lift-and-shift, re-platform as appropriate
4. Includes specific activities for each phase
5. Describes key deliverables at each stage
6. Explains how risks will be mitigated during execution
7. Shows how ${companyName}'s methodology addresses the client's specific needs
${winStrategy ? "8. Show how each phase delivers against the target outcomes — reference specific metrics and map deliverables to defined success criteria" : ""}

Be concrete and specific. Use the reference material to inform realistic timelines and approaches.

Include a Mermaid flowchart showing the architecture or migration flow. Use a \`\`\`mermaid code block. Example:
\`\`\`mermaid
graph TD
  A[Discovery] --> B[Assessment]
  B --> C[Migration Planning]
  C --> D[Execution]
  D --> E[Optimization]
\`\`\`
Keep the diagram focused and readable (max 12-15 nodes).

Output only the approach section text, formatted in markdown with appropriate headings.`;
}
