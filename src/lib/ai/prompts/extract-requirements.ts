/**
 * Requirements Extraction Prompt Builder
 * Analyzes source documents and extracts structured requirements for compliance tracking.
 * Part of IMF Phase 2 (L0: Requirements Truth).
 */

export const VALID_SECTION_TYPES = [
  "executive_summary",
  "understanding",
  "approach",
  "methodology",
  "team",
  "case_studies",
  "timeline",
  "pricing",
  "risk_mitigation",
  "why_us",
] as const;

export type SectionType = (typeof VALID_SECTION_TYPES)[number];

export const VALID_CATEGORIES = ["mandatory", "desirable", "informational"] as const;
export type RequirementCategory = (typeof VALID_CATEGORIES)[number];

export interface RequirementExtraction {
  requirement_text: string;
  source_reference: string;
  category: RequirementCategory;
  suggested_sections: string[];
}

const MAX_DOCUMENT_CHARS = 500_000; // ~125K words, well within Gemini 1M context

export function buildRequirementsExtractionPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) +
        "\n\n[Document truncated — only the first portion was analyzed]"
      : documentText;

  return `You are analyzing a client document to extract requirements and expectations that a consulting proposal must address.

## Document Content
<document>
${truncated}
</document>

## Your Task
Extract every requirement, ask, or expectation from this document. Be thorough — capture both explicit requirements and implicit expectations.

For each requirement, return:
- **requirement_text**: The specific requirement in one clear sentence
- **source_reference**: Where in the document this appears (section number, page, slide, or heading)
- **category**: One of:
  - "mandatory" — explicit "must have", "shall", "required", "mandatory" language
  - "desirable" — "should have", "preferred", "ideally", "would like" language
  - "informational" — context, background, nice-to-know items
- **suggested_sections**: Which proposal sections should address this requirement. Choose from: ${VALID_SECTION_TYPES.join(", ")}

## Output Format
Return ONLY a JSON array. No markdown, no explanation, no wrapping.

Example:
[
  {
    "requirement_text": "Vendor must provide 24/7 support with 4-hour SLA",
    "source_reference": "Section 4.2 - Service Level Requirements",
    "category": "mandatory",
    "suggested_sections": ["approach", "methodology"]
  },
  {
    "requirement_text": "Preference for vendors with financial services experience",
    "source_reference": "Section 2.1 - Evaluation Criteria",
    "category": "desirable",
    "suggested_sections": ["case_studies", "why_us"]
  }
]

## Guidelines
1. One requirement per entry — don't merge multiple requirements into one
2. Be specific — "must provide disaster recovery plan" not "various technical requirements"
3. Include ALL requirements, even obvious ones — completeness over brevity
4. If no clear requirements are found, return an empty array: []
5. Source references should help the user find the original text quickly`;
}

/**
 * Parse AI response into typed RequirementExtraction array.
 * Handles raw JSON, code-fenced JSON, and malformed responses.
 */
export function parseExtractionResponse(response: string): RequirementExtraction[] {
  if (!response || !response.trim()) {
    return [];
  }

  let jsonStr = response.trim();

  // Strip markdown code block wrapper if present
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.warn("Failed to parse requirements extraction response as JSON");
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn("Requirements extraction response is not an array");
    return [];
  }

  // Validate and normalize each requirement
  return parsed
    .filter((item): item is Record<string, unknown> => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).requirement_text === "string" &&
        (item as Record<string, unknown>).requirement_text !== ""
      );
    })
    .map((item) => ({
      requirement_text: String(item.requirement_text),
      source_reference: typeof item.source_reference === "string" ? item.source_reference : "",
      category: normalizeCategory(item.category),
      suggested_sections: normalizeSections(item.suggested_sections),
    }));
}

function normalizeCategory(value: unknown): RequirementCategory {
  if (typeof value === "string" && VALID_CATEGORIES.includes(value as RequirementCategory)) {
    return value as RequirementCategory;
  }
  return "desirable";
}

function normalizeSections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is string =>
      typeof s === "string" && VALID_SECTION_TYPES.includes(s as SectionType),
  );
}
