"use client";

// ── Citation Pill ───────────────────────────────────────────────────────────
// Small clickable pill showing a source document name.

interface CitationPillProps {
  label: string;
  onClick?: () => void;
}

export function CitationPill({ label, onClick }: CitationPillProps) {
  const baseClasses =
    "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground";
  const interactiveClasses = onClick
    ? "cursor-pointer hover:bg-muted/80 transition-colors"
    : "";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses}`}
      >
        {label}
      </button>
    );
  }

  return <span className={baseClasses}>{label}</span>;
}
