"use client";

import { ArrowLeft, Building2, Users, Award, Scale } from "lucide-react";
import { useIntelligence } from "../../_components/use-intelligence";
import { IntelligenceLoading } from "../../_components/intelligence-loading";
import type { AgencyProfileResponse } from "../../_components/types";

interface Props {
  agencyName: string;
  onBack: () => void;
}

export function AgencyDetail({ agencyName, onBack }: Props) {
  const { data, loading, error } = useIntelligence<AgencyProfileResponse>(
    `/api/v1/agency/${encodeURIComponent(agencyName)}`,
  );

  if (loading) {
    return <IntelligenceLoading icon={Building2} label="agency profile" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to agencies
        </button>
        <p className="text-sm text-[var(--foreground-muted)]">
          {error ?? "Agency profile not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to agencies
      </button>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Building2 className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{data.agency_name}</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            {data.agency_level.charAt(0).toUpperCase() + data.agency_level.slice(1)} Agency
          </p>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Award}
          value={data.total_awards_tracked.toLocaleString()}
          label="Awards Tracked"
        />
        <StatCard
          icon={Scale}
          value={data.preferred_eval_method ?? "N/A"}
          label="Eval Method"
        />
        <StatCard
          icon={Users}
          value={data.avg_num_offers?.toFixed(1) ?? "N/A"}
          label="Avg Offers"
        />
        <StatCard
          icon={Award}
          value={data.avg_award_amount ? `$${(data.avg_award_amount / 1_000_000).toFixed(1)}M` : "N/A"}
          label="Avg Award"
        />
      </div>

      {/* Evaluation criteria weights */}
      {data.typical_criteria_weights && Object.keys(data.typical_criteria_weights).length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Typical Evaluation Criteria Weights
          </h2>
          <div className="space-y-3">
            {Object.entries(data.typical_criteria_weights)
              .sort((a, b) => b[1] - a[1])
              .map(([criterion, weight]) => (
                <div key={criterion} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--foreground)] w-40 truncate">
                    {criterion.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <div className="flex-1 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full transition-all"
                      style={{ width: `${Math.min(weight, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[var(--foreground-muted)] w-10 text-right">
                    {weight}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Contract types */}
      {data.common_contract_types && data.common_contract_types.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Common Contract Types</h2>
          <div className="flex flex-wrap gap-2">
            {data.common_contract_types.map((type) => (
              <span key={type} className="badge badge-default">{type}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recent awards */}
      {data.recent_awards.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent Awards</h2>
          <div className="divide-y divide-[var(--border)]">
            <div className="grid grid-cols-12 gap-2 py-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              <span className="col-span-4">Title</span>
              <span className="col-span-3">Awardee</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">Date</span>
              <span className="col-span-1 text-right">NAICS</span>
            </div>
            {data.recent_awards.map((award, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 py-3 text-sm">
                <span className="col-span-4 text-[var(--foreground)] truncate">
                  {award.title}
                </span>
                <span className="col-span-3 text-[var(--foreground-muted)] truncate">
                  {award.awardee}
                </span>
                <span className="col-span-2 text-right text-[var(--foreground)]">
                  ${(award.amount / 1_000_000).toFixed(2)}M
                </span>
                <span className="col-span-2 text-right text-[var(--foreground-muted)]">
                  {award.date ? new Date(award.date).toLocaleDateString() : "-"}
                </span>
                <span className="col-span-1 text-right font-mono text-xs text-[var(--accent)]">
                  {award.naics}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Building2; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
        <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
