/**
 * Compliance Matrix Section Prompt
 *
 * Generates an inline compliance cross-reference that maps each extracted
 * requirement to the proposal section that addresses it. This demonstrates
 * systematic compliance and makes evaluator scoring easier.
 */

import type { WinStrategyData } from "@/types/outcomes";
import type { CompanyInfo } from "@/types/idd";
import { buildEditorialStandards } from "./editorial-standards";

export function buildComplianceMatrixSectionPrompt(
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

  // Extract requirements from intake
  const keyRequirements = (intakeData.key_requirements as string[]) || [];
  const complianceRequirements = (intakeData.compliance_requirements as string[]) || [];
  const allRequirements = [...keyRequirements, ...complianceRequirements];

  // Handle empty requirements gracefully
  const requirementsBlock = allRequirements.length > 0
    ? `### Extracted Requirements (${allRequirements.length} total)\n${allRequirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    : "### No specific requirements were extracted from this solicitation.\nGenerate a general compliance overview based on standard ${solicitationType} compliance areas.";

  return `Generate a compliance matrix section for a ${companyName} proposal responding to a ${solicitationType} from ${clientName}.

## Opportunity Details
${JSON.stringify(intakeData, null, 2)}

## Strategic Analysis
${analysis}

## Reference Material
${retrievedContext}
${l1Context || ""}

${requirementsBlock}

## Instructions

Create a compliance cross-reference matrix that demonstrates ${companyName}'s systematic response to every requirement. This section helps evaluators quickly verify that all ${solicitationType} requirements are addressed.

### Required Output Format

Generate a **markdown table** with these columns:

| # | Requirement | Proposal Section | Compliance Status | Notes |
|---|-------------|-----------------|-------------------|-------|
| 1 | [Requirement text] | [Section that addresses it] | Full / Partial / Acknowledged | [Brief note on approach] |

### Compliance Status Definitions
- **Full**: ${companyName} fully addresses this requirement in the referenced section
- **Partial**: ${companyName} addresses most aspects; specific exceptions noted
- **Acknowledged**: Requirement is understood; detailed approach will be finalized during contract negotiation

### Section Reference Mapping
Map requirements to these proposal sections:
1. Executive Summary (order 1)
2. Understanding of Client Needs (order 2)
3. Proposed Approach (order 3)
4. Methodology (order 4)
5. Proposed Team & Qualifications (order 5)
6. Relevant Experience & Case Studies (order 6)
7. Timeline & Milestones (order 7)
8. Commercial Framework (order 8)
9. Risk Mitigation (order 9)
10. Why Us (order 10)

### Guidelines

1. Every requirement from the list above MUST appear in the matrix — do not skip any
2. Map each requirement to the MOST relevant proposal section
3. If a requirement spans multiple sections, list the primary section and note others in the Notes column
4. Use "Full" compliance status where ${companyName}'s capabilities clearly address the requirement
5. Use "Partial" only when there's a genuine gap — note what's missing
6. After the table, include a brief summary: "X of Y requirements fully addressed, Z partially addressed"
7. Do not invent requirements — only reference the ones provided above

${allRequirements.length === 0 ? `\nSince no specific requirements were extracted, create a general compliance overview covering standard ${solicitationType} areas: technical requirements, staffing requirements, schedule requirements, reporting requirements, quality assurance requirements, and security/compliance requirements.` : ""}

${buildEditorialStandards(intakeData.solicitation_type as string | undefined, intakeData.audience_profile, intakeData._brand_name as string | undefined)}`;
}
