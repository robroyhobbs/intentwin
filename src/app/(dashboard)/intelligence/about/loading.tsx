import { Building2 } from "lucide-react";

export default function IntelligenceAboutLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Building2 className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-40 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content card with text lines */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm p-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-[var(--background-tertiary)] animate-pulse"
            style={{ width: `${95 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}
