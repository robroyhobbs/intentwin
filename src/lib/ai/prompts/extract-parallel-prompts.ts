/**
 * Parallel Extraction Prompts
 * Three focused prompt builders for the parallel micro-extractors.
 * Each targets a specific subset of ExtractedIntake fields.
 */

// ── Types ────────────────────────────────────────────────────────────────────

type ContentType = "file" | "pasted" | "verbal";

// ── Content Truncation ───────────────────────────────────────────────────────

const QUICK_FIELDS_LIMIT = 30_000;

export function truncateForQuickFields(content: string): string {
  if (content.length <= QUICK_FIELDS_LIMIT) return content;
  return (
    content.slice(0, QUICK_FIELDS_LIMIT) +
    "\n\n[Content truncated — first 30K chars shown for identification fields]"
  );
}

// ── Shared Guidelines ────────────────────────────────────────────────────────

function contextHint(ct: ContentType): string {
  if (ct === "file")
    return "This content was extracted from uploaded document(s).";
  if (ct === "pasted")
    return "This content was pasted by the user (email, notes, or text).";
  return "This is a verbal description provided by the user.";
}

const CONFIDENCE_RULES = `Confidence Scoring:
- 0.9-1.0: Explicitly stated, unambiguous
- 0.7-0.89: Clearly implied or minor ambiguity
- 0.5-0.69: Reasonably inferred from context
- 0.3-0.49: Weak inference, needs confirmation
- Below 0.3: Don't include, omit the field

Always include a brief "source" quote (under 50 words) from the content.
If a document has role labels (e.g., PRIMARY_RFP), include source_document_id and source_document_name.
Omit fields you cannot extract with any confidence.
Respond ONLY with the JSON object, no additional text.`;

// ── Quick Fields Prompt ──────────────────────────────────────────────────────

export function buildQuickFieldsPrompt(
  content: string,
  ct: ContentType,
): string {
  return `You are an expert proposal analyst. Extract identification and classification fields from this document.
These fields are typically in the first few pages: executive summary, cover letter, or introduction.

## Context
${contextHint(ct)}

## Input Content
<content>
${content}
</content>

## Required Output — JSON only
\`\`\`json
{
  "input_type": "formal_rfp|email|meeting_notes|brief|verbal|other",
  "input_summary": "2-3 sentence summary",
  "extracted": {
    "client_name": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
    "client_industry": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
    "client_size": { "value": "enterprise|mid-market|smb or count", "confidence": 0.0-1.0, "source": "..." },
    "solicitation_type": { "value": "RFP|RFI|RFQ|SOW|Proactive", "confidence": 0.0-1.0, "source": "..." },
    "opportunity_type": { "value": "cloud_migration|app_modernization|data_analytics|digital_transformation|managed_services|other", "confidence": 0.0-1.0, "source": "..." },
    "budget_range": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
    "timeline": { "value": "...", "confidence": 0.0-1.0, "source": "..." }
  },
  "inferred": {
    "client_size": { "value": "...", "reasoning": "..." },
    "solicitation_type": { "value": "...", "reasoning": "..." },
    "opportunity_type": { "value": "...", "reasoning": "..." },
    "industry": { "value": "...", "reasoning": "..." }
  }
}
\`\`\`

## ${CONFIDENCE_RULES}`;
}

// ── Requirements Prompt ──────────────────────────────────────────────────────

export function buildRequirementsPrompt(
  content: string,
  ct: ContentType,
): string {
  return `You are an expert proposal analyst. Extract detailed requirements, compliance, and evaluation criteria from this document.
Scan the ENTIRE document — requirements may appear in any section including appendices and attachments.

## Context
${contextHint(ct)}

## Input Content
<content>
${content}
</content>

## Required Output — JSON only
\`\`\`json
{
  "extracted": {
    "scope_description": { "value": "what they need", "confidence": 0.0-1.0, "source": "..." },
    "key_requirements": { "value": ["req 1", "req 2"], "confidence": 0.0-1.0, "source": "..." },
    "compliance_requirements": { "value": ["compliance 1"], "confidence": 0.0-1.0, "source": "..." },
    "technical_environment": { "value": "tech stack details", "confidence": 0.0-1.0, "source": "..." },
    "decision_criteria": { "value": ["criterion 1"], "confidence": 0.0-1.0, "source": "..." },
    "current_state_pains": { "value": ["pain 1"], "confidence": 0.0-1.0, "source": "..." },
    "desired_outcomes": { "value": ["outcome 1"], "confidence": 0.0-1.0, "source": "..." }
  }
}
\`\`\`

## ${CONFIDENCE_RULES}`;
}

// ── RFP Structure Prompt ─────────────────────────────────────────────────────

const RFP_STRUCTURE_RULES = `## Section Mapping Rules
- Map RFP-requested sections to standard section_types when possible
- Use "custom" for sections that don't map (e.g., "Small Business Subcontracting Plan")
- Mark as "mandatory" when explicitly required ("shall include", "must provide")
- Mark as "recommended" when beneficial even if not required
- Always include at minimum: executive_summary, understanding, approach
- Extract ALL evaluation criteria with weights/points if provided
- For non-RFP inputs: include minimal recommended sections, mark as "recommended"

## Gap Importance
- critical: Must have to create a proposal (client name, scope)
- helpful: Would significantly improve quality
- nice_to_have: Useful but can work without

Respond ONLY with the JSON object, no additional text.`;

const RFP_STRUCTURE_SCHEMA = `{
  "rfp_analysis": {
    "sections": [
      {
        "section_type": "executive_summary|understanding|approach|methodology|team|case_studies|timeline|pricing|risk_mitigation|why_us|cover_letter|compliance_matrix_section|exceptions_terms|custom",
        "title": "Section title",
        "rationale": "Why needed — cite RFP section or requirement",
        "requirement_level": "mandatory|recommended|optional",
        "rfp_requirements": ["specific requirement this section addresses"],
        "custom_description": "Only for custom sections: what to include"
      }
    ],
    "evaluation_criteria": [
      {
        "name": "Criterion name",
        "weight": "30% or 300 points or null",
        "description": "What evaluators look for",
        "mapped_sections": ["section_type(s) addressing this"]
      }
    ],
    "page_limit": "page/word limit or null",
    "submission_format": "format requirements or null"
  },
  "gaps": [
    {
      "field": "field_name",
      "importance": "critical|helpful|nice_to_have",
      "suggested_question": "Question to fill this gap"
    }
  ]
}`;

export function buildRfpStructurePrompt(
  content: string,
  ct: ContentType,
): string {
  return `You are an expert proposal analyst. Analyze the structural requirements of this document to determine what proposal sections are needed and identify information gaps.

## Context
${contextHint(ct)}

## Input Content
<content>
${content}
</content>

## Required Output — JSON only
\`\`\`json
${RFP_STRUCTURE_SCHEMA}
\`\`\`

${RFP_STRUCTURE_RULES}`;
}
