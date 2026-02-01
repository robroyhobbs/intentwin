import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get all proposals with outcomes for this organization
    const { data: proposals, error } = await adminClient
      .from("proposals")
      .select(`
        id,
        title,
        status,
        deal_outcome,
        deal_outcome_set_at,
        deal_value,
        deal_currency,
        loss_reason_category,
        intake_data,
        created_at
      `)
      .eq("organization_id", context.organizationId)
      .in("status", ["exported", "final", "review", "draft"])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary stats
    const total = proposals?.length || 0;
    const won = proposals?.filter((p) => p.deal_outcome === "won").length || 0;
    const lost = proposals?.filter((p) => p.deal_outcome === "lost").length || 0;
    const pending = proposals?.filter((p) => p.deal_outcome === "pending" || !p.deal_outcome).length || 0;
    const noDecision = proposals?.filter((p) => p.deal_outcome === "no_decision").length || 0;

    const decidedCount = won + lost;
    const winRate = decidedCount > 0 ? Math.round((won / decidedCount) * 100) : 0;

    const totalWonValue = proposals
      ?.filter((p) => p.deal_outcome === "won" && p.deal_value)
      .reduce((sum, p) => sum + (p.deal_value || 0), 0) || 0;

    // Group by industry
    const byIndustry: Record<string, { won: number; lost: number; total: number }> = {};
    for (const p of proposals || []) {
      const industry = (p.intake_data as Record<string, string>)?.client_industry || "unknown";
      if (!byIndustry[industry]) {
        byIndustry[industry] = { won: 0, lost: 0, total: 0 };
      }
      byIndustry[industry].total++;
      if (p.deal_outcome === "won") byIndustry[industry].won++;
      if (p.deal_outcome === "lost") byIndustry[industry].lost++;
    }

    // Group by opportunity type
    const byOpportunityType: Record<string, { won: number; lost: number; total: number }> = {};
    for (const p of proposals || []) {
      const oppType = (p.intake_data as Record<string, string>)?.opportunity_type || "unknown";
      if (!byOpportunityType[oppType]) {
        byOpportunityType[oppType] = { won: 0, lost: 0, total: 0 };
      }
      byOpportunityType[oppType].total++;
      if (p.deal_outcome === "won") byOpportunityType[oppType].won++;
      if (p.deal_outcome === "lost") byOpportunityType[oppType].lost++;
    }

    // Loss reasons
    const lossReasons: Record<string, number> = {};
    for (const p of proposals || []) {
      if (p.deal_outcome === "lost" && p.loss_reason_category) {
        lossReasons[p.loss_reason_category] = (lossReasons[p.loss_reason_category] || 0) + 1;
      }
    }

    // Recent outcomes (last 10)
    const recentOutcomes = proposals
      ?.filter((p) => p.deal_outcome && p.deal_outcome !== "pending")
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        title: p.title,
        outcome: p.deal_outcome,
        value: p.deal_value,
        industry: (p.intake_data as Record<string, string>)?.client_industry,
        date: p.deal_outcome_set_at || p.created_at,
      }));

    return NextResponse.json({
      summary: {
        total,
        won,
        lost,
        pending,
        noDecision,
        winRate,
        totalWonValue,
      },
      byIndustry,
      byOpportunityType,
      lossReasons,
      recentOutcomes,
      proposals: proposals?.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        dealOutcome: p.deal_outcome,
        dealValue: p.deal_value,
        industry: (p.intake_data as Record<string, string>)?.client_industry,
        opportunityType: (p.intake_data as Record<string, string>)?.opportunity_type,
        clientName: (p.intake_data as Record<string, string>)?.client_name,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
