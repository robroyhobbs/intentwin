"use client";

import type { ExtractionStep } from "../create-types";
import { WaitLoader } from "./wait-loader";

const EXTRACTION_STEPS: { key: ExtractionStep; label: string }[] = [
  { key: "uploading", label: "Uploading documents" },
  { key: "processing", label: "Processing content" },
  { key: "extracting", label: "Extracting key details" },
];

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function StepIndicator({
  current,
}: {
  current: ExtractionStep | null;
}) {
  const activeIdx = EXTRACTION_STEPS.findIndex((s) => s.key === current);
  const activeLabel = EXTRACTION_STEPS[activeIdx]?.label ?? "Preparing extraction";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <WaitLoader
        label={activeLabel}
        detail="We are parsing your files and preparing a high-quality summary."
        className="mb-5"
      />
      <div className="flex flex-col gap-3">
        {EXTRACTION_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div key={step.key} className="flex items-center gap-3">
              {isDone ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  <CheckIcon />
                </div>
              ) : isActive ? (
                <div className="relative size-6 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary motion-safe:animate-spin motion-reduce:animate-none" />
                </div>
              ) : (
                <div className="size-6 rounded-full border-2 border-muted shrink-0" />
              )}
              <span
                className={
                  isActive
                    ? "text-sm font-medium"
                    : isDone
                      ? "text-sm text-muted-foreground"
                      : "text-sm text-muted-foreground"
                }
              >
                {step.label} {isActive ? "..." : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
