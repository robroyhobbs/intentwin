"use client";

// ── Decision Coach Panel ────────────────────────────────────────────────────
// Renders contextual guidance based on current phase state.

import { useMemo } from "react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { ConfidenceRing } from "./shared/confidence-ring";
import { PhaseTimeline } from "./shared/phase-timeline";
import { RiskFlagChip } from "./shared/risk-flag";
import { CitationPill } from "./shared/citation-pill";
import type { CoachContent, CoachInsight, CoachPrompt } from "./create-types";

// ── Phase tips ──────────────────────────────────────────────────────────────

const PHASE_TIPS: Record<string, string> = {
  intake:
    "Upload your RFP or solicitation document. We'll extract key requirements, evaluation criteria, and deadlines automatically.",
  strategy:
    "Review the bid/no-bid score and select win themes that align with your strengths. This shapes how the proposal is framed.",
  draft:
    "Each section is generated based on your RFP analysis and win themes. Review sections and regenerate any that need improvement.",
  finalize:
    "Resolve any blockers, approve the final proposal, and export to DOCX or PDF for submission.",
};

// ── Sub-sections ────────────────────────────────────────────────────────────

function TipSection({ phase }: { phase: string }) {
  const tip = PHASE_TIPS[phase];
  if (!tip) return null;
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
      <p className="text-xs text-foreground/70 leading-relaxed">{tip}</p>
    </div>
  );
}

function WhySection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Status
      </h4>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function SignalsSection({ signals }: { signals: string[] }) {
  if (signals.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Key signals
      </h4>
      <ul className="space-y-1">
        {signals.map((signal) => (
          <li
            key={signal}
            className="flex items-start gap-2 text-sm text-foreground/80"
          >
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
            {signal}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RisksSection({ flags }: { flags: CoachContent["riskFlags"] }) {
  if (flags.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Attention needed
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((flag) => (
          <RiskFlagChip
            key={flag.id}
            severity={flag.severity}
            label={flag.label}
          />
        ))}
      </div>
    </div>
  );
}

function SourcesSection({
  citations,
}: {
  citations: CoachContent["citations"];
}) {
  if (citations.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Sources
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <CitationPill key={c.id} label={c.label} />
        ))}
      </div>
    </div>
  );
}

// ── New: Insights Section ───────────────────────────────────────────────────

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
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Detailed Analysis
      </h4>
      <div className="divide-y divide-border/50">
        {insights.map((ins) => (
          <InsightRow key={ins.id} insight={ins} />
        ))}
      </div>
    </div>
  );
}

// ── New: Prompts Section ────────────────────────────────────────────────────

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
  helpful: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
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
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Information Needed
      </h4>
      {prompts.map((p) => (
        <div
          key={p.id}
          className={`rounded-lg border p-2.5 ${IMPORTANCE_COLORS[p.importance]}`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {IMPORTANCE_LABELS[p.importance]}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {p.question}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);

  return (
    <div className="space-y-5">
      {/* Header with timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Decision Coach
        </h3>
        <PhaseTimeline
          current={state.phase}
          completed={state.completedPhases}
        />
      </div>

      {/* Confidence ring */}
      <div className="flex justify-center py-1">
        <ConfidenceRing score={state.confidence} />
      </div>

      {/* Contextual tip */}
      <TipSection phase={state.phase} />

      {/* Dynamic content */}
      <WhySection text={content.whyItMatters} />
      <SignalsSection signals={content.signals} />
      <RisksSection flags={content.riskFlags} />

      {/* Enriched content */}
      {content.insights && <InsightsSection insights={content.insights} />}
      {content.prompts && <PromptsSection prompts={content.prompts} />}

      {/* Sources */}
      <SourcesSection citations={content.citations} />
    </div>
  );
}
