"use client";

import { Save, Loader2, Check } from "lucide-react";

interface ProfileTabProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export function ProfileTab({
  companyName,
  setCompanyName,
  description,
  setDescription,
  saving,
  saved,
  onSave,
}: ProfileTabProps) {
  return (
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
            This description will be used in the &quot;About Us&quot;
            sections of your proposals.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onSave}
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
  );
}
