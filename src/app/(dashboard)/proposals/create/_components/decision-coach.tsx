"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Sparkles,
  Clipboard,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { AlertCard } from "./shared/alert-card";
import { NextStepCard } from "./shared/next-step-card";
import { VerdictCard } from "./shared/verdict-card";
import { GapCard } from "./shared/gap-card";
import { StrengthCard } from "./shared/strength-card";
import { IntelStats } from "./shared/intel-stats";
import { ReadinessChecklist } from "./shared/readiness-checklist";
import type { BidIntelligenceContext } from "@/lib/ai/bid-scoring";
import type {
  CoachContent,
  CoachInsight,
  CoachPrompt,
} from "./create-types";

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

// ── Coach Header ────────────────────────────────────────────────────────────

function CoachHeader({ isFinalize }: { isFinalize: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
        {isFinalize ? (
          <Clipboard size={14} className="text-white" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>
      <h3 className="text-sm font-semibold">
        {isFinalize ? "Proposal Summary" : "Decision Coach"}
      </h3>
    </div>
  );
}

// ── Advisory text ───────────────────────────────────────────────────────────

function AdvisorySection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
      <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

// ── Risk flags ──────────────────────────────────────────────────────────────

function RisksSection({ flags }: { flags: CoachContent["riskFlags"] }) {
  if (flags.length === 0) return null;
  return (
    <CollapsibleSection title="Attention needed" defaultOpen={true}>
      <div className="space-y-2">
        {flags.map((flag) => (
          <AlertCard key={flag.id} severity={flag.severity} text={flag.label} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ── Insights ────────────────────────────────────────────────────────────────

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
    <CollapsibleSection title="Details" defaultOpen={false}>
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

function PromptsSection({ prompts }: { prompts: CoachPrompt[] }) {
  if (prompts.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        What&apos;s Missing
      </h4>
      {prompts.map((p) => (
        <div
          key={p.id}
          className={`rounded-lg p-3 ${IMPORTANCE_COLORS[p.importance]}`}
        >
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${IMPORTANCE_PILLS[p.importance]}`}
          >
            {IMPORTANCE_LABELS[p.importance]}
          </span>
          <p className="text-sm text-foreground/80 leading-relaxed mt-1.5">
            {p.question}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Bid Analysis ────────────────────────────────────────────────────────────

function BidAnalysis({
  content,
  intelligence,
}: {
  content: CoachContent;
  intelligence?: BidIntelligenceContext | null;
}) {
  return (
    <div className="space-y-3">
      {content.verdict && <VerdictCard verdict={content.verdict} />}
      {content.gaps && content.gaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gaps to Address
          </h4>
          {content.gaps.map((g) => (
            <GapCard
              key={g.id}
              factor={g.factor}
              rationale={g.rationale}
              score={g.score}
            />
          ))}
        </div>
      )}
      {content.strengths && content.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Strengths
          </h4>
          {content.strengths.map((s) => (
            <StrengthCard key={s.id} factor={s.factor} rationale={s.rationale} />
          ))}
        </div>
      )}
      {intelligence && (
        <CollapsibleSection title="Market Intelligence" defaultOpen={false}>
          <IntelStats intelligence={intelligence} />
        </CollapsibleSection>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);
  const isFinalize = state.phase === "finalize";

  return (
    <div className="space-y-6">
      <CoachHeader isFinalize={isFinalize} />
      {content.nextStep && <NextStepCard text={content.nextStep} />}
      <AdvisorySection text={content.whyItMatters} />
      {content.verdict && (
        <BidAnalysis
          content={content}
          intelligence={state.bidEvaluation?.intelligence}
        />
      )}
      {content.riskFlags.length > 0 && (
        <RisksSection flags={content.riskFlags} />
      )}
      {content.prompts && content.prompts.length > 0 && (
        <PromptsSection prompts={content.prompts} />
      )}
      {content.insights && content.insights.length > 0 && (
        <InsightsSection insights={content.insights} />
      )}
      {isFinalize &&
        content.readinessItems &&
        content.readinessItems.length > 0 && (
          <ReadinessChecklist items={content.readinessItems} />
        )}
    </div>
  );
}
