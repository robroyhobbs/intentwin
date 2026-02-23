"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Upload,
  Shield,
  CheckCircle2,
  Briefcase,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  TeamMember,
  TeamMemberFormData,
  TeamMemberProjectHistory,
  CLEARANCE_OPTIONS,
} from "./types";

const EMPTY_FORM: TeamMemberFormData = {
  name: "",
  role: "",
  title: "",
  email: "",
  skills: [],
  certifications: [],
  clearance_level: "",
  years_experience: null,
  bio: "",
  project_history: [],
};

export function TeamMembersTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<TeamMemberFormData>(EMPTY_FORM);
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFetch = useAuthFetch();

  const loadMembers = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings/team-members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.teamMembers || []);
      }
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowAddForm(false);
    setEditingId(null);
    setSkillInput("");
    setCertInput("");
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setShowAddForm(false);
    setForm({
      name: member.name,
      role: member.role,
      title: member.title || "",
      email: member.email || "",
      skills: member.skills || [],
      certifications: member.certifications || [],
      clearance_level: member.clearance_level || "",
      years_experience: member.years_experience,
      bio: member.bio || "",
      project_history: member.project_history || [],
    });
    setSkillInput("");
    setCertInput("");
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm({ ...form, skills: [...form.skills, trimmed] });
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  }

  function addCert() {
    const trimmed = certInput.trim();
    if (trimmed && !form.certifications.includes(trimmed)) {
      setForm({ ...form, certifications: [...form.certifications, trimmed] });
      setCertInput("");
    }
  }

  function removeCert(cert: string) {
    setForm({
      ...form,
      certifications: form.certifications.filter((c) => c !== cert),
    });
  }

  function addProjectHistory() {
    setForm({
      ...form,
      project_history: [
        ...form.project_history,
        { title: "", client_industry: "", scope: "", results: "", dates: "" },
      ],
    });
  }

  function updateProjectHistory(
    index: number,
    field: keyof TeamMemberProjectHistory,
    value: string,
  ) {
    const updated = [...form.project_history];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, project_history: updated });
  }

  function removeProjectHistory(index: number) {
    setForm({
      ...form,
      project_history: form.project_history.filter((_, i) => i !== index),
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        years_experience: form.years_experience || null,
        clearance_level: form.clearance_level || null,
        project_history: form.project_history.filter((p) => p.title.trim()),
      };

      if (editingId) {
        const res = await authFetch("/api/settings/team-members", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to update team member");
          return;
        }
        toast.success("Team member updated");
      } else {
        const res = await authFetch("/api/settings/team-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to create team member");
          return;
        }
        toast.success("Team member added");
      }

      resetForm();
      await loadMembers();
    } catch {
      toast.error("Failed to save team member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    setDeleteConfirmId(null);

    try {
      const res = await authFetch(`/api/settings/team-members?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Team member removed");
        await loadMembers();
      } else {
        toast.error("Failed to delete team member");
      }
    } catch {
      toast.error("Failed to delete team member");
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".pdf", ".docx", ".txt"].includes(ext)) {
      toast.error("Accepted formats: PDF, DOCX, TXT");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setResumeUploading(true);
    try {
      // Step 1: Upload to knowledge base
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await authFetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload resume file");
      }

      const { document } = await uploadRes.json();

      // Step 2: Extract team member from resume
      const extractRes = await authFetch("/api/settings/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_document_id: document.id,
          extract_from_resume: true,
        }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error || "Failed to extract team member from resume");
      }

      toast.success("Resume processed — team member created");
      await loadMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Resume upload failed",
      );
    } finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const isFormOpen = showAddForm || editingId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-[var(--foreground)]">
            Team Members
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Key personnel for proposals. Real names, roles, and credentials
            replace generic placeholders.
          </p>
        </div>
        {!isFormOpen && (
          <div className="flex gap-2">
            {/* Resume upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleResumeUpload}
              className="hidden"
              disabled={resumeUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={resumeUploading}
              className="btn-secondary text-sm"
            >
              {resumeUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {resumeUploading ? "Processing..." : "Upload Resume"}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-[var(--foreground)]">
              {editingId ? "Edit Team Member" : "New Team Member"}
            </h4>
            <button
              onClick={resetForm}
              className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Row 1: Name, Role, Title */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Role *
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., Program Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., Senior Vice President"
                />
              </div>
            </div>

            {/* Row 2: Email, Years Experience, Clearance */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.years_experience ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      years_experience: e.target.value
                        ? parseInt(e.target.value, 10)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Security Clearance
                </label>
                <select
                  value={form.clearance_level}
                  onChange={(e) =>
                    setForm({ ...form, clearance_level: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  {CLEARANCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                placeholder="Brief professional bio for proposal use (third-person preferred)..."
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Used in &quot;Proposed Team&quot; sections. Keep it concise and
                proposal-ready.
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
                  placeholder="Type a skill and press Enter"
                />
                <button
                  onClick={addSkill}
                  disabled={!skillInput.trim()}
                  className="btn-secondary text-sm"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-[var(--error)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Certifications
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCert();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
                  placeholder="e.g., PMP, CISSP, AWS Solutions Architect"
                />
                <button
                  onClick={addCert}
                  disabled={!certInput.trim()}
                  className="btn-secondary text-sm"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      <Award className="h-3 w-3" />
                      {cert}
                      <button
                        onClick={() => removeCert(cert)}
                        className="hover:text-[var(--error)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Project History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Past Performance ({form.project_history.length})
                </label>
                <button
                  onClick={addProjectHistory}
                  className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Project
                </button>
              </div>

              <div className="space-y-3">
                {form.project_history.map((proj, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]"
                  >
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) =>
                          updateProjectHistory(i, "title", e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="Project title"
                      />
                      <input
                        type="text"
                        value={proj.client_industry || ""}
                        onChange={(e) =>
                          updateProjectHistory(
                            i,
                            "client_industry",
                            e.target.value,
                          )
                        }
                        className="w-40 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="Industry"
                      />
                      <input
                        type="text"
                        value={proj.dates || ""}
                        onChange={(e) =>
                          updateProjectHistory(i, "dates", e.target.value)
                        }
                        className="w-32 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="2020-2023"
                      />
                      <button
                        onClick={() => removeProjectHistory(i)}
                        className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea
                        value={proj.scope || ""}
                        onChange={(e) =>
                          updateProjectHistory(i, "scope", e.target.value)
                        }
                        rows={2}
                        className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="Scope of work..."
                      />
                      <textarea
                        value={proj.results || ""}
                        onChange={(e) =>
                          updateProjectHistory(i, "results", e.target.value)
                        }
                        rows={2}
                        className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="Results / outcomes..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.role.trim()}
                className="btn-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingId ? "Update Member" : "Save Member"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && !isFormOpen && (
        <div className="card p-8 text-center">
          <Users className="h-12 w-12 text-[var(--foreground-subtle)] mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">
            No team members added yet.
          </p>
          <p className="text-sm text-[var(--foreground-subtle)] mt-1">
            Add your key personnel so proposals use real names and credentials
            instead of placeholders.
          </p>
          <p className="text-xs text-[var(--foreground-subtle)] mt-3">
            Tip: Upload a resume (PDF/DOCX) to auto-extract credentials.
          </p>
        </div>
      )}

      {/* Member List */}
      {members.map((member) => (
        <div key={member.id} className="card">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-[var(--foreground)]">
                    {member.name}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                    {member.role}
                  </span>
                  {member.clearance_level && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Shield className="h-3 w-3" />
                      {member.clearance_level}
                    </span>
                  )}
                  {member.is_verified && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {member.title && (
                  <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                    {member.title}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--foreground-muted)]">
                  {member.years_experience && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {member.years_experience} years
                    </span>
                  )}
                  {member.certifications?.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {member.certifications.length} cert
                      {member.certifications.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {member.skills?.length > 0 && (
                    <span>
                      {member.skills.length} skill
                      {member.skills.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {(member.project_history as TeamMemberProjectHistory[] | undefined)?.length ? (
                    <span>
                      {(member.project_history as TeamMemberProjectHistory[]).length} project
                      {(member.project_history as TeamMemberProjectHistory[]).length !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => startEdit(member)}
                  className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className={cn(
                    "p-1.5 text-[var(--foreground-muted)] hover:text-[var(--error)]",
                    deleteConfirmId === member.id &&
                      "text-[var(--error)] animate-pulse",
                  )}
                  title={
                    deleteConfirmId === member.id
                      ? "Click again to confirm"
                      : "Delete"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expand/collapse details */}
            <button
              onClick={() =>
                setExpandedId(expandedId === member.id ? null : member.id)
              }
              className="flex items-center gap-1 mt-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              {expandedId === member.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Details
            </button>
          </div>

          {/* Expanded details */}
          {expandedId === member.id && (
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
              {/* Bio */}
              {member.bio && (
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Bio
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {member.bio}
                  </p>
                </div>
              )}

              {/* Certifications */}
              {member.certifications?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.certifications.map((cert: string) => (
                      <span
                        key={cert}
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {member.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Project History */}
              {(member.project_history as TeamMemberProjectHistory[] | undefined)?.length ? (
                <div>
                  <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Past Performance
                  </p>
                  <div className="space-y-2">
                    {(member.project_history as TeamMemberProjectHistory[]).map(
                      (proj, i) => (
                        <div
                          key={i}
                          className="p-2 rounded bg-[var(--background-secondary)]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {proj.title}
                            </p>
                            {proj.dates && (
                              <span className="text-xs text-[var(--foreground-muted)]">
                                {proj.dates}
                              </span>
                            )}
                          </div>
                          {proj.client_industry && (
                            <p className="text-xs text-[var(--foreground-muted)]">
                              {proj.client_industry}
                            </p>
                          )}
                          {proj.scope && (
                            <p className="text-xs text-[var(--foreground)] mt-1">
                              {proj.scope}
                            </p>
                          )}
                          {proj.results && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              {proj.results}
                            </p>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {/* Email */}
              {member.email && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  {member.email}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
