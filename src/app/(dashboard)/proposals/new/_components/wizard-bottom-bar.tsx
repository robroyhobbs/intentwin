"use client";

/**
 * WizardBottomBar — Persistent fixed bottom bar with Back / Next buttons.
 *
 * Button labels and visibility change per step:
 * - Step 1: Back hidden, Next = "Continue" (disabled until ready)
 * - Step 2: Back = "Back", Next = "Continue"
 * - Step 3: Back = "Back", Next = "Continue to Configure"
 * - Step 4: Back = "Back", Next = "Generate Proposal"
 * - Step 5: Hidden entirely (no navigation during generation)
 */

import { useWizard } from "./wizard-provider";
import { cn } from "@/lib/utils/cn";

interface WizardBottomBarProps {
  /** Whether the Next/Continue button should be disabled */
  nextDisabled?: boolean;
  /** Optional override for the Next button handler (e.g., Step 3 triggers generation) */
  onNext?: () => void;
  /** Optional override for the Back button handler */
  onBack?: () => void;
  /** Whether to show a loading spinner on the Next button */
  nextLoading?: boolean;
}

const STEP_CONFIG: Record<number, { backLabel: string | null; nextLabel: string; nextVariant: "default" | "primary" }> = {
  1: { backLabel: null, nextLabel: "Continue", nextVariant: "primary" },
  2: { backLabel: "Back", nextLabel: "Continue", nextVariant: "primary" },
  3: { backLabel: "Back", nextLabel: "Continue to Configure", nextVariant: "primary" },
  4: { backLabel: "Back", nextLabel: "Generate Proposal", nextVariant: "primary" },
  5: { backLabel: null, nextLabel: "", nextVariant: "default" }, // hidden on step 5
};

export function WizardBottomBar({ nextDisabled, onNext, onBack, nextLoading }: WizardBottomBarProps) {
  const { state, dispatch } = useWizard();

  // Hide on step 5 (generation)
  if (state.currentStep === 5) return null;

  const config = STEP_CONFIG[state.currentStep] || STEP_CONFIG[1];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      dispatch({ type: "GO_BACK" });
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      dispatch({ type: "GO_NEXT" });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 py-4 max-w-5xl mx-auto">
        {/* Back Button */}
        <div>
          {config.backLabel ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)] transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
              </svg>
              {config.backLabel}
            </button>
          ) : (
            <div /> /* Spacer */
          )}
        </div>

        {/* Next Button */}
        <div>
          {config.nextLabel && (
            <button
              onClick={handleNext}
              disabled={nextDisabled || nextLoading}
              className={cn(
                "flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                config.nextVariant === "primary"
                  ? "bg-[var(--accent)] text-white hover:brightness-110 shadow-[0_0_16px_var(--accent-subtle)]"
                  : "bg-[var(--background-subtle)] text-[var(--foreground)] hover:bg-[var(--border)] border border-[var(--border)]",
              )}
            >
              {nextLoading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {config.nextLabel}
              {!nextLoading && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
