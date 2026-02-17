"use client";

import { Loader2, Plus, Trash2, Award } from "lucide-react";
import { CompanyContext } from "./types";

interface CertificationsTabProps {
  certifications: CompanyContext[];
  newCertification: { title: string; content: string };
  setNewCertification: (value: { title: string; content: string }) => void;
  handleAddCertification: () => void;
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
  handleDeleteContext,
  saving,
}: CertificationsTabProps) {
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
              <div
                key={cert.id}
                className="flex items-start justify-between p-4 rounded-lg bg-[var(--background-secondary)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[var(--accent)]" />
                    <span className="font-medium text-[var(--foreground)]">
                      {cert.title}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {cert.content}
                  </p>
                </div>
                <button
                  onClick={() => cert.id && handleDeleteContext(cert.id)}
                  className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Description
            </label>
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
