"use client";

import { use } from "react";
import { ArrowLeft, Hash, Building2, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntelligence } from "../../_components/use-intelligence";
import { IntelligenceLoading } from "../../_components/intelligence-loading";
import { SourceAttribution } from "../../_components/source-attribution";
import type { NaicsIntelligenceResponse } from "../../_components/types";

export default function NaicsDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { data, loading, error } = useIntelligence<NaicsIntelligenceResponse>(
    `/api/v1/naics/${code}`,
  );

  if (loading) {
    return <IntelligenceLoading icon={Hash} label={`NAICS ${code}`} />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/intelligence" className="btn-ghost flex items-center gap-2 text-sm w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Link>
        <p className="text-sm text-[var(--foreground-muted)]">
          {error ?? "NAICS code not found"}
        </p>
      </div>
    );
  }

  const config = data.industry_config;
  const stats = data.award_stats;

  const formatCompetition = (v: string) =>
    v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/intelligence" className="btn-ghost flex items-center gap-2 text-sm w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Hash className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            NAICS {data.naics_code}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            {config?.displayName ?? data.description ?? "Industry Intelligence"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Award} value={stats.total_awards.toLocaleString()} label="Total Awards" />
        <StatCard
          icon={TrendingUp}
          value={stats.avg_amount ? `$${(stats.avg_amount / 1_000_000).toFixed(1)}M` : "N/A"}
          label="Avg Award"
        />
        <StatCard
          icon={Building2}
          value={stats.common_agencies.length.toString()}
          label="Active Agencies"
        />
      </div>

      {/* Competition breakdown */}
      {Object.keys(stats.competition_breakdown).length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Competition Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(stats.competition_breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = stats.total_awards > 0 ? (count / stats.total_awards) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--foreground)] w-44 truncate">
                      {formatCompetition(type)}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--foreground-muted)] w-16 text-right">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Common agencies */}
      {stats.common_agencies.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Top Agencies</h2>
          <div className="flex flex-wrap gap-2">
            {stats.common_agencies.map((agency) => (
              <button
                key={agency}
                onClick={() => router.push(`/intelligence/agencies?select=${encodeURIComponent(agency)}`)}
                className="badge badge-default hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                {agency}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Industry config */}
      {config && (
        <>
          {config.painPoints.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Common Pain Points</h2>
              <ul className="space-y-2">
                {config.painPoints.map((point, i) => (
                  <li key={i} className="text-sm text-[var(--foreground-muted)] flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {config.winThemes.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Win Themes</h2>
              <div className="flex flex-wrap gap-2">
                {config.winThemes.map((theme, i) => (
                  <span key={i} className="badge badge-accent">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {config.keywords.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Industry Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {config.keywords.map((keyword, i) => (
                  <span key={i} className="badge badge-default text-xs">{keyword}</span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(config.sectionGuidance).length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Section Guidance</h2>
              <div className="space-y-4">
                {Object.entries(config.sectionGuidance).map(([section, guidance]) => (
                  <div key={section}>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                      {section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </h3>
                    <p className="text-sm text-[var(--foreground-muted)]">{guidance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* View awards for this NAICS */}
      <div className="flex justify-center">
        <Link
          href={`/intelligence/awards?naics=${code}`}
          className="btn-primary py-2.5 px-6"
        >
          View Awards for NAICS {code}
        </Link>
      </div>

      <SourceAttribution />
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Hash; value: string; label: string }) {
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
