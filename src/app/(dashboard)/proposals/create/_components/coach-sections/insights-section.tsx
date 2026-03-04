import {
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";
import { ExpandableText } from "./expandable-text";
import type { CoachInsight } from "../create-types";

const SEVERITY_ICON: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  high: { icon: XCircle, color: "text-red-500" },
  medium: { icon: AlertTriangle, color: "text-amber-500" },
  low: { icon: CheckCircle, color: "text-emerald-500" },
};

function InsightRow({ insight }: { insight: CoachInsight }) {
  const cfg = SEVERITY_ICON[insight.severity ?? "low"];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xs font-medium text-foreground truncate">
            {insight.label}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {insight.value}
          </span>
        </div>
        {insight.detail && (
          <ExpandableText
            text={insight.detail}
            lines={2}
            className="mt-0.5 text-xs text-muted-foreground/70 leading-snug text-pretty"
          />
        )}
      </div>
    </div>
  );
}

export function InsightsSection({
  insights,
}: {
  insights: CoachInsight[];
}) {
  if (insights.length === 0) return null;
  return (
    <CollapsibleSection title="Details" defaultOpen={false}>
      <div className="divide-y divide-border/50">
        {insights.map((ins) => (
          <InsightRow key={ins.id} insight={ins} />
        ))}
      </div>
    </CollapsibleSection>
  );
}
