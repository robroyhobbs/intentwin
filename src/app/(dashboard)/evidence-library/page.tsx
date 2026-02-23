"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  Library,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

import type {
  EvidenceType,
  OutcomeDemonstrated,
  EvidenceMetric,
  Evidence,
  EvidenceForm,
} from "./_components/types";
import { EVIDENCE_TYPES, EMPTY_FORM } from "./_components/types";
import { EvidenceFilterBar } from "./_components/evidence-filter-bar";
import { EvidenceFormPanel } from "./_components/evidence-form";
import { EvidenceGroup } from "./_components/evidence-group";

// ── Page Component ─────────────────────────────────────────────────────────

export default function EvidenceLibraryPage() {
  const authFetch = useAuthFetch();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterServiceLine, setFilterServiceLine] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EvidenceForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────

  const loadEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterIndustry) params.set("industry", filterIndustry);
      if (filterServiceLine) params.set("service_line", filterServiceLine);
      if (filterVerified) params.set("verified", filterVerified);

      const qs = params.toString();
      const url = `/api/evidence${qs ? `?${qs}` : ""}`;
      const res = await authFetch(url);
      const json = await res.json();
      setEvidence(json.evidence || []);
    } catch {
      setEvidence([]);
      setLoadError("Failed to load evidence items. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    authFetch,
    filterType,
    filterIndustry,
    filterServiceLine,
    filterVerified,
  ]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  // ── Form helpers ───────────────────────────────────────────────────────

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(ev: Evidence) {
    setForm({
      evidence_type: ev.evidence_type,
      title: ev.title,
      summary: ev.summary,
      full_content: ev.full_content,
      client_industry: ev.client_industry || "",
      service_line: ev.service_line || "",
      client_size: ev.client_size || "",
      outcomes_text: (ev.outcomes_demonstrated || [])
        .map((o) => `${o.outcome}: ${o.description}`)
        .join("\n"),
      metrics_text: (ev.metrics || [])
        .map((m) => `${m.name}: ${m.value} (${m.context})`)
        .join("\n"),
    });
    setEditingId(ev.id);
    setShowForm(true);
  }

  function parseOutcomes(text: string): OutcomeDemonstrated[] {
    if (!text.trim()) return [];
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => {
        const [outcome, ...rest] = line.split(":");
        return {
          outcome: outcome.trim(),
          description: rest.join(":").trim(),
        };
      });
  }

  function parseMetrics(text: string): EvidenceMetric[] {
    if (!text.trim()) return [];
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => {
        const match = line.match(/^(.+?):\s*(.+?)\s*(?:\((.+)\))?$/);
        if (match) {
          return {
            name: match[1].trim(),
            value: match[2].trim(),
            context: match[3]?.trim() || "",
          };
        }
        return { name: line.trim(), value: "", context: "" };
      });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.summary.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        evidence_type: form.evidence_type,
        title: form.title,
        summary: form.summary,
        full_content: form.full_content,
        client_industry: form.client_industry || null,
        service_line: form.service_line || null,
        client_size: form.client_size || null,
        outcomes_demonstrated: parseOutcomes(form.outcomes_text),
        metrics: parseMetrics(form.metrics_text),
      };

      const method = editingId ? "PATCH" : "POST";
      await authFetch("/api/evidence", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      resetForm();
      await loadEvidence();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    setDeleteConfirm(null);
    try {
      await authFetch(`/api/evidence?id=${id}`, { method: "DELETE" });
      toast.success("Evidence entry deleted");
      await loadEvidence();
    } catch {
      toast.error("Failed to delete evidence entry");
    }
  }

  async function handleToggleVerify(ev: Evidence) {
    await authFetch("/api/evidence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ev.id,
        is_verified: !ev.is_verified,
      }),
    });
    await loadEvidence();
  }

  // ── Group evidence by type ─────────────────────────────────────────────

  function groupByType() {
    const groups: Record<EvidenceType, Evidence[]> = {
      case_study: [],
      metric: [],
      testimonial: [],
      certification: [],
      award: [],
    };
    for (const ev of evidence) {
      if (groups[ev.evidence_type]) {
        groups[ev.evidence_type].push(ev);
      }
    }
    return groups;
  }

  const grouped = groupByType();

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <Library className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Evidence Library
            </h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Manage case studies, metrics, testimonials, certifications, and
              awards
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Evidence
        </button>
      </div>

      {/* Filter Bar */}
      <EvidenceFilterBar
        filterType={filterType}
        setFilterType={setFilterType}
        filterIndustry={filterIndustry}
        setFilterIndustry={setFilterIndustry}
        filterServiceLine={filterServiceLine}
        setFilterServiceLine={setFilterServiceLine}
        filterVerified={filterVerified}
        setFilterVerified={setFilterVerified}
      />

      {/* Add/Edit Form */}
      <EvidenceFormPanel
        showForm={showForm}
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        onSave={handleSave}
        onCancel={resetForm}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--foreground-muted)]" />
        </div>
      )}

      {/* Error State */}
      {!loading && loadError && (
        <div className="card p-8 text-center">
          <p className="text-[var(--foreground-muted)]">{loadError}</p>
          <button
            onClick={() => { setLoadError(null); setLoading(true); loadEvidence(); }}
            className="mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Evidence Groups */}
      {!loading && !loadError &&
        EVIDENCE_TYPES.map(({ value: type, label, icon }) => {
          const items = grouped[type];
          return (
            <EvidenceGroup
              key={type}
              type={type}
              label={label}
              icon={icon}
              items={items}
              onEdit={startEdit}
              onDelete={handleDelete}
              onToggleVerify={handleToggleVerify}
              deleteConfirm={deleteConfirm}
            />
          );
        })}

      {/* Global empty state */}
      {!loading && evidence.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Library className="h-12 w-12 mx-auto mb-4 text-[var(--foreground-subtle)]" />
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No evidence yet
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">
            Add case studies, metrics, testimonials, certifications, and awards
            to strengthen your proposals.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Your First Evidence
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              Delete this evidence entry? This cannot be undone.
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
