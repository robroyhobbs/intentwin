/**
 * L1 Extractor — AI-powered extraction of structured company data from documents
 *
 * Takes parsed document text and uses Gemini to extract structured L1 items:
 * - company_context (brand, values, certifications, legal, partnerships)
 * - product_contexts (products with capabilities)
 * - evidence_library (case studies, metrics, testimonials, certifications, awards)
 */

import { generateText } from "@/lib/ai/claude";

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_DOCUMENT_CHARS = 100_000;

export const VALID_COMPANY_CATEGORIES = [
  "brand",
  "values",
  "certifications",
  "legal",
  "partnerships",
] as const;

export const VALID_EVIDENCE_TYPES = [
  "case_study",
  "metric",
  "testimonial",
  "certification",
  "award",
] as const;

type CompanyCategory = (typeof VALID_COMPANY_CATEGORIES)[number];
type EvidenceType = (typeof VALID_EVIDENCE_TYPES)[number];

// ── Types ──────────────────────────────────────────────────────────────────

export interface CompanyContextItem {
  category: CompanyCategory;
  key: string;
  title: string;
  content: string;
}

export interface ProductContextItem {
  product_name: string;
  service_line: string;
  description: string;
  capabilities: Array<{ name: string; description: string }>;
}

export interface EvidenceItem {
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  full_content: string;
  client_industry?: string;
  service_line?: string;
  metrics?: Array<{ name: string; value: string; context: string }>;
}

export interface ExtractionResult {
  company_context: CompanyContextItem[];
  product_contexts: ProductContextItem[];
  evidence_library: EvidenceItem[];
}

export interface ExtractionResponse {
  data: ExtractionResult;
  error: string | null;
}

// ── Prompt Builder ─────────────────────────────────────────────────────────

export function buildL1ExtractionPrompt(
  text: string,
  fileName: string,
): string {
  let documentText = text;
  let truncationNotice = "";

  if (documentText.length > MAX_DOCUMENT_CHARS) {
    documentText = documentText.slice(0, MAX_DOCUMENT_CHARS);
    truncationNotice = `\n[Document truncated to first ${MAX_DOCUMENT_CHARS} characters]`;
  }

  return `You are an expert data extraction analyst. Your task is to extract structured company information from the following document.

## Source File
File name: ${fileName}

## Document Content
<document>
${documentText}${truncationNotice}
</document>

## Your Task
Analyze the document and extract ALL relevant information into these three categories:

### 1. company_context
Company facts, brand information, values, certifications, legal entities, and partnerships.
Each item needs:
- category: one of "brand" | "values" | "certifications" | "legal" | "partnerships"
- key: a unique slug identifier (e.g., "employee-count", "cmmc-level-2")
- title: human-readable title
- content: the actual fact/information

### 2. product_contexts
Products and services offered by the company.
Each item needs:
- product_name: name of the product/service
- service_line: which service line it belongs to
- description: what it does
- capabilities: array of { name, description } for specific capabilities

### 3. evidence_library
Case studies, metrics, testimonials, certifications, and awards.
Each item needs:
- evidence_type: one of "case_study" | "metric" | "testimonial" | "certification" | "award"
- title: descriptive title
- summary: 1-2 sentence summary
- full_content: complete content
- client_industry: (optional) industry of the client
- service_line: (optional) related service line
- metrics: (optional) array of { name, value, context }

## Required Output Format
Respond with ONLY a JSON object matching this exact structure. No additional text before or after.

\`\`\`json
{
  "company_context": [...],
  "product_contexts": [...],
  "evidence_library": [...]
}
\`\`\`

If you cannot extract any items for a category, use an empty array [].
Extract as much relevant information as possible. Be thorough but accurate.`;
}

// ── Response Parser ────────────────────────────────────────────────────────

function emptyResult(): ExtractionResult {
  return {
    company_context: [],
    product_contexts: [],
    evidence_library: [],
  };
}

function extractJsonFromText(raw: string): string {
  const trimmed = raw.trim();

  // Try to extract JSON from code fence by finding the opening fence
  // and then the matching closing fence (the LAST ``` in the text)
  const openFenceMatch = trimmed.match(/^```(?:json)?\s*\n?/);
  if (openFenceMatch) {
    const afterOpen = trimmed.slice(openFenceMatch[0].length);
    const lastFenceIdx = afterOpen.lastIndexOf("```");
    if (lastFenceIdx !== -1) {
      return afterOpen.slice(0, lastFenceIdx).trim();
    }
    return afterOpen.trim();
  }

  // Code fence might be preceded by explanatory text
  const midFenceMatch = trimmed.match(/```(?:json)?\s*\n/);
  if (midFenceMatch && midFenceMatch.index !== undefined) {
    const afterOpen = trimmed.slice(
      midFenceMatch.index + midFenceMatch[0].length,
    );
    const lastFenceIdx = afterOpen.lastIndexOf("```");
    if (lastFenceIdx !== -1) {
      return afterOpen.slice(0, lastFenceIdx).trim();
    }
    return afterOpen.trim();
  }

  // Try to find raw JSON object
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  return trimmed;
}

function isValidCompanyCategory(
  category: unknown,
): category is CompanyCategory {
  return (
    typeof category === "string" &&
    (VALID_COMPANY_CATEGORIES as readonly string[]).includes(category)
  );
}

function isValidEvidenceType(type: unknown): type is EvidenceType {
  return (
    typeof type === "string" &&
    (VALID_EVIDENCE_TYPES as readonly string[]).includes(type)
  );
}

function deduplicateCompanyContext(
  items: CompanyContextItem[],
): CompanyContextItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}:${item.key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateProducts(
  items: ProductContextItem[],
): ProductContextItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.product_name}:${item.service_line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateEvidence(items: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

export function parseExtractionResponse(raw: string): ExtractionResult {
  if (!raw || !raw.trim()) {
    return emptyResult();
  }

  try {
    const jsonText = extractJsonFromText(raw);
    const parsed = JSON.parse(jsonText);

    // Must be an object, not an array
    if (
      Array.isArray(parsed) ||
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return emptyResult();
    }

    // Parse company_context
    let companyContext: CompanyContextItem[] = [];
    if (Array.isArray(parsed.company_context)) {
      companyContext = parsed.company_context.filter(
        (item: Record<string, unknown>) =>
          isValidCompanyCategory(item?.category) &&
          typeof item?.key === "string" &&
          typeof item?.title === "string" &&
          typeof item?.content === "string",
      );
    }

    // Parse product_contexts
    let productContexts: ProductContextItem[] = [];
    if (Array.isArray(parsed.product_contexts)) {
      productContexts = parsed.product_contexts
        .filter(
          (item: Record<string, unknown>) =>
            typeof item?.product_name === "string" &&
            typeof item?.service_line === "string" &&
            typeof item?.description === "string",
        )
        .map((item: Record<string, unknown>) => ({
          product_name: item.product_name as string,
          service_line: item.service_line as string,
          description: item.description as string,
          capabilities: Array.isArray(item.capabilities)
            ? (item.capabilities as Array<{
                name: string;
                description: string;
              }>)
            : [],
        }));
    }

    // Parse evidence_library
    let evidenceLibrary: EvidenceItem[] = [];
    if (Array.isArray(parsed.evidence_library)) {
      evidenceLibrary = parsed.evidence_library
        .filter(
          (item: Record<string, unknown>) =>
            isValidEvidenceType(item?.evidence_type) &&
            typeof item?.title === "string" &&
            typeof item?.summary === "string" &&
            typeof item?.full_content === "string",
        )
        .map((item: Record<string, unknown>) => {
          const evidence: EvidenceItem = {
            evidence_type: item.evidence_type as EvidenceType,
            title: item.title as string,
            summary: item.summary as string,
            full_content: item.full_content as string,
          };
          if (typeof item.client_industry === "string") {
            evidence.client_industry = item.client_industry;
          }
          if (typeof item.service_line === "string") {
            evidence.service_line = item.service_line;
          }
          if (Array.isArray(item.metrics)) {
            evidence.metrics = item.metrics as Array<{
              name: string;
              value: string;
              context: string;
            }>;
          }
          return evidence;
        });
    }

    return {
      company_context: deduplicateCompanyContext(companyContext),
      product_contexts: deduplicateProducts(productContexts),
      evidence_library: deduplicateEvidence(evidenceLibrary),
    };
  } catch {
    return emptyResult();
  }
}

// ── Main Extraction Function ───────────────────────────────────────────────

export async function extractL1FromText(
  text: string,
  fileName: string,
): Promise<ExtractionResponse> {
  try {
    const prompt = buildL1ExtractionPrompt(text, fileName);

    const response = await generateText(prompt, {
      systemPrompt:
        "You are an expert data extraction analyst. You extract structured company information from documents and return valid JSON. Be thorough and extract every relevant item.",
      temperature: 0.2,
      maxTokens: 8192,
    });

    const data = parseExtractionResponse(response);

    return { data, error: null };
  } catch {
    return {
      data: emptyResult(),
      error: "Failed to extract L1 data from document",
    };
  }
}
