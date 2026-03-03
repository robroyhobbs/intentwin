"use client";

import { ThumbsUp, Scale, ThumbsDown } from "lucide-react";

type Verdict = "bid" | "evaluate" | "pass";

interface VerdictCardProps {
  verdict: Verdict;
}

const VERDICT_CONFIG: Record<
  Verdict,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    borderColor: string;
    bgColor: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  bid: {
    icon: ThumbsUp,
    label: "Pursue",
    description: "Strong fit — your capabilities align well with this RFP",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  evaluate: {
    icon: Scale,
    label: "Pursue with Caution",
    description: "Gaps exist — review below before committing resources",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  pass: {
    icon: ThumbsDown,
    label: "Consider Passing",
    description: "Significant gaps — may not be worth the pursuit cost",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-500/5",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
};

export function VerdictCard({ verdict }: VerdictCardProps) {
  const cfg = VERDICT_CONFIG[verdict];
  const Icon = cfg.icon;

  return (
    <div
      data-testid="verdict-card"
      className={`rounded-lg border border-border border-l-4 ${cfg.borderColor} ${cfg.bgColor} p-4 animate-fade-in`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-foreground">{cfg.label}</h4>
          <p className="text-sm text-muted-foreground mt-1">{cfg.description}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={cfg.iconColor} />
        </div>
      </div>
    </div>
  );
}
