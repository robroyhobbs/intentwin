"use client";

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ── Types ──────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  section_type: string;
}

interface Review {
  id: string;
  section_id: string;
  score: number | null;
  comment: string | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
}

interface SectionReviewFormProps {
  stageId: string;
  proposalId: string;
  sections: Section[];
  existingReview?: Review;
  onSubmit: () => void;
}

// ── Score Display ──────────────────────────────────────────────────────────

function ScoreDisplay({ score }: { score: number | null }) {
  const value = score ?? 0;

  const color =
    value >= 80
      ? "var(--success)"
      : value >= 60
        ? "var(--warning)"
        : value > 0
          ? "var(--danger)"
          : "var(--foreground-subtle)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--foreground-muted)]">
          Score: {score !== null ? score : "--"} / 100
        </span>
        <span className="text-xs font-semibold" style={{ color }}>
          {score !== null
            ? score >= 80
              ? "Strong"
              : score >= 60
                ? "Acceptable"
                : "Needs Work"
            : "Not Scored"}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--background-tertiary)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function SectionReviewForm({
  stageId,
  proposalId,
  sections,
  existingReview,
  onSubmit,
}: SectionReviewFormProps) {
  const authFetch = useAuthFetch();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sectionId, setSectionId] = useState(existingReview?.section_id ?? "");
  const [score, setScore] = useState<string>(
    existingReview?.score != null ? String(existingReview.score) : "",
  );
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [strengths, setStrengths] = useState(existingReview?.strengths ?? "");
  const [weaknesses, setWeaknesses] = useState(existingReview?.weaknesses ?? "");
  const [recommendations, setRecommendations] = useState(
    existingReview?.recommendations ?? "",
  );

  // Sync if existingReview changes
  useEffect(() => {
    if (existingReview) {
      setSectionId(existingReview.section_id);
      setScore(existingReview.score != null ? String(existingReview.score) : "");
      setComment(existingReview.comment ?? "");
      setStrengths(existingReview.strengths ?? "");
      setWeaknesses(existingReview.weaknesses ?? "");
      setRecommendations(existingReview.recommendations ?? "");
    }
  }, [existingReview]);

  const isEditMode = !!existingReview;
  const parsedScore = score !== "" ? Number(score) : null;
  const isValid = sectionId !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please select a section");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        section_id: sectionId,
        score: parsedScore,
        comment: comment || null,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        recommendations: recommendations || null,
      };

      const url = `/api/proposals/${proposalId}/review-stages/${stageId}/reviews`;
      const method = isEditMode ? "PATCH" : "POST";
      const body = isEditMode
        ? JSON.stringify({ ...payload, review_id: existingReview.id })
        : JSON.stringify(payload);

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit review");
      }

      toast.success(isEditMode ? "Review updated" : "Review submitted");
      if (!isEditMode) {
        // Reset form
        setSectionId("");
        setScore("");
        setComment("");
        setStrengths("");
        setWeaknesses("");
        setRecommendations("");
      }
      onSubmit();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Shared textarea classes
  const textareaClasses =
    "w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] px-3 py-2 focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-glow)] transition-colors resize-y min-h-[72px]";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {isEditMode ? "Edit Review" : "Submit Section Review"}
      </h3>

      {/* Section selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Section <span className="text-[var(--danger)]">*</span>
        </label>
        {isEditMode ? (
          <div className="text-sm text-[var(--foreground)] px-3 py-2 rounded-md bg-[var(--background-tertiary)] border border-[var(--border-subtle)]">
            {sections.find((s) => s.id === sectionId)?.title ?? sectionId}
          </div>
        ) : (
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-glow)] transition-colors"
          >
            <option value="">Select a section...</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title} ({section.section_type})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Score */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Score (0-100)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              setScore("");
            } else {
              const num = Math.min(100, Math.max(0, Number(val)));
              setScore(String(num));
            }
          }}
          placeholder="Optional score..."
          className="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] px-3 py-2 focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-glow)] transition-colors"
        />
        <ScoreDisplay score={parsedScore} />
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="General comments on this section..."
          className={textareaClasses}
          rows={3}
        />
      </div>

      {/* Strengths */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Strengths
        </label>
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="What are the strengths of this section?"
          className={textareaClasses}
          rows={2}
        />
      </div>

      {/* Weaknesses */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Weaknesses
        </label>
        <textarea
          value={weaknesses}
          onChange={(e) => setWeaknesses(e.target.value)}
          placeholder="What needs improvement?"
          className={textareaClasses}
          rows={2}
        />
      </div>

      {/* Recommendations */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--foreground-muted)]">
          Recommendations
        </label>
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="Specific recommendations for improvement..."
          className={textareaClasses}
          rows={2}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isValid && !submitting ? "var(--accent)" : "var(--background-tertiary)",
            color: isValid && !submitting ? "#0a0a0a" : "var(--foreground-subtle)",
          }}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isEditMode ? "Update Review" : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
