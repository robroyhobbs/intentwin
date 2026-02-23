"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function IntelligenceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Intelligence error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 mb-6">
          <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Failed to load market intelligence
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-6">
          The intelligence service may be temporarily unavailable. Please try
          again in a moment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
