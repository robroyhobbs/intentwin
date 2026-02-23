export default function OnboardingLoading() {
  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
      <div className="max-w-lg mx-auto w-full rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-8 text-center">
        {/* Circle icon placeholder */}
        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--background-tertiary)] animate-pulse" />

        {/* Title and description */}
        <div className="mt-6 mx-auto h-7 w-48 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-3 mx-auto h-4 w-72 rounded bg-[var(--background-tertiary)] animate-pulse" />
        <div className="mt-1 mx-auto h-4 w-56 rounded bg-[var(--background-tertiary)] animate-pulse" />

        {/* Feature list items */}
        <div className="mt-8 space-y-4 text-left">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[var(--background-tertiary)] animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-36 rounded bg-[var(--background-tertiary)] animate-pulse" />
                <div className="h-3 w-52 rounded bg-[var(--background-tertiary)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div className="mt-8 mx-auto h-11 w-40 rounded-xl bg-[var(--background-tertiary)] animate-pulse" />
      </div>
    </div>
  );
}
