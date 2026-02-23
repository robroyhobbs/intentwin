import { Award } from "lucide-react";

export default function EvidenceLibraryLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Award className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-40 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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

      {/* Evidence item rows */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div>
                  <div className="h-4 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
                  <div className="mt-1 h-3 w-32 rounded bg-[var(--background-tertiary)] animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-md bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
