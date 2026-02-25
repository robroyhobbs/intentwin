"use client";

/**
 * WizardSidebar — Vertical step list with logo, step states, and exit button.
 *
 * Replaces the main dashboard sidebar when the wizard is active.
 * Dark theme with accent-colored active indicator.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWizard } from "./wizard-provider";
import { WIZARD_STEPS, type WizardStep } from "./wizard-types";
import { cn } from "@/lib/utils/cn";

function StepIndicator({ step }: { step: WizardStep }) {
  const { state } = useWizard();
  const isActive = state.currentStep === step;
  const isCompleted = state.maxCompletedStep >= step;

  if (isCompleted && !isActive) {
    // Completed checkmark
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (isActive) {
    // Active filled dot
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-bold">
        {step}
      </span>
    );
  }

  // Future — muted hollow dot
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 text-slate-500 text-xs">
      {step}
    </span>
  );
}

export function WizardSidebar() {
  const { state } = useWizard();
  const router = useRouter();

  const handleExit = () => {
    const hasData = state.clientName || state.extractedData || state.pastedContent || state.files.length > 0;
    if (hasData) {
      const confirmed = window.confirm("You have unsaved progress. Are you sure you want to exit?");
      if (!confirmed) return;
    }
    router.push("/proposals");
  };

  return (
    <aside className="flex h-full w-[260px] flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/proposals" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
            IB
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
            IntentBid
          </span>
        </Link>
      </div>

      {/* Section Label */}
      <div className="px-5 pt-6 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          New Proposal
        </span>
      </div>

      {/* Steps */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {WIZARD_STEPS.map((meta) => {
            const isActive = state.currentStep === meta.step;
            return (
              <li key={meta.step}>
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                    isActive && "bg-slate-800/60",
                  )}
                >
                  {/* Active accent bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                  )}

                  <StepIndicator step={meta.step} />

                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-white" : state.maxCompletedStep >= meta.step ? "text-slate-300" : "text-slate-500",
                    )}>
                      {meta.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {meta.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit Button */}
      <div className="px-3 pb-5">
        <button
          onClick={handleExit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Exit Wizard
        </button>
      </div>
    </aside>
  );
}
