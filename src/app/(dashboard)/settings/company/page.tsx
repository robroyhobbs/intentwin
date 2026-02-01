"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  Award,
  Target,
  AlertCircle,
} from "lucide-react";

interface CompanyContext {
  id?: string;
  category: string;
  key: string;
  title: string;
  content: string;
}

interface Organization {
  id: string;
  name: string;
  settings: {
    description?: string;
    differentiators?: string[];
    industries?: string[];
    services?: string[];
  };
}

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [contexts, setContexts] = useState<CompanyContext[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "differentiators" | "certifications">("profile");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [differentiators, setDifferentiators] = useState<string[]>([""]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState({ title: "", content: "" });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        // Load organization
        const { data: organization } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single();

        if (organization) {
          setOrg(organization);
          setCompanyName(organization.name || "");
          setDescription(organization.settings?.description || "");
          setDifferentiators(organization.settings?.differentiators?.length > 0
            ? organization.settings.differentiators
            : [""]);
          setIndustries(organization.settings?.industries || []);
          setServices(organization.settings?.services || []);
        }

        // Load company contexts
        const { data: contextData } = await supabase
          .from("company_context")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .order("category", { ascending: true });

        if (contextData) {
          setContexts(contextData);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!org) return;
    setSaving(true);
    setSaved(false);

    try {
      // Update organization
      const { error: orgError } = await supabase
        .from("organizations")
        .update({
          name: companyName,
          settings: {
            ...org.settings,
            description,
            differentiators: differentiators.filter(d => d.trim()),
            industries,
            services,
          },
        })
        .eq("id", org.id);

      if (orgError) throw orgError;

      // Upsert company_context entries for key profile info
      const profileContexts = [
        { category: "brand", key: "company_name", title: "Company Name", content: companyName },
        { category: "brand", key: "description", title: "Company Description", content: description },
      ];

      for (const ctx of profileContexts) {
        const existing = contexts.find(c => c.category === ctx.category && c.key === ctx.key);
        if (existing) {
          await supabase
            .from("company_context")
            .update({ title: ctx.title, content: ctx.content })
            .eq("id", existing.id);
        } else if (ctx.content) {
          await supabase
            .from("company_context")
            .insert({
              ...ctx,
              organization_id: org.id,
            });
        }
      }

      // Save differentiators as company context
      const diffContent = differentiators.filter(d => d.trim()).join("\n\n");
      if (diffContent) {
        const existingDiff = contexts.find(c => c.category === "brand" && c.key === "differentiators");
        if (existingDiff) {
          await supabase
            .from("company_context")
            .update({ content: diffContent })
            .eq("id", existingDiff.id);
        } else {
          await supabase
            .from("company_context")
            .insert({
              category: "brand",
              key: "differentiators",
              title: "Key Differentiators",
              content: diffContent,
              organization_id: org.id,
            });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadData();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCertification() {
    if (!org || !newCertification.title || !newCertification.content) return;
    setSaving(true);

    try {
      const key = newCertification.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
      await supabase
        .from("company_context")
        .insert({
          category: "certifications",
          key,
          title: newCertification.title,
          content: newCertification.content,
          organization_id: org.id,
        });

      setNewCertification({ title: "", content: "" });
      await loadData();
    } catch (error) {
      console.error("Error adding certification:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContext(id: string) {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      await supabase
        .from("company_context")
        .delete()
        .eq("id", id);
      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  }

  const addDifferentiator = () => setDifferentiators([...differentiators, ""]);
  const updateDifferentiator = (index: number, value: string) => {
    const updated = [...differentiators];
    updated[index] = value;
    setDifferentiators(updated);
  };
  const removeDifferentiator = (index: number) => {
    if (differentiators.length > 1) {
      setDifferentiators(differentiators.filter((_, i) => i !== index));
    }
  };

  const certifications = contexts.filter(c => c.category === "certifications");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Company Profile</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Configure your company information to personalize AI-generated proposals
        </p>
      </div>

      {/* Info Banner */}
      <div className="card p-4 mb-6 bg-[var(--accent-subtle)] border-[var(--accent)]">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[var(--foreground)]">
              <strong>Why this matters:</strong> The AI uses your company profile to write proposals
              that sound like you. Add your unique differentiators and certifications to make every
              proposal authentically represent your company.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {[
          { id: "profile", label: "Company Profile", icon: Building2 },
          { id: "differentiators", label: "Differentiators", icon: Target },
          { id: "certifications", label: "Certifications", icon: Award },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                placeholder="Describe what your company does, your mission, and what makes you unique..."
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                This description will be used in the &quot;About Us&quot; sections of your proposals.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Differentiators Tab */}
      {activeTab === "differentiators" && (
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Key Differentiators</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              What makes your company stand out? These will be highlighted in &quot;Why Us&quot; sections.
            </p>
          </div>

          <div className="space-y-3">
            {differentiators.map((diff, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={diff}
                  onChange={(e) => updateDifferentiator(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder={`Differentiator ${index + 1} (e.g., "20+ years of industry experience")`}
                />
                {differentiators.length > 1 && (
                  <button
                    onClick={() => removeDifferentiator(index)}
                    className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addDifferentiator}
            className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add another differentiator
          </button>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
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
                        <span className="font-medium text-[var(--foreground)]">{cert.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{cert.content}</p>
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
                  onChange={(e) => setNewCertification({ ...newCertification, title: e.target.value })}
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
                  onChange={(e) => setNewCertification({ ...newCertification, content: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                  placeholder="Brief description of the certification and what it means for your clients..."
                />
              </div>
              <button
                onClick={handleAddCertification}
                disabled={saving || !newCertification.title || !newCertification.content}
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
      )}
    </div>
  );
}
