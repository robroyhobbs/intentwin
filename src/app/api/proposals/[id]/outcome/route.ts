import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`
        id,
        title,
        deal_outcome,
        deal_outcome_set_at,
        deal_value,
        deal_currency,
        loss_reason,
        loss_reason_category,
        competitor_won,
        outcome_notes,
        promoted_to_case_study
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ outcome: proposal });
  } catch (error) {
    console.error("Get outcome error:", error);
    return NextResponse.json(
      { error: "Failed to get outcome" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const supabase = await createClient();

    // Get current outcome for history
    const { data: current } = await supabase
      .from("proposals")
      .select("deal_outcome, deal_value")
      .eq("id", id)
      .single();

    // Update the proposal
    const updateData: Record<string, unknown> = {
      deal_outcome,
      deal_outcome_set_at: new Date().toISOString(),
      deal_outcome_set_by: user.id,
    };

    if (deal_value !== undefined) updateData.deal_value = deal_value;
    if (deal_currency !== undefined) updateData.deal_currency = deal_currency;
    if (loss_reason !== undefined) updateData.loss_reason = loss_reason;
    if (loss_reason_category !== undefined) updateData.loss_reason_category = loss_reason_category;
    if (competitor_won !== undefined) updateData.competitor_won = competitor_won;
    if (outcome_notes !== undefined) updateData.outcome_notes = outcome_notes;

    const { data: proposal, error } = await supabase
      .from("proposals")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record in history
    await supabase.from("deal_outcome_history").insert({
      proposal_id: id,
      previous_outcome: current?.deal_outcome,
      new_outcome: deal_outcome,
      deal_value,
      loss_reason,
      loss_reason_category,
      competitor_won,
      notes: outcome_notes,
      changed_by: user.id,
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Update outcome error:", error);
    return NextResponse.json(
      { error: "Failed to update outcome" },
      { status: 500 }
    );
  }
}
