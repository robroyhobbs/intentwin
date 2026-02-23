export interface AnalyticsData {
  summary: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    noDecision: number;
    winRate: number;
    totalWonValue: number;
  };
  byIndustry: Record<string, { won: number; lost: number; total: number }>;
  byOpportunityType: Record<string, { won: number; lost: number; total: number }>;
  lossReasons: Record<string, number>;
  recentOutcomes: Array<{
    id: string;
    title: string;
    outcome: string;
    value?: number;
    industry?: string;
    date: string;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    dealOutcome: string;
    dealValue?: number;
    industry?: string;
    opportunityType?: string;
    clientName?: string;
    createdAt: string;
  }>;
  monthlyTrends?: Array<{
    month: string;
    proposalsCreated: number;
    won: number;
    lost: number;
    winRate: number;
    totalValue: number;
  }>;
  pipelineFunnel?: {
    draft: number;
    intake: number;
    generating: number;
    review: number;
    final: number;
    exported: number;
  };
  qualityCorrelation?: Array<{
    id: string;
    title: string;
    qualityScore: number;
    outcome: string;
    dealValue: number | null;
  }>;
  avgDaysToClose?: number;
  bidScoreAnalysis?: {
    totalScored: number;
    avgBidScoreWon: number | null;
    avgBidScoreLost: number | null;
    bidAccuracy: number | null;
    passAccuracy: number | null;
    factorBreakdown: Array<{
      factor: string;
      avgWon: number | null;
      avgLost: number | null;
    }>;
    correlation: Array<{
      id: string;
      title: string;
      bidScore: number;
      recommendation: string;
      outcome: string;
      dealValue: number | null;
    }>;
  };
}
