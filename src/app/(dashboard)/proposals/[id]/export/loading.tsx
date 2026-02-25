import { Download } from "lucide-react";

export default function ExportLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Download className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-44 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Export format cards grid */}
      <div className="grid grid-cols-5 gap-4">
        {["DOCX", "PDF", "HTML", "PPTX", "Slides"].map((label) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm p-6"
          >
            <div className="h-12 w-12 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
            <div className="h-4 w-14 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
