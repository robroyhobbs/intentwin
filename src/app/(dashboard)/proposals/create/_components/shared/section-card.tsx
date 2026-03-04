"use client";

import { useState, useCallback } from "react";
import { ProposalContentRenderer } from "@/components/proposal-content-renderer";
import type { SectionDraft } from "../create-types";

// ── Status indicators ───────────────────────────────────────────────────────

function StatusIndicator({
  status,
}: {
  status: SectionDraft["generationStatus"];
}) {
  switch (status) {
    case "generating":
      return (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
      );
    case "complete":
      return (
        <svg
          className="h-4 w-4 text-emerald-500 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "failed":
      return (
        <svg
          className="h-4 w-4 text-destructive shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return <div className="h-4 w-4 rounded-full bg-muted shrink-0" />;
  }
}

function statusLabel(status: SectionDraft["generationStatus"]): string {
  switch (status) {
    case "generating":
      return "Generating...";
    case "complete":
      return "Complete";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

// ── Card header ─────────────────────────────────────────────────────────────

interface CardHeaderProps {
  section: SectionDraft;
  expanded: boolean;
  onToggle: () => void;
}

function GroundingBadge({ level }: { level?: "high" | "medium" | "low" }) {
  if (!level || level === "high") return null;
  if (level === "low") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-inset ring-red-500/20">
        Low grounding
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-inset ring-amber-500/20">
      Partial grounding
    </span>
  );
}

function CardHeader({ section, expanded, onToggle }: CardHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
    >
      <StatusIndicator status={section.generationStatus} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{section.title}</span>
          <GroundingBadge level={section.groundingLevel} />
        </div>
        <span className="text-xs text-muted-foreground">
          {statusLabel(section.generationStatus)}
          {section.reviewed && " - Reviewed"}
        </span>
      </div>
      <svg
        className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
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
  );
}

// ── Card body ───────────────────────────────────────────────────────────────

interface CardBodyProps {
  section: SectionDraft;
  onMarkReviewed?: (sectionId: string) => void;
  onRegenerate?: (sectionId: string) => void;
}

function CardBody({ section, onMarkReviewed, onRegenerate }: CardBodyProps) {
  return (
    <div className="px-4 pb-4 pt-0 space-y-4">
      {section.generationStatus === "failed" && (
        <p className="text-sm text-destructive">
          Generation failed for this section.
        </p>
      )}

      {section.content && (
        <ProposalContentRenderer
          content={section.content}
          className="text-sm text-foreground/90 leading-relaxed"
        />
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {onMarkReviewed &&
          !section.reviewed &&
          section.generationStatus === "complete" && (
            <button
              type="button"
              onClick={() => onMarkReviewed(section.id)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Mark as Reviewed
            </button>
          )}
        {section.reviewed && (
          <span className="text-xs font-medium text-emerald-600">Reviewed</span>
        )}
        {onRegenerate && section.generationStatus !== "generating" && (
          <button
            type="button"
            onClick={() => onRegenerate(section.id)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main SectionCard ────────────────────────────────────────────────────────

export interface SectionCardProps {
  section: SectionDraft;
  onMarkReviewed?: (sectionId: string) => void;
  onRegenerate?: (sectionId: string) => void;
  defaultExpanded?: boolean;
}

export function SectionCard({
  section,
  onMarkReviewed,
  onRegenerate,
  defaultExpanded = false,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const borderClass = section.reviewed
    ? "border-l-3 border-l-emerald-500 shadow-sm"
    : "";

  return (
    <div
      className={`rounded-lg border border-border bg-card overflow-hidden hover-glow ${borderClass}`}
    >
      <CardHeader section={section} expanded={expanded} onToggle={toggle} />
      {expanded && (
        <CardBody
          section={section}
          onMarkReviewed={onMarkReviewed}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}
