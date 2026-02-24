import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import {
  buildRequirementsExtractionPrompt,
  parseExtractionResponse,
} from "@/lib/ai/prompts/extract-requirements";
import {
  buildMergePlan,
  identifyAffectedSections,
} from "@/lib/documents/incremental-merge";
import type { IncrementalExtractionResult } from "@/types/proposal-documents";
import { withProposalRoute, notFound, badRequest, conflict, ok } from "@/lib/api/response";

export const maxDuration = 300; // 5 min — extraction + embedding can be slow

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing business documents and extracting requirements. You are precise, thorough, and always respond with valid JSON arrays only.`;

/**
 * POST /api/proposals/[id]/documents/[docId]/extract
 *
 * Incrementally extract requirements from a SINGLE new document and
 * compare against existing requirements to produce a merge plan.
 *
 * Does NOT modify any data — returns a plan for user review.
 * The user then confirms via /api/proposals/[id]/documents/[docId]/merge.
 */
export const POST = withProposalRoute(async (request, { id: proposalId, docId: documentId }, context) => {
  const adminClient = createAdminClient();

  // Verify document is associated with this proposal
  const { data: proposalDoc } = await adminClient
    .from("proposal_documents")
    .select("*, document:documents(id, file_name, processing_status)")
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!proposalDoc) {
    return notFound("Document not associated with this proposal");
  }

  const doc = proposalDoc.document as {
    id: string;
    file_name: string;
    processing_status: string;
  };

  if (doc.processing_status !== "completed") {
    return conflict("Document is still processing. Please wait and retry.");
  }

  // Fetch document content from chunks
  const { data: chunks } = await adminClient
    .from("document_chunks")
    .select("content, section_heading, chunk_index")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });

  if (!chunks || chunks.length === 0) {
    return badRequest("No content found in document");
  }

  const docContent = chunks
    .map((c: { content: string; section_heading?: string }) => {
      const heading = c.section_heading ? `## ${c.section_heading}\n` : "";
      return heading + c.content;
    })
    .join("\n\n");

  // Extract requirements from this single document
  const prompt = buildRequirementsExtractionPrompt(docContent);
  const response = await generateText(prompt, {
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    temperature: 0.2,
    maxTokens: 4096,
  });

  const extractedReqs = parseExtractionResponse(response);

  // Fetch existing requirements for this proposal
  const { data: existingReqs } = await adminClient
    .from("proposal_requirements")
    .select(
      "id, requirement_text, source_reference, category, compliance_status, mapped_section_id, is_extracted, source_document_id"
    )
    .eq("proposal_id", proposalId)
    .eq("organization_id", context.organizationId);

  // Build the merge plan using semantic similarity
  const mergePlan = await buildMergePlan(
    existingReqs || [],
    extractedReqs,
    documentId
  );

  // Fetch proposal sections for impact analysis
  const { data: sections } = await adminClient
    .from("proposal_sections")
    .select("id, section_type")
    .eq("proposal_id", proposalId);

  const sectionMap = new Map<string, string>();
  if (sections) {
    for (const s of sections) {
      sectionMap.set(s.section_type, s.id);
    }
  }

  const affectedSections = identifyAffectedSections(
    mergePlan,
    existingReqs || [],
    sectionMap
  );

  // Update extraction status on the proposal_documents row
  await adminClient
    .from("proposal_documents")
    .update({
      extraction_status: "extracted",
      extracted_at: new Date().toISOString(),
    })
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId);

  // Log extraction event
  await adminClient.from("proposal_document_events").insert({
    proposal_id: proposalId,
    document_id: documentId,
    organization_id: context.organizationId,
    event_type: "extracted",
    event_data: {
      new_count: mergePlan.new_requirements.length,
      updated_count: mergePlan.updated_requirements.length,
      covered_count: mergePlan.already_covered.length,
      affected_sections: affectedSections,
    },
    created_by: context.user.id,
  });

  const result: IncrementalExtractionResult = {
    new_requirements: mergePlan.new_requirements,
    updated_requirements: mergePlan.updated_requirements,
    new_intake_fields: {},
    updated_intake_fields: [],
    affected_sections: affectedSections,
    source_document: {
      id: documentId,
      file_name: doc.file_name,
      document_role: proposalDoc.document_role,
    },
  };

  return ok(result);
});
