import { Hash } from "lucide-react";

export default function NaicsCodeLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Hash className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-24 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Description paragraph skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-4 w-full rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-[var(--background-tertiary)] animate-pulse" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-5 py-6"
          >
            <div className="h-8 w-16 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-3 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
