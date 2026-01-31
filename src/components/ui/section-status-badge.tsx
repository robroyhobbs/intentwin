import { cn } from "@/lib/utils/cn";
import { Check, AlertCircle, Loader2, Clock, XCircle } from "lucide-react";

type ReviewStatus = "pending" | "approved" | "needs_revision" | "draft";
type GenerationStatus = "pending" | "generating" | "completed" | "failed";

interface SectionStatusBadgeProps {
  reviewStatus?: ReviewStatus;
  generationStatus?: GenerationStatus;
  className?: string;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  generating: { bg: "bg-[var(--accent-subtle)]", text: "text-[var(--accent)]", border: "border-[var(--accent-muted)]" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  failed: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  needs_revision: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  draft: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" },
  review: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  intake: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  exported: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  final: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
};

const BADGE_ICONS: Record<string, typeof Check> = {
  completed: Check,
  approved: Check,
  exported: Check,
  final: Check,
  failed: XCircle,
  needs_revision: AlertCircle,
  generating: Loader2,
  pending: Clock,
  draft: Clock,
  intake: Clock,
  review: AlertCircle,
};

const DOT_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  generating: "bg-[var(--accent)]",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  approved: "bg-emerald-500",
  needs_revision: "bg-red-500",
  draft: "bg-stone-400",
  review: "bg-amber-500",
  intake: "bg-amber-400",
  exported: "bg-emerald-500",
  final: "bg-emerald-500",
};

export function SectionStatusBadge({
  reviewStatus,
  generationStatus,
  className,
}: SectionStatusBadgeProps) {
  const status = reviewStatus || generationStatus || "pending";
  const label = status.replace("_", " ");
  const style = BADGE_STYLES[status] || BADGE_STYLES.pending;
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
      <Icon className={cn("h-3 w-3", status === "generating" && "animate-spin")} />
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
          DOT_COLORS[status] || DOT_COLORS.pending,
          className
        )}
      />
      {status === "generating" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            DOT_COLORS[status] || DOT_COLORS.pending,
            "animate-ping opacity-75"
          )}
        />
      )}
    </span>
  );
}
