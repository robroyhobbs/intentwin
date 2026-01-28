import Link from "next/link";
import { Clock, FileText, CheckCircle2, Play, Download, ArrowUpRight } from "lucide-react";
import { SectionStatusBadge } from "./section-status-badge";

interface ProposalCardProps {
  id: string;
  title: string;
  status: string;
  clientName: string;
  opportunityType: string;
  createdAt: string;
  sectionCount?: number;
  completedSections?: number;
}

const STATUS_GRADIENT: Record<string, string> = {
  draft: "from-gray-400 to-gray-500",
  intake: "from-yellow-400 to-orange-400",
  generating: "from-blue-400 to-blue-600",
  review: "from-orange-400 to-red-400",
  final: "from-green-400 to-green-600",
  exported: "from-emerald-500 to-green-700",
};

const QUICK_ACTIONS: Record<string, { label: string; icon: typeof Play }> = {
  intake: { label: "Continue", icon: Play },
  draft: { label: "Generate", icon: Play },
  review: { label: "Export", icon: Download },
  exported: { label: "View", icon: FileText },
};

export function ProposalCard({
  id,
  title,
  status,
  clientName,
  opportunityType,
  createdAt,
  sectionCount = 0,
  completedSections = 0,
}: ProposalCardProps) {
  const progress = sectionCount > 0 ? (completedSections / sectionCount) * 100 : 0;
  const action = QUICK_ACTIONS[status];
  const gradient = STATUS_GRADIENT[status] || STATUS_GRADIENT.draft;

  return (
    <Link
      href={`/proposals/${id}`}
      className="group block rounded-xl bg-white border border-gray-100 shadow-sm hover-lift overflow-hidden"
    >
      {/* Top accent gradient */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1B365D] truncate group-hover:text-[#0070AD] transition-colors duration-200">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {clientName}
              {opportunityType && (
                <span className="ml-2 text-gray-400">
                  &middot; {opportunityType.replace(/_/g, " ")}
                </span>
              )}
            </p>
          </div>

          <SectionStatusBadge generationStatus={status as "pending" | "generating" | "completed" | "failed"} />
        </div>

        {/* Progress bar */}
        {sectionCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-medium text-gray-500">
                {completedSections}/{sectionCount} sections
              </span>
              <span className="font-semibold text-[#0070AD]">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0070AD] to-[#12ABDB] transition-all duration-500 relative"
                style={{ width: `${progress}%` }}
              >
                {progress > 0 && progress < 100 && (
                  <div className="absolute inset-0 animate-shimmer" />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {action && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0070AD] opacity-0 group-hover:opacity-100 transition-all duration-200">
              {action.label}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
