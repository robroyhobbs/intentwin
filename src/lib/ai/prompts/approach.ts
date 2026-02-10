import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildApproachPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
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
Write a detailed approach section (800-1200 words) using the Feature-Advantage-Benefit (FAB) framework:

For each phase of the approach:
- **FEATURE**: Describe what ${companyName} will do — the specific activities, tools, and methods
- **ADVANTAGE**: Explain why this approach is superior to alternatives — what makes it smarter, faster, or more reliable
- **BENEFIT**: Connect every feature to a tangible client outcome — reduced cost, faster time-to-market, lower risk

Additionally:
1. Describe the phased approach ${companyName} will take
2. For cloud migration: reference the 6R framework (Rehost, Replatform, Repurchase, Refactor, Retire, Retain) where appropriate
3. For app modernization: reference patterns like strangler fig, lift-and-shift, re-platform as appropriate
4. Include key deliverables at each stage
5. Explain how risks will be mitigated during execution
${winStrategy ? "6. Show how each phase delivers against the target outcomes — reference specific metrics and map deliverables to defined success criteria" : ""}

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
