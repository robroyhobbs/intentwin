"use client";

import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react";
import type { WinStrategyData } from "@/types/outcomes";

interface ReviewPhaseProps {
  clientName: string;
  clientIndustry: string;
  solicitationType: string;
  opportunityType: string;
  scopeDescription: string;
  budgetRange: string;
  timelineExpectation: string;
  currentStatePains: string[];
  desiredOutcomes: string[];
  winStrategy: WinStrategyData | null;
  intentApproved: boolean;
  setIntentApproved: (value: boolean) => void;
}

const INDUSTRY_LABELS: Record<string, string> = {
  financial_services: "Financial Services",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  retail: "Retail",
  energy_utilities: "Energy & Utilities",
  public_sector: "Public Sector",
  telecom: "Telecom",
  technology: "Technology",
  other: "Other",
};

const SERVICE_LABELS: Record<string, string> = {
  cloud_migration: "Cloud Migration",
  app_modernization: "App Modernization",
  data_analytics: "Data & Analytics",
  ai_ml: "AI / Machine Learning",
  migration_modernization: "Migration + Modernization",
  other: "Other",
};

export function ReviewPhase({
  clientName,
  clientIndustry,
  solicitationType,
  opportunityType,
  scopeDescription,
  budgetRange,
  timelineExpectation,
  currentStatePains,
  desiredOutcomes,
  winStrategy,
  intentApproved,
  setIntentApproved,
}: ReviewPhaseProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning-muted)]">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[var(--warning)] mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Intent Approval Required
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Review the summary below. Once approved, your proposal
              will be generated.
            </p>
          </div>
        </div>
      </div>

      {/* Client & Opportunity Context */}
      <div className="p-4 rounded-xl border border-[var(--border)]">
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Proposal Context
        </h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <SummaryRow label="Client" value={clientName} />
          {clientIndustry && (
            <SummaryRow
              label="Industry"
              value={INDUSTRY_LABELS[clientIndustry] ?? clientIndustry}
            />
          )}
          <SummaryRow label="Type" value={solicitationType} icon={FileText} />
          <SummaryRow
            label="Service"
            value={SERVICE_LABELS[opportunityType] ?? opportunityType}
            icon={Briefcase}
          />
          {budgetRange && (
            <SummaryRow label="Budget" value={budgetRange} icon={DollarSign} />
          )}
          {timelineExpectation && (
            <SummaryRow
              label="Timeline"
              value={timelineExpectation}
              icon={Calendar}
            />
          )}
        </div>
        {scopeDescription && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
              Scope
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {scopeDescription}
            </p>
          </div>
        )}
      </div>

      {/* Pain Points & Outcomes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--warning)] mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Pain Points
          </h4>
          <ul className="space-y-1">
            {currentStatePains
              .filter((p) => p.trim())
              .map((p, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--foreground-muted)] flex items-start gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] mt-2" />
                  {p}
                </li>
              ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--accent)] mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" /> Desired Outcomes
          </h4>
          <ul className="space-y-1">
            {desiredOutcomes
              .filter((o) => o.trim())
              .map((o, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--foreground-muted)] flex items-start gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-2" />
                  {o}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {winStrategy && (
        <div className="p-4 rounded-xl border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Win Strategy
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {winStrategy.win_themes.map((theme, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs font-medium bg-[var(--accent-subtle)] text-[var(--accent)] rounded-full"
              >
                {theme}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--foreground-subtle)]">
            {winStrategy.target_outcomes.length} outcomes •{" "}
            {winStrategy.differentiators.length} differentiators
          </p>
        </div>
      )}

      {/* Approval checkbox */}
      <div className="p-6 rounded-xl border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={intentApproved}
            onChange={(e) => setIntentApproved(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <div>
            <span className="text-lg font-bold text-[var(--foreground)]">
              I approve this Intent
            </span>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Your proposal will be generated to deliver these specific
              outcomes, verified against your company&apos;s capabilities
              and case studies.
            </p>
          </div>
        </label>
      </div>

      {intentApproved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success-subtle)] border border-[var(--success-muted)] animate-fade-in">
          <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Ready to create your proposal
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Click &quot;Create Proposal&quot; to proceed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Building2;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <span className="text-[var(--foreground-muted)] flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}
