/**
 * Extraction Prompt Builder
 * Analyzes any input (RFP, email, notes, verbal) and extracts structured intake data.
 * Supports multi-document extraction with role-based precedence.
 */

import type { DocumentRole } from "@/types/proposal-documents";

/** Metadata for a document being sent to extraction */
export interface DocumentForExtraction {
  id: string;
  name: string;
  role: DocumentRole;
  content: string;
}

/**
 * Build content block for multi-document extraction with role labels and precedence.
 * Used by the intake extract route when documents have role classifications.
 */
export function buildMultiDocumentContent(
  documents: DocumentForExtraction[]
): string {
  const docBlocks = documents.map((doc, idx) => {
    const roleLabel = doc.role.toUpperCase().replace(/_/g, " ");
    return `=== DOCUMENT ${idx + 1}: ${doc.name} (Role: ${roleLabel}, ID: ${doc.id}) ===\n${doc.content}`;
  });

  const precedenceRules = `
=== DOCUMENT PRECEDENCE RULES ===
- PRIMARY_RFP: Anchors the extraction. Core requirements, client info, and scope come from here.
- AMENDMENT: Overrides or supplements the primary RFP. When an amendment contradicts the primary, the amendment takes precedence. Note which amendment introduced the change.
- ATTACHMENT: Provides supplemental detail referenced by the primary (SOW, specs, etc.). Adds granularity to requirements.
- QA_ADDENDUM: Clarifies ambiguities from the primary RFP. Treat as authoritative for the specific questions addressed.
- EVALUATION_CRITERIA: Contains scoring rubric and decision criteria. Primary source for decision_criteria field.
- TEMPLATE: Required response format/structure. May contain implicit requirements about what must be addressed.
- INCUMBENT_INFO: Background on current provider. Useful for competitive positioning, not primary requirements.
- SUPPLEMENTAL: Additional context. Lower precedence than all other document types.

When extracting, always attribute each field to the specific document it came from using source_document_id and source_document_name.`;

  return docBlocks.join("\n\n") + "\n\n" + precedenceRules;
}

export function buildExtractionPrompt(
  content: string,
  contentType: "file" | "pasted" | "verbal"
): string {
  const contextHint =
    contentType === "file"
      ? "This content was extracted from uploaded document(s). It may be a formal RFP, a client brief, or other business document. Documents may have role labels (PRIMARY_RFP, AMENDMENT, ATTACHMENT, etc.) — respect precedence rules if present."
      : contentType === "pasted"
        ? "This content was pasted by the user. It could be an email thread, meeting notes, a Slack message, or any other text."
        : "This is a verbal description provided by the user about an opportunity they're pursuing.";

  return `You are an expert proposal analyst. Your task is to extract structured information from raw input to help create a consulting proposal.

## Context
${contextHint}

## Input Content
<content>
${content}
</content>

## Your Task
Analyze this content and extract whatever proposal-relevant information you can find. Be thorough but honest about confidence levels.

## Required Output Format
Respond with a JSON object matching this exact structure:

\`\`\`json
{
  "input_type": "formal_rfp" | "email" | "meeting_notes" | "brief" | "verbal" | "other",
  "input_summary": "2-3 sentence summary of what this input contains and the opportunity it describes",

  "extracted": {
    "client_name": {
      "value": "extracted client/company name",
      "confidence": 0.0-1.0,
      "source": "quote or reference from the content",
      "source_document_id": "document ID if from a labeled document (omit if N/A)",
      "source_document_name": "document filename if from a labeled document (omit if N/A)"
    },
    "client_industry": {
      "value": "industry sector",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "client_size": {
      "value": "enterprise/mid-market/smb or employee count",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "solicitation_type": {
      "value": "RFP | RFI | RFQ | SOW | Proactive",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "opportunity_type": {
      "value": "cloud_migration | app_modernization | data_analytics | digital_transformation | managed_services | other",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "scope_description": {
      "value": "description of what they're looking for",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "key_requirements": {
      "value": ["requirement 1", "requirement 2"],
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "budget_range": {
      "value": "budget info if mentioned",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "timeline": {
      "value": "timeline expectations",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "decision_criteria": {
      "value": ["criterion 1", "criterion 2"],
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "technical_environment": {
      "value": "current tech stack or environment details",
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "compliance_requirements": {
      "value": ["compliance req 1"],
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "current_state_pains": {
      "value": ["pain point 1", "pain point 2"],
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "desired_outcomes": {
      "value": ["outcome 1", "outcome 2"],
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    },
    "audience_profile": {
      "value": {
        "tech_level": "non_technical | moderate | highly_technical",
        "evaluator": "description of who will evaluate (e.g., county_board, procurement_office, engineering_team, executive_committee)",
        "size": "organization size context (e.g., small_municipality, mid_market, enterprise, federal_agency)"
      },
      "confidence": 0.0-1.0,
      "source": "quote or reference"
    }
  },

  "inferred": {
    "client_size": {
      "value": "inferred size if not explicit",
      "reasoning": "why you inferred this"
    },
    "solicitation_type": {
      "value": "RFP | RFI | RFQ | SOW | Proactive (default to RFP if unsure)",
      "reasoning": "why you inferred this format based on language (e.g. quote tables = RFQ)"
    },
    "opportunity_type": {
      "value": "inferred type if not explicit",
      "reasoning": "why you inferred this"
    },
    "industry": {
      "value": "inferred industry if not explicit",
      "reasoning": "why you inferred this"
    },
    "audience_profile": {
      "value": {
        "tech_level": "non_technical | moderate | highly_technical (based on document language, org type, and evaluator role)",
        "evaluator": "who will likely read this proposal (based on submission instructions, evaluation criteria, org structure)",
        "size": "organization size (based on employee count mentions, budget scale, scope complexity)"
      },
      "reasoning": "why you inferred this audience profile"
    }
  },

  "rfp_analysis": {
    "sections": [
      {
        "section_type": "executive_summary" | "understanding" | "approach" | "methodology" | "team" | "case_studies" | "timeline" | "pricing" | "risk_mitigation" | "why_us" | "cover_letter" | "compliance_matrix_section" | "exceptions_terms" | "custom",
        "title": "Section title (use standard title for known types, or RFP's heading for custom)",
        "rationale": "Why this section is needed — cite the specific RFP section or requirement",
        "requirement_level": "mandatory" | "recommended" | "optional",
        "rfp_requirements": ["specific requirement from RFP this section must address"],
        "custom_description": "Only for section_type='custom': what this section should contain"
      }
    ],
    "evaluation_criteria": [
      {
        "name": "Criterion name (e.g., Technical Approach, Past Performance)",
        "weight": "percentage or points if stated (e.g., '30%', '300 points'), null if not specified",
        "description": "What evaluators are looking for",
        "mapped_sections": ["section_type(s) that should address this criterion"]
      }
    ],
    "page_limit": "page or word limit if specified, null otherwise",
    "submission_format": "format requirements if specified (e.g., 'separate technical and cost volumes'), null otherwise"
  },

  "gaps": [
    {
      "field": "field_name",
      "importance": "critical" | "helpful" | "nice_to_have",
      "suggested_question": "Question to ask the client or internal team to fill this gap"
    }
  ]
}
\`\`\`

## Extraction Guidelines

1. **Confidence Scoring**:
   - 0.9-1.0: Explicitly stated, unambiguous
   - 0.7-0.89: Clearly implied or stated with minor ambiguity
   - 0.5-0.69: Reasonably inferred from context
   - 0.3-0.49: Weak inference, needs confirmation
   - Below 0.3: Don't include, put in inferred section instead

2. **Source Quotes**: Always include a brief quote or reference from the content that supports your extraction. Keep quotes under 50 words.

3. **Source Document Attribution**: When content is labeled with document roles (e.g., "DOCUMENT 1: filename.pdf (Role: PRIMARY_RFP, ID: abc-123)"), include source_document_id and source_document_name on each extracted field to indicate which document the value came from. If multiple documents contribute to a field, cite the highest-precedence source.

4. **Omit Empty Fields**: If you cannot extract or infer a field with any confidence, omit it entirely from the extracted section.

5. **Inferred Section**: Only populate when you're making educated guesses not directly supported by the text. Always explain your reasoning.

6. **Gap Importance**:
    - critical: Must have to create a proposal (e.g., client name, what they need)
    - helpful: Would significantly improve proposal quality
    - nice_to_have: Would be useful but can work without

7. **Input Type Detection**:
   - formal_rfp: Structured document with sections, requirements, evaluation criteria
   - email: Email format, conversational, may have forwarding/reply chains
   - meeting_notes: Bullet points, action items, discussion summaries
   - brief: Short informal document describing a need
   - verbal: Conversational description, first-person perspective
   - other: Doesn't fit other categories

8. **RFP Analysis** (rfp_analysis field):
   This is CRITICAL for producing a winning proposal. Analyze the document structure carefully:

   **Section Mapping Rules:**
   - Map every RFP-requested section to one of our standard section_types when possible
   - If the RFP requires a section that doesn't map to any standard type (e.g., "Small Business Subcontracting Plan", "Organizational Conflict of Interest Statement", "Transition Plan"), use section_type="custom" and provide a clear custom_description
   - Mark sections as "mandatory" when the RFP explicitly requires them (look for: "shall include", "must provide", "required sections", evaluation criteria references, Table of Contents requirements)
   - Mark sections as "recommended" when they would strengthen the proposal even if not explicitly required (e.g., case studies are almost always beneficial even if not required)
   - At minimum, always include: executive_summary, understanding, approach (these are always recommended)
   - For pricing/cost sections: mark as mandatory if the RFP mentions cost evaluation, pricing volumes, or cost proposals
   - For compliance_matrix_section: mark as mandatory if the RFP includes a compliance checklist or requirement matrix

   **Evaluation Criteria Rules:**
   - Extract ALL stated evaluation criteria, including weights/points if provided
   - Map each criterion to the section(s) that should address it (e.g., "Technical Approach - 40%" maps to ["approach", "methodology"])
   - If evaluation criteria aren't stated, infer them from the document structure and common government procurement practices
   - Include both technical and management/cost criteria if separated

   **For non-RFP inputs** (emails, notes, verbal): Include a minimal rfp_analysis with recommended sections based on the opportunity type. Mark everything as "recommended" rather than "mandatory".

Respond ONLY with the JSON object, no additional text.`;
}

export function buildResearchPrompt(
  clientName: string,
  industryHint?: string
): string {
  return `You are a business intelligence analyst preparing research on a potential client for a consulting proposal.

## Target Company
Company Name: ${clientName}
${industryHint ? `Industry Hint: ${industryHint}` : ""}

## Your Task
Research this company and provide comprehensive intelligence that would help a consulting team prepare a winning proposal.

## Required Output Format
Respond with a JSON object matching this exact structure:

\`\`\`json
{
  "company_overview": "2-3 paragraph overview of the company, their business model, and market position",
  "industry": "Primary industry sector",
  "size_estimate": "Employee count range or revenue tier (e.g., 'Enterprise - 10,000+ employees' or 'Mid-market - $100M-500M revenue')",
  "headquarters": "City, Country",

  "recent_news": [
    {
      "headline": "News headline",
      "date": "Approximate date",
      "summary": "Brief summary of the news",
      "relevance": "Why this matters for a consulting proposal"
    }
  ],

  "strategic_priorities": [
    "Priority 1 based on public statements, annual reports, or news",
    "Priority 2"
  ],

  "technology_stack": [
    "Known technology or platform they use"
  ],

  "key_executives": [
    {
      "name": "Executive Name",
      "title": "Title"
    }
  ],

  "competitive_landscape": "Brief overview of their main competitors and market position",

  "industry_trends": [
    "Trend affecting their industry that creates opportunity"
  ],

  "recommended_angles": [
    "Positioning suggestion based on their situation",
    "Another angle to consider"
  ],

  "sources": [
    {
      "title": "Source name",
      "url": "URL if available"
    }
  ]
}
\`\`\`

## Research Guidelines

1. Focus on information that helps create a compelling, personalized proposal
2. Prioritize recent developments (last 12-18 months)
3. Include both opportunities and challenges they face
4. Be specific about recommended angles - how should we position ourselves?
5. If information is unavailable or uncertain, indicate that rather than guessing
6. Include 3-5 recent news items if available
7. Strategic priorities should reflect actual public statements or observable initiatives

Respond ONLY with the JSON object, no additional text.`;
}
