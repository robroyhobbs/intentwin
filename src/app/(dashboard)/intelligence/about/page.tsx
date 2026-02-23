"use client";

import { Info, ExternalLink, Database, RefreshCw, Shield } from "lucide-react";
import { SourceAttribution } from "../_components/source-attribution";

export default function AboutDataPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Info className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">About This Data</h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            Sources, methodology, and data freshness
          </p>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Data Sources</h2>
        </div>

        <div className="space-y-4">
          <SourceCard
            name="USAspending.gov"
            url="https://www.usaspending.gov"
            description="The official source for spending data for the U.S. Government. Provides comprehensive data on federal contract awards including agency, awardee, amounts, NAICS codes, competition type, set-aside status, and period of performance."
            provides={[
              "Federal contract awards",
              "Agency and awardee details",
              "Competition and set-aside data",
              "NAICS and PSC code classifications",
              "Award amounts and dates",
            ]}
            auth="No authentication required (public API)"
          />

          <SourceCard
            name="GSA CALC+"
            url="https://buy.gsa.gov/pricing"
            description="The Contract-Awarded Labor Category (CALC+) tool from the General Services Administration. Provides ceiling rates for labor categories from GSA Multiple Award Schedule (MAS) contracts."
            provides={[
              "Labor rate benchmarks (min, median, max)",
              "Rates by labor category and experience level",
              "Business size breakdown (small vs. large)",
              "GSA MAS contract vehicle rates",
            ]}
            auth="No authentication required (public API)"
          />
        </div>

        <div className="rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Planned Future Sources
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--foreground-muted)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">-</span>
              <span><strong>GAO Protest Decisions</strong> - Evaluation scoring details, strengths/weaknesses from actual proposal evaluations (~2,500/year)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">-</span>
              <span><strong>SAM.gov Contract Awards API</strong> - Direct contract data with additional detail fields</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">-</span>
              <span><strong>FOIA Responses</strong> - Actual proposal content and evaluation narratives from public records requests</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Methodology */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Methodology & Freshness</h2>
        </div>

        <div className="space-y-3 text-sm text-[var(--foreground)]">
          <div>
            <h3 className="font-semibold mb-1">Award Data Collection</h3>
            <p className="text-[var(--foreground-muted)]">
              Awards are collected from USAspending.gov across the top 20 federal NAICS codes by contract volume. A two-step process is used: bulk discovery via search API, then detail enrichment per award for fields like competition type and number of offers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Agency Profiles</h3>
            <p className="text-[var(--foreground-muted)]">
              Agency profiles are computed from the award data. Evaluation criteria weights are estimated heuristics based on competition patterns and award types. These are not direct observations of actual solicitation criteria.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Rate Benchmarks</h3>
            <p className="text-[var(--foreground-muted)]">
              Labor rates are GSA MAS ceiling rates from CALC+, not actual bid prices. They represent the maximum rates contractors can charge under their GSA schedules. Actual competitive rates are typically 10-30% below ceiling rates.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Data Refresh</h3>
            <p className="text-[var(--foreground-muted)]">
              Data is synced nightly via automated jobs. Agency profiles are rebuilt weekly. NAICS intelligence is computed on-demand from current award data.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Limitations</h2>
        </div>
        <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground-subtle)] mt-0.5">1.</span>
            <span>Evaluation criteria weights shown in agency profiles are estimated heuristics, not direct observations from solicitations.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground-subtle)] mt-0.5">2.</span>
            <span>GSA CALC+ rates are ceiling rates (maximums), not actual competitive bid prices.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground-subtle)] mt-0.5">3.</span>
            <span>Award data covers the top 20 federal NAICS codes and may not include all agencies or contract types.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground-subtle)] mt-0.5">4.</span>
            <span>State and local government data is not yet included.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--foreground-subtle)] mt-0.5">5.</span>
            <span>Winning proposal text is not available from public sources without FOIA requests.</span>
          </li>
        </ul>
      </div>

      <SourceAttribution />
    </div>
  );
}

function SourceCard({
  name,
  url,
  description,
  provides,
  auth,
}: {
  name: string;
  url: string;
  description: string;
  provides: string[];
  auth: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{name}</h3>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 text-xs"
        >
          {url.replace("https://", "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
      <div>
        <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1.5">
          Provides
        </p>
        <ul className="space-y-1">
          {provides.map((item) => (
            <li key={item} className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-[var(--foreground-subtle)]">{auth}</p>
    </div>
  );
}
