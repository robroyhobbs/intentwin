"use client";

import { useState } from "react";
import type { CapabilityAlignmentResult } from "@/lib/ai/pipeline/capability-alignment";

// ── Props ────────────────────────────────────────────────────────────────────

interface CapabilityWarningGateProps {
  alignment: CapabilityAlignmentResult;
  onAcknowledge: () => void;
  onCancel?: () => void;
}

// ── Banner color by level ────────────────────────────────────────────────────

function bannerClasses(level: "low" | "moderate"): string {
  return level === "low"
    ? "border-red-400/40 bg-red-500/5"
    : "border-amber-400/40 bg-amber-500/5";
}

function iconColor(level: "low" | "moderate"): string {
  return level === "low" ? "text-red-500" : "text-amber-500";
}

function headingText(level: "low" | "moderate"): string {
  return level === "low"
    ? "Low Capability Alignment"
    : "Moderate Capability Alignment";
}

function descriptionText(level: "low" | "moderate"): string {
  return level === "low"
    ? "Your evidence library and bid score suggest limited alignment with this opportunity. Generated sections may rely on general framing rather than proven results."
    : "Some gaps exist in your evidence or bid alignment. Some sections may use hedged language where specific proof points are unavailable.";
}

// ── Component ────────────────────────────────────────────────────────────────

export function CapabilityWarningGate({
  alignment,
  onAcknowledge,
  onCancel,
}: CapabilityWarningGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [risksExpanded, setRisksExpanded] = useState(false);
  const level = alignment.level as "low" | "moderate";

  return (
    <div
      role="alert"
      className={`rounded-xl border-2 p-6 space-y-4 ${bannerClasses(level)}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <svg
          className={`h-6 w-6 shrink-0 mt-0.5 ${iconColor(level)}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {headingText(level)}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {descriptionText(level)}
          </p>
        </div>
      </div>

      {/* Reasons */}
      {alignment.reasons.length > 0 && (
        <ul className="space-y-1 pl-9">
          {alignment.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-muted-foreground/50 shrink-0">&bull;</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Section risks (collapsible) */}
      {alignment.sectionRisks.length > 0 && (
        <div className="pl-9">
          <button
            type="button"
            onClick={() => setRisksExpanded(!risksExpanded)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg
              className={`h-3 w-3 transition-transform ${risksExpanded ? "rotate-90" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {alignment.sectionRisks.length} section(s) most affected
          </button>
          {risksExpanded && (
            <ul className="mt-2 space-y-1">
              {alignment.sectionRisks.map((risk, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  &mdash; {risk}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Acknowledge checkbox + buttons */}
      <div className="border-t border-border pt-4 space-y-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 rounded border-border"
          />
          <span className="text-sm text-foreground">
            I understand sections with insufficient evidence will use general
            framing
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAcknowledge}
            disabled={!acknowledged}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed Anyway
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
