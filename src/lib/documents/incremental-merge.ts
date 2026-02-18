/**
 * Incremental Merge Logic for Requirements
 *
 * When a new document is added to an in-progress proposal, we need to:
 * 1. Extract requirements from ONLY the new document
 * 2. Compare against existing requirements using semantic similarity
 * 3. Classify each as NEW, UPDATED, or already covered
 * 4. Return a merge plan for user review (never auto-apply)
 *
 * Key principle: NEVER delete or modify manual requirements (is_extracted = false).
 * NEVER destroy compliance_status or mapped_section_id on existing requirements.
 */

import { generateEmbeddings } from "@/lib/ai/embeddings";
import type {
  IncrementalRequirement,
  UpdatedRequirement,
} from "@/types/proposal-documents";

// Cosine similarity threshold for considering two requirements a "match"
const SIMILARITY_THRESHOLD = 0.92;

// Below this threshold, requirements are definitely different
const DISSIMILARITY_THRESHOLD = 0.75;

interface ExistingRequirement {
  id: string;
  requirement_text: string;
  source_reference: string | null;
  category: string;
  compliance_status: string;
  mapped_section_id: string | null;
  is_extracted: boolean;
  source_document_id: string | null;
}

interface ExtractedRequirement {
  requirement_text: string;
  source_reference: string | null;
  category: "mandatory" | "desirable" | "informational";
  suggested_sections: string[];
}

export interface MergePlan {
  /** Brand new requirements not found in existing set */
  new_requirements: IncrementalRequirement[];
  /** Existing requirements whose wording has been updated */
  updated_requirements: UpdatedRequirement[];
  /** Existing requirements that are already covered (no action needed) */
  already_covered: { existing_id: string; similarity: number }[];
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate a temporary client-side ID for tracking new requirements through
 * the merge review flow.
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build a merge plan by comparing newly extracted requirements against
 * existing requirements using embedding-based semantic similarity.
 *
 * This function:
 * - Generates embeddings for both existing and new requirement texts
 * - Finds the best match for each new requirement in the existing set
 * - Classifies each as NEW, UPDATED, or COVERED based on similarity scores
 *
 * @param existing - Current requirements on the proposal
 * @param extracted - Newly extracted requirements from the new document
 * @param sourceDocumentId - ID of the new document
 * @returns MergePlan with classified requirements for user review
 */
export async function buildMergePlan(
  existing: ExistingRequirement[],
  extracted: ExtractedRequirement[],
  sourceDocumentId: string
): Promise<MergePlan> {
  const plan: MergePlan = {
    new_requirements: [],
    updated_requirements: [],
    already_covered: [],
  };

  // If no existing requirements, everything is new
  if (existing.length === 0) {
    plan.new_requirements = extracted.map((req) => ({
      temp_id: generateTempId(),
      requirement_text: req.requirement_text,
      source_reference: req.source_reference,
      category: req.category,
      suggested_sections: req.suggested_sections,
      source_document_id: sourceDocumentId,
    }));
    return plan;
  }

  // If no new requirements extracted, nothing to merge
  if (extracted.length === 0) {
    return plan;
  }

  // Generate embeddings for all requirement texts
  const existingTexts = existing.map((r) => r.requirement_text);
  const extractedTexts = extracted.map((r) => r.requirement_text);

  const [existingEmbeddings, extractedEmbeddings] = await Promise.all([
    generateEmbeddings(existingTexts, "document"),
    generateEmbeddings(extractedTexts, "document"),
  ]);

  // For each extracted requirement, find the best match in existing
  for (let i = 0; i < extracted.length; i++) {
    const newReq = extracted[i];
    const newEmb = extractedEmbeddings[i];

    let bestMatch: { index: number; similarity: number } | null = null;

    for (let j = 0; j < existing.length; j++) {
      const similarity = cosineSimilarity(newEmb, existingEmbeddings[j]);

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { index: j, similarity };
      }
    }

    if (!bestMatch || bestMatch.similarity < DISSIMILARITY_THRESHOLD) {
      // Clearly new - no close match exists
      plan.new_requirements.push({
        temp_id: generateTempId(),
        requirement_text: newReq.requirement_text,
        source_reference: newReq.source_reference,
        category: newReq.category,
        suggested_sections: newReq.suggested_sections,
        source_document_id: sourceDocumentId,
      });
    } else if (bestMatch.similarity >= SIMILARITY_THRESHOLD) {
      // Close enough to be the same requirement - already covered
      plan.already_covered.push({
        existing_id: existing[bestMatch.index].id,
        similarity: bestMatch.similarity,
      });
    } else {
      // In the gray zone (0.75 - 0.92): similar but different enough
      // that the wording may have been updated (e.g., by an amendment).
      // Present as an update for the user to review.
      const existingReq = existing[bestMatch.index];

      // Only suggest update for extracted requirements (not manual ones)
      if (existingReq.is_extracted) {
        plan.updated_requirements.push({
          existing_id: existingReq.id,
          existing_text: existingReq.requirement_text,
          updated_text: newReq.requirement_text,
          similarity: bestMatch.similarity,
          source_document_id: sourceDocumentId,
        });
      } else {
        // Manual requirement is close but different - treat as new
        // since we never modify manual requirements
        plan.new_requirements.push({
          temp_id: generateTempId(),
          requirement_text: newReq.requirement_text,
          source_reference: newReq.source_reference,
          category: newReq.category,
          suggested_sections: newReq.suggested_sections,
          source_document_id: sourceDocumentId,
        });
      }
    }
  }

  return plan;
}

/**
 * Identify which proposal sections may be affected by new or updated requirements.
 *
 * Returns section_type values that should be flagged for review/regeneration.
 */
export function identifyAffectedSections(
  plan: MergePlan,
  existingRequirements: ExistingRequirement[],
  sectionMap: Map<string, string> // section_type -> section_id
): string[] {
  const affectedTypes = new Set<string>();

  // New requirements suggest sections
  for (const req of plan.new_requirements) {
    for (const sectionType of req.suggested_sections) {
      if (sectionMap.has(sectionType)) {
        affectedTypes.add(sectionType);
      }
    }
  }

  // Updated requirements may affect their currently mapped sections
  for (const update of plan.updated_requirements) {
    const existing = existingRequirements.find((r) => r.id === update.existing_id);
    if (existing?.mapped_section_id) {
      // Find the section_type for this section_id
      for (const [type, id] of sectionMap) {
        if (id === existing.mapped_section_id) {
          affectedTypes.add(type);
          break;
        }
      }
    }
  }

  return Array.from(affectedTypes);
}
