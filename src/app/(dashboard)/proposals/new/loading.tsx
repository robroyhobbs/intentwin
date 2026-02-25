import { Sparkles } from "lucide-react";

export default function NewProposalLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-40 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Progress stepper skeleton */}
      <div className="mb-8 flex items-center justify-between rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-6 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-4 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
            {i < 3 && (
              <div className="ml-3 h-0.5 w-12 rounded bg-[var(--background-tertiary)] animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Form fields skeleton */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div
              className="h-10 rounded-lg bg-[var(--background-tertiary)] animate-pulse"
              style={{ width: i === 3 ? "60%" : "100%" }}
            />
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="mt-6 flex justify-end">
        <div className="h-10 w-32 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
      </div>
    </div>
  );
}
