"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  Library,
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  Loader2,
  CheckCircle2,
  Circle,
  Filter,
  FileText,
  BarChart3,
  MessageSquare,
  Award,
  ShieldCheck,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type EvidenceType =
  | "case_study"
  | "metric"
  | "testimonial"
  | "certification"
  | "award";

interface OutcomeDemonstrated {
  outcome: string;
  description: string;
}

interface EvidenceMetric {
  name: string;
  value: string;
  context: string;
}

interface Evidence {
  id: string;
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  full_content: string;
  client_industry: string | null;
  service_line: string | null;
  client_size: string | null;
  outcomes_demonstrated: OutcomeDemonstrated[];
  metrics: EvidenceMetric[];
  is_verified: boolean;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

interface EvidenceForm {
  evidence_type: EvidenceType;
  title: string;
  summary: string;
  full_content: string;
  client_industry: string;
  service_line: string;
  client_size: string;
  outcomes_text: string;
  metrics_text: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const EVIDENCE_TYPES: {
  value: EvidenceType;
  label: string;
  icon: typeof FileText;
}[] = [
  { value: "case_study", label: "Case Studies", icon: FileText },
  { value: "metric", label: "Metrics", icon: BarChart3 },
  { value: "testimonial", label: "Testimonials", icon: MessageSquare },
  { value: "certification", label: "Certifications", icon: ShieldCheck },
  { value: "award", label: "Awards", icon: Award },
];

const CLIENT_SIZES = [
  { value: "", label: "Any Size" },
  { value: "enterprise", label: "Enterprise" },
  { value: "mid_market", label: "Mid-Market" },
  { value: "smb", label: "SMB" },
];

const EMPTY_FORM: EvidenceForm = {
  evidence_type: "case_study",
  title: "",
  summary: "",
  full_content: "",
  client_industry: "",
  service_line: "",
  client_size: "",
  outcomes_text: "",
  metrics_text: "",
};

// ── Page Component ─────────────────────────────────────────────────────────

export default function EvidenceLibraryPage() {
  const authFetch = useAuthFetch();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
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
      outcomes_text: ev.outcomes_demonstrated
        .map((o) => `${o.outcome}: ${o.description}`)
        .join("\n"),
      metrics_text: ev.metrics
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
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
        <Filter className="h-4 w-4 text-[var(--foreground-muted)]" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)]"
        >
          <option value="">All Types</option>
          {EVIDENCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Industry..."
          value={filterIndustry}
          onChange={(e) => setFilterIndustry(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)] w-36"
        />
        <input
          type="text"
          placeholder="Service Line..."
          value={filterServiceLine}
          onChange={(e) => setFilterServiceLine(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)] w-36"
        />
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--foreground)]"
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--accent)] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {editingId ? "Edit Evidence" : "Add Evidence"}
            </h2>
            <button
              onClick={resetForm}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Type
              </label>
              <select
                value={form.evidence_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    evidence_type: e.target.value as EvidenceType,
                  })
                }
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label.replace(/s$/, "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Client Size
              </label>
              <select
                value={form.client_size}
                onChange={(e) =>
                  setForm({ ...form, client_size: e.target.value })
                }
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {CLIENT_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Healthcare Cloud Migration Success"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Summary *
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Brief summary of the evidence..."
              rows={2}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Full Content
            </label>
            <textarea
              value={form.full_content}
              onChange={(e) =>
                setForm({ ...form, full_content: e.target.value })
              }
              placeholder="Detailed content..."
              rows={4}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Client Industry
              </label>
              <input
                type="text"
                value={form.client_industry}
                onChange={(e) =>
                  setForm({ ...form, client_industry: e.target.value })
                }
                placeholder="e.g., Healthcare"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Service Line
              </label>
              <input
                type="text"
                value={form.service_line}
                onChange={(e) =>
                  setForm({ ...form, service_line: e.target.value })
                }
                placeholder="e.g., Cloud Migration"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Outcomes (one per line: outcome: description)
              </label>
              <textarea
                value={form.outcomes_text}
                onChange={(e) =>
                  setForm({ ...form, outcomes_text: e.target.value })
                }
                placeholder={
                  "cost_optimization: Reduced costs by 40%\nspeed_to_value: Delivered in 3 months"
                }
                rows={3}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Metrics (one per line: name: value (context))
              </label>
              <textarea
                value={form.metrics_text}
                onChange={(e) =>
                  setForm({ ...form, metrics_text: e.target.value })
                }
                placeholder={
                  "Cost Savings: 40% (Annual IT budget)\nMigration Time: 3 months (500K records)"
                }
                rows={3}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--foreground)] font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.summary.trim()}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--foreground-muted)]" />
        </div>
      )}

      {/* Evidence Groups */}
      {!loading &&
        EVIDENCE_TYPES.map(({ value: type, label, icon: Icon }) => {
          const items = grouped[type];
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
                    <div
                      key={ev.id}
                      className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">
                          {ev.title}
                        </h3>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleVerify(ev)}
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
                            onClick={() => startEdit(ev)}
                            className="p-1 rounded-lg hover:bg-[var(--card-border)] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
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
                      {ev.metrics.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[var(--card-border)]">
                          {ev.metrics.slice(0, 2).map((m, i) => (
                            <p
                              key={i}
                              className="text-[10px] text-[var(--foreground-subtle)]"
                            >
                              <span className="font-medium">{m.name}:</span>{" "}
                              {m.value}
                            </p>
                          ))}
                          {ev.metrics.length > 2 && (
                            <p className="text-[10px] text-[var(--foreground-subtle)]">
                              +{ev.metrics.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
