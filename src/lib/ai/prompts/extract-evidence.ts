/**
 * Evidence Extraction Prompt Builder
 * Analyzes document text and extracts structured evidence entries
 * (case studies, metrics, testimonials, certifications, awards)
 */

const MAX_DOCUMENT_CHARS = 100_000;

const EVIDENCE_TYPES = [
  "case_study",
  "metric",
  "testimonial",
  "certification",
  "award",
] as const;

export function buildEvidenceExtractionPrompt(documentText: string): string {
  const truncated =
    documentText.length > MAX_DOCUMENT_CHARS
      ? documentText.slice(0, MAX_DOCUMENT_CHARS) +
        "\n\n[Document truncated at 100K characters]"
      : documentText;

  return `You are an expert at analyzing business documents and extracting evidence that can be used in consulting proposals.

## Your Task
Analyze the document below and extract any evidence that would strengthen a proposal. Look for:

1. **case_study** — Client success stories, project outcomes, engagement results
2. **metric** — Specific measurable results (cost savings, time reduction, performance improvement)
3. **testimonial** — Client quotes, endorsements, feedback
4. **certification** — Industry certifications, compliance achievements, accreditations
5. **award** — Awards, recognitions, rankings

## Document
<document>
${truncated}
</document>

## Required Output Format
Respond with a JSON array of extracted evidence. Each item must have:

\`\`\`json
[
  {
    "evidence_type": "case_study" | "metric" | "testimonial" | "certification" | "award",
    "title": "Short descriptive title",
    "summary": "2-3 sentence summary suitable for a proposal",
    "full_content": "Full extracted text from the document",
    "client_industry": "industry if identifiable, or null",
    "service_line": "service line if identifiable, or null",
    "metrics": [
      { "name": "metric name", "value": "metric value", "context": "brief context" }
    ],
    "outcomes_demonstrated": [
      { "outcome": "outcome category", "description": "what was achieved" }
    ]
  }
]
\`\`\`

## Rules
- Extract EVERY piece of evidence you can find — be thorough
- Each evidence item should be self-contained and usable in a proposal
- For metrics, always include the specific numbers
- If you can't identify industry or service_line, set them to null
- If there's no extractable evidence, return an empty array: []
- Return ONLY the JSON array, no other text`;
}

/**
 * Parse the AI response into structured evidence entries.
 * Handles: raw JSON, code-fenced JSON, malformed responses.
 */
export function parseEvidenceResponse(
  raw: string,
): Array<{
  evidence_type: string;
  title: string;
  summary: string;
  full_content: string;
  client_industry: string | null;
  service_line: string | null;
  metrics: Array<{ name: string; value: string; context: string }>;
  outcomes_demonstrated: Array<{ outcome: string; description: string }>;
}> {
  if (!raw || !raw.trim()) return [];

  // Strip markdown code fences if present
  let cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  // Try to find JSON array in the response
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    // Validate and normalize each entry
    return parsed
      .filter(
        (item: Record<string, unknown>) =>
          item && typeof item === "object" && item.title && item.summary,
      )
      .map((item: Record<string, unknown>) => ({
        evidence_type: EVIDENCE_TYPES.includes(
          item.evidence_type as (typeof EVIDENCE_TYPES)[number],
        )
          ? (item.evidence_type as string)
          : "metric",
        title: String(item.title || "").trim(),
        summary: String(item.summary || "").trim(),
        full_content: String(item.full_content || "").trim(),
        client_industry:
          item.client_industry && typeof item.client_industry === "string"
            ? item.client_industry
            : null,
        service_line:
          item.service_line && typeof item.service_line === "string"
            ? item.service_line
            : null,
        metrics: Array.isArray(item.metrics)
          ? (item.metrics as Array<{ name: string; value: string; context: string }>)
          : [],
        outcomes_demonstrated: Array.isArray(item.outcomes_demonstrated)
          ? (item.outcomes_demonstrated as Array<{ outcome: string; description: string }>)
          : [],
      }));
  } catch {
    return [];
  }
}
