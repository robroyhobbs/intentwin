"use client";

import type { LucideIcon } from "lucide-react";
import type { Evidence } from "./types";
import { EvidenceCard } from "./evidence-card";

interface EvidenceGroupProps {
  type: string;
  label: string;
  icon: LucideIcon;
  items: Evidence[];
  onEdit: (ev: Evidence) => void;
  onDelete: (id: string) => void;
  onToggleVerify: (ev: Evidence) => void;
  deleteConfirm: string | null;
}

export function EvidenceGroup({
  type,
  label,
  icon: Icon,
  items,
  onEdit,
  onDelete,
  onToggleVerify,
  deleteConfirm,
}: EvidenceGroupProps) {
  return (
    <div key={type} className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-[var(--foreground-muted)]" />
        <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
          {label}
        </h2>
        <span className="text-xs text-[var(--foreground-subtle)] bg-[var(--card-bg)] px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] p-6 text-center">
          <p className="text-sm text-[var(--foreground-subtle)]">
            No {label.toLowerCase()} yet. Click &quot;Add Evidence&quot;
            to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ev) => (
            <EvidenceCard
              key={ev.id}
              evidence={ev}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVerify={onToggleVerify}
              deleteConfirm={deleteConfirm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
