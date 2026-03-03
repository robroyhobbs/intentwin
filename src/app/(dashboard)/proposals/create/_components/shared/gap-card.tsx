"use client";

import { AlertTriangle, XCircle } from "lucide-react";

interface GapCardProps {
  factor: string;
  rationale: string;
  score: number;
}

export function GapCard({ factor, rationale, score }: GapCardProps) {
  const isHigh = score < 40;
  const Icon = isHigh ? XCircle : AlertTriangle;
  const borderColor = isHigh ? "border-l-red-500" : "border-l-amber-500";
  const bgColor = isHigh ? "bg-red-500/5" : "bg-amber-500/5";
  const iconColor = isHigh ? "text-red-500" : "text-amber-500";

  return (
    <div
      data-testid="gap-card"
      className={`rounded-lg border border-border border-l-4 ${borderColor} ${bgColor} p-4 animate-fade-in-up transition-shadow hover:shadow-[var(--shadow-glow)]`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-semibold text-foreground">{factor}</h5>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            {rationale}
          </p>
        </div>
      </div>
    </div>
  );
}
