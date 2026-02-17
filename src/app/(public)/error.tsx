"use client";

import Link from "next/link";

export default function PublicError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-6">
          We hit an unexpected error. Please try again or return to the home
          page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
