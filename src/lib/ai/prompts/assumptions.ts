/**
 * Assumptions Generation Prompt
 *
 * Generates structured project assumptions from RFP context.
 * Used during intake extraction to pre-populate the assumptions section.
 */

import { buildEditorialStandards } from "./editorial-standards";

/** Categories for generated assumptions */
export const ASSUMPTION_CATEGORIES = [
  "working_hours",
  "site_access",
  "customer_responsibilities",
  "change_control",
  "out_of_scope",
  "staffing",
  "technology",
  "timeline",
  "compliance",
  "general",
] as const;

export type AssumptionCategory = (typeof ASSUMPTION_CATEGORIES)[number];

export interface Assumption {
  category: AssumptionCategory;
  text: string;
  is_ai_generated: boolean;
}

export function buildAssumptionsPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
): string {
  const clientName = (intakeData.client_name as string) || "the client";
  const scope = (intakeData.scope_description as string) || "the engagement";
  const timeline = (intakeData.timeline as string) || "";
  const solicitationType = (intakeData.solicitation_type as string) || "RFP";

  return `Generate project assumptions for a proposal responding to a ${solicitationType} from ${clientName}.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Instructions

Generate 10-20 project assumptions organized by category. Each assumption should be:
- Specific to THIS engagement (not boilerplate)
- Based on what's stated or implied in the RFP
- Written so the client can review and confirm/modify before contract execution

## Required Output Format
Respond with a JSON array:

\`\`\`json
[
  {
    "category": "working_hours",
    "text": "Standard business hours (Monday-Friday, 8:00 AM - 5:00 PM local time) unless otherwise specified in the SOW.",
    "is_ai_generated": true
  },
  {
    "category": "site_access",
    "text": "Client will provide VPN access and necessary credentials within 5 business days of contract execution.",
    "is_ai_generated": true
  }
]
\`\`\`

## Categories and Examples

- **working_hours**: Business hours, time zones, on-call expectations
- **site_access**: Physical/virtual access, credentials, badge requirements
- **customer_responsibilities**: What the client must provide (data, SMEs, approvals)
- **change_control**: How scope changes are handled, approval process
- **out_of_scope**: Explicit boundaries of what's NOT included
- **staffing**: Team availability, dedicated vs shared resources, replacement process
- **technology**: Infrastructure provided by client, licensing, environments
- **timeline**: Start date assumptions, holiday schedules, milestone dependencies
- **compliance**: Regulatory assumptions, clearance timelines, audit requirements
- **general**: Other project assumptions

## Guidelines

1. Generate at least 2 assumptions per major category relevant to ${scope}
2. If the RFP mentions a specific timeline, add timeline assumptions referencing it${timeline ? ` (mentioned: "${timeline}")` : ""}
3. Always include at least one "out_of_scope" assumption
4. Always include at least one "customer_responsibilities" assumption
5. Write in declarative present tense: "Client will provide..." not "We assume the client will provide..."
6. Be specific where the RFP gives specifics, generic where it's silent

Respond ONLY with the JSON array, no additional text.`;
}
