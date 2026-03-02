import type { BidEvaluation } from "@/lib/ai/bid-scoring";
import { SCORING_FACTORS } from "@/lib/ai/bid-scoring";
import type { WinTheme } from "../create-types";
import { getScoreColor, getScoreBgColor, getRecommendationBadge } from "./strategy-helpers";

// ── Loading spinner ─────────────────────────────────────────────────────────

export function SpinnerOverlay({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Error banner ────────────────────────────────────────────────────────────

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <span className="text-destructive text-lg leading-none mt-0.5">!</span>
      <div className="flex-1">
        <p className="text-sm text-destructive">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

export function StrategyHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Bid Strategy</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Review the AI-scored bid evaluation and select your win themes before
        proceeding to draft generation.
      </p>
    </div>
  );
}

// ── Factor row ──────────────────────────────────────────────────────────────

function FactorRow({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">({weight}%)</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>
        {score}
      </span>
    </div>
  );
}

// ── Score card ───────────────────────────────────────────────────────────────

export function ScoreCard({ evaluation }: { evaluation: BidEvaluation }) {
  const badge = getRecommendationBadge(evaluation.recommendation);
  const totalColor = getScoreColor(evaluation.weighted_total);
  const totalBg = getScoreBgColor(evaluation.weighted_total);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Bid Score</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className={`rounded-lg border p-4 text-center ${totalBg}`}>
        <div className={`text-4xl font-bold ${totalColor}`}>
          {Math.round(evaluation.weighted_total)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Weighted Score / 100
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Scoring Factors
        </h4>
        {SCORING_FACTORS.map((factor) => {
          const factorScore = evaluation.ai_scores[factor.key];
          return (
            <FactorRow
              key={factor.key}
              label={factor.label}
              score={factorScore.score}
              weight={factor.weight}
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
    <div className="flex gap-3">
      <button
        onClick={onProceed}
        className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Proceed -- Pursue this opportunity
      </button>
      <button
        onClick={onSkip}
        className="flex-1 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        Skip -- Pass on this one
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
        <p className="text-xs text-muted-foreground mt-1">
          Toggle themes to include or exclude from your proposal strategy.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onToggle(theme.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              theme.confirmed
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
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
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Strategy
      </button>
    </div>
  );
}
