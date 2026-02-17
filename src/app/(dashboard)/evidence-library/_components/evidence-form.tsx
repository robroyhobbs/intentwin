"use client";

import { X, Save, Loader2 } from "lucide-react";
import type { EvidenceType, EvidenceForm as EvidenceFormType } from "./types";
import { EVIDENCE_TYPES, CLIENT_SIZES } from "./types";

interface EvidenceFormProps {
  showForm: boolean;
  form: EvidenceFormType;
  setForm: (form: EvidenceFormType) => void;
  editingId: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function EvidenceFormPanel({
  showForm,
  form,
  setForm,
  editingId,
  saving,
  onSave,
  onCancel,
}: EvidenceFormProps) {
  if (!showForm) return null;

  return (
    <div className="mb-6 p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--accent)] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {editingId ? "Edit Evidence" : "Add Evidence"}
        </h2>
        <button
          onClick={onCancel}
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
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
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
  );
}
