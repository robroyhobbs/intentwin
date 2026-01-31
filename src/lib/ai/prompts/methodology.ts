import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildMethodologyPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Methodology" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (500-700 words) describing the methodology ${companyName} will use:
1. Reference relevant frameworks (e.g., Cloud Assessment Framework, 6R Migration Strategy)
2. Describe the quality assurance and testing approach
3. Explain the change management and knowledge transfer methodology
4. Describe the Agile/DevOps practices that will be applied
5. Address how the methodology adapts to the client's organizational maturity
${winStrategy ? "6. Tie methodology practices directly to achieving the defined success metrics — show how each practice delivers measurable outcomes" : ""}

Include a Mermaid flowchart showing the methodology process. Use a \`\`\`mermaid code block. Example:
\`\`\`mermaid
graph LR
  A[Assess] --> B[Plan]
  B --> C[Build]
  C --> D[Test]
  D --> E[Deploy]
  E --> F[Optimize]
\`\`\`
Keep the diagram clear and focused (max 10-12 nodes).

Output only the section text, formatted in markdown.`;
}
