import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildTimelinePrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Timeline & Milestones" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (400-600 words) using the Certainty Framework to build confidence through specificity:

1. **PHASES**: Break the engagement into clear, manageable phases with defined boundaries — discovery/assessment, planning, execution, and transition
2. **MILESTONES**: Identify specific checkpoints where progress is measurable and demonstrable — key deliverables per phase
3. **RISK MITIGATION**: Show what could go wrong at each phase and how you'll prevent/handle it — governance checkpoints and go/no-go decision points
4. **CONFIDENCE**: Build confidence through specificity — dates, deliverables, dependencies all mapped
${winStrategy ? "5. Map milestones to specific target outcomes — show when each success metric will begin to be realized, with early wins for high-priority outcomes" : ""}

Present as a clear, structured timeline. Use bullet points or a table format.

Include a Mermaid Gantt chart showing the project timeline. Use a \`\`\`mermaid code block. Example:
\`\`\`mermaid
gantt
  title Project Timeline
  dateFormat YYYY-MM-DD
  section Discovery
  Assessment :a1, 2025-01-01, 30d
  section Planning
  Architecture Design :a2, after a1, 20d
  section Execution
  Migration Wave 1 :a3, after a2, 45d
\`\`\`
Use realistic durations based on the engagement scope.

Output only the section text, formatted in markdown.`;
}
