"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Zap,
  ArrowUpRight,
  Building2,
  Briefcase,
} from "lucide-react";

interface AnalyticsData {
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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics/outcomes");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="h-8 w-8 text-[var(--accent)] animate-pulse" />
          <p className="text-sm text-[var(--foreground-muted)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">Failed to load analytics</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <BarChart3 className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Win/Loss Analytics
            </h1>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              Track outcomes and learn from every proposal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent-muted)] bg-[var(--accent-subtle)]">
          <Zap className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">Compounding Loop</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Win Rate</span>
            <div className="h-9 w-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
              <Target className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--accent)]">{data.summary.winRate}%</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {data.summary.won} won / {data.summary.won + data.summary.lost} decided
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Won</span>
            <div className="h-9 w-9 rounded-lg bg-[var(--success-subtle)] flex items-center justify-center">
              <Trophy className="h-5 w-5 text-[var(--success)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--success)]">{data.summary.won}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {formatCurrency(data.summary.totalWonValue)} total value
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--danger)] hover:shadow-[0_0_20px_rgba(255,68,102,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Lost</span>
            <div className="h-9 w-9 rounded-lg bg-[var(--danger-subtle)] flex items-center justify-center">
              <XCircle className="h-5 w-5 text-[var(--danger)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--danger)]">{data.summary.lost}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            opportunities lost
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--warning)] hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Pending</span>
            <div className="h-9 w-9 rounded-lg bg-[var(--warning-subtle)] flex items-center justify-center">
              <Clock className="h-5 w-5 text-[var(--warning)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--warning)]">{data.summary.pending}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            awaiting outcome
          </p>
        </div>

        <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Total</span>
            <div className="h-9 w-9 rounded-lg bg-[var(--info-subtle)] flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[var(--info)]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{data.summary.total}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            total proposals
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* By Industry */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">By Industry</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Win rate across client industries</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(data.byIndustry)
              .filter(([, stats]) => stats.total > 0)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 6)
              .map(([industry, stats]) => {
                const winRate = stats.won + stats.lost > 0
                  ? Math.round((stats.won / (stats.won + stats.lost)) * 100)
                  : 0;
                return (
                  <div key={industry} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)] capitalize">{formatLabel(industry)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {stats.won}W / {stats.lost}L
                        </span>
                        <span className={`font-semibold ${winRate >= 50 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {winRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--background-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Opportunity Type */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">By Opportunity Type</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Win rate by engagement type</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(data.byOpportunityType)
              .filter(([, stats]) => stats.total > 0)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([type, stats]) => {
                const winRate = stats.won + stats.lost > 0
                  ? Math.round((stats.won / (stats.won + stats.lost)) * 100)
                  : 0;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground)] capitalize">{formatLabel(type)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {stats.won}W / {stats.lost}L
                        </span>
                        <span className={`font-semibold ${winRate >= 50 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {winRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--background-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Loss Reasons & Recent Outcomes */}
      <div className="grid grid-cols-2 gap-6">
        {/* Loss Reasons */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--danger-subtle)] flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-[var(--danger)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Loss Reasons</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Why deals were lost</p>
            </div>
          </div>

          {Object.keys(data.lossReasons).length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
              No loss reasons recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.lossReasons)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)]"
                  >
                    <span className="text-sm text-[var(--foreground)] capitalize">{formatLabel(reason)}</span>
                    <span className="text-sm font-semibold text-[var(--danger)]">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Outcomes */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
              <Clock className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Outcomes</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Latest proposal results</p>
            </div>
          </div>

          {data.recentOutcomes.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
              No outcomes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentOutcomes.map((outcome) => (
                <Link
                  key={outcome.id}
                  href={`/proposals/${outcome.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background-elevated)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      outcome.outcome === "won"
                        ? "bg-[var(--success-subtle)]"
                        : "bg-[var(--danger-subtle)]"
                    }`}>
                      {outcome.outcome === "won" ? (
                        <Trophy className="h-4 w-4 text-[var(--success)]" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[var(--danger)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                        {outcome.title}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] capitalize">
                        {outcome.industry?.replace(/_/g, " ") || "Unknown industry"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {outcome.value && (
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {formatCurrency(outcome.value)}
                      </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proposals List */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">All Proposals</h2>
          <p className="text-xs text-[var(--foreground-muted)]">Click to update outcome</p>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {data.proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/proposals/${proposal.id}`}
              className="flex items-center justify-between p-4 hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  proposal.dealOutcome === "won"
                    ? "bg-[var(--success-subtle)]"
                    : proposal.dealOutcome === "lost"
                    ? "bg-[var(--danger-subtle)]"
                    : "bg-[var(--warning-subtle)]"
                }`}>
                  {proposal.dealOutcome === "won" ? (
                    <Trophy className="h-5 w-5 text-[var(--success)]" />
                  ) : proposal.dealOutcome === "lost" ? (
                    <XCircle className="h-5 w-5 text-[var(--danger)]" />
                  ) : (
                    <Clock className="h-5 w-5 text-[var(--warning)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{proposal.title}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {proposal.clientName || "Unknown client"} • {formatLabel(proposal.opportunityType || "unknown")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {proposal.dealValue && (
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {formatCurrency(proposal.dealValue)}
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  proposal.dealOutcome === "won"
                    ? "bg-[var(--success-subtle)] text-[var(--success)]"
                    : proposal.dealOutcome === "lost"
                    ? "bg-[var(--danger-subtle)] text-[var(--danger)]"
                    : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                }`}>
                  {proposal.dealOutcome || "pending"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
