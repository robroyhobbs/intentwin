import { ExpandableText } from "./expandable-text";
import { cn } from "@/lib/utils/cn";
import type { CoachPrompt } from "../create-types";

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "border-l-2 border-l-red-500 border border-border bg-card",
  helpful: "border-l-2 border-l-amber-500 border border-border bg-card",
  nice_to_have: "border-l-2 border-l-border border border-border bg-card",
};

const IMPORTANCE_PILLS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  helpful: "bg-amber-500/10 text-amber-500",
  nice_to_have: "bg-muted text-muted-foreground",
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: "Critical",
  helpful: "Helpful",
  nice_to_have: "Optional",
};

export function PromptsSection({
  prompts,
}: {
  prompts: CoachPrompt[];
}) {
  if (prompts.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        What&apos;s Missing
      </h4>
      {prompts.map((p) => (
        <div
          key={p.id}
          className={cn("rounded-lg p-3", IMPORTANCE_COLORS[p.importance])}
        >
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              IMPORTANCE_PILLS[p.importance],
            )}
          >
            {IMPORTANCE_LABELS[p.importance]}
          </span>
          <div className="mt-1.5">
            <ExpandableText
              text={p.question}
              lines={2}
              className="text-sm text-foreground/80 leading-relaxed text-pretty"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
