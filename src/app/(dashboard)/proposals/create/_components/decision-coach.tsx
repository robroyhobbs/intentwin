"use client";

// ── Decision Coach Panel ────────────────────────────────────────────────────
// Contextual guidance sidebar — advisory, not status-reporting.

import { useMemo, useState, useCallback } from "react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { ConfidenceRing } from "./shared/confidence-ring";
import { RiskFlagChip } from "./shared/risk-flag";
import type { CoachContent, CoachInsight, CoachPrompt } from "./create-types";

// ── Collapsible wrapper ─────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((p) => !p), []);
  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between w-full group"
      >
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
        <svg
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ── Advisory text ───────────────────────────────────────────────────────────

function AdvisorySection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

// ── Risk flags ──────────────────────────────────────────────────────────────

function RisksSection({ flags }: { flags: CoachContent["riskFlags"] }) {
  if (flags.length === 0) return null;
  return (
    <CollapsibleSection title="Attention needed" defaultOpen={true}>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((flag) => (
          <RiskFlagChip
            key={flag.id}
            severity={flag.severity}
            label={flag.label}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Insights ────────────────────────────────────────────────────────────────

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

function InsightRow({ insight }: { insight: CoachInsight }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span
        className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${SEVERITY_DOT[insight.severity ?? "low"]}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xs font-medium text-foreground truncate">
            {insight.label}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {insight.value}
          </span>
        </div>
        {insight.detail && (
          <p className="text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
            {insight.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function InsightsSection({ insights }: { insights: CoachInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <CollapsibleSection title="Detailed Analysis" defaultOpen={false}>
      <div className="divide-y divide-border/50">
        {insights.map((ins) => (
          <InsightRow key={ins.id} insight={ins} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Prompts ─────────────────────────────────────────────────────────────────

const IMPORTANCE_COLORS: Record<string, string> = {
  critical:
    "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
  helpful:
    "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
  nice_to_have: "border-border bg-muted/30",
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: "Critical",
  helpful: "Helpful",
  nice_to_have: "Optional",
};

function PromptsSection({ prompts }: { prompts: CoachPrompt[] }) {
  if (prompts.length === 0) return null;
  return (
    <CollapsibleSection title="Information Needed" defaultOpen={true}>
      <div className="space-y-2">
        {prompts.map((p) => (
          <div
            key={p.id}
            className={`rounded-lg border p-2.5 ${IMPORTANCE_COLORS[p.importance]}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {IMPORTANCE_LABELS[p.importance]}
            </span>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              {p.question}
            </p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);
  const isFinalize = state.phase === "finalize";

  return (
    <div className="space-y-5">
      {/* Header + progress ring */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {isFinalize ? "Proposal Summary" : "Decision Coach"}
          </h3>
          {isFinalize && state.bidEvaluation && (
            <p className="text-xs text-muted-foreground mt-1">
              Bid fit: {Math.round(state.bidEvaluation.weighted_total)}/100
            </p>
          )}
        </div>
        <ConfidenceRing score={state.confidence} size={56} />
      </div>

      {/* Advisory guidance — the main contextual message */}
      <AdvisorySection text={content.whyItMatters} />

      {/* Risk flags (always visible if present) */}
      <RisksSection flags={content.riskFlags} />

      {/* Prompts for missing info (always visible if present) */}
      {content.prompts && content.prompts.length > 0 && (
        <PromptsSection prompts={content.prompts} />
      )}

      {/* Detailed analysis (collapsed by default) */}
      {content.insights && content.insights.length > 0 && (
        <InsightsSection insights={content.insights} />
      )}
    </div>
  );
}
