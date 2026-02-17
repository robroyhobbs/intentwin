"use client";

import { Save, Loader2, Check, Plus, Trash2 } from "lucide-react";

interface DifferentiatorsTabProps {
  differentiators: string[];
  addDifferentiator: () => void;
  updateDifferentiator: (index: number, value: string) => void;
  removeDifferentiator: (index: number) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export function DifferentiatorsTab({
  differentiators,
  addDifferentiator,
  updateDifferentiator,
  removeDifferentiator,
  saving,
  saved,
  onSave,
}: DifferentiatorsTabProps) {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-[var(--foreground)]">
          Key Differentiators
        </h3>
        <p className="text-sm text-[var(--foreground-muted)]">
          What makes your company stand out? These will be highlighted in
          &quot;Why Us&quot; sections.
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
  );
}
