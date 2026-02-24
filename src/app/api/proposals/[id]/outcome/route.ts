import { createAdminClient } from "@/lib/supabase/admin";
import { ok, serverError, withProposalRoute } from "@/lib/api/response";

export const GET = withProposalRoute(
  async (_request, { id: _id }, _context, proposal) => {
    // Return just the outcome fields
    const outcome = {
      id: proposal!.id,
      title: proposal!.title,
      deal_outcome: proposal!.deal_outcome,
      deal_outcome_set_at: proposal!.deal_outcome_set_at,
      deal_value: proposal!.deal_value,
      deal_currency: proposal!.deal_currency,
      loss_reason: proposal!.loss_reason,
      loss_reason_category: proposal!.loss_reason_category,
      competitor_won: proposal!.competitor_won,
      outcome_notes: proposal!.outcome_notes,
      promoted_to_case_study: proposal!.promoted_to_case_study,
    };

    return ok({ outcome });
  },
  { requireFullProposal: true },
);

export const PATCH = withProposalRoute(
  async (request, { id }, context, existingProposal) => {
    const body = await request.json();
    const {
      deal_outcome,
      deal_value,
      deal_currency,
      loss_reason,
      loss_reason_category,
      competitor_won,
      outcome_notes,
    } = body;

    const adminClient = createAdminClient();

    // Update the proposal
    const updateData: Record<string, unknown> = {
      deal_outcome,
      deal_outcome_set_at: new Date().toISOString(),
      deal_outcome_set_by: context.user.id,
    };

    if (deal_value !== undefined) updateData.deal_value = deal_value;
    if (deal_currency !== undefined) updateData.deal_currency = deal_currency;
    if (loss_reason !== undefined) updateData.loss_reason = loss_reason;
    if (loss_reason_category !== undefined) updateData.loss_reason_category = loss_reason_category;
    if (competitor_won !== undefined) updateData.competitor_won = competitor_won;
    if (outcome_notes !== undefined) updateData.outcome_notes = outcome_notes;

    const { data: proposal, error } = await adminClient
      .from("proposals")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", context.organizationId)
      .select()
      .single();

    if (error) {
      return serverError("Failed to update outcome", error);
    }

    // Record in history
    await adminClient.from("deal_outcome_history").insert({
      proposal_id: id,
      previous_outcome: existingProposal!.deal_outcome,
      new_outcome: deal_outcome,
      deal_value,
      loss_reason,
      loss_reason_category,
      competitor_won,
      notes: outcome_notes,
      changed_by: context.user.id,
    });

    return ok({ proposal });
  },
  { requireFullProposal: true },
);
