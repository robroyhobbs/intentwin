import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { ProposalStatus, DealOutcome } from "@/lib/constants/statuses";
import { unauthorized, ok, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const adminClient = createAdminClient();

    // ── Existing query: proposals with outcomes for this organization (capped at 1000) ──
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
        created_at,
        quality_review,
        bid_evaluation
      `)
      .eq("organization_id", context.organizationId)
      .in("status", [ProposalStatus.EXPORTED, ProposalStatus.FINAL, ProposalStatus.REVIEW, ProposalStatus.DRAFT])
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return serverError("Failed to load analytics", error);
    }

    // ── Pipeline funnel: count ALL proposals (not filtered by status, capped at 1000) ──
    const { data: allProposals, error: funnelError } = await adminClient
      .from("proposals")
      .select("status")
      .eq("organization_id", context.organizationId)
      .limit(1000);

    if (funnelError) {
      return serverError("Failed to load analytics", funnelError);
    }

    const pipelineFunnel = {
      [ProposalStatus.DRAFT]: 0,
      [ProposalStatus.INTAKE]: 0,
      [ProposalStatus.GENERATING]: 0,
      [ProposalStatus.REVIEW]: 0,
      [ProposalStatus.FINAL]: 0,
      [ProposalStatus.EXPORTED]: 0,
    };
    for (const p of allProposals || []) {
      const status = p.status as keyof typeof pipelineFunnel;
      if (status in pipelineFunnel) {
        pipelineFunnel[status]++;
      }
    }

    // ── Calculate summary stats (existing) ──
    const total = proposals?.length || 0;
    const won = proposals?.filter((p) => p.deal_outcome === DealOutcome.WON).length || 0;
    const lost = proposals?.filter((p) => p.deal_outcome === DealOutcome.LOST).length || 0;
    const pending = proposals?.filter((p) => p.deal_outcome === DealOutcome.PENDING || !p.deal_outcome).length || 0;
    const noDecision = proposals?.filter((p) => p.deal_outcome === DealOutcome.NO_DECISION).length || 0;

    const decidedCount = won + lost;
    const winRate = decidedCount > 0 ? Math.round((won / decidedCount) * 100) : 0;

    const totalWonValue = proposals
      ?.filter((p) => p.deal_outcome === DealOutcome.WON && p.deal_value)
      .reduce((sum, p) => sum + (p.deal_value || 0), 0) || 0;

    // ── Group by industry (existing) ──
    const byIndustry: Record<string, { won: number; lost: number; total: number }> = {};
    for (const p of proposals || []) {
      const industry = (p.intake_data as Record<string, string>)?.client_industry || "unknown";
      if (!byIndustry[industry]) {
        byIndustry[industry] = { won: 0, lost: 0, total: 0 };
      }
      byIndustry[industry].total++;
      if (p.deal_outcome === DealOutcome.WON) byIndustry[industry].won++;
      if (p.deal_outcome === DealOutcome.LOST) byIndustry[industry].lost++;
    }

    // ── Group by opportunity type (existing) ──
    const byOpportunityType: Record<string, { won: number; lost: number; total: number }> = {};
    for (const p of proposals || []) {
      const oppType = (p.intake_data as Record<string, string>)?.opportunity_type || "unknown";
      if (!byOpportunityType[oppType]) {
        byOpportunityType[oppType] = { won: 0, lost: 0, total: 0 };
      }
      byOpportunityType[oppType].total++;
      if (p.deal_outcome === DealOutcome.WON) byOpportunityType[oppType].won++;
      if (p.deal_outcome === DealOutcome.LOST) byOpportunityType[oppType].lost++;
    }

    // ── Loss reasons (existing) ──
    const lossReasons: Record<string, number> = {};
    for (const p of proposals || []) {
      if (p.deal_outcome === DealOutcome.LOST && p.loss_reason_category) {
        lossReasons[p.loss_reason_category] = (lossReasons[p.loss_reason_category] || 0) + 1;
      }
    }

    // ── Recent outcomes (existing, last 10) ──
    const recentOutcomes = proposals
      ?.filter((p) => p.deal_outcome && p.deal_outcome !== DealOutcome.PENDING)
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        title: p.title,
        outcome: p.deal_outcome,
        value: p.deal_value,
        industry: (p.intake_data as Record<string, string>)?.client_industry,
        date: p.deal_outcome_set_at || p.created_at,
      }));

    // ── NEW: Monthly trends (last 12 months) ──
    const now = new Date();
    const monthlyTrends: Array<{
      month: string;
      proposalsCreated: number;
      won: number;
      lost: number;
      winRate: number;
      totalValue: number;
    }> = [];

    // Build map of month keys -> data
    const monthMap: Record<string, { proposalsCreated: number; won: number; lost: number; totalValue: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = { proposalsCreated: 0, won: 0, lost: 0, totalValue: 0 };
    }

    // Count proposals created per month
    for (const p of proposals || []) {
      if (!p.created_at) continue;
      const createdDate = new Date(p.created_at);
      const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) {
        monthMap[key].proposalsCreated++;
      }
    }

    // Count won/lost per month based on deal_outcome_set_at
    for (const p of proposals || []) {
      if (!p.deal_outcome_set_at) continue;
      const outcomeDate = new Date(p.deal_outcome_set_at);
      const key = `${outcomeDate.getFullYear()}-${String(outcomeDate.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) {
        if (p.deal_outcome === DealOutcome.WON) {
          monthMap[key].won++;
          monthMap[key].totalValue += p.deal_value || 0;
        } else if (p.deal_outcome === DealOutcome.LOST) {
          monthMap[key].lost++;
        }
      }
    }

    // Convert map to sorted array
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const data = monthMap[key];
      const monthDecided = data.won + data.lost;
      monthlyTrends.push({
        month: key,
        proposalsCreated: data.proposalsCreated,
        won: data.won,
        lost: data.lost,
        winRate: monthDecided > 0 ? Math.round((data.won / monthDecided) * 100) : 0,
        totalValue: data.totalValue,
      });
    }

    // ── NEW: Quality correlation ──
    const qualityCorrelation = (proposals || [])
      .filter((p) => {
        const qr = p.quality_review as Record<string, unknown> | null;
        return qr && typeof qr === "object" && "overall_score" in qr;
      })
      .map((p) => {
        const qr = p.quality_review as Record<string, unknown>;
        return {
          id: p.id,
          title: p.title,
          qualityScore: qr.overall_score as number,
          outcome: p.deal_outcome || DealOutcome.PENDING,
          dealValue: p.deal_value ?? null,
        };
      });

    // ── NEW: Average days to close ──
    const closedProposals = (proposals || []).filter(
      (p) =>
        (p.deal_outcome === DealOutcome.WON || p.deal_outcome === DealOutcome.LOST) &&
        p.created_at &&
        p.deal_outcome_set_at
    );

    let avgDaysToClose: number | null = null;
    if (closedProposals.length > 0) {
      const totalDays = closedProposals.reduce((sum, p) => {
        const created = new Date(p.created_at).getTime();
        const closed = new Date(p.deal_outcome_set_at).getTime();
        const diffDays = (closed - created) / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgDaysToClose = Math.round((totalDays / closedProposals.length) * 10) / 10;
    }

    // ── NEW: Bid score analysis ──
    interface BidEvalData {
      ai_scores: Record<string, { score: number; rationale: string }>;
      weighted_total: number;
      recommendation: string;
    }

    const proposalsWithBidEval = (proposals || []).filter((p) => {
      const be = p.bid_evaluation as BidEvalData | null;
      return be && typeof be === "object" && typeof be.weighted_total === "number";
    });

    // Scatter data: bid score vs outcome
    const bidScoreCorrelation = proposalsWithBidEval.map((p) => {
      const be = p.bid_evaluation as BidEvalData;
      return {
        id: p.id,
        title: p.title,
        bidScore: be.weighted_total,
        recommendation: be.recommendation,
        outcome: p.deal_outcome || DealOutcome.PENDING,
        dealValue: p.deal_value ?? null,
      };
    });

    // Avg bid score for won vs lost
    const wonWithBidScore = proposalsWithBidEval.filter((p) => p.deal_outcome === DealOutcome.WON);
    const lostWithBidScore = proposalsWithBidEval.filter((p) => p.deal_outcome === DealOutcome.LOST);

    const avgBidScoreWon = wonWithBidScore.length > 0
      ? Math.round(wonWithBidScore.reduce((sum, p) => sum + (p.bid_evaluation as BidEvalData).weighted_total, 0) / wonWithBidScore.length * 10) / 10
      : null;
    const avgBidScoreLost = lostWithBidScore.length > 0
      ? Math.round(lostWithBidScore.reduce((sum, p) => sum + (p.bid_evaluation as BidEvalData).weighted_total, 0) / lostWithBidScore.length * 10) / 10
      : null;

    // Recommendation accuracy: how often did "bid" → won, "pass" → lost
    const bidRecommended = proposalsWithBidEval.filter((p) => (p.bid_evaluation as BidEvalData).recommendation === "bid");
    const passRecommended = proposalsWithBidEval.filter((p) => (p.bid_evaluation as BidEvalData).recommendation === "pass");

    const bidRecommendedWon = bidRecommended.filter((p) => p.deal_outcome === DealOutcome.WON).length;
    const bidRecommendedDecided = bidRecommended.filter((p) => p.deal_outcome === DealOutcome.WON || p.deal_outcome === DealOutcome.LOST).length;
    const passRecommendedLost = passRecommended.filter((p) => p.deal_outcome === DealOutcome.LOST).length;
    const passRecommendedDecided = passRecommended.filter((p) => p.deal_outcome === DealOutcome.WON || p.deal_outcome === DealOutcome.LOST).length;

    const bidAccuracy = bidRecommendedDecided > 0 ? Math.round((bidRecommendedWon / bidRecommendedDecided) * 100) : null;
    const passAccuracy = passRecommendedDecided > 0 ? Math.round((passRecommendedLost / passRecommendedDecided) * 100) : null;

    // Factor-by-factor breakdown: average score for won vs lost
    const factorKeys = ["requirement_match", "past_performance", "capability_alignment", "timeline_feasibility", "strategic_value"];
    const factorBreakdown = factorKeys.map((key) => {
      const wonScores = wonWithBidScore
        .map((p) => (p.bid_evaluation as BidEvalData).ai_scores[key]?.score)
        .filter((s): s is number => typeof s === "number");
      const lostScores = lostWithBidScore
        .map((p) => (p.bid_evaluation as BidEvalData).ai_scores[key]?.score)
        .filter((s): s is number => typeof s === "number");
      return {
        factor: key,
        avgWon: wonScores.length > 0 ? Math.round(wonScores.reduce((a, b) => a + b, 0) / wonScores.length) : null,
        avgLost: lostScores.length > 0 ? Math.round(lostScores.reduce((a, b) => a + b, 0) / lostScores.length) : null,
      };
    });

    const bidScoreAnalysis = {
      totalScored: proposalsWithBidEval.length,
      avgBidScoreWon,
      avgBidScoreLost,
      bidAccuracy,
      passAccuracy,
      factorBreakdown,
      correlation: bidScoreCorrelation,
    };

    return ok({
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
      monthlyTrends,
      pipelineFunnel,
      qualityCorrelation,
      avgDaysToClose,
      bidScoreAnalysis,
    });
  } catch (error) {
    return serverError("Failed to load analytics", error);
  }
}
