"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Circle,
  MinusCircle,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ── Types ──────────────────────────────────────────────────────────────────

interface Requirement {
  id: string;
  requirement_text: string;
  source_reference: string | null;
  category: "mandatory" | "desirable" | "informational";
  compliance_status:
    | "met"
    | "partially_met"
    | "not_addressed"
    | "not_applicable";
  mapped_section_id: string | null;
  notes: string | null;
  is_extracted: boolean;
  created_at: string;
  updated_at: string;
}

interface ComplianceSummary {
  total: number;
  met: number;
  partially_met: number;
  not_addressed: number;
  not_applicable: number;
  mandatory_gaps: number;
}

interface ComplianceBoardProps {
  proposalId: string;
  sections?: { id: string; title: string; section_type: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: "met" as const,
    title: "Met",
    icon: CheckCircle2,
    color: "var(--success)",
  },
  {
    id: "partially_met" as const,
    title: "Partially Met",
    icon: CircleDot,
    color: "var(--warning)",
  },
  {
    id: "not_addressed" as const,
    title: "Not Addressed",
    icon: Circle,
    color: "var(--danger)",
  },
  {
    id: "not_applicable" as const,
    title: "N/A",
    icon: MinusCircle,
    color: "var(--foreground-muted)",
  },
] as const;

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  mandatory: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#ef4444",
    label: "MANDATORY",
  },
  desirable: {
    bg: "rgba(234, 179, 8, 0.1)",
    text: "#eab308",
    label: "DESIRABLE",
  },
  informational: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#3b82f6",
    label: "INFO",
  },
};

const CATEGORY_ORDER: Record<string, number> = {
  mandatory: 0,
  desirable: 1,
  informational: 2,
};

// ── Droppable Column ───────────────────────────────────────────────────────

function DroppableColumn({
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
}: {
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
}) {
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

// ── Draggable Card ─────────────────────────────────────────────────────────

function DraggableCard({
  requirement,
  isExpanded,
  onClick,
  sections,
  onNotesChange,
  onDelete,
}: {
  requirement: Requirement;
  isExpanded: boolean;
  onClick: () => void;
  sections?: { id: string; title: string; section_type: string }[];
  onNotesChange: (reqId: string, notes: string) => void;
  onDelete: (reqId: string) => void;
}) {
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

// ── Card Overlay (for drag preview) ────────────────────────────────────────

function CardOverlay({ requirement }: { requirement: Requirement }) {
  const cat =
    CATEGORY_COLORS[requirement.category] || CATEGORY_COLORS.desirable;
  const truncated =
    requirement.requirement_text.length > 80
      ? requirement.requirement_text.slice(0, 80) + "..."
      : requirement.requirement_text;

  return (
    <div className="rounded-md border border-[var(--accent)] bg-[var(--card-bg)] p-2.5 shadow-lg w-[240px] opacity-90">
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-1"
        style={{ backgroundColor: cat.bg, color: cat.text }}
      >
        {cat.label}
      </span>
      <p className="text-xs text-[var(--foreground)]">{truncated}</p>
    </div>
  );
}

// ── Main Board Component ───────────────────────────────────────────────────

export function ComplianceBoard({
  proposalId,
  sections,
}: ComplianceBoardProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addText, setAddText] = useState("");
  const [addCategory, setAddCategory] = useState<
    "mandatory" | "desirable" | "informational"
  >("desirable");
  const [activeReq, setActiveReq] = useState<Requirement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const notesTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const authFetch = useAuthFetch();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const fetchRequirements = useCallback(async () => {
    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequirements(data.requirements || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // ── Drag and Drop ──────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const req = event.active.data.current?.requirement as
      | Requirement
      | undefined;
    if (req) setActiveReq(req);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveReq(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as Requirement["compliance_status"];
    const reqId = active.id as string;
    const req = requirements.find((r) => r.id === reqId);
    if (!req || req.compliance_status === newStatus) return;

    // Optimistic update
    const prevRequirements = [...requirements];
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, compliance_status: newStatus } : r,
      ),
    );

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ id: reqId, compliance_status: newStatus }],
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      // Refresh to get accurate summary
      fetchRequirements();
    } catch {
      // Rollback
      setRequirements(prevRequirements);
      toast.error("Failed to update status. Reverted.");
    }
  }

  // ── Add Requirement ────────────────────────────────────────────────────

  async function handleAdd() {
    if (!addText.trim()) {
      toast.error("Requirement text is required");
      return;
    }

    try {
      const res = await authFetch(`/api/proposals/${proposalId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement_text: addText.trim(),
          category: addCategory,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setAddText("");
      setShowAddForm(false);
      toast.success("Requirement added");
      fetchRequirements();
    } catch {
      toast.error("Failed to add requirement");
    }
  }

  // ── Notes (debounced) ──────────────────────────────────────────────────

  function handleNotesChange(reqId: string, notes: string) {
    if (notesTimerRef.current[reqId]) {
      clearTimeout(notesTimerRef.current[reqId]);
    }
    notesTimerRef.current[reqId] = setTimeout(async () => {
      try {
        await authFetch(`/api/proposals/${proposalId}/requirements`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: [{ id: reqId, notes }] }),
        });
      } catch {
        toast.error("Failed to save notes");
      }
    }, 800);
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete(reqId: string) {
    if (deleteConfirm !== reqId) {
      setDeleteConfirm(reqId);
      return;
    }

    try {
      const res = await authFetch(
        `/api/proposals/${proposalId}/requirements?reqId=${reqId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Requirement deleted");
      setDeleteConfirm(null);
      setExpandedCard(null);
      fetchRequirements();
    } catch {
      toast.error("Failed to delete requirement");
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
            <button onClick={handleAdd} className="btn-primary text-xs py-1.5">
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
          onDragEnd={handleDragEnd}
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
