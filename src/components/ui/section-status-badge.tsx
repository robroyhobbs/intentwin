import { cn } from "@/lib/utils/cn";
import { Check, AlertCircle, Loader2, Clock, XCircle } from "lucide-react";
import { ProposalStatus, GenerationStatus, SectionReviewStatus } from "@/lib/constants/statuses";

type ReviewStatus = "pending" | "approved" | "needs_revision" | "draft";
type GenerationStatus = "pending" | "generating" | "completed" | "failed";

interface SectionStatusBadgeProps {
  reviewStatus?: ReviewStatus;
  generationStatus?: GenerationStatus;
  className?: string;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  [GenerationStatus.PENDING]: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  [GenerationStatus.GENERATING]: { bg: "bg-[var(--accent-subtle)]", text: "text-[var(--accent)]", border: "border-[var(--accent-muted)]" },
  [GenerationStatus.COMPLETED]: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  [GenerationStatus.FAILED]: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  [SectionReviewStatus.APPROVED]: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  [SectionReviewStatus.NEEDS_REVISION]: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  [ProposalStatus.DRAFT]: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" },
  [ProposalStatus.REVIEW]: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  [ProposalStatus.INTAKE]: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  [ProposalStatus.EXPORTED]: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  [ProposalStatus.FINAL]: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
};

const BADGE_ICONS: Record<string, typeof Check> = {
  [GenerationStatus.COMPLETED]: Check,
  [SectionReviewStatus.APPROVED]: Check,
  [ProposalStatus.EXPORTED]: Check,
  [ProposalStatus.FINAL]: Check,
  [GenerationStatus.FAILED]: XCircle,
  [SectionReviewStatus.NEEDS_REVISION]: AlertCircle,
  [GenerationStatus.GENERATING]: Loader2,
  [GenerationStatus.PENDING]: Clock,
  [ProposalStatus.DRAFT]: Clock,
  [ProposalStatus.INTAKE]: Clock,
  [ProposalStatus.REVIEW]: AlertCircle,
};

const DOT_COLORS: Record<string, string> = {
  [GenerationStatus.PENDING]: "bg-amber-400",
  [GenerationStatus.GENERATING]: "bg-[var(--accent)]",
  [GenerationStatus.COMPLETED]: "bg-emerald-500",
  [GenerationStatus.FAILED]: "bg-red-500",
  [SectionReviewStatus.APPROVED]: "bg-emerald-500",
  [SectionReviewStatus.NEEDS_REVISION]: "bg-red-500",
  [ProposalStatus.DRAFT]: "bg-stone-400",
  [ProposalStatus.REVIEW]: "bg-amber-500",
  [ProposalStatus.INTAKE]: "bg-amber-400",
  [ProposalStatus.EXPORTED]: "bg-emerald-500",
  [ProposalStatus.FINAL]: "bg-emerald-500",
};

export function SectionStatusBadge({
  reviewStatus,
  generationStatus,
  className,
}: SectionStatusBadgeProps) {
  const status = reviewStatus || generationStatus || GenerationStatus.PENDING;
  const label = status.replace("_", " ");
  const style = BADGE_STYLES[status] || BADGE_STYLES[GenerationStatus.PENDING];
  const Icon = BADGE_ICONS[status] || Clock;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium capitalize",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      <Icon className={cn("h-3 w-3", status === GenerationStatus.GENERATING && "animate-spin")} />
      {label}
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          DOT_COLORS[status] || DOT_COLORS[GenerationStatus.PENDING],
          className
        )}
      />
      {status === GenerationStatus.GENERATING && (
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            DOT_COLORS[status] || DOT_COLORS[GenerationStatus.PENDING],
            "animate-ping opacity-75"
          )}
        />
      )}
    </span>
  );
}
