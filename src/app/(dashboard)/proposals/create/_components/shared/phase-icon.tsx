import { FileText, Target, PenTool, CheckCircle } from "lucide-react";
import type { CreatePhase } from "../create-types";

const PHASE_ICONS: Record<CreatePhase, React.ElementType> = {
  intake: FileText,
  strategy: Target,
  draft: PenTool,
  finalize: CheckCircle,
};

type PhaseIconState = "inactive" | "active" | "completed";

const STATE_CLASSES: Record<PhaseIconState, string> = {
  inactive: "bg-muted text-muted-foreground",
  active:
    "bg-[var(--accent)] text-white shadow-[var(--shadow-glow)] animate-glow",
  completed: "bg-emerald-600 text-white",
};

interface PhaseIconProps {
  phase: CreatePhase;
  state: PhaseIconState;
  size?: "sm" | "md";
}

export function PhaseIcon({ phase, state, size = "md" }: PhaseIconProps) {
  const Icon = PHASE_ICONS[phase];
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div
      data-testid="phase-icon"
      className={`${sizeClass} rounded-lg flex items-center justify-center shrink-0 transition-all ${STATE_CLASSES[state]}`}
    >
      {state === "completed" ? (
        <CheckCircle size={iconSize} />
      ) : (
        <Icon size={iconSize} />
      )}
    </div>
  );
}
