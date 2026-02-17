"use client";

import { Check } from "lucide-react";
import { Step } from "./constants";

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: Step;
  currentStepIndex: number;
}

export function ProgressIndicator({
  steps,
  currentStep,
  currentStepIndex,
}: ProgressIndicatorProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                currentStep === s
                  ? "bg-[var(--accent)] text-white"
                  : i < currentStepIndex
                    ? "bg-[var(--success)] text-white"
                    : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
              }`}
            >
              {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  i < currentStepIndex
                    ? "bg-[var(--success)]"
                    : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
