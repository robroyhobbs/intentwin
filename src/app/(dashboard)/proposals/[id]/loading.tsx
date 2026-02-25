import { FileText } from "lucide-react";

export default function ProposalDetailLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <FileText className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-48 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-72 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Two-column layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Section navigation sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--border-subtle)]"
            >
              <div className="h-4 w-4 rounded bg-[var(--background-tertiary)] animate-pulse" />
              <div
                className="h-4 rounded bg-[var(--background-tertiary)] animate-pulse"
                style={{ width: `${60 + (i % 3) * 20}%` }}
              />
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="flex-1 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm"
            >
              {/* Section title bar */}
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
                <div className="h-5 w-5 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div
                  className="h-5 rounded bg-[var(--background-tertiary)] animate-pulse"
                  style={{ width: `${120 + i * 30}px` }}
                />
              </div>
              {/* Section content lines */}
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-4 rounded bg-[var(--background-tertiary)] animate-pulse"
                    style={{ width: `${90 - j * 12}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
