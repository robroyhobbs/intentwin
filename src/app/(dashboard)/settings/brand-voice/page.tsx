"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface BrandVoiceSettings {
  tone: string;
  terminology: {
    use: string[];
    avoid: string[];
  };
}

export default function BrandVoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [existingSettings, setExistingSettings] = useState<Record<string, unknown>>({});

  // Form state
  const [tone, setTone] = useState("");
  const [useTerms, setUseTerms] = useState<string[]>([""]);
  const [avoidTerms, setAvoidTerms] = useState<string[]>([""]);

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
        const { data: org } = await supabase
          .from("organizations")
          .select("id, settings")
          .eq("id", profile.organization_id)
          .single();

        if (org) {
          setOrgId(org.id);
          const settings = (org.settings || {}) as Record<string, unknown>;
          setExistingSettings(settings);

          const brandVoice = settings.brand_voice as BrandVoiceSettings | undefined;
          if (brandVoice) {
            setTone(brandVoice.tone || "");
            setUseTerms(
              brandVoice.terminology?.use?.length > 0
                ? brandVoice.terminology.use
                : [""]
            );
            setAvoidTerms(
              brandVoice.terminology?.avoid?.length > 0
                ? brandVoice.terminology.avoid
                : [""]
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading brand voice settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);

    try {
      const brandVoice: BrandVoiceSettings = {
        tone: tone.trim(),
        terminology: {
          use: useTerms.filter(t => t.trim()).map(t => t.trim()),
          avoid: avoidTerms.filter(t => t.trim()).map(t => t.trim()),
        },
      };

      const { error } = await supabase
        .from("organizations")
        .update({
          settings: {
            ...existingSettings,
            brand_voice: brandVoice,
          },
        })
        .eq("id", orgId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadData();
    } catch (error) {
      console.error("Error saving brand voice:", error);
      alert("Failed to save brand voice settings");
    } finally {
      setSaving(false);
    }
  }

  const addUseTerm = () => setUseTerms([...useTerms, ""]);
  const updateUseTerm = (index: number, value: string) => {
    const updated = [...useTerms];
    updated[index] = value;
    setUseTerms(updated);
  };
  const removeUseTerm = (index: number) => {
    if (useTerms.length > 1) {
      setUseTerms(useTerms.filter((_, i) => i !== index));
    }
  };

  const addAvoidTerm = () => setAvoidTerms([...avoidTerms, ""]);
  const updateAvoidTerm = (index: number, value: string) => {
    const updated = [...avoidTerms];
    updated[index] = value;
    setAvoidTerms(updated);
  };
  const removeAvoidTerm = (index: number) => {
    if (avoidTerms.length > 1) {
      setAvoidTerms(avoidTerms.filter((_, i) => i !== index));
    }
  };

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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Brand Voice</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Define how your proposals should sound — tone, preferred terminology, and words to avoid
        </p>
      </div>

      {/* Info Banner */}
      <div className="card p-4 mb-6 bg-[var(--accent-subtle)] border-[var(--accent)]">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[var(--foreground)]">
              <strong>Why this matters:</strong> Brand voice settings are injected into every AI-generated
              proposal section. The tone shapes how the AI writes, and terminology constraints are
              validated after each section is generated.
            </p>
          </div>
        </div>
      </div>

      {/* Tone Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-lg font-medium text-[var(--foreground)]">Tone & Voice</h3>
        </div>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">
          Describe how your proposals should sound. This is injected into the AI system prompt for every section.
        </p>
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
          placeholder="e.g., confident, collaborative, outcomes-focused. Write in active voice. Be specific but not jargon-heavy."
        />
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Tip: Include perspective (first person plural), formality level, and emotional register.
        </p>
      </div>

      {/* Preferred Terminology */}
      <div className="card p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-[var(--foreground)]">Preferred Terminology</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Terms and phrases the AI should use in your proposals.
          </p>
        </div>

        <div className="space-y-3">
          {useTerms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={term}
                onChange={(e) => updateUseTerm(index, e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder={`e.g., "${index === 0 ? "digital transformation" : index === 1 ? "accelerate outcomes" : "partnership"}"`}
              />
              {useTerms.length > 1 && (
                <button
                  onClick={() => removeUseTerm(index)}
                  className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addUseTerm}
          className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add another term
        </button>
      </div>

      {/* Avoided Terminology */}
      <div className="card p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-[var(--foreground)]">Terminology to Avoid</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Words and phrases the AI should never use. These are checked after each section is generated.
          </p>
        </div>

        <div className="space-y-3">
          {avoidTerms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={term}
                onChange={(e) => updateAvoidTerm(index, e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder={`e.g., "${index === 0 ? "synergy" : index === 1 ? "leverage" : "circle back"}"`}
              />
              {avoidTerms.length > 1 && (
                <button
                  onClick={() => removeAvoidTerm(index)}
                  className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addAvoidTerm}
          className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add another term
        </button>
      </div>

      {/* Save */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handleSave}
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
              Save Brand Voice
            </>
          )}
        </button>
      </div>
    </div>
  );
}
