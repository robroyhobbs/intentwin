import { FileText } from "lucide-react";

export default function FoiaLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
              <FileText className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="h-7 w-36 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
              <div className="mt-2 h-4 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
          </div>
          {/* New Request button skeleton */}
          <div className="h-9 w-32 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] animate-pulse" />
        </div>
      </div>

      {/* Request card skeletons */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div className="mt-2 h-3 w-32 rounded bg-[var(--background-tertiary)] animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 rounded-full bg-[var(--background-tertiary)] animate-pulse" />
                <div className="h-3 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
