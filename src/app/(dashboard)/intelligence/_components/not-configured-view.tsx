"use client";

import { Database } from "lucide-react";

export function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)] mb-6">
        <Database className="h-8 w-8 text-[var(--accent)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
        Intelligence Service Not Connected
      </h2>
      <p className="text-sm text-[var(--foreground-muted)] max-w-md mb-6">
        The market intelligence service provides real federal procurement data
        including agency profiles, labor rate benchmarks, and award history.
      </p>
      <div className="card p-4 text-left max-w-sm">
        <p className="text-xs font-semibold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          To connect, add to .env.local:
        </p>
        <code className="text-xs text-[var(--accent)] block">
          INTELLIGENCE_API_URL=http://localhost:3100
          <br />
          INTELLIGENCE_SERVICE_KEY=your-key
        </code>
      </div>
    </div>
  );
}
