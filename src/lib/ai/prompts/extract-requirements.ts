/**
 * Requirements Extraction Prompt Builder
 * Analyzes source documents and extracts structured requirements for compliance tracking.
 * Part of IMF Phase 2 (L0: Requirements Truth).
 */

import { logger } from "@/lib/utils/logger";

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

export const VALID_REQUIREMENT_TYPES = ["content", "format", "submission", "certification"] as const;
export type RequirementType = (typeof VALID_REQUIREMENT_TYPES)[number];

export interface RequirementExtraction {
  requirement_text: string;
  source_reference: string;
  category: RequirementCategory;
  requirement_type: RequirementType;
  suggested_sections: string[];
}

const MAX_DOCUMENT_CHARS = 500_000; // ~125K words, well within Gemini 1M context

export function buildRequirementsExtractionPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) +
        "\n\n[Document truncated — only the first portion was analyzed]"
      : documentText;

  return `You are analyzing a client document to extract ALL requirements and expectations that a consulting proposal must address. This includes content requirements AND response formatting/submission requirements.

## Document Content
<document>
${truncated}
</document>

## Your Task
Extract every requirement, ask, or expectation from this document. Be thorough — capture both explicit requirements and implicit expectations. Pay special attention to:
- **Content requirements**: What information must be included in the proposal
- **Format requirements**: Page limits, font type/size, spacing, margins, file format, naming conventions
- **Submission requirements**: How/where to submit, deadline, number of copies, delivery method
- **Certification requirements**: Required certifications, signatures, attestations, insurance, bonding

For each requirement, return:
- **requirement_text**: The specific requirement in one clear sentence
- **source_reference**: Where in the document this appears (section number, page, slide, or heading)
- **category**: One of:
  - "mandatory" — explicit "must have", "shall", "required", "mandatory" language
  - "desirable" — "should have", "preferred", "ideally", "would like" language
  - "informational" — context, background, nice-to-know items
- **requirement_type**: One of:
  - "content" — what information must be included in the proposal (e.g., "include project timeline", "describe team qualifications")
  - "format" — how the proposal must be formatted (e.g., "12pt Times New Roman", "maximum 30 pages", "1-inch margins", "PDF format")
  - "submission" — how/when/where to submit (e.g., "submit by March 15", "email to procurement@client.com", "3 printed copies")
  - "certification" — required certifications, attestations, legal requirements (e.g., "SOC 2 certified", "signed NDA", "proof of insurance")
- **suggested_sections**: Which proposal sections should address this requirement. Choose from: ${VALID_SECTION_TYPES.join(", ")}. For format/submission requirements, use an empty array [].

## Output Format
Return ONLY a JSON array. No markdown, no explanation, no wrapping.

Example:
[
  {
    "requirement_text": "Vendor must provide 24/7 support with 4-hour SLA",
    "source_reference": "Section 4.2 - Service Level Requirements",
    "category": "mandatory",
    "requirement_type": "content",
    "suggested_sections": ["approach", "methodology"]
  },
  {
    "requirement_text": "Proposal must not exceed 30 pages excluding appendices",
    "source_reference": "Section 1.3 - Submission Instructions",
    "category": "mandatory",
    "requirement_type": "format",
    "suggested_sections": []
  },
  {
    "requirement_text": "Responses must be received by 5:00 PM EST on March 15, 2026",
    "source_reference": "Cover Page - Key Dates",
    "category": "mandatory",
    "requirement_type": "submission",
    "suggested_sections": []
  },
  {
    "requirement_text": "Vendor must hold active SOC 2 Type II certification",
    "source_reference": "Section 6.1 - Vendor Qualifications",
    "category": "mandatory",
    "requirement_type": "certification",
    "suggested_sections": ["why_us"]
  }
]

## Guidelines
1. One requirement per entry — don't merge multiple requirements into one
2. Be specific — "must provide disaster recovery plan" not "various technical requirements"
3. Include ALL requirements, even obvious ones — completeness over brevity
4. If no clear requirements are found, return an empty array: []
5. Source references should help the user find the original text quickly
6. Format/submission requirements are CRITICAL — missing a page limit or deadline is a disqualification risk
7. Look for formatting instructions in cover pages, submission instructions, appendices, and headers/footers`;
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
    logger.warn("Failed to parse requirements extraction response as JSON");
    return [];
  }

  if (!Array.isArray(parsed)) {
    logger.warn("Requirements extraction response is not an array");
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
      requirement_type: normalizeRequirementType(item.requirement_type),
      suggested_sections: normalizeSections(item.suggested_sections),
    }));
}

function normalizeCategory(value: unknown): RequirementCategory {
  if (typeof value === "string" && VALID_CATEGORIES.includes(value as RequirementCategory)) {
    return value as RequirementCategory;
  }
  return "desirable";
}

function normalizeRequirementType(value: unknown): RequirementType {
  if (typeof value === "string" && VALID_REQUIREMENT_TYPES.includes(value as RequirementType)) {
    return value as RequirementType;
  }
  return "content";
}

function normalizeSections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is string =>
      typeof s === "string" && VALID_SECTION_TYPES.includes(s as SectionType),
  );
}
