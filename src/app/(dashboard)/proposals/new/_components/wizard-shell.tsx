"use client";

/**
 * WizardShell — Layout component combining sidebar stepper + content area + bottom bar.
 *
 * Renders the active step content based on currentStep from wizard state.
 * Each step is a lazy placeholder for now — actual step components will be built in later phases.
 *
 * Note: Currently renders within the dashboard layout (sidebar + header provided by parent).
 * The WizardSidebar is rendered as a step indicator panel at the top of the content area.
 * A future phase will move this route outside the dashboard layout for full-screen wizard control.
 */

import { useWizard } from "./wizard-provider";
import { WizardSidebar } from "./wizard-sidebar";
import { WizardBottomBar } from "./wizard-bottom-bar";
import { WIZARD_STEPS } from "./wizard-types";

// ────────────────────────────────────────────────────────
// Step Placeholders (replaced in Phases 1-4)
// ────────────────────────────────────────────────────────

function StepPlaceholder({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-6xl font-bold text-[var(--foreground-subtle)] mb-4">{step}</div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{label}</h2>
      <p className="text-sm text-[var(--foreground-muted)]">This step will be built in Phase {step}.</p>
    </div>
  );
}

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
  const { state } = useWizard();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepPlaceholder step={1} label="Provide Documents" />;
      case 2:
        return <StepPlaceholder step={2} label="Review & Edit" />;
      case 3:
        return <StepPlaceholder step={3} label="Configure Proposal" />;
      case 4:
        return <StepPlaceholder step={4} label="Generate Sections" />;
      default:
        return <StepPlaceholder step={1} label="Provide Documents" />;
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
      <WizardBottomBar />
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
        return <StepPlaceholder step={1} label="Provide Documents" />;
      case 2:
        return <StepPlaceholder step={2} label="Review & Edit" />;
      case 3:
        return <StepPlaceholder step={3} label="Configure Proposal" />;
      case 4:
        return <StepPlaceholder step={4} label="Generate Sections" />;
      default:
        return <StepPlaceholder step={1} label="Provide Documents" />;
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
