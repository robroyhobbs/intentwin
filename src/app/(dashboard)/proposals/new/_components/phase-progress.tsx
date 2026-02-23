"use client";

import {
  Check,
  Building2,
  Trophy,
  CheckCircle2,
} from "lucide-react";

export const PHASES = [
  {
    id: "context",
    name: "Define Context",
    description: "Client, challenges, and desired outcomes",
    icon: Building2,
    color: "var(--accent)",
  },
  {
    id: "strategy",
    name: "Win Strategy",
    description: "Tailored approach based on your context",
    icon: Trophy,
    color: "var(--warning)",
  },
  {
    id: "review",
    name: "Review & Create",
    description: "Confirm intent and generate proposal",
    icon: CheckCircle2,
    color: "var(--success)",
  },
];

interface PhaseProgressBarProps {
  phase: number;
  onPhaseClick: (i: number) => void;
}

export function PhaseProgressBar({ phase, onPhaseClick }: PhaseProgressBarProps) {
  return (
    <div className="flex items-center gap-4">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const isActive = i === phase;
        const isComplete = i < phase;

        return (
          <button
            key={p.id}
            onClick={() => i <= phase && onPhaseClick(i)}
            disabled={i > phase}
            className={`flex-1 relative flex items-center gap-3 p-4 rounded-xl transition-all ${
              isActive
                ? "bg-[var(--background-elevated)] border-2 border-[var(--accent)] shadow-lg"
                : isComplete
                  ? "bg-[var(--background-tertiary)] border border-[var(--success-muted)] hover:bg-[var(--background-secondary)] cursor-pointer"
                  : "bg-[var(--background-tertiary)] border border-[var(--border)] opacity-50 cursor-not-allowed"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : isComplete
                    ? "bg-[var(--success)] text-white"
                    : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
              }`}
            >
              {isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            <div className="text-left">
              <p
                className={`text-sm font-semibold ${isActive ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}
              >
                {p.name}
              </p>
              <p className="text-xs text-[var(--foreground-subtle)] hidden lg:block">
                Phase {i + 1}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
