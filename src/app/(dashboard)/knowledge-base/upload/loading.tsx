import { Upload } from "lucide-react";

export default function UploadLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[var(--shadow-glow)]">
            <Upload className="h-6 w-6 text-black" />
          </div>
          <div>
            <div className="h-7 w-36 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Upload area skeleton */}
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card-bg)] p-12 flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-4 h-5 w-48 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-2 h-4 w-64 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-6 h-10 w-32 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
      </div>

      {/* Helper text */}
      <div className="mt-4 h-3 w-72 rounded bg-[var(--background-tertiary)] animate-pulse" />
    </div>
  );
}
