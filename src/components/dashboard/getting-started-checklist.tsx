"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Circle,
  Building2,
  FileText,
  Upload,
  Rocket,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  isComplete: boolean;
}

export function GettingStartedChecklist() {
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  async function checkProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;
      setOrgId(profile.organization_id);

      // Get organization data
      const { data: org } = await supabase
        .from("organizations")
        .select("name, settings")
        .eq("id", profile.organization_id)
        .single();

      // Check if checklist is dismissed
      if (org?.settings?.checklist_dismissed) {
        setDismissed(true);
        setLoading(false);
        return;
      }

      // Check various completion states
      const hasCompanyName = !!org?.name && org.name !== `${user.email?.split("@")[0]}'s Organization`;
      const hasDescription = !!org?.settings?.description;
      const hasDifferentiators = (org?.settings?.differentiators?.length || 0) > 0;

      // Check for documents
      const { count: docCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      // Check for proposals
      const { count: proposalCount } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      const checklistItems: ChecklistItem[] = [
        {
          id: "company",
          title: "Set up company profile",
          description: "Add your company name and description",
          href: "/settings/company",
          icon: <Building2 className="h-4 w-4" />,
          isComplete: hasCompanyName && hasDescription,
        },
        {
          id: "differentiators",
          title: "Add your differentiators",
          description: "Tell us what makes you unique",
          href: "/settings/company?tab=differentiators",
          icon: <Sparkles className="h-4 w-4" />,
          isComplete: hasDifferentiators,
        },
        {
          id: "documents",
          title: "Upload a document",
          description: "Add past proposals or case studies",
          href: "/knowledge-base/upload",
          icon: <Upload className="h-4 w-4" />,
          isComplete: (docCount || 0) > 0,
        },
        {
          id: "proposal",
          title: "Create your first proposal",
          description: "Generate an AI-powered proposal",
          href: "/proposals/new",
          icon: <FileText className="h-4 w-4" />,
          isComplete: (proposalCount || 0) > 0,
        },
      ];

      setItems(checklistItems);

      // Auto-dismiss if all complete
      const allComplete = checklistItems.every(item => item.isComplete);
      if (allComplete) {
        // Mark as dismissed so it doesn't show again
        await supabase
          .from("organizations")
          .update({
            settings: {
              ...org?.settings,
              checklist_dismissed: true,
              checklist_completed_at: new Date().toISOString(),
            },
          })
          .eq("id", profile.organization_id);
        setDismissed(true);
      }
    } catch (error) {
      console.error("Error checking progress:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    if (!orgId) return;

    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      await supabase
        .from("organizations")
        .update({
          settings: {
            ...org?.settings,
            checklist_dismissed: true,
          },
        })
        .eq("id", orgId);

      setDismissed(true);
    } catch (error) {
      console.error("Error dismissing checklist:", error);
    }
  }

  if (loading || dismissed) return null;

  const completedCount = items.filter(item => item.isComplete).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (completedCount === items.length) return null;

  return (
    <div className="card mb-6 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--background-secondary)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-muted)]">
            <Rocket className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Getting Started</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {completedCount} of {items.length} tasks complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
            title="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" />
          )}
        </div>
      </div>

      {/* Checklist Items */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          {items.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--background-secondary)] transition-colors ${
                index < items.length - 1 ? "border-b border-[var(--border)]" : ""
              }`}
            >
              <div className={`flex-shrink-0 ${item.isComplete ? "text-[var(--success)]" : "text-[var(--foreground-muted)]"}`}>
                {item.isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                item.isComplete
                  ? "bg-[var(--success-subtle)] text-[var(--success)]"
                  : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${
                  item.isComplete ? "text-[var(--foreground-muted)] line-through" : "text-[var(--foreground)]"
                }`}>
                  {item.title}
                </p>
                <p className="text-sm text-[var(--foreground-muted)] truncate">
                  {item.description}
                </p>
              </div>
              {!item.isComplete && (
                <span className="text-sm text-[var(--accent)] font-medium">
                  Start →
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
