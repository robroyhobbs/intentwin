"use client";

import { useDroppable } from "@dnd-kit/core";
import type { CheckCircle2 } from "lucide-react";
import { DraggableCard } from "./draggable-card";
import { CATEGORY_ORDER, type Requirement } from "./types";

interface DroppableColumnProps {
  id: string;
  title: string;
  icon: typeof CheckCircle2;
  color: string;
  requirements: Requirement[];
  onCardClick: (id: string) => void;
  expandedCard: string | null;
  sections?: { id: string; title: string; section_type: string }[];
  onNotesChange: (reqId: string, notes: string) => void;
  onDelete: (reqId: string) => void;
}

export function DroppableColumn({
  id,
  title,
  icon: Icon,
  color,
  requirements,
  onCardClick,
  expandedCard,
  sections,
  onNotesChange,
  onDelete,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const sorted = [...requirements].sort(
    (a, b) =>
      (CATEGORY_ORDER[a.category] ?? 2) - (CATEGORY_ORDER[b.category] ?? 2),
  );

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[220px] rounded-lg border transition-colors"
      style={{
        borderColor: isOver ? color : "var(--border)",
        backgroundColor: isOver ? `${color}18` : "var(--background-secondary)",
        boxShadow: isOver ? `inset 0 0 0 1px ${color}40` : "none",
      }}
    >
      <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {title}
        </span>
        <span
          className="ml-auto text-xs font-medium rounded-full px-2 py-0.5"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {requirements.length}
        </span>
      </div>

      <div className="p-2 space-y-2 min-h-[100px] max-h-[600px] overflow-y-auto">
        {sorted.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--foreground-subtle)]">
            Drop cards here
          </div>
        )}
        {sorted.map((req) => (
          <DraggableCard
            key={req.id}
            requirement={req}
            isExpanded={expandedCard === req.id}
            onClick={() => onCardClick(req.id)}
            sections={sections}
            onNotesChange={onNotesChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
