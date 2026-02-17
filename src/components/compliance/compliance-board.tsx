"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, X, AlertTriangle, Circle, Trash2 } from "lucide-react";
import { DroppableColumn } from "./compliance-board/droppable-column";
import { CardOverlay } from "./compliance-board/card-overlay";
import { useComplianceData } from "./compliance-board/use-compliance-data";
import {
  COLUMNS,
  type Requirement,
  type ComplianceBoardProps,
} from "./compliance-board/types";

// ── Main Board Component ───────────────────────────────────────────────────

export function ComplianceBoard({
  proposalId,
  sections,
}: ComplianceBoardProps) {
  const {
    requirements,
    summary,
    loading,
    expandedCard,
    setExpandedCard,
    deleteConfirm,
    setDeleteConfirm,
    handleDragEnd: onDragEnd,
    handleAdd,
    handleNotesChange,
    handleDelete,
  } = useComplianceData(proposalId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [addCategory, setAddCategory] = useState<
    "mandatory" | "desirable" | "informational"
  >("desirable");
  const [activeReq, setActiveReq] = useState<Requirement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const req = event.active.data.current?.requirement as
      | Requirement
      | undefined;
    if (req) setActiveReq(req);
  }

  async function handleDragEndEvent(event: DragEndEvent) {
    setActiveReq(null);
    const { active, over } = event;
    if (!over) return;
    await onDragEnd(
      active.id as string,
      over.id as Requirement["compliance_status"],
    );
  }

  async function submitAdd() {
    const ok = await handleAdd(addText, addCategory);
    if (ok) {
      setAddText("");
      setShowAddForm(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--foreground-muted)]">
        <div className="animate-pulse text-sm">Loading compliance data...</div>
      </div>
    );
  }

  const score = summary
    ? summary.total > 0
      ? Math.round(
          ((summary.met + summary.not_applicable) / summary.total) * 100,
        )
      : 0
    : 0;

  return (
    <div className="p-6 space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--foreground)]">
              {summary ? `${summary.met}/${summary.total}` : "0/0"}
            </span>
            <span className="text-sm text-[var(--foreground-muted)]">Met</span>
            <span className="text-lg font-semibold text-[var(--foreground-muted)]">
              &mdash; {score}%
            </span>
          </div>
          {summary && summary.mandatory_gaps > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--danger)]">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {summary.mandatory_gaps} mandatory gaps
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary text-xs py-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Requirement
        </button>
      </div>

      {/* Add Requirement Form */}
      {showAddForm && (
        <div className="card p-4 space-y-3 animate-fade-in">
          <textarea
            className="w-full text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] resize-none"
            placeholder="Enter requirement text..."
            rows={2}
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-3">
            <select
              value={addCategory}
              onChange={(e) =>
                setAddCategory(e.target.value as typeof addCategory)
              }
              className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--foreground)]"
            >
              <option value="mandatory">Mandatory</option>
              <option value="desirable">Desirable</option>
              <option value="informational">Informational</option>
            </select>
            <button onClick={submitAdd} className="btn-primary text-xs py-1.5">
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddText("");
              }}
              className="btn-secondary text-xs py-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {requirements.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-muted)]">
          <Circle className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No requirements found</p>
          <p className="text-xs mt-1">
            Add requirements manually or extract from uploaded documents
          </p>
        </div>
      )}

      {/* Kanban Board */}
      {requirements.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndEvent}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.id}
                id={col.id}
                title={col.title}
                icon={col.icon}
                color={col.color}
                requirements={requirements.filter(
                  (r) => r.compliance_status === col.id,
                )}
                onCardClick={(id) =>
                  setExpandedCard(expandedCard === id ? null : id)
                }
                expandedCard={expandedCard}
                sections={sections}
                onNotesChange={handleNotesChange}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <DragOverlay>
            {activeReq ? <CardOverlay requirement={activeReq} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card p-6 max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-[var(--foreground)]">
              Are you sure you want to delete this requirement?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--danger)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
