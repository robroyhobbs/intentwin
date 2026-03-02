// ── NextStepCard ────────────────────────────────────────────────────────────
// Accent-bordered directive card with ArrowRight icon.

import { ArrowRight } from "lucide-react";

interface NextStepCardProps {
  text: string;
}

export function NextStepCard({ text }: NextStepCardProps) {
  return (
    <div className="rounded-lg border border-border border-l-2 border-l-[var(--accent)] bg-[var(--accent-subtle)] p-3 flex items-start gap-2.5">
      <ArrowRight size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
      <p className="text-sm font-medium text-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}
