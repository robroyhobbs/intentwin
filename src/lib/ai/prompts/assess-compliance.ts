/**
 * Compliance Auto-Assessment Prompt Builder
 * Compares proposal requirements against generated section content
 * to determine which requirements are met, partially met, or not addressed.
 */

export interface RequirementForAssessment {
  id: string;
  requirement_text: string;
  category: "mandatory" | "desirable" | "informational";
  requirement_type: "content" | "format" | "submission" | "certification";
  source_reference: string | null;
}

export interface SectionForAssessment {
  id: string;
  section_type: string;
  title: string;
  content: string;
}

export interface AssessmentResult {
  requirement_id: string;
  compliance_status: "met" | "partially_met" | "not_addressed" | "not_applicable";
  mapped_section_id: string | null;
  rationale: string;
  confidence: number;
}

const MAX_CONTENT_PER_SECTION = 8_000; // chars — keep prompt within model context

/**
 * Build the compliance assessment prompt.
 * Sends all requirements + all section content to the AI for structured comparison.
 */
export function buildComplianceAssessmentPrompt(
  requirements: RequirementForAssessment[],
  sections: SectionForAssessment[],
): string {
  const sectionText = sections
    .map((s) => {
      const truncated =
        s.content.length > MAX_CONTENT_PER_SECTION
          ? s.content.slice(0, MAX_CONTENT_PER_SECTION) + "\n[... truncated]"
          : s.content;
      return `### Section: ${s.title} (ID: ${s.id}, type: ${s.section_type})\n${truncated}`;
    })
    .join("\n\n---\n\n");

  const requirementsList = requirements
    .map(
      (r, i) =>
        `${i + 1}. [ID: ${r.id}] [${r.category.toUpperCase()}] [type: ${r.requirement_type}] ${r.requirement_text}${r.source_reference ? ` (Source: ${r.source_reference})` : ""}`,
    )
    .join("\n");

  return `You are a compliance analyst reviewing a proposal against client requirements. Your job is to determine whether each requirement has been addressed by the proposal content.

## Proposal Sections
<proposal>
${sectionText}
</proposal>

## Requirements to Assess
<requirements>
${requirementsList}
</requirements>

## Assessment Rules

For each requirement, determine its compliance status:

- **"met"** — The proposal clearly and specifically addresses this requirement. The relevant section contains substantive content that satisfies the requirement.
- **"partially_met"** — The proposal touches on this requirement but doesn't fully address it. Key details are missing or the coverage is superficial.
- **"not_addressed"** — The proposal does not contain any content addressing this requirement.
- **"not_applicable"** — This requirement cannot be assessed from proposal content (e.g., submission deadlines, physical delivery methods, certifications that need external verification).

### Special handling by requirement type:
- **content** requirements: Assess based on whether the proposal sections contain relevant information
- **format** requirements (page limits, font, spacing): Mark as "not_applicable" — these require manual verification of the exported document
- **submission** requirements (deadlines, delivery method): Mark as "not_applicable" — these are process requirements, not content requirements
- **certification** requirements: Mark as "not_applicable" UNLESS the proposal explicitly mentions having the certification (e.g., "We hold SOC 2 Type II certification"), in which case mark as "met"

### For each requirement, also identify:
- **mapped_section_id**: The ID of the section that best addresses this requirement (null if not_addressed or not_applicable)
- **rationale**: A brief (1-2 sentence) explanation of your assessment
- **confidence**: 0.0 to 1.0 — how confident you are in this assessment

## Output Format
Return ONLY a JSON array. No markdown, no explanation, no wrapping.

[
  {
    "requirement_id": "<UUID>",
    "compliance_status": "met",
    "mapped_section_id": "<section UUID or null>",
    "rationale": "The executive summary describes the 24/7 support model with 4-hour SLA commitment on page 2.",
    "confidence": 0.95
  }
]

Assess ALL ${requirements.length} requirements. Return exactly ${requirements.length} results.`;
}

/**
 * Parse the AI assessment response into typed results.
 */
export function parseAssessmentResponse(
  response: string,
  validRequirementIds: Set<string>,
  validSectionIds: Set<string>,
): AssessmentResult[] {
  if (!response?.trim()) return [];

  let jsonStr = response.trim();

  // Strip markdown code block wrapper
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const VALID_STATUSES = new Set(["met", "partially_met", "not_addressed", "not_applicable"]);

  return parsed
    .filter((item): item is Record<string, unknown> => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).requirement_id === "string" &&
        validRequirementIds.has((item as Record<string, unknown>).requirement_id as string)
      );
    })
    .map((item) => ({
      requirement_id: String(item.requirement_id),
      compliance_status: VALID_STATUSES.has(item.compliance_status as string)
        ? (item.compliance_status as AssessmentResult["compliance_status"])
        : "not_addressed",
      mapped_section_id:
        typeof item.mapped_section_id === "string" && validSectionIds.has(item.mapped_section_id)
          ? item.mapped_section_id
          : null,
      rationale: typeof item.rationale === "string" ? item.rationale : "",
      confidence: typeof item.confidence === "number" ? Math.min(1, Math.max(0, item.confidence)) : 0.5,
    }));
}
