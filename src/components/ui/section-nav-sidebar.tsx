"use client";

import { cn } from "@/lib/utils/cn";
import { StatusDot } from "./section-status-badge";

interface SectionNavItem {
  id: string;
  title: string;
  generation_status: string;
  review_status: string;
}

interface SectionNavSidebarProps {
  sections: SectionNavItem[];
  activeSection: string | null;
  onSelect: (id: string) => void;
}

export function SectionNavSidebar({
  sections,
  activeSection,
  onSelect,
}: SectionNavSidebarProps) {
  const completedCount = sections.filter(
    (s) => s.generation_status === "completed"
  ).length;

  const progress = sections.length
    ? (completedCount / sections.length) * 100
    : 0;

  return (
    <div className="w-60 flex-shrink-0 bg-[var(--card-bg)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <p className="tiny-label">
          Sections
        </p>
        <div className="mt-3 flex items-center gap-3">
          {/* Circular progress */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.94} 100`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-[var(--foreground)]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {completedCount} of {sections.length}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">completed</p>
          </div>
        </div>
      </div>

      {/* Section List */}
      <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => onSelect(section.id)}
            className={cn(
              "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              activeSection === section.id
                ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
                : "text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
            )}
          >
            {/* Active indicator */}
            {activeSection === section.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--accent)]" />
            )}
            <StatusDot status={section.generation_status} />
            <span className="truncate">
              {idx + 1}. {section.title}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
