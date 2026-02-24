import { createAdminClient } from "@/lib/supabase/admin";
import { VALID_SECTION_TYPES } from "@/lib/ai/prompts/extract-requirements";
import type { MergeRequest, MergeResponse } from "@/types/proposal-documents";
import { ComplianceStatus, SectionReviewStatus } from "@/lib/constants/statuses";
import { withProposalRoute, notFound, badRequest, conflict, ok } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/proposals/[id]/documents/[docId]/merge
 *
 * Apply user-approved merge decisions from incremental extraction.
 * This is the confirmation step after the user reviews the merge plan
 * returned by the /extract endpoint.
 *
 * Only applies changes the user explicitly approved.
 */
export const POST = withProposalRoute(async (request, { id: proposalId, docId: documentId }, context) => {
  let body: MergeRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const {
    approved_new_requirements = [],
    approved_updated_requirements = [],
    approved_intake_changes = [],
    regenerate_sections = [],
  } = body;

  const adminClient = createAdminClient();

  // Verify document association exists and is in 'extracted' status
  const { data: proposalDoc } = await adminClient
    .from("proposal_documents")
    .select("extraction_status")
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!proposalDoc) {
    return notFound("Document not associated with this proposal");
  }

  if (proposalDoc.extraction_status !== "extracted") {
    return conflict(`Document extraction_status is '${proposalDoc.extraction_status}', expected 'extracted'. Run extraction first.`);
  }

  let requirementsAdded = 0;
  let requirementsUpdated = 0;
  const intakeFieldsUpdated: string[] = [];
  const sectionsFlagged: string[] = [];

  // 1. Insert approved new requirements
  // The caller sends temp_ids from the extraction result. We need to
  // re-fetch the extraction data or trust the client-sent data.
  // For safety, we accept the requirement data in the request body.
  // The client should include the full requirement objects alongside temp_ids.
  //
  // For a simpler V1: the client sends the full new_requirements array
  // and we filter by approved temp_ids.
  if (approved_new_requirements.length > 0) {
    // Expect the request to include the full requirements from the extract response
    const newReqsBody = body as MergeRequest & {
      new_requirements_data?: Array<{
        temp_id: string;
        requirement_text: string;
        source_reference: string | null;
        category: string;
        suggested_sections: string[];
        source_document_id: string;
      }>;
    };

    const reqData = newReqsBody.new_requirements_data || [];
    const approvedData = reqData.filter((r) =>
      approved_new_requirements.includes(r.temp_id)
    );

    if (approvedData.length > 0) {
      // Fetch section map for auto-mapping
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

      const rows = approvedData.map((req) => {
        let mappedSectionId: string | null = null;
        for (const suggested of req.suggested_sections) {
          if (
            VALID_SECTION_TYPES.includes(
              suggested as (typeof VALID_SECTION_TYPES)[number]
            )
          ) {
            const sectionId = sectionMap.get(suggested);
            if (sectionId) {
              mappedSectionId = sectionId;
              break;
            }
          }
        }

        return {
          proposal_id: proposalId,
          organization_id: context.organizationId,
          requirement_text: req.requirement_text,
          source_reference: req.source_reference || null,
          category: req.category || "desirable",
          compliance_status: ComplianceStatus.NOT_ADDRESSED,
          mapped_section_id: mappedSectionId,
          is_extracted: true,
          source_document_id: req.source_document_id,
        };
      });

      const { error: insertError } = await adminClient
        .from("proposal_requirements")
        .insert(rows);

      if (insertError) {
        logger.warn("Failed to insert new requirements", { error: insertError });
      } else {
        requirementsAdded = rows.length;
      }
    }
  }

  // 2. Update approved existing requirements with new wording
  if (approved_updated_requirements.length > 0) {
    const updatedReqsBody = body as MergeRequest & {
      updated_requirements_data?: Array<{
        existing_id: string;
        updated_text: string;
        source_document_id: string;
      }>;
    };

    const updateData = updatedReqsBody.updated_requirements_data || [];
    const approvedUpdates = updateData.filter((r) =>
      approved_updated_requirements.includes(r.existing_id)
    );

    for (const update of approvedUpdates) {
      const { error: updateError } = await adminClient
        .from("proposal_requirements")
        .update({
          requirement_text: update.updated_text,
          source_document_id: update.source_document_id,
          // Preserve: compliance_status, mapped_section_id, category
        })
        .eq("id", update.existing_id)
        .eq("proposal_id", proposalId)
        .eq("organization_id", context.organizationId)
        .eq("is_extracted", true); // Safety: never update manual requirements

      if (!updateError) {
        requirementsUpdated++;
      }
    }
  }

  // 3. Apply approved intake data changes
  if (approved_intake_changes.length > 0) {
    const intakeChangesBody = body as MergeRequest & {
      intake_changes_data?: Record<string, unknown>;
    };

    if (intakeChangesBody.intake_changes_data) {
      // Fetch current intake_data
      const { data: proposal } = await adminClient
        .from("proposals")
        .select("intake_data")
        .eq("id", proposalId)
        .eq("organization_id", context.organizationId)
        .single();

      if (proposal) {
        const currentIntake =
          (proposal.intake_data as Record<string, unknown>) || {};
        const changes = intakeChangesBody.intake_changes_data;

        // Only apply fields the user approved
        for (const field of approved_intake_changes) {
          if (field in changes) {
            currentIntake[field] = changes[field];
            intakeFieldsUpdated.push(field);
          }
        }

        await adminClient
          .from("proposals")
          .update({ intake_data: currentIntake })
          .eq("id", proposalId)
          .eq("organization_id", context.organizationId);
      }
    }
  }

  // 4. Flag sections for regeneration
  if (regenerate_sections.length > 0) {
    for (const sectionType of regenerate_sections) {
      const { error: flagError } = await adminClient
        .from("proposal_sections")
        .update({
          review_status: SectionReviewStatus.NEEDS_REVISION,
          review_notes: `Flagged for revision: new document "${documentId}" added requirements affecting this section.`,
        })
        .eq("proposal_id", proposalId)
        .eq("section_type", sectionType);

      if (!flagError) {
        sectionsFlagged.push(sectionType);
      }
    }
  }

  // 5. Update extraction status to 'merged'
  await adminClient
    .from("proposal_documents")
    .update({ extraction_status: "merged" })
    .eq("proposal_id", proposalId)
    .eq("document_id", documentId)
    .eq("organization_id", context.organizationId);

  // 6. Log merge event
  const { data: event, error: eventError } = await adminClient
    .from("proposal_document_events")
    .insert({
      proposal_id: proposalId,
      document_id: documentId,
      organization_id: context.organizationId,
      event_type: "merged",
      event_data: {
        requirements_added: requirementsAdded,
        requirements_updated: requirementsUpdated,
        intake_fields_updated: intakeFieldsUpdated,
        sections_flagged: sectionsFlagged,
      },
      created_by: context.user.id,
    })
    .select()
    .single();

  if (eventError) {
    logger.warn("Failed to log merge event", { error: eventError });
  }

  const response: MergeResponse = {
    requirements_added: requirementsAdded,
    requirements_updated: requirementsUpdated,
    intake_fields_updated: intakeFieldsUpdated,
    sections_flagged: sectionsFlagged,
    event: event ?? null,
  };

  return ok(response);
});
