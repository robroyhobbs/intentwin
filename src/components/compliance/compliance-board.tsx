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
import {
  Plus,
  X,
  AlertTriangle,
  Circle,
  Trash2,
  LayoutGrid,
  CheckSquare,
  Filter,
  Zap,
  Loader2,
} from "lucide-react";
import { DroppableColumn } from "./compliance-board/droppable-column";
import { CardOverlay } from "./compliance-board/card-overlay";
import { ChecklistView } from "./compliance-board/checklist-view";
import { useComplianceData } from "./compliance-board/use-compliance-data";
import { ComplianceAssessmentStatus as ComplianceAssessmentStatusConst } from "@/lib/constants/statuses";
import {
  COLUMNS,
  REQUIREMENT_TYPE_LABELS,
  VALID_REQUIREMENT_TYPES,
  type Requirement,
  type RequirementType,
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
    handleStatusChange,
    handleFieldUpdate,
    assessmentStatus,
    assessing,
    handleRunAssessment,
  } = useComplianceData(proposalId);

  const [viewMode, setViewMode] = useState<"checklist" | "kanban">("checklist");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [addCategory, setAddCategory] = useState<
    "mandatory" | "desirable" | "informational"
  >("mandatory");
  const [addType, setAddType] = useState<RequirementType>("content");
  const [activeReq, setActiveReq] = useState<Requirement | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<RequirementType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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
    const ok = await handleAdd(addText, addCategory, addType);
    if (ok) {
      setAddText("");
      setShowAddForm(false);
    }
  }

  // Filter active indicator
  const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || filterCategory !== "all";

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

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setViewMode("checklist")}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                viewMode === "checklist"
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              title="Checklist view"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Checklist
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors border-l border-[var(--border)] ${
                viewMode === "kanban"
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              title="Kanban view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-xs py-1.5 ${hasActiveFilters ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <Filter className="h-3.5 w-3.5" />
            {hasActiveFilters ? "Filtered" : "Filter"}
          </button>

          {/* Auto-assess button */}
          {requirements.length > 0 && (
            <button
              onClick={handleRunAssessment}
              disabled={assessing}
              className="btn-secondary text-xs py-1.5"
              title="AI auto-assesses which requirements are met by the proposal"
            >
              {assessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {assessing ? "Assessing..." : "Auto-Assess"}
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-secondary text-xs py-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Type breakdown badges */}
      {summary?.by_type && (
        <div className="flex gap-2 flex-wrap">
          {VALID_REQUIREMENT_TYPES.map(type => {
            const info = REQUIREMENT_TYPE_LABELS[type];
            const typeData = summary.by_type[type];
            if (!typeData || typeData.total === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filterType === type
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] hover:border-[var(--foreground-subtle)]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-[var(--foreground)]">{info.label}</span>
                <span className="text-[var(--foreground-muted)]">
                  {typeData.met}/{typeData.total}
                </span>
                {typeData.gaps > 0 && (
                  <span className="text-[var(--danger)] font-medium">
                    ({typeData.gaps} gaps)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Assessment status banner */}
      {assessmentStatus?.status === ComplianceAssessmentStatusConst.COMPLETED && assessmentStatus.results_applied !== undefined && assessmentStatus.results_applied > 0 && (
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] px-1">
          <Zap className="h-3 w-3 text-[var(--success)]" />
          <span>
            Last auto-assessment: {assessmentStatus.results_applied} requirements updated
            {assessmentStatus.skipped_manual ? ` (${assessmentStatus.skipped_manual} kept manual status)` : ""}
            {assessmentStatus.assessed_at && (
              <span className="text-[var(--foreground-subtle)]">
                {" "}&mdash; {new Date(assessmentStatus.assessed_at).toLocaleDateString()}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Filter bar */}
      {showFilters && (
        <div className="card p-3 flex items-center gap-3 flex-wrap animate-fade-in">
          <span className="text-xs text-[var(--foreground-muted)] font-medium">Filters:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RequirementType | "all")}
            className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--foreground)]"
          >
            <option value="all">All Types</option>
            <option value="content">Content</option>
            <option value="format">Format</option>
            <option value="submission">Submission</option>
            <option value="certification">Certification</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--foreground)]"
          >
            <option value="all">All Statuses</option>
            <option value="met">Met</option>
            <option value="partially_met">Partially Met</option>
            <option value="not_addressed">Not Addressed</option>
            <option value="not_applicable">N/A</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--foreground)]"
          >
            <option value="all">All Categories</option>
            <option value="mandatory">Mandatory</option>
            <option value="desirable">Desirable</option>
            <option value="informational">Informational</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterType("all");
                setFilterStatus("all");
                setFilterCategory("all");
              }}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

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
          <div className="flex items-center gap-3 flex-wrap">
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
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as RequirementType)}
              className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[var(--foreground)]"
            >
              <option value="content">Content</option>
              <option value="format">Format</option>
              <option value="submission">Submission</option>
              <option value="certification">Certification</option>
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

      {/* Checklist View */}
      {requirements.length > 0 && viewMode === "checklist" && (
        <ChecklistView
          requirements={requirements}
          sections={sections}
          filterType={filterType}
          filterStatus={filterStatus}
          filterCategory={filterCategory}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onDelete={handleDelete}
          onSectionChange={(reqId, sectionId) => handleFieldUpdate(reqId, "mapped_section_id", sectionId)}
          onTypeChange={(reqId, type) => handleFieldUpdate(reqId, "requirement_type", type)}
        />
      )}

      {/* Kanban Board */}
      {requirements.length > 0 && viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndEvent}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((col) => {
              // Apply filters to kanban too
              let colReqs = requirements.filter(
                (r) => r.compliance_status === col.id,
              );
              if (filterType !== "all") {
                colReqs = colReqs.filter(r => (r.requirement_type || "content") === filterType);
              }
              if (filterCategory !== "all") {
                colReqs = colReqs.filter(r => r.category === filterCategory);
              }

              return (
                <DroppableColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  icon={col.icon}
                  color={col.color}
                  requirements={colReqs}
                  onCardClick={(id) =>
                    setExpandedCard(expandedCard === id ? null : id)
                  }
                  expandedCard={expandedCard}
                  sections={sections}
                  onNotesChange={handleNotesChange}
                  onDelete={handleDelete}
                />
              );
            })}
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
