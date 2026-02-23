import { Palette } from "lucide-react";

export default function BrandingLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Palette className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-28 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Logo upload area skeleton */}
      <div className="mb-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
        <div className="h-5 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
        </div>
      </div>

      {/* Color picker rows */}
      <div className="mb-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6 space-y-4">
        <div className="h-5 w-28 rounded bg-[var(--background-tertiary)] animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Preview area skeleton */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
        <div className="h-5 w-20 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-4 h-40 w-full rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
      </div>
    </div>
  );
}
