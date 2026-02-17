"use client";

import { Trash2, Pencil, CheckCircle2, Circle } from "lucide-react";
import type { Evidence } from "./types";

interface EvidenceCardProps {
  evidence: Evidence;
  onEdit: (ev: Evidence) => void;
  onDelete: (id: string) => void;
  onToggleVerify: (ev: Evidence) => void;
  deleteConfirm: string | null;
}

export function EvidenceCard({
  evidence: ev,
  onEdit,
  onDelete,
  onToggleVerify,
  deleteConfirm: _deleteConfirm,
}: EvidenceCardProps) {
  return (
    <div
      className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 hover:border-[var(--accent)] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">
          {ev.title}
        </h3>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => onToggleVerify(ev)}
            title={
              ev.is_verified
                ? "Click to unverify"
                : "Click to verify"
            }
            className="p-1 rounded-lg hover:bg-[var(--card-border)] transition-colors"
          >
            {ev.is_verified ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-[var(--foreground-subtle)]" />
            )}
          </button>
          <button
            onClick={() => onEdit(ev)}
            className="p-1 rounded-lg hover:bg-[var(--card-border)] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
          </button>
          <button
            onClick={() => onDelete(ev.id)}
            className="p-1 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 mb-3">
        {ev.summary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {ev.client_industry && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
            {ev.client_industry}
          </span>
        )}
        {ev.service_line && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
            {ev.service_line}
          </span>
        )}
        {ev.client_size && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
            {ev.client_size}
          </span>
        )}
        {ev.is_verified && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
            Verified
          </span>
        )}
      </div>

      {/* Metrics preview */}
      {(ev.metrics || []).length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--card-border)]">
          {(ev.metrics || []).slice(0, 2).map((m, i) => (
            <p
              key={i}
              className="text-[10px] text-[var(--foreground-subtle)]"
            >
              <span className="font-medium">{m.name}:</span>{" "}
              {m.value}
            </p>
          ))}
          {(ev.metrics || []).length > 2 && (
            <p className="text-[10px] text-[var(--foreground-subtle)]">
              +{(ev.metrics || []).length - 2} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
