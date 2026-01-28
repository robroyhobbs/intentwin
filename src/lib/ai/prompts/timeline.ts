import type { WinStrategyData } from "@/types/outcomes";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildTimelinePrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null
): string {
  return `Write the "Timeline & Milestones" section for a Capgemini proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material from Past Winning Proposals
${retrievedContext}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a section (400-600 words) that:
1. Proposes a realistic project timeline with phases
2. Includes key milestones and deliverables per phase
3. Accounts for discovery/assessment, planning, execution, and transition phases
4. Addresses any timeline constraints mentioned in the intake data
5. Includes governance checkpoints and go/no-go decision points
${winStrategy ? "6. Map milestones to specific target outcomes — show when each success metric will begin to be realized, with early wins for high-priority outcomes" : ""}

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
