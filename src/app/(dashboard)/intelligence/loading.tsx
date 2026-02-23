import { Globe } from "lucide-react";

export default function IntelligenceLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Globe className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-36 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-60 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
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

      {/* Chart/table placeholders */}
      <div className="grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6"
          >
            <div className="h-5 w-36 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-4 h-56 w-full rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
