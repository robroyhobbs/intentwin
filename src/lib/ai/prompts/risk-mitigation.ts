import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildRiskMitigationPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Risk Mitigation" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (400-600 words) that:
1. Identifies 4-6 key risks specific to this engagement
2. For each risk, provides: description, likelihood, impact, and mitigation strategy
3. Addresses common risks in cloud migration / app modernization projects
4. Describes ${companyName}'s risk governance framework
5. Shows proactive thinking about potential challenges
${winStrategy ? "6. Map risks directly to the target outcomes they could jeopardize — show mitigation strategies as safeguards for achieving defined success metrics" : ""}

Present in a structured format (table or risk cards).

Include a Mermaid quadrant chart showing the risk matrix. Use a \`\`\`mermaid code block. Example:
\`\`\`mermaid
quadrantChart
  title Risk Assessment Matrix
  x-axis Low Likelihood --> High Likelihood
  y-axis Low Impact --> High Impact
  quadrant-1 Critical
  quadrant-2 Monitor
  quadrant-3 Accept
  quadrant-4 Mitigate
  Risk A: [0.8, 0.9]
  Risk B: [0.3, 0.7]
\`\`\`
Map the identified risks onto the quadrant chart with appropriate positions.

Output only the section text, formatted in markdown.`;
}
