import { BookOpen } from "lucide-react";

export default function SourcesLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <BookOpen className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-28 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Info banner skeleton */}
      <div className="mb-6 h-14 w-full rounded-xl bg-[var(--background-tertiary)] animate-pulse" />

      {/* Source category cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6"
          >
            <div className="h-10 w-10 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-4 h-5 w-28 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-3 w-full rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-1 h-3 w-3/4 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-4 h-8 w-20 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
