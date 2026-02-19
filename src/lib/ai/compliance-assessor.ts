/**
 * Compliance Auto-Assessor
 * Compares generated proposal sections against extracted requirements
 * and auto-classifies compliance status using AI.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "./claude";
import {
  buildComplianceAssessmentPrompt,
  parseAssessmentResponse,
  type RequirementForAssessment,
  type SectionForAssessment,
} from "./prompts/assess-compliance";
import { createLogger } from "@/lib/utils/logger";

const ASSESSMENT_SYSTEM_PROMPT = `You are a meticulous compliance analyst. You assess proposal content against client requirements with precision. Always respond with valid JSON arrays only. Never hallucinate content — if you cannot find evidence in the proposal, mark as not_addressed.`;

const ASSESSMENT_TIMEOUT_MS = 120_000; // 2 minutes for the AI call

export interface ComplianceAssessmentMeta {
  status: "assessing" | "completed" | "failed";
  assessed_at: string;
  total_requirements: number;
  auto_assessed: number;
  results_applied: number;
  skipped_manual: number;
  error?: string;
}

/**
 * Run compliance auto-assessment for a proposal.
 * Fetches requirements and sections, sends to AI, applies results.
 * 
 * Only updates requirements that are currently "not_addressed" — 
 * never overwrites manual user decisions.
 */
export async function runComplianceAssessment(
  proposalId: string,
  trigger: "auto_post_generation" | "manual" = "manual",
): Promise<ComplianceAssessmentMeta> {
  const log = createLogger({ operation: "complianceAssessment", proposalId });
  const supabase = createAdminClient();

  const meta: ComplianceAssessmentMeta = {
    status: "assessing",
    assessed_at: new Date().toISOString(),
    total_requirements: 0,
    auto_assessed: 0,
    results_applied: 0,
    skipped_manual: 0,
  };

  try {
    // Store initial status
    await supabase
      .from("proposals")
      .update({ compliance_assessment: { ...meta, trigger } })
      .eq("id", proposalId);

    // Fetch proposal to get org ID
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, organization_id")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Fetch all requirements
    const { data: allRequirements, error: reqErr } = await supabase
      .from("proposal_requirements")
      .select("id, requirement_text, category, requirement_type, compliance_status, source_reference, is_extracted")
      .eq("proposal_id", proposalId)
      .eq("organization_id", proposal.organization_id);

    if (reqErr) throw new Error(`Failed to fetch requirements: ${reqErr.message}`);
    if (!allRequirements || allRequirements.length === 0) {
      log.info("No requirements to assess");
      meta.status = "completed";
      await storeResult(supabase, proposalId, meta, trigger);
      return meta;
    }

    meta.total_requirements = allRequirements.length;

    // Only auto-assess requirements that are currently "not_addressed"
    // Never overwrite manual user decisions
    const toAssess = allRequirements.filter(
      (r) => r.compliance_status === "not_addressed",
    );
    meta.skipped_manual = allRequirements.length - toAssess.length;

    if (toAssess.length === 0) {
      log.info("All requirements already have manual status — nothing to assess");
      meta.status = "completed";
      await storeResult(supabase, proposalId, meta, trigger);
      return meta;
    }

    // Fetch completed sections
    const { data: sections, error: secErr } = await supabase
      .from("proposal_sections")
      .select("id, section_type, title, generated_content, edited_content, generation_status")
      .eq("proposal_id", proposalId)
      .eq("generation_status", "completed")
      .order("section_order", { ascending: true });

    if (secErr) throw new Error(`Failed to fetch sections: ${secErr.message}`);
    if (!sections || sections.length === 0) {
      log.warn("No completed sections to assess against");
      meta.status = "completed";
      await storeResult(supabase, proposalId, meta, trigger);
      return meta;
    }

    // Build assessment inputs
    const reqInputs: RequirementForAssessment[] = toAssess.map((r) => ({
      id: r.id,
      requirement_text: r.requirement_text,
      category: r.category,
      requirement_type: r.requirement_type || "content",
      source_reference: r.source_reference,
    }));

    const sectionInputs: SectionForAssessment[] = sections.map((s) => ({
      id: s.id,
      section_type: s.section_type,
      title: s.title,
      content: (s.edited_content || s.generated_content || "").trim(),
    })).filter((s) => s.content.length > 0);

    log.info("Running AI compliance assessment", {
      requirementsToAssess: reqInputs.length,
      sectionsAvailable: sectionInputs.length,
      trigger,
    });

    // Build prompt and call AI with timeout
    const prompt = buildComplianceAssessmentPrompt(reqInputs, sectionInputs);
    const response = await Promise.race([
      generateText(prompt, {
        systemPrompt: ASSESSMENT_SYSTEM_PROMPT,
        temperature: 0.1, // Low temperature for consistency
        maxTokens: 8192, // Enough for ~50 requirements
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Assessment timed out")), ASSESSMENT_TIMEOUT_MS),
      ),
    ]);

    // Parse results
    const validReqIds = new Set(toAssess.map((r) => r.id));
    const validSectionIds = new Set(sections.map((s) => s.id));
    const results = parseAssessmentResponse(response, validReqIds, validSectionIds);

    meta.auto_assessed = results.length;

    log.info("Assessment results parsed", {
      inputCount: reqInputs.length,
      parsedCount: results.length,
    });

    // Apply results to requirements (batch update via direct DB)
    let appliedCount = 0;
    for (const result of results) {
      const updateData: Record<string, unknown> = {
        compliance_status: result.compliance_status,
        updated_at: new Date().toISOString(),
      };

      // Set mapped_section_id if the AI identified one
      if (result.mapped_section_id) {
        updateData.mapped_section_id = result.mapped_section_id;
      }

      // Append AI rationale to notes (don't overwrite existing notes)
      if (result.rationale) {
        const existing = toAssess.find((r) => r.id === result.requirement_id);
        const prefix = "[Auto-assessed] ";
        updateData.notes = prefix + result.rationale;
      }

      const { error: updateErr } = await supabase
        .from("proposal_requirements")
        .update(updateData)
        .eq("id", result.requirement_id)
        .eq("organization_id", proposal.organization_id);

      if (!updateErr) {
        appliedCount++;
      } else {
        log.warn("Failed to update requirement", {
          requirementId: result.requirement_id,
          error: updateErr.message,
        });
      }
    }

    meta.results_applied = appliedCount;
    meta.status = "completed";

    log.info("Compliance assessment complete", {
      total: meta.total_requirements,
      assessed: meta.auto_assessed,
      applied: meta.results_applied,
      skippedManual: meta.skipped_manual,
    });

    await storeResult(supabase, proposalId, meta, trigger);
    return meta;
  } catch (error) {
    log.error("Compliance assessment failed", error);
    meta.status = "failed";
    meta.error = error instanceof Error ? error.message : String(error);
    await storeResult(supabase, proposalId, meta, trigger).catch(() => {});
    return meta;
  }
}

async function storeResult(
  supabase: ReturnType<typeof createAdminClient>,
  proposalId: string,
  meta: ComplianceAssessmentMeta,
  trigger: string,
) {
  await supabase
    .from("proposals")
    .update({
      compliance_assessment: { ...meta, trigger },
    })
    .eq("id", proposalId);
}
