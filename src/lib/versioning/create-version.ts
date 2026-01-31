import { createAdminClient } from "@/lib/supabase/admin";

export type VersionTriggerEvent =
  | "intent_approved"
  | "generation_complete"
  | "section_edited"
  | "manual_save"
  | "pre_export"
  | "pre_restore"
  | "restored";

interface CreateVersionOptions {
  proposalId: string;
  triggerEvent: VersionTriggerEvent;
  changeSummary?: string;
  label?: string;
  userId?: string;
}

/**
 * Creates a version snapshot of a proposal
 * Call this at key milestones: intent approval, generation, edits, exports
 */
export async function createProposalVersion({
  proposalId,
  triggerEvent,
  changeSummary,
  label,
  userId,
}: CreateVersionOptions): Promise<{ versionId: string | null; error: string | null }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("create_proposal_version", {
      p_proposal_id: proposalId,
      p_trigger_event: triggerEvent,
      p_change_summary: changeSummary || null,
      p_label: label || null,
      p_user_id: userId || null,
    });

    if (error) {
      console.error("Error creating version:", error);
      return { versionId: null, error: error.message };
    }

    return { versionId: data as string, error: null };
  } catch (error) {
    console.error("Version creation failed:", error);
    return {
      versionId: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Auto-generate change summary based on trigger event
 */
export function getDefaultChangeSummary(triggerEvent: VersionTriggerEvent): string {
  switch (triggerEvent) {
    case "intent_approved":
      return "Intent and outcome contract approved";
    case "generation_complete":
      return "AI generation completed for all sections";
    case "section_edited":
      return "Section content edited";
    case "pre_export":
      return "Snapshot before export";
    case "manual_save":
      return "Manual save point";
    case "pre_restore":
      return "Auto-saved before restore";
    case "restored":
      return "Restored from previous version";
    default:
      return "Version saved";
  }
}
