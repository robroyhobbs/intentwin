"use client";

/**
 * WizardShell — Layout component combining inline step bar + content area + bottom bar.
 *
 * Renders the active step content based on currentStep from wizard state:
 *   Step 1: StepInput — document upload/paste/describe
 *   Step 2: StepReview — review gaps and AI-inferred data
 *   Step 3: StepBidDecision — bid/no-bid evaluation
 *   Step 4: StepConfigure — template, tone, sections, win strategy
 *   Step 5: StepGenerate — proposal creation, generation progress, redirect
 *
 * Renders within the dashboard layout (sidebar + header provided by parent).
 * A future phase may move this route outside the dashboard layout for full-screen wizard control.
 */

import { useCallback } from "react";
import { useWizard } from "./wizard-provider";
import { WizardSidebar } from "./wizard-sidebar";
import { WizardBottomBar } from "./wizard-bottom-bar";
import { WIZARD_STEPS } from "@/lib/proposal-core/wizard-state";
import { StepInput } from "./step-input";
import { StepReview } from "./step-review";
import { StepBidDecision } from "./step-bid-decision";
import { StepConfigure } from "./step-configure";
import { StepGenerate } from "./step-generate";

// ────────────────────────────────────────────────────────
// Inline Step Progress Bar (renders within dashboard layout)
// ────────────────────────────────────────────────────────

function WizardStepBar() {
  const { state } = useWizard();

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {WIZARD_STEPS.map((meta, idx) => {
        const isActive = state.currentStep === meta.step;
        const isCompleted = state.maxCompletedStep >= meta.step;

        return (
          <div key={meta.step} className="flex items-center">
            {idx > 0 && (
              <div className={`w-12 h-[2px] mx-2 ${isCompleted || isActive ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
            )}
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "border border-[var(--border)] text-[var(--foreground-muted)]"
                }`}
              >
                {isCompleted && !isActive ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  meta.step
                )}
              </span>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  isActive
                    ? "text-[var(--foreground)]"
                    : isCompleted
                      ? "text-[var(--foreground-muted)]"
                      : "text-[var(--foreground-subtle)]"
                }`}
              >
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Shell
// ────────────────────────────────────────────────────────

export function WizardShell() {
  const { state, dispatch } = useWizard();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepInput />;
      case 2:
        return <StepReview />;
      case 3:
        return <StepBidDecision />;
      case 4:
        return <StepConfigure />;
      case 5:
        return <StepGenerate />;
      default:
        return <StepInput />;
    }
  };

  // Step 1 Next is disabled unless:
  // - Extraction succeeded (extractedData is set) → auto-advanced by reducer
  // - Manual entry mode is chosen → intakeMode === "manual"
  // In both cases the user has already moved past step 1, so the bottom bar
  // shows "Continue" as disabled on step 1 (FlexibleIntake handles its own submit).
  const step1NextDisabled =
    state.currentStep === 1 && state.intakeMode !== "manual";

  // Step 2 Next: populate form fields from extraction + edits before advancing to bid decision
  const handleStep2Next = useCallback(() => {
    dispatch({ type: "POPULATE_FROM_EXTRACTION" });
    dispatch({ type: "GO_NEXT" });
  }, [dispatch]);

  // Step 2 Quick Start: skip review, bid decision, and configure — go straight to generate
  // Populates form fields from extraction data with defaults, then jumps to step 5.
  const handleQuickStart = useCallback(() => {
    dispatch({ type: "POPULATE_FROM_EXTRACTION" });
    // maxCompletedStep must reach 4 so step 5 is reachable
    dispatch({ type: "SET_STEP", step: 5 });
  }, [dispatch]);

  // Step 3 (Bid Decision): no special disabled logic — the step itself handles
  // confirmation internally via handleDecision(). The bottom bar Continue button
  // lets the user advance once they've decided or want to skip.
  // No disabled gate needed here.

  // Step 4 Next: only advance if win strategy has been generated.
  // The "Generate Proposal" button in the bottom bar should be disabled until
  // the user has generated (and optionally edited) a win strategy and selected sections.
  const step4NextDisabled =
    state.currentStep === 4 && (!state.winStrategy || state.selectedSections.length === 0);

  // Determine nextDisabled and custom onNext per step
  const getBottomBarProps = () => {
    switch (state.currentStep) {
      case 1:
        return {
          nextDisabled: step1NextDisabled,
          nextLoading: state.isExtracting,
        };
      case 2:
        return {
          onNext: handleStep2Next,
          // Show Quick Start only when there's extraction data to work with
          onQuickStart: state.extractedData ? handleQuickStart : undefined,
        };
      case 3:
        // Bid decision step — no special bottom bar logic
        return {};
      case 4:
        return {
          nextDisabled: step4NextDisabled,
        };
      default:
        return {};
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Inline step progress bar */}
      <WizardStepBar />

      {/* Content area */}
      <div className="flex-1 pb-24">
        <div className="max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Persistent Bottom Bar */}
      <WizardBottomBar {...getBottomBarProps()} />
    </div>
  );
}

/**
 * WizardShellFullScreen — Full-screen variant with dedicated sidebar.
 *
 * Use this when the wizard route is moved outside the dashboard layout.
 * Not currently used, but preserved for the layout migration in a later phase.
 */
export function WizardShellFullScreen() {
  const { state } = useWizard();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepInput />;
      case 2:
        return <StepReview />;
      case 3:
        return <StepBidDecision />;
      case 4:
        return <StepConfigure />;
      case 5:
        return <StepGenerate />;
      default:
        return <StepInput />;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Wizard Sidebar — replaces dashboard sidebar */}
      <WizardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-8 py-8 pb-24">
          <div className="max-w-4xl mx-auto">
            {renderStep()}
          </div>
        </div>

        {/* Persistent Bottom Bar */}
        <WizardBottomBar />
      </main>
    </div>
  );
}
