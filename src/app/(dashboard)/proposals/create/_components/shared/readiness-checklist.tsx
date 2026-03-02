"use client";

import { CheckCircle, Circle } from "lucide-react";

export interface ReadinessItem {
  id: string;
  label: string;
  checked: boolean;
  hint?: string;
}

interface ReadinessChecklistProps {
  items: ReadinessItem[];
}

function ChecklistRow({ item }: { item: ReadinessItem }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {item.checked ? (
        <CheckCircle
          data-checked="true"
          size={16}
          className="text-[var(--accent)] shrink-0 mt-0.5 animate-fade-in"
        />
      ) : (
        <Circle
          data-checked="false"
          size={16}
          className="text-muted-foreground/40 shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`text-xs ${item.checked ? "text-foreground" : "text-muted-foreground"}`}
        >
          {item.label}
        </span>
        {!item.checked && item.hint && (
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {item.hint}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReadinessChecklist({ items }: ReadinessChecklistProps) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <ChecklistRow key={item.id} item={item} />
      ))}
    </div>
  );
}
