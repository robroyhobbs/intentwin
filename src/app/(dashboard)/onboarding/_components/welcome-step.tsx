"use client";

import {
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

interface WelcomeStepProps {
  firstName: string;
  onContinue: () => void;
}

export function WelcomeStep({ firstName, onContinue }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        Welcome to IntentBid, {firstName}!
      </h1>
      <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
        Let&apos;s set up your company profile so the AI can write
        proposals that truly represent you.
      </p>

      <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
        <h3 className="font-medium text-[var(--foreground)] mb-4">
          Your 14-day free trial includes:
        </h3>
        <ul className="space-y-3">
          {[
            "3 AI-generated proposals",
            "Full export capabilities (DOCX, PDF, PPTX)",
            "Knowledge base with 10 documents",
            "All premium features unlocked",
          ].map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]"
            >
              <Check className="w-4 h-4 text-[var(--success)]" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onContinue}
        className="btn-primary"
      >
        Let&apos;s get started
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
