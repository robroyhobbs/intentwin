"use client";

import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { CATEGORY_COLORS, type Requirement } from "./types";

interface DraggableCardProps {
  requirement: Requirement;
  isExpanded: boolean;
  onClick: () => void;
  sections?: { id: string; title: string; section_type: string }[];
  onNotesChange: (reqId: string, notes: string) => void;
  onDelete: (reqId: string) => void;
}

export function DraggableCard({
  requirement,
  isExpanded,
  onClick,
  sections,
  onNotesChange,
  onDelete,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: requirement.id,
      data: { requirement },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const cat =
    CATEGORY_COLORS[requirement.category] || CATEGORY_COLORS.desirable;
  const mappedSection = sections?.find(
    (s) => s.id === requirement.mapped_section_id,
  );
  const truncated =
    requirement.requirement_text.length > 80
      ? requirement.requirement_text.slice(0, 80) + "..."
      : requirement.requirement_text;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm"
      {...listeners}
      {...attributes}
    >
      <div className="p-2.5" onClick={onClick}>
        <div className="flex items-start gap-2 mb-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: cat.bg, color: cat.text }}
          >
            {cat.label}
          </span>
          {requirement.source_reference && (
            <span className="text-[10px] text-[var(--foreground-subtle)] truncate">
              {requirement.source_reference}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--foreground)] leading-relaxed">
          {truncated}
        </p>
        {mappedSection && (
          <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
            &rarr; {mappedSection.title}
          </p>
        )}
        <div className="flex items-center mt-1.5">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-[var(--foreground-subtle)]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[var(--foreground-subtle)]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div
          className="border-t border-[var(--border)] p-2.5 space-y-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-[var(--foreground)] whitespace-pre-wrap">
            {requirement.requirement_text}
          </p>
          <textarea
            className="w-full text-xs rounded border border-[var(--border)] bg-[var(--background)] p-2 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] resize-none"
            placeholder="Add notes..."
            rows={2}
            defaultValue={requirement.notes || ""}
            onChange={(e) => onNotesChange(requirement.id, e.target.value)}
          />
          <button
            onClick={() => onDelete(requirement.id)}
            className="flex items-center gap-1 text-[10px] text-[var(--danger)] hover:underline"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
