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
    <div className="w-60 flex-shrink-0 bg-gradient-to-b from-[#1B365D] to-[#0F2440] shadow-inner">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300/50">
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
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#12ABDB"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.94} 100`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/90">
              {completedCount} of {sections.length}
            </p>
            <p className="text-[10px] text-blue-300/50">completed</p>
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
              "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-200",
              activeSection === section.id
                ? "bg-white/10 text-white font-medium shadow-sm"
                : "text-blue-100/60 hover:bg-white/5 hover:text-blue-100/90"
            )}
          >
            {/* Active indicator */}
            {activeSection === section.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-[#12ABDB] shadow-[0_0_6px_rgba(18,171,219,0.5)]" />
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
