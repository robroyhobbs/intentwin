import { DollarSign } from "lucide-react";

export default function RatesLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <DollarSign className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-36 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-3">
          <div className="h-3 w-28 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
          <div className="h-3 w-24 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
          <div className="h-3 w-20 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
        </div>
        {/* Table rows */}
        <div className="divide-y divide-[var(--border)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-40 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-28 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-24 flex-1 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
