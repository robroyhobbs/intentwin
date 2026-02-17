"use client";

import Link from "next/link";
import {
  Trophy,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import type { AnalyticsData } from "./types";

interface RecentOutcomesProps {
  recentOutcomes: AnalyticsData["recentOutcomes"];
  proposals: AnalyticsData["proposals"];
  formatCurrency: (v: number) => string;
  formatLabel: (key: string) => string;
}

export function RecentOutcomes({
  recentOutcomes,
  proposals,
  formatCurrency,
  formatLabel,
}: RecentOutcomesProps) {
  return (
    <>
      {/* Recent Outcomes */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Recent Outcomes
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              Latest proposal results
            </p>
          </div>
        </div>

        {recentOutcomes.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
            No outcomes recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {recentOutcomes.map((outcome) => (
              <Link
                key={outcome.id}
                href={`/proposals/${outcome.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)] hover:bg-[var(--background-elevated)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      outcome.outcome === "won"
                        ? "bg-[var(--success-subtle)]"
                        : "bg-[var(--danger-subtle)]"
                    }`}
                  >
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

      {/* Proposals List */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            All Proposals
          </h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Click to update outcome
          </p>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/proposals/${proposal.id}`}
              className="flex items-center justify-between p-4 hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    proposal.dealOutcome === "won"
                      ? "bg-[var(--success-subtle)]"
                      : proposal.dealOutcome === "lost"
                      ? "bg-[var(--danger-subtle)]"
                      : "bg-[var(--warning-subtle)]"
                  }`}
                >
                  {proposal.dealOutcome === "won" ? (
                    <Trophy className="h-5 w-5 text-[var(--success)]" />
                  ) : proposal.dealOutcome === "lost" ? (
                    <XCircle className="h-5 w-5 text-[var(--danger)]" />
                  ) : (
                    <Clock className="h-5 w-5 text-[var(--warning)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {proposal.title}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {proposal.clientName || "Unknown client"} &bull;{" "}
                    {formatLabel(proposal.opportunityType || "unknown")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {proposal.dealValue && (
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {formatCurrency(proposal.dealValue)}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    proposal.dealOutcome === "won"
                      ? "bg-[var(--success-subtle)] text-[var(--success)]"
                      : proposal.dealOutcome === "lost"
                      ? "bg-[var(--danger-subtle)] text-[var(--danger)]"
                      : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                  }`}
                >
                  {proposal.dealOutcome || "pending"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
