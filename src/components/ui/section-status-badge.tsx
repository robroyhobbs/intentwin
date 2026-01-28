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
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  generating: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  needs_revision: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  draft: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  review: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  intake: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  exported: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  final: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
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
  generating: "bg-blue-400",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  approved: "bg-emerald-500",
  needs_revision: "bg-red-500",
  draft: "bg-gray-400",
  review: "bg-orange-400",
  intake: "bg-amber-400",
  exported: "bg-emerald-600",
  final: "bg-emerald-600",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide",
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
          "inline-block h-2.5 w-2.5 rounded-full",
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
