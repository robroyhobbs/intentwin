"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CreditCard,
  Users,
  Building2,
  Zap,
  FileText,
  Check,
  ArrowRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

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

const PLAN_FEATURES: Record<string, string[]> = {
  trial: ["3 proposals", "50K AI tokens", "1 user", "10 documents"],
  starter: ["5 proposals/mo", "50K AI tokens", "1 user", "10 documents", "All exports"],
  pro: ["20 proposals/mo", "250K AI tokens", "5 users", "50 documents", "Priority support"],
  business: ["Unlimited proposals", "1M AI tokens", "15 users", "Unlimited docs", "API access"],
  enterprise: ["Unlimited everything", "Unlimited users", "SSO/SAML", "Dedicated support"],
};

const PLAN_PRICES: Record<string, number | null> = {
  trial: 0,
  starter: 29,
  pro: 79,
  business: 199,
  enterprise: null,
};

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrganization() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: organization } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single();

        setOrg(organization);
      }
      setLoading(false);
    }

    loadOrganization();
  }, [supabase]);

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval: "monthly" }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to start upgrade process");
    } finally {
      setUpgrading(null);
    }
  };

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
        alert(data.error || "Failed to open billing portal");
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal");
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
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isOnTrial = org?.plan_tier === "trial" && trialDaysLeft > 0;
  const proposalUsage = org?.usage_current_period?.proposals_created || 0;
  const proposalLimit = org?.plan_limits?.proposals_per_month || 0;
  const tokenUsage = org?.usage_current_period?.ai_tokens_used || 0;
  const tokenLimit = org?.plan_limits?.ai_tokens_per_month || 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
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
                  {org?.plan_tier === "trial" ? "Free Trial" : `${org?.plan_tier?.charAt(0).toUpperCase()}${org?.plan_tier?.slice(1)} Plan`}
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
              <span className="text-sm text-[var(--foreground-muted)]">Proposals</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {proposalUsage} <span className="text-sm font-normal text-[var(--foreground-muted)]">/ {proposalLimit >= 999999 ? "∞" : proposalLimit}</span>
            </div>
            <div className="mt-2 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{ width: `${Math.min(100, (proposalUsage / proposalLimit) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">AI Tokens</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {Math.round(tokenUsage / 1000)}K <span className="text-sm font-normal text-[var(--foreground-muted)]">/ {tokenLimit >= 999999 ? "∞" : `${tokenLimit / 1000}K`}</span>
            </div>
            <div className="mt-2 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{ width: `${Math.min(100, (tokenUsage / tokenLimit) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-sm text-[var(--foreground-muted)]">Team Size</span>
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              1 <span className="text-sm font-normal text-[var(--foreground-muted)]">/ {org?.plan_limits?.max_users || 1}</span>
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Organization</h2>
            <p className="text-sm text-[var(--foreground-muted)]">{org?.name}</p>
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      {(org?.plan_tier === "trial" || org?.plan_tier === "starter" || org?.plan_tier === "pro") && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            {isOnTrial ? "Choose a plan" : "Upgrade your plan"}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(["starter", "pro", "business"] as const).map((tier) => {
              const isCurrentPlan = org?.plan_tier === tier;
              const isDowngrade =
                (org?.plan_tier === "business" && tier !== "business") ||
                (org?.plan_tier === "pro" && tier === "starter");

              if (isDowngrade) return null;

              return (
                <div
                  key={tier}
                  className={`card p-6 ${
                    tier === "pro" ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : ""
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] capitalize">
                      {tier}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-[var(--foreground)]">
                        ${PLAN_PRICES[tier]}
                      </span>
                      <span className="text-[var(--foreground-muted)]">/mo</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {PLAN_FEATURES[tier].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                        <Check className="h-4 w-4 text-[var(--success)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(tier)}
                    disabled={isCurrentPlan || upgrading === tier}
                    className={`w-full ${
                      isCurrentPlan
                        ? "btn-secondary opacity-50 cursor-not-allowed"
                        : tier === "pro"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    {upgrading === tier ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Enterprise CTA */}
          <div className="card p-6 mt-4 bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background-tertiary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Need Enterprise?
                </h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Unlimited everything, SSO, dedicated support, and custom integrations
                </p>
              </div>
              <a
                href="mailto:sales@proposalai.com?subject=Enterprise%20Inquiry"
                className="btn-secondary"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
