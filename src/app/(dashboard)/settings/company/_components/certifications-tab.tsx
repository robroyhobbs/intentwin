"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Award, Sparkles, Pencil } from "lucide-react";
import { CompanyContext } from "./types";

interface CertificationsTabProps {
  certifications: CompanyContext[];
  newCertification: { title: string; content: string };
  setNewCertification: (value: { title: string; content: string }) => void;
  handleAddCertification: () => void;
  handleEditCertification: (id: string, title: string, content: string) => void;
  handleDeleteContext: (id: string) => void;
  deleteConfirm: { id: string; type: "context" | "product" } | null;
  setDeleteConfirm: (
    value: { id: string; type: "context" | "product" } | null,
  ) => void;
  saving: boolean;
}

export function CertificationsTab({
  certifications,
  newCertification,
  setNewCertification,
  handleAddCertification,
  handleEditCertification,
  handleDeleteContext,
  saving,
}: CertificationsTabProps) {
  const [suggesting, setSuggesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [editSuggesting, setEditSuggesting] = useState(false);

  function startEdit(cert: CompanyContext) {
    setEditingId(cert.id ?? null);
    setEditForm({ title: cert.title || "", content: cert.content || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ title: "", content: "" });
  }

  async function handleEditSuggestDescription() {
    if (!editForm.title || editForm.title.trim().length < 3) return;
    setEditSuggesting(true);
    try {
      const res = await fetch("/api/settings/certifications/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificationName: editForm.title }),
      });
      if (res.ok) {
        const { description } = await res.json();
        setEditForm((f) => ({ ...f, content: description }));
      }
    } catch {
      // non-fatal
    } finally {
      setEditSuggesting(false);
    }
  }

  async function handleSuggestDescription() {
    if (!newCertification.title || newCertification.title.trim().length < 3) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/settings/certifications/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificationName: newCertification.title }),
      });
      if (res.ok) {
        const { description } = await res.json();
        setNewCertification({ ...newCertification, content: description });
      }
    } catch {
      // non-fatal — user can type manually
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing Certifications */}
      {certifications.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
            Your Certifications & Partnerships
          </h3>
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="rounded-lg bg-[var(--background-secondary)]">
                {editingId === cert.id ? (
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--foreground-muted)]">Description</span>
                        <button
                          type="button"
                          onClick={handleEditSuggestDescription}
                          disabled={editSuggesting || editForm.title.trim().length < 3}
                          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 disabled:opacity-40"
                        >
                          {editSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {editSuggesting ? "Generating..." : "AI suggest"}
                        </button>
                      </div>
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { if (cert.id) { handleEditCertification(cert.id, editForm.title, editForm.content); cancelEdit(); } }}
                        disabled={saving || !editForm.title || !editForm.content}
                        className="btn-primary text-sm py-1.5"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary text-sm py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[var(--accent)]" />
                        <span className="font-medium text-[var(--foreground)]">{cert.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{cert.content}</p>
                    </div>
                    <div className="flex gap-1 ml-4 flex-shrink-0">
                      <button onClick={() => startEdit(cert)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => cert.id && handleDeleteContext(cert.id)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Certification */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
          Add Certification or Partnership
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Certification Name
            </label>
            <input
              type="text"
              value={newCertification.title}
              onChange={(e) =>
                setNewCertification({
                  ...newCertification,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder="e.g., AWS Premier Partner, ISO 27001 Certified"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Description
              </label>
              <button
                type="button"
                onClick={handleSuggestDescription}
                disabled={suggesting || newCertification.title.trim().length < 3}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {suggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {suggesting ? "Generating..." : "AI suggest"}
              </button>
            </div>
            <textarea
              value={newCertification.content}
              onChange={(e) =>
                setNewCertification({
                  ...newCertification,
                  content: e.target.value,
                })
              }
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
              placeholder="Brief description of the certification and what it means for your clients..."
            />
          </div>
          <button
            onClick={handleAddCertification}
            disabled={
              saving || !newCertification.title || !newCertification.content
            }
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Certification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
