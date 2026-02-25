import { Building2 } from "lucide-react";

export default function AgenciesLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Building2 className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-44 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="mb-6">
        <div className="h-10 w-full max-w-md rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] animate-pulse" />
      </div>

      {/* Agency cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5"
          >
            <div className="h-5 w-40 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-3 h-3 w-28 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-16 rounded-md bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-3 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
