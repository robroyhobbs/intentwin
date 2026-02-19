"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  Ruler,
  Send,
  Award,
  ArrowRight,
} from "lucide-react";
import {
  CATEGORY_COLORS,
  REQUIREMENT_TYPE_LABELS,
  type Requirement,
  type RequirementType,
} from "./types";

interface ChecklistViewProps {
  requirements: Requirement[];
  sections?: { id: string; title: string; section_type: string }[];
  filterType: RequirementType | "all";
  filterStatus: string;
  filterCategory: string;
  onStatusChange: (reqId: string, status: Requirement["compliance_status"]) => void;
  onNotesChange: (reqId: string, notes: string) => void;
  onDelete: (reqId: string) => void;
  onSectionChange: (reqId: string, sectionId: string | null) => void;
  onTypeChange: (reqId: string, type: RequirementType) => void;
}

const STATUS_OPTIONS: { value: Requirement["compliance_status"]; label: string; icon: typeof CheckCircle2; color: string }[] = [
  { value: "met", label: "Met", icon: CheckCircle2, color: "var(--success)" },
  { value: "partially_met", label: "Partial", icon: CircleDot, color: "var(--warning)" },
  { value: "not_addressed", label: "Not Addressed", icon: Circle, color: "var(--danger)" },
  { value: "not_applicable", label: "N/A", icon: MinusCircle, color: "var(--foreground-muted)" },
];

const TYPE_ICONS: Record<RequirementType, typeof FileText> = {
  content: FileText,
  format: Ruler,
  submission: Send,
  certification: Award,
};

export function ChecklistView({
  requirements,
  sections,
  filterType,
  filterStatus,
  filterCategory,
  onStatusChange,
  onNotesChange,
  onDelete,
  onSectionChange,
  onTypeChange,
}: ChecklistViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Apply filters
  let filtered = requirements;
  if (filterType !== "all") {
    filtered = filtered.filter(r => (r.requirement_type || "content") === filterType);
  }
  if (filterStatus !== "all") {
    filtered = filtered.filter(r => r.compliance_status === filterStatus);
  }
  if (filterCategory !== "all") {
    filtered = filtered.filter(r => r.category === filterCategory);
  }

  // Group by requirement type
  const grouped = groupByType(filtered);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--foreground-muted)]">
        <Circle className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">No requirements match current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ type, items }) => {
        const typeInfo = REQUIREMENT_TYPE_LABELS[type];
        const TypeIcon = TYPE_ICONS[type];
        const metCount = items.filter(
          r => r.compliance_status === "met" || r.compliance_status === "not_applicable"
        ).length;

        return (
          <div key={type} className="space-y-2">
            {/* Type group header */}
            <div className="flex items-center gap-2 px-1">
              <TypeIcon className="h-4 w-4" style={{ color: typeInfo.color }} />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {typeInfo.label} Requirements
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {metCount}/{items.length} complete
              </span>
              {/* Progress bar */}
              <div className="flex-1 h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden max-w-[120px]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${items.length > 0 ? (metCount / items.length) * 100 : 0}%`,
                    backgroundColor: typeInfo.color,
                  }}
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-1">
              {items.map(req => {
                const isExpanded = expandedId === req.id;
                const cat = CATEGORY_COLORS[req.category] || CATEGORY_COLORS.desirable;
                const currentStatus = STATUS_OPTIONS.find(s => s.value === req.compliance_status);
                const StatusIcon = currentStatus?.icon || Circle;
                const mappedSection = sections?.find(s => s.id === req.mapped_section_id);

                return (
                  <div
                    key={req.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
                  >
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-[var(--background-secondary)] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    >
                      {/* Status indicator (clickable cycle) */}
                      <button
                        className="mt-0.5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const idx = STATUS_OPTIONS.findIndex(s => s.value === req.compliance_status);
                          const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
                          onStatusChange(req.id, next.value);
                        }}
                        title={`Status: ${currentStatus?.label}. Click to cycle.`}
                      >
                        <StatusIcon
                          className="h-5 w-5 transition-colors"
                          style={{ color: currentStatus?.color }}
                        />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: cat.bg, color: cat.text }}
                          >
                            {cat.label}
                          </span>
                          {req.source_reference && (
                            <span className="text-[10px] text-[var(--foreground-subtle)] truncate">
                              {req.source_reference}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${
                            req.compliance_status === "met" || req.compliance_status === "not_applicable"
                              ? "text-[var(--foreground-muted)] line-through"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {req.requirement_text}
                        </p>
                        {mappedSection && (
                          <p className="text-[10px] text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" />
                            {mappedSection.title}
                          </p>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[var(--foreground-subtle)]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[var(--foreground-subtle)]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border)] p-3 space-y-3 bg-[var(--background-secondary)]">
                        {/* Status selector */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[var(--foreground-muted)] w-16">Status:</span>
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => onStatusChange(req.id, opt.value)}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                                req.compliance_status === opt.value
                                  ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                                  : "border-[var(--border)] hover:border-[var(--foreground-subtle)]"
                              }`}
                            >
                              <opt.icon className="h-3 w-3" style={{ color: opt.color }} />
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Type selector */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[var(--foreground-muted)] w-16">Type:</span>
                          <select
                            value={req.requirement_type || "content"}
                            onChange={(e) => onTypeChange(req.id, e.target.value as RequirementType)}
                            className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)]"
                          >
                            <option value="content">Content</option>
                            <option value="format">Format</option>
                            <option value="submission">Submission</option>
                            <option value="certification">Certification</option>
                          </select>
                        </div>

                        {/* Section mapping */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--foreground-muted)] w-16">Section:</span>
                          <select
                            value={req.mapped_section_id || ""}
                            onChange={(e) => onSectionChange(req.id, e.target.value || null)}
                            className="text-xs rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)] flex-1 max-w-xs"
                          >
                            <option value="">Not mapped</option>
                            {sections?.map(s => (
                              <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                          </select>
                        </div>

                        {/* Notes */}
                        <div>
                          <span className="text-xs text-[var(--foreground-muted)] block mb-1">Notes:</span>
                          <textarea
                            className="w-full text-xs rounded border border-[var(--border)] bg-[var(--background)] p-2 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] resize-none"
                            placeholder="Add notes..."
                            rows={2}
                            defaultValue={req.notes || ""}
                            onChange={(e) => onNotesChange(req.id, e.target.value)}
                          />
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(req.id)}
                          className="flex items-center gap-1 text-[10px] text-[var(--danger)] hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete requirement
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function groupByType(requirements: Requirement[]) {
  const typeOrder: RequirementType[] = ["content", "format", "submission", "certification"];
  const groups: { type: RequirementType; items: Requirement[] }[] = [];

  for (const type of typeOrder) {
    const items = requirements.filter(r => (r.requirement_type || "content") === type);
    if (items.length > 0) {
      groups.push({ type, items });
    }
  }

  return groups;
}
