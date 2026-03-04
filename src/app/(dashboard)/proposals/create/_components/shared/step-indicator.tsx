"use client";

import type { ExtractionStep } from "../create-types";
import { WaitLoader } from "./wait-loader";
import { cn } from "@/lib/utils/cn";

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
  const activeLabel =
    EXTRACTION_STEPS[activeIdx]?.label ?? "Preparing extraction";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <WaitLoader
        label={activeLabel}
        detail="We are parsing your files and preparing a high-quality summary."
        className="mb-5"
      />
      <div className="flex flex-col gap-2">
        {EXTRACTION_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                isActive
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-background/40",
              )}
            >
              <div className="flex size-6 items-center justify-center shrink-0">
                {isDone ? (
                  <div className="flex size-5 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <CheckIcon />
                  </div>
                ) : isActive ? (
                  <div className="relative size-5">
                    <div className="absolute inset-0 rounded-full border border-primary/30" />
                    <div className="absolute inset-[6px] rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none" />
                  </div>
                ) : (
                  <div className="size-2 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
