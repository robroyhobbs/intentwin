/**
 * Cover Letter Section Prompt
 *
 * Generates a formal cover letter for the proposal with merge fields
 * for signatory details. Merge fields remain as {field_name} placeholders
 * so they can be filled in by the user before final export.
 */

import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildWinStrategySection } from "./win-strategy-section";
import { buildEditorialStandards } from "./editorial-standards";

export function buildCoverLetterPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  l1Context?: string,
): string {
  const companyName = companyInfo?.name || "Our Company";
  const clientName = (intakeData.client_name as string) || "the Client";
  const solicitationType = (intakeData.solicitation_type as string) || "RFP";
  const scopeDescription = (intakeData.scope_description as string) || "the proposed engagement";

  return `Write a formal cover letter for a ${companyName} proposal responding to a ${solicitationType} from ${clientName}.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}
${buildWinStrategySection(winStrategy)}

## Instructions

Write a professional cover letter (250-350 words) that serves as the opening page of the proposal document.

### Required Structure

1. **Header Block** — Use these EXACT merge fields (the user will replace them before export):
   - Date: {date}
   - Addressed to: {client_name} (or use "${clientName}" if known from the RFP)
   - From: {signatory_name}, {signatory_title}
   - Re: ${solicitationType} Response — ${scopeDescription}

2. **Opening Paragraph** (2-3 sentences)
   - Express ${companyName}'s enthusiasm for the opportunity
   - Reference the specific ${solicitationType} by name/number if available
   - State that ${companyName} is submitting this proposal in response

3. **Value Proposition** (1 short paragraph)
   - Summarize in 3-4 sentences why ${companyName} is the right choice
   - Reference 1-2 key differentiators from the win strategy or company context
   - Tie directly to the client's stated needs

4. **Closing** (2-3 sentences)
   - Express confidence in delivering results
   - Offer to provide additional information or clarification
   - Include: "Respectfully submitted, {signatory_name}, {signatory_title}"

### Merge Field Rules

CRITICAL: Keep these merge fields EXACTLY as shown — do NOT replace them with invented names or data:
- \`{signatory_name}\` — will be replaced with the actual signer's name
- \`{signatory_title}\` — will be replaced with the actual signer's title
- \`{date}\` — will be replaced with the submission date
- \`{client_name}\` — will be replaced with the client contact name (use the organization name "${clientName}" where referring to the client organization)

These merge fields are intentional placeholders. They are NOT errors. Do not invent signatory information.

### Tone

- Professional, warm, and confident
- Not obsequious — avoid excessive flattery
- Government-appropriate formality for ${solicitationType} responses
- Active voice throughout

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined, undefined, intakeData.tone as string | undefined)}`;
}
