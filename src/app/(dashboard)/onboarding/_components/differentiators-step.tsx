"use client";

import {
  Target,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";

interface DifferentiatorsStepProps {
  differentiators: string[];
  updateDifferentiator: (index: number, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function DifferentiatorsStep({
  differentiators,
  updateDifferentiator,
  onBack,
  onContinue,
}: DifferentiatorsStepProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
          <Target className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            What makes you different?
          </h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            These will appear in &quot;Why Us&quot; sections
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {differentiators.map((diff, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Differentiator {index + 1}
            </label>
            <input
              type="text"
              value={diff}
              onChange={(e) =>
                updateDifferentiator(index, e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder={
                index === 0
                  ? 'e.g., "20+ years of industry experience"'
                  : index === 1
                    ? 'e.g., "Certified cloud migration experts"'
                    : 'e.g., "Dedicated support team"'
              }
            />
          </div>
        ))}
      </div>

      <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
          <p className="text-sm text-[var(--foreground-muted)]">
            <strong>Tip:</strong> Think about why clients choose you
            over competitors. Certifications, team size, unique
            methodologies, and track record are great differentiators.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
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
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
