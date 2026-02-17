"use client";

import {
  Rocket,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface ReadyStepProps {
  firstName: string;
  companyName: string;
  industry: string;
  differentiators: string[];
  loading: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function ReadyStep({
  firstName,
  companyName,
  industry,
  differentiators,
  loading,
  onComplete,
  onBack,
}: ReadyStepProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--success)] mb-6">
        <Rocket className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        You&apos;re all set, {firstName}!
      </h1>
      <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
        Your company profile is configured. Let&apos;s create your first
        proposal.
      </p>

      <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
        <h4 className="font-medium text-[var(--foreground)] mb-3">
          Quick summary:
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">
              Company:
            </span>
            <span className="font-medium text-[var(--foreground)]">
              {companyName}
            </span>
          </div>
          {industry && (
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">
                Industry:
              </span>
              <span className="font-medium text-[var(--foreground)]">
                {industry}
              </span>
            </div>
          )}
          {differentiators.filter((d) => d.trim()).length > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--foreground-muted)]">
                Differentiators:
              </span>
              <span className="font-medium text-[var(--foreground)]">
                {differentiators.filter((d) => d.trim()).length} added
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onComplete}
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Create my first proposal
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back and edit
        </button>
      </div>
    </div>
  );
}
