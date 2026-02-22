"use client";

import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PlaceholderItem {
  /** Unique identifier */
  id: string;
  /** The placeholder text found in the content */
  text: string;
  /** Which section this placeholder appears in */
  sectionId: string;
  /** Section title for display */
  sectionTitle: string;
  /** Whether this placeholder has been resolved */
  resolved: boolean;
}

interface PlaceholderActionProps {
  item: PlaceholderItem;
  onNavigate: (sectionId: string) => void;
}

export function PlaceholderAction({ item, onNavigate }: PlaceholderActionProps) {
  // Truncate long placeholder text for the sidebar
  const displayText =
    item.text.length > 80 ? item.text.slice(0, 80) + "..." : item.text;

  return (
    <button
      onClick={() => onNavigate(item.sectionId)}
      className={cn(
        "flex items-start gap-2 w-full text-left p-2 rounded-md",
        "hover:bg-[var(--background-secondary)] transition-colors",
        item.resolved && "opacity-50",
      )}
      title={item.text}
    >
      {item.resolved ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            item.resolved
              ? "text-[var(--foreground-muted)] line-through"
              : "text-[var(--foreground)]",
          )}
        >
          {displayText}
        </p>
        <p className="text-[10px] text-[var(--foreground-subtle)] mt-0.5 flex items-center gap-1">
          {item.sectionTitle}
          <ExternalLink className="h-2.5 w-2.5" />
        </p>
      </div>
    </button>
  );
}
