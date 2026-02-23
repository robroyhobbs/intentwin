import { MessageSquare } from "lucide-react";

export default function BrandVoiceLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <MessageSquare className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-36 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-60 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3 card sections with text areas */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6"
          >
            <div className="h-5 w-32 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-3 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-4 h-28 w-full rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
