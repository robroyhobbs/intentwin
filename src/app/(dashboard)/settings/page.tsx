"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Users,
  Building2,
  Zap,
  FileText,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { logger } from "@/lib/utils/logger";

interface Organization {
  id: string;
  name: string;
  plan_tier: string;
  plan_limits: {
    proposals_per_month: number;
    ai_tokens_per_month: number;
    max_users: number;
    max_documents: number;
  };
  usage_current_period: {
    proposals_created: number;
    ai_tokens_used: number;
    documents_uploaded: number;
  };
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
}

const PLAN_FEATURES: string[] = [
  "Unlimited proposals",
  "Intent Framework (6-layer persuasion engine)",
  "RFP Intelligence (auto-extract)",
  "Unlimited knowledge base documents",
  "All export formats (DOCX, PDF, PPTX)",
  "Win Analytics & outcome tracking",
  "White-glove onboarding",
  "Dedicated support",
  "Quarterly strategy reviews",
];

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrganization() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: organization } = await supabase
          .from("organizations")
          .select("id, name, slug, settings, plan_tier, plan_limits, usage_current_period, trial_ends_at, stripe_customer_id, stripe_subscription_id, billing_cycle_start, billing_cycle_end")
          .eq("id", profile.organization_id)
          .single();

        setOrg(organization);
      }
      setLoading(false);
    }

    loadOrganization();
  }, [supabase]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to open billing portal");
      }
    } catch (error) {
      logger.error("Stripe portal error", error);
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const trialDaysLeft = org?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(org.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const isOnTrial = org?.plan_tier === "trial" && trialDaysLeft > 0;
  const proposalUsage = org?.usage_current_period?.proposals_created || 0;
  const proposalLimit = org?.plan_limits?.proposals_per_month || 0;
  const tokenUsage = org?.usage_current_period?.ai_tokens_used || 0;
  const tokenLimit = org?.plan_limits?.ai_tokens_per_month || 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Manage your organization and subscription
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="card p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                <Zap className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {org?.plan_tier === "trial"
                    ? "Free Trial"
                    : `${org?.plan_tier?.charAt(0).toUpperCase()}${org?.plan_tier?.slice(1)} Plan`}
                </h2>
                {isOnTrial && (
                  <p className="text-sm text-[var(--warning)]">
                    {trialDaysLeft} days remaining in trial
                  </p>
                )}
              </div>
            </div>
          </div>
          {org?.stripe_subscription_id && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="btn-secondary text-sm"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">
                Proposals
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {proposalUsage}{" "}
              <span className="text-sm font-normal text-[var(--foreground-muted)]">
                / {proposalLimit >= 999999 ? "∞" : proposalLimit}
              </span>
            </div>
            <div className="mt-2 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (proposalUsage / proposalLimit) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">
                AI Tokens
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {Math.round(tokenUsage / 1000)}K{" "}
              <span className="text-sm font-normal text-[var(--foreground-muted)]">
                / {tokenLimit >= 999999 ? "∞" : `${tokenLimit / 1000}K`}
              </span>
            </div>
            <div className="mt-2 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (tokenUsage / tokenLimit) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">
                Team Size
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              1{" "}
              <span className="text-sm font-normal text-[var(--foreground-muted)]">
                / {org?.plan_limits?.max_users || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <Building2 className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Organization
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              {org?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <Check className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Your Plan Includes
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              $999/month — everything, no limits
            </p>
          </div>
        </div>
        <ul className="grid md:grid-cols-2 gap-2">
          {PLAN_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
            >
              <Check className="h-4 w-4 text-[var(--success)] flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        {org?.stripe_subscription_id && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="btn-secondary text-sm"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
