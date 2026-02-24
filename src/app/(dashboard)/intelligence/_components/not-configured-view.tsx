"use client";

import { Database, BarChart3, Building2, DollarSign, Briefcase } from "lucide-react";

export function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] mb-6">
        <Database className="h-8 w-8 text-[var(--accent)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
        Market Intelligence Coming Soon
      </h2>
      <p className="text-sm text-[var(--foreground-muted)] max-w-md mb-8">
        Market intelligence provides real procurement data to help you
        make smarter bid decisions and write winning proposals.
      </p>

      {/* Feature preview */}
      <div className="grid grid-cols-2 gap-4 max-w-lg w-full mb-8">
        <FeatureCard
          icon={Building2}
          title="Agency Profiles"
          description="Evaluation methods, typical award sizes, and procurement patterns"
        />
        <FeatureCard
          icon={DollarSign}
          title="Rate Benchmarks"
          description="GSA labor rate data for competitive pricing"
        />
        <FeatureCard
          icon={BarChart3}
          title="Award History"
          description="Federal contract awards with competition analysis"
        />
        <FeatureCard
          icon={Briefcase}
          title="Opportunities"
          description="Open solicitations from procurement portals"
        />
      </div>

      <p className="text-xs text-[var(--foreground-subtle)] max-w-sm">
        This feature is being set up for your account.
        Contact your administrator if you expected this to be available.
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] text-left">
      <Icon className="h-5 w-5 text-[var(--accent)] mb-2" />
      <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
        {title}
      </p>
      <p className="text-xs text-[var(--foreground-muted)]">
        {description}
      </p>
    </div>
  );
}
