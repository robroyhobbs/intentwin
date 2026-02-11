import { Zap } from "lucide-react";

export default function ProposalsLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="h-7 w-32 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
              <div className="mt-2 h-4 w-64 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-36 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-4"
            >
              <div className="h-11 w-11 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
              <div>
                <div className="h-7 w-12 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div className="mt-1 h-3 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6 h-10 w-72 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />

      {/* Card grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm"
          >
            <div className="h-0.5 rounded-t-xl bg-[var(--background-tertiary)]" />
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 w-3/4 rounded bg-[var(--background-tertiary)] animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-[var(--background-tertiary)] animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-md bg-[var(--background-tertiary)] animate-pulse" />
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <div className="h-3 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
