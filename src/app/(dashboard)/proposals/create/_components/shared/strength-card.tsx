"use client";

import { CheckCircle } from "lucide-react";

interface StrengthCardProps {
  factor: string;
  rationale: string;
}

export function StrengthCard({ factor, rationale }: StrengthCardProps) {
  return (
    <div
      data-testid="strength-card"
      className="rounded-lg border border-border border-l-4 border-l-emerald-500 bg-emerald-500/5 p-3 transition-shadow hover:shadow-[var(--shadow-glow)]"
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold text-foreground">{factor}</h5>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{rationale}</p>
        </div>
      </div>
    </div>
  );
}
