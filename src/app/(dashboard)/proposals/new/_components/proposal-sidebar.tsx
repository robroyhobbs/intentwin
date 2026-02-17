"use client";

import { HelpCircle } from "lucide-react";

interface ProposalSidebarProps {
  clientName: string;
  clientIndustry: string;
  opportunityType: string;
  currentStatePains: string[];
  desiredOutcomes: string[];
  phase: number;
}

export function ProposalSidebar({
  clientName,
  clientIndustry,
  opportunityType,
  currentStatePains,
  desiredOutcomes,
  phase,
}: ProposalSidebarProps) {
  return (
    <div className="col-span-4 space-y-4">
      {/* Context summary */}
      {clientName && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
            Summary
          </p>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[var(--foreground-subtle)]">Client</p>
              <p className="font-medium text-[var(--foreground)]">
                {clientName}
              </p>
            </div>
            {clientIndustry && (
              <div>
                <p className="text-[var(--foreground-subtle)]">Industry</p>
                <p className="text-[var(--foreground-muted)]">
                  {clientIndustry.replace(/_/g, " ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-[var(--foreground-subtle)]">Opportunity</p>
              <p className="text-[var(--foreground-muted)]">
                {opportunityType.replace(/_/g, " ")}
              </p>
            </div>
            {currentStatePains.some((p) => p.trim()) && (
              <div>
                <p className="text-[var(--foreground-subtle)]">
                  Pain Points
                </p>
                <p className="text-[var(--warning)]">
                  {currentStatePains.filter((p) => p.trim()).length}{" "}
                  identified
                </p>
              </div>
            )}
            {desiredOutcomes.some((o) => o.trim()) && (
              <div>
                <p className="text-[var(--foreground-subtle)]">Outcomes</p>
                <p className="text-[var(--accent)]">
                  {desiredOutcomes.filter((o) => o.trim()).length} defined
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card p-4 bg-[var(--background-tertiary)] border-dashed">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Tips
          </p>
        </div>
        <ul className="space-y-2 text-xs text-[var(--foreground-muted)]">
          {phase === 0 && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                Be specific about pain points - they drive the narrative
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                Define measurable outcomes for stronger proposals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                AI will find relevant case studies automatically
              </li>
            </>
          )}
          {phase === 1 && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                Win themes run throughout the proposal
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                High priority outcomes get more emphasis
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                Add competitive intel for sharper positioning
              </li>
            </>
          )}
          {phase === 2 && (
            <>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                Review all details before approving
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                You can edit the proposal after generation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)]">•</span>
                All claims will be verified against sources
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
