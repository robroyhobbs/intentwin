"use client";

import {
  Loader2,
  X,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import type { WinStrategyData } from "@/types/outcomes";
import { OUTCOME_CATEGORIES } from "@/types/outcomes";

interface WinStrategyPhaseProps {
  loadingStrategy: boolean;
  winStrategy: WinStrategyData | null;
  setWinStrategy: (value: WinStrategyData | null) => void;
  competitiveIntel: string;
  setCompetitiveIntel: (value: string) => void;
  generateWinStrategy: () => void;
  fieldClass: string;
  labelClass: string;
}

export function WinStrategyPhase({
  loadingStrategy,
  winStrategy,
  setWinStrategy,
  competitiveIntel,
  setCompetitiveIntel,
  generateWinStrategy,
  fieldClass,
  labelClass,
}: WinStrategyPhaseProps) {
  return (
    <>
      {loadingStrategy ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[var(--foreground)]">
              Generating Win Strategy
            </p>
            <p className="text-[var(--foreground-muted)] mt-2">
              Analyzing your context and building win themes...
            </p>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : winStrategy ? (
        <div className="space-y-8">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--info-subtle)] border border-[var(--info-muted)]">
            <Lightbulb className="h-6 w-6 text-[var(--info)] mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                AI-Generated Strategy
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Based on your context, we suggest these win themes.
                Edit as needed.
              </p>
            </div>
          </div>

          {/* Win Themes */}
          <section>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Win Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {winStrategy.win_themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-muted)] text-sm font-medium text-[var(--accent)]"
                >
                  {theme}
                  <button
                    onClick={() => {
                      setWinStrategy({
                        ...winStrategy,
                        win_themes: winStrategy.win_themes.filter(
                          (_, i) => i !== idx,
                        ),
                      });
                    }}
                    className="hover:text-[var(--danger)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Target Outcomes */}
          <section>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Target Outcomes
            </h3>
            <div className="space-y-3">
              {winStrategy.target_outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)]"
                >
                  <div className="flex-1">
                    <p className="text-sm text-[var(--foreground)]">
                      {outcome.outcome}
                    </p>
                    <span className="inline-block mt-1 text-xs text-[var(--foreground-subtle)] bg-[var(--background-secondary)] px-2 py-0.5 rounded">
                      {OUTCOME_CATEGORIES.find(
                        (c) => c.value === outcome.category,
                      )?.label || outcome.category}
                    </span>
                  </div>
                  <select
                    value={outcome.priority}
                    onChange={(e) => {
                      setWinStrategy({
                        ...winStrategy,
                        target_outcomes:
                          winStrategy.target_outcomes.map((o) =>
                            o.id === outcome.id
                              ? {
                                  ...o,
                                  priority: e.target.value as
                                    | "high"
                                    | "medium"
                                    | "low",
                                }
                              : o,
                          ),
                      });
                    }}
                    className={`text-xs font-semibold rounded-lg px-3 py-1.5 ${
                      outcome.priority === "high"
                        ? "bg-[var(--danger-subtle)] text-[var(--danger)]"
                        : outcome.priority === "medium"
                          ? "bg-[var(--warning-subtle)] text-[var(--warning)]"
                          : "bg-[var(--success-subtle)] text-[var(--success)]"
                    }`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Differentiators */}
          <section>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
              Key Differentiators
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {winStrategy.differentiators.map((diff, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-tertiary)]"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <span className="flex-1 text-sm text-[var(--foreground-muted)]">
                    {diff}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Competitive Intel */}
          <section>
            <label className={labelClass}>
              Competitive Intelligence (Optional)
            </label>
            <textarea
              value={competitiveIntel}
              onChange={(e) => setCompetitiveIntel(e.target.value)}
              rows={3}
              className={fieldClass}
              placeholder="Known competitors, incumbent vendors, decision influencers..."
            />
          </section>

          <button
            onClick={() => {
              setWinStrategy(null);
              generateWinStrategy();
            }}
            disabled={loadingStrategy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {loadingStrategy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Regenerate Strategy
          </button>
        </div>
      ) : null}
    </>
  );
}
