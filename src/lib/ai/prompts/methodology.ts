import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";

export function buildMethodologyPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";

  return `Write the "Methodology" section for a ${companyName} proposal.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}
## Instructions
Write a detailed methodology section (500-700 words) that:

1. Describes ${companyName}'s proven methodology for this type of engagement
2. References specific frameworks, tools, and accelerators from the Company Context
3. Explains HOW the methodology delivers the promised outcomes — connect process steps to results
4. Addresses governance, quality gates, and how risks are managed at each stage
5. Includes a Mermaid diagram showing the methodology phases or workflow
${winStrategy ? `6. Maps methodology phases to target outcomes and success metrics` : ""}

Use ${companyName}'s actual methodology names and frameworks from the Company Context — do not invent generic methodology names.

Output only the section text, formatted in markdown.`;
}
