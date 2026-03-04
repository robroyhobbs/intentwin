import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type { WinTheme } from "../create-types";
import {
  getScoreColor,
  getScoreBgColor,
  getRecommendationBadge,
} from "./strategy-helpers";
import { PhaseIcon } from "../shared/phase-icon";
import { ScoreBar } from "../shared/score-bar";
import { cn } from "@/lib/utils/cn";
import { WaitLoader } from "../shared/wait-loader";

// ── Loading spinner ─────────────────────────────────────────────────────────

export function SpinnerOverlay({ label }: { label: string }) {
  return (
    <div className="animate-fade-in">
      <WaitLoader
        label={label}
        detail="We are scoring fit, risks, and strengths before drafting."
      />
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

export function StrategyHeader() {
  return (
    <div className="flex items-center gap-3">
      <PhaseIcon phase="strategy" state="active" />
      <div>
        <h2 className="text-xl font-bold text-balance">
          Opportunity Fit Check
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
          Review your fit score, then choose the themes you want in the draft.
        </p>
      </div>
    </div>
  );
}

// ── Score card ───────────────────────────────────────────────────────────────

export function ScoreCard({ evaluation }: { evaluation: BidEvaluation }) {
  const badge = getRecommendationBadge(evaluation.recommendation);
  const totalColor = getScoreColor(evaluation.weighted_total);
  const totalBg = getScoreBgColor(evaluation.weighted_total);
  const totalScore = Math.round(evaluation.weighted_total);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Opportunity Fit Score</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className={cn("rounded-lg border p-4", totalBg)}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Overall fit score
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Weighted score out of 100
            </p>
          </div>
          <p
            className={cn(
              "text-4xl font-semibold leading-none tabular-nums",
              totalColor,
            )}
          >
            {totalScore}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase">
          How this score was calculated
        </h4>
        {SCORING_FACTORS.map((factor) => {
          const factorScore = evaluation.ai_scores[factor.key];
          return (
            <ScoreBar
              key={factor.key}
              label={`${factor.label} (${factor.weight}%)`}
              score={factorScore.score}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Decision buttons ────────────────────────────────────────────────────────

export function BidDecisionButtons({
  onProceed,
  onSkip,
}: {
  onProceed: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onProceed}
        className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Continue with this opportunity
      </button>
      <button
        onClick={onSkip}
        className="flex-1 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        Pass for now
      </button>
    </div>
  );
}

// ── Win theme chips ─────────────────────────────────────────────────────────

export function WinThemeChips({
  themes,
  onToggle,
}: {
  themes: WinTheme[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Win Themes</h3>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Select the themes you want your proposal to emphasize.
        </p>
      </div>
      <div className="space-y-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onToggle(theme.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium text-pretty transition-colors",
              theme.confirmed
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                theme.confirmed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 bg-transparent",
              )}
            >
              {theme.confirmed && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Confirm strategy button ─────────────────────────────────────────────────

export function ConfirmStrategyButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={disabled}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-primary/40 disabled:text-primary-foreground/80"
      >
        Use Selected Themes
      </button>
    </div>
  );
}
