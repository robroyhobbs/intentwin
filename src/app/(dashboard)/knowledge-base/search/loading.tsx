import { Search } from "lucide-react";

export default function SearchLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Search className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-28 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="mb-6 h-12 w-full rounded-xl bg-[var(--background-tertiary)] animate-pulse" />

      {/* Result rows */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div>
                  <div className="h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
                  <div className="mt-1 h-3 w-80 rounded bg-[var(--background-tertiary)] animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
