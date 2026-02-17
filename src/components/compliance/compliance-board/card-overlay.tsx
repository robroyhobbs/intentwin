"use client";

import { CATEGORY_COLORS, type Requirement } from "./types";

export function CardOverlay({ requirement }: { requirement: Requirement }) {
  const cat =
    CATEGORY_COLORS[requirement.category] || CATEGORY_COLORS.desirable;
  const truncated =
    requirement.requirement_text.length > 80
      ? requirement.requirement_text.slice(0, 80) + "..."
      : requirement.requirement_text;

  return (
    <div className="rounded-md border border-[var(--accent)] bg-[var(--card-bg)] p-2.5 shadow-lg w-[240px] opacity-90">
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-1"
        style={{ backgroundColor: cat.bg, color: cat.text }}
      >
        {cat.label}
      </span>
      <p className="text-xs text-[var(--foreground)]">{truncated}</p>
    </div>
  );
}
