"use client";

import { ExternalLink, Info } from "lucide-react";
import Link from "next/link";

/**
 * Source attribution footer shown on all intelligence pages.
 * Links to the About This Data page for full methodology.
 */
export function SourceAttribution() {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-8">
      <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)]">
        <Info className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Data sourced from{" "}
          <a
            href="https://www.usaspending.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
          >
            USAspending.gov
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          {" "}and{" "}
          <a
            href="https://buy.gsa.gov/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
          >
            GSA CALC+
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </span>
      </div>
      <Link
        href="/intelligence/about"
        className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--accent)] transition-colors"
      >
        About this data
      </Link>
    </div>
  );
}
