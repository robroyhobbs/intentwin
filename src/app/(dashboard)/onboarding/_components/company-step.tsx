"use client";

import {
  Building2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { INDUSTRIES } from "./constants";

interface CompanyStepProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  companyDescription: string;
  setCompanyDescription: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function CompanyStep({
  companyName,
  setCompanyName,
  companyDescription,
  setCompanyDescription,
  industry,
  setIndustry,
  onBack,
  onContinue,
}: CompanyStepProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
          <Building2 className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Tell us about your company
          </h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Your proposals will reflect this information
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Company Description
          </label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
            placeholder="Briefly describe what your company does..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Primary Industry
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  industry === ind
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onContinue}
          className="btn-primary"
          disabled={!companyName}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
