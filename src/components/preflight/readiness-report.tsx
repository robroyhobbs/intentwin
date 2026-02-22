"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  Users,
  FileText,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PreflightResult, PreflightGap } from "@/lib/ai/pipeline/preflight";
import { TargetedUpload } from "./targeted-upload";

interface ReadinessReportProps {
  preflight: PreflightResult | null;
  loading?: boolean;
  onRetry?: () => void;
  onUploadComplete?: () => void;
  proposalId: string;
}

const STATUS_CONFIG = {
  ready: {
    icon: CheckCircle2,
    label: "Ready to Generate",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  needs_data: {
    icon: AlertTriangle,
    label: "Data Gaps Found",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  cannot_address: {
    icon: XCircle,
    label: "Critical Gaps",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
} as const;

const GAP_TYPE_ICONS = {
  evidence: FileText,
  personnel: Users,
  product: Package,
  compliance: Shield,
} as const;

function GapItem({
  gap,
  proposalId,
  onUploadComplete,
}: {
  gap: PreflightGap;
  proposalId: string;
  onUploadComplete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = GAP_TYPE_ICONS[gap.type] || AlertTriangle;

  const categoryColor =
    gap.category === "ready"
      ? "text-emerald-500"
      : gap.category === "needs_data"
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="border border-[var(--border)] rounded-lg p-3 bg-[var(--card-bg)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-3 w-full text-left"
      >
        <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", categoryColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {gap.description}
          </p>
          {gap.affectedSection && (
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              Affects: {gap.affectedSection.replace(/_/g, " ")}
            </p>
          )}
        </div>
        {(gap.detail || gap.uploadHint) && (
          <span className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            )}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 ml-7 space-y-2">
          {gap.detail && (
            <p className="text-xs text-[var(--foreground-subtle)]">
              {gap.detail}
            </p>
          )}
          {gap.uploadHint && (
            <div className="mt-2">
              <p className="text-xs text-[var(--foreground-muted)] mb-2">
                {gap.uploadHint}
              </p>
              <TargetedUpload
                gapType={gap.type}
                proposalId={proposalId}
                onUploadComplete={onUploadComplete}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReadinessReport({
  preflight,
  loading,
  onRetry,
  onUploadComplete,
  proposalId,
}: ReadinessReportProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] py-4">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Checking readiness...
      </div>
    );
  }

  if (!preflight) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] py-4">
        <AlertTriangle className="h-4 w-4" />
        Unable to check readiness
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[var(--accent)] hover:underline text-xs ml-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const config = STATUS_CONFIG[preflight.status];
  const StatusIcon = config.icon;
  const hasGaps = preflight.gaps.length > 0;

  return (
    <div className={cn("rounded-xl border p-4", config.border, config.bg)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <StatusIcon className={cn("h-5 w-5", config.color)} />
        <div>
          <h3 className={cn("text-sm font-bold", config.color)}>
            {config.label}
          </h3>
          <p className="text-xs text-[var(--foreground-muted)]">
            {preflight.summary.evidenceCount} evidence items,{" "}
            {preflight.summary.productCount} products,{" "}
            {preflight.summary.companyContextCount} company context entries
          </p>
        </div>
      </div>

      {/* Gap list */}
      {hasGaps && (
        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
          {preflight.gaps.map((gap, idx) => (
            <GapItem
              key={`${gap.type}-${gap.affectedSection}-${idx}`}
              gap={gap}
              proposalId={proposalId}
              onUploadComplete={onUploadComplete}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      {hasGaps && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--foreground-muted)]">
            {preflight.summary.needsDataCount} gap{preflight.summary.needsDataCount !== 1 ? "s" : ""} found
            {" "}(generation will still proceed with placeholders)
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Re-check
            </button>
          )}
        </div>
      )}
    </div>
  );
}
