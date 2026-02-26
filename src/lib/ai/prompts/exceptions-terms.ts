/**
 * Exceptions to Terms Section Prompt
 *
 * Generates a structured exceptions-to-terms section with common exception
 * categories as draft placeholders. All exceptions are marked for legal
 * review before submission.
 */

import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildEditorialStandards } from "./editorial-standards";

export function buildExceptionsTermsPrompt(
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

  return `Generate an Exceptions to Terms & Conditions section for a ${companyName} proposal responding to a ${solicitationType} from ${clientName}.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}

## Instructions

Create a professional Exceptions to Terms & Conditions section that identifies common contract areas where ${companyName} may request modifications. This section demonstrates transparency and expedites contract negotiation.

**IMPORTANT**: This section generates DRAFT exceptions for legal counsel review. Every exception must be clearly marked as a draft requiring attorney approval before submission.

### Required Structure

1. **Introduction** (2-3 sentences)
   - State that ${companyName} has reviewed the ${solicitationType} terms and conditions
   - Note that the following exceptions are submitted for discussion during contract negotiation
   - Emphasize commitment to reaching mutually agreeable terms

2. **Exception Categories** — Generate exceptions in these standard areas:

   #### Limitation of Liability
   - Propose mutual limitation of liability (typically capped at contract value)
   - Note any carve-outs for willful misconduct, IP infringement, or confidentiality breaches

   #### Indemnification
   - Propose mutual indemnification obligations
   - Note scope limits (e.g., direct damages only, excluding consequential damages)

   #### Intellectual Property
   - Clarify ownership of pre-existing IP vs. work product
   - Propose that ${companyName} retains rights to pre-existing tools, frameworks, and methodologies
   - Client receives license to deliverables upon payment

   #### Termination
   - Propose mutual termination for convenience with 30-day notice
   - Request payment for work completed through termination date
   - Note transition assistance obligations

   #### Insurance Requirements
   - List standard coverage types (general liability, professional liability, cyber liability)
   - Note if specific limits need discussion based on engagement scope

   #### Data Protection & Confidentiality
   - Propose mutual NDA obligations
   - Note data handling and return/destruction provisions
   - Reference applicable privacy frameworks if the ${solicitationType} mentions specific standards

3. **Closing Statement** (2-3 sentences)
   - Reiterate that exceptions are submitted in good faith for negotiation
   - Express willingness to discuss each exception with ${clientName}'s legal counsel
   - Note that no exception is a dealbreaker — ${companyName} is flexible on terms

### Format Requirements

- Use a **numbered list** for each exception category
- Each exception should be 2-4 sentences
- Use professional legal-adjacent language (clear but not overly legalistic)
- Include a disclaimer at the top: "*The following exceptions are AI-generated drafts and must be reviewed by legal counsel before submission.*"

### Tone

- Professional and measured
- Not adversarial — framed as "requests for discussion"
- Demonstrates ${companyName}'s experience with contract negotiation
- Context-appropriate for ${scopeDescription}

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined, undefined, intakeData.tone as string | undefined)}`;
}
