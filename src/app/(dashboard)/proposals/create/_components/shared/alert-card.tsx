// ── AlertCard ───────────────────────────────────────────────────────────────
// Left-bordered severity card with contextual icon.

import { XCircle, AlertTriangle, Info } from "lucide-react";

type Severity = "low" | "medium" | "high";

const SEVERITY_CONFIG: Record<
  Severity,
  { border: string; icon: React.ElementType; iconColor: string }
> = {
  high: {
    border: "border-l-red-500",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  medium: {
    border: "border-l-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  low: {
    border: "border-l-blue-500",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

interface AlertCardProps {
  severity: Severity;
  text: string;
}

export function AlertCard({ severity, text }: AlertCardProps) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  return (
    <div
      className={`rounded-lg border border-border ${cfg.border} border-l-2 bg-card p-3 flex items-start gap-2.5`}
    >
      <Icon size={14} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}
