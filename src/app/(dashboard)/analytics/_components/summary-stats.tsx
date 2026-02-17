"use client";

import {
  Trophy,
  XCircle,
  Clock,
  BarChart3,
  Target,
  CalendarDays,
} from "lucide-react";
import type { AnalyticsData } from "./types";

interface SummaryStatsProps {
  summary: AnalyticsData["summary"];
  avgDaysToClose: number | undefined;
  formatCurrency: (v: number) => string;
}

export function SummaryStats({ summary, avgDaysToClose, formatCurrency }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-6 gap-4">
      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Win Rate
          </span>
          <div className="h-9 w-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
            <Target className="h-5 w-5 text-[var(--accent)]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[var(--accent)]">
          {summary.winRate}%
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {summary.won} won / {summary.won + summary.lost} decided
        </p>
      </div>

      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--success)] hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Won
          </span>
          <div className="h-9 w-9 rounded-lg bg-[var(--success-subtle)] flex items-center justify-center">
            <Trophy className="h-5 w-5 text-[var(--success)]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[var(--success)]">
          {summary.won}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {formatCurrency(summary.totalWonValue)} total value
        </p>
      </div>

      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--danger)] hover:shadow-[0_0_20px_rgba(255,68,102,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Lost
          </span>
          <div className="h-9 w-9 rounded-lg bg-[var(--danger-subtle)] flex items-center justify-center">
            <XCircle className="h-5 w-5 text-[var(--danger)]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[var(--danger)]">
          {summary.lost}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">opportunities lost</p>
      </div>

      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--warning)] hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Pending
          </span>
          <div className="h-9 w-9 rounded-lg bg-[var(--warning-subtle)] flex items-center justify-center">
            <Clock className="h-5 w-5 text-[var(--warning)]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[var(--warning)]">
          {summary.pending}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">awaiting outcome</p>
      </div>

      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--info)] hover:shadow-[0_0_20px_rgba(0,102,255,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Total
          </span>
          <div className="h-9 w-9 rounded-lg bg-[var(--info-subtle)] flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-[var(--info)]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
          {summary.total}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">total proposals</p>
      </div>

      <div className="group flex flex-col rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--purple)] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            Avg Days to Close
          </span>
          <div className="h-9 w-9 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-[#8b5cf6]" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold text-[#8b5cf6]">
          {avgDaysToClose != null ? avgDaysToClose : "--"}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          average closing time
        </p>
      </div>
    </div>
  );
}
