import { Building2 } from "lucide-react";

export default function CompanySettingsLoading() {
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

      {/* Tab bar skeleton */}
      <div className="mb-6 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
        ))}
      </div>

      {/* Form fields skeleton */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6 space-y-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
        <div className="pt-2">
          <div className="h-10 w-24 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
