"use client";

import { useState } from "react";
import {
  Trophy,
  XCircle,
  Clock,
  MinusCircle,
  DollarSign,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DealOutcome } from "@/lib/constants/statuses";

interface DealOutcomeSetterProps {
  proposalId: string;
  currentOutcome?: string;
  currentValue?: number;
  onUpdate?: (outcome: string) => void;
}

const OUTCOMES = [
  { value: DealOutcome.PENDING, label: "Pending", icon: Clock, color: "warning" },
  { value: DealOutcome.WON, label: "Won", icon: Trophy, color: "success" },
  { value: DealOutcome.LOST, label: "Lost", icon: XCircle, color: "danger" },
  { value: DealOutcome.NO_DECISION, label: "No Decision", icon: MinusCircle, color: "info" },
];

const LOSS_REASONS = [
  { value: "price", label: "Price" },
  { value: "capability", label: "Capability Gap" },
  { value: "relationship", label: "Relationship" },
  { value: "timing", label: "Timing" },
  { value: "competition", label: "Competition" },
  { value: "requirements", label: "Requirements Changed" },
  { value: "other", label: "Other" },
];

export function DealOutcomeSetter({
  proposalId,
  currentOutcome = DealOutcome.PENDING,
  currentValue,
  onUpdate,
}: DealOutcomeSetterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [outcome, setOutcome] = useState(currentOutcome);
  const [dealValue, setDealValue] = useState(currentValue?.toString() || "");
  const [lossReason, _setLossReason] = useState("");
  const [lossReasonCategory, setLossReasonCategory] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const currentOutcomeData = OUTCOMES.find((o) => o.value === outcome) || OUTCOMES[0];
  const Icon = currentOutcomeData.icon;

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_outcome: outcome,
          deal_value: dealValue ? parseFloat(dealValue) : null,
          loss_reason: lossReason || null,
          loss_reason_category: lossReasonCategory || null,
          competitor_won: competitor || null,
          outcome_notes: notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update outcome");
      }

      toast.success(`Outcome updated to "${currentOutcomeData.label}"`);
      setShowForm(false);
      setIsOpen(false);
      onUpdate?.(outcome);
    } catch (_error) {
      toast.error("Failed to update outcome");
    } finally {
      setSaving(false);
    }
  }

  const colorClasses = {
    success: {
      bg: "bg-[var(--success-subtle)]",
      border: "border-[var(--success-muted)]",
      text: "text-[var(--success)]",
    },
    danger: {
      bg: "bg-[var(--danger-subtle)]",
      border: "border-[var(--danger-muted)]",
      text: "text-[var(--danger)]",
    },
    warning: {
      bg: "bg-[var(--warning-subtle)]",
      border: "border-[var(--warning-muted)]",
      text: "text-[var(--warning)]",
    },
    info: {
      bg: "bg-[var(--info-subtle)]",
      border: "border-[var(--info-muted)]",
      text: "text-[var(--info)]",
    },
  };

  const colors = colorClasses[currentOutcomeData.color as keyof typeof colorClasses];

  return (
    <div className="relative">
      {/* Current Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 border transition-all ${colors.bg} ${colors.border} hover:shadow-md`}
      >
        <Icon className={`h-4 w-4 ${colors.text}`} />
        <span className={`text-sm font-semibold ${colors.text}`}>
          {currentOutcomeData.label}
        </span>
        <ChevronDown className={`h-4 w-4 ${colors.text} ${isOpen ? "rotate-180" : ""} transition-transform`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-lg z-50 overflow-hidden">
          {!showForm ? (
            <>
              <div className="p-2">
                {OUTCOMES.map((opt) => {
                  const OptIcon = opt.icon;
                  const optColors = colorClasses[opt.color as keyof typeof colorClasses];
                  const isSelected = outcome === opt.value;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setOutcome(opt.value);
                        if (opt.value === DealOutcome.WON || opt.value === DealOutcome.LOST) {
                          setShowForm(true);
                        } else {
                          // Quick save for pending/no_decision
                          setShowForm(false);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors ${
                        isSelected
                          ? `${optColors.bg} ${optColors.border} border`
                          : "hover:bg-[var(--background-tertiary)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <OptIcon className={`h-4 w-4 ${optColors.text}`} />
                        <span className={`text-sm font-medium ${isSelected ? optColors.text : "text-[var(--foreground)]"}`}>
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && <Check className={`h-4 w-4 ${optColors.text}`} />}
                    </button>
                  );
                })}
              </div>

              {(outcome === DealOutcome.PENDING || outcome === DealOutcome.NO_DECISION) && outcome !== currentOutcome && (
                <div className="p-3 border-t border-[var(--border)]">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full btn-primary"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${colors.text}`} />
                <span className={`font-semibold ${colors.text}`}>
                  {outcome === DealOutcome.WON ? "Record Win" : "Record Loss"}
                </span>
              </div>

              {/* Deal Value */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Deal Value (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-subtle)]" />
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Loss-specific fields */}
              {outcome === DealOutcome.LOST && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                      Loss Reason Category
                    </label>
                    <select
                      value={lossReasonCategory}
                      onChange={(e) => setLossReasonCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none"
                    >
                      <option value="">Select reason...</option>
                      {LOSS_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                      Competitor (if any)
                    </label>
                    <input
                      type="text"
                      value={competitor}
                      onChange={(e) => setCompetitor(e.target.value)}
                      placeholder="Who won the deal?"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional context..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm focus:border-[var(--accent)] focus:outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-primary"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Outcome"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
