"use client";

// ── Decision Coach Panel ────────────────────────────────────────────────────
// Renders contextual guidance based on current phase state.

import { useMemo } from "react";
import { useCreateFlow } from "./create-provider";
import { getCoachContent } from "./coach-content";
import { ConfidencePill } from "./shared/confidence-pill";
import { RiskFlagChip } from "./shared/risk-flag";
import { CitationPill } from "./shared/citation-pill";
import type { CoachContent } from "./create-types";

// ── Sub-sections ────────────────────────────────────────────────────────────

function WhySection({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Why this matters
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
        Risk flags
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

function ActionsSection({ actions }: { actions: CoachContent["actions"] }) {
  if (actions.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Actions
      </h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.actionType}
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DecisionCoach() {
  const { state } = useCreateFlow();
  const content = useMemo(() => getCoachContent(state), [state]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Decision Coach
        </h3>
        <ConfidencePill score={state.confidence} />
      </div>

      <WhySection text={content.whyItMatters} />
      <SignalsSection signals={content.signals} />
      <RisksSection flags={content.riskFlags} />
      <SourcesSection citations={content.citations} />
      <ActionsSection actions={content.actions} />
    </div>
  );
}
