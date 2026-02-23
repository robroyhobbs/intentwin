import { Settings } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Settings className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-28 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Plan card skeleton */}
      <div className="mb-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
        </div>
      </div>

      {/* Usage stats skeleton */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6 space-y-4">
        <div className="h-5 w-28 rounded bg-[var(--background-tertiary)] animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-32 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div className="h-4 w-16 rounded bg-[var(--background-tertiary)] animate-pulse" />
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
