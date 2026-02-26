import Stripe from "stripe";

// Lazy initialization to allow builds without env vars
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Export stripe for backwards compatibility - will throw at runtime if not configured
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : (null as unknown as Stripe);

// Pricing configuration — 4-tier model
// free → starter ($49) → pro ($199) → enterprise ($999)
export const PRICING_TIERS = {
  free: {
    name: "Free",
    description: "Manual proposals. No AI. Genuinely useful.",
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdEnvVar: null, // No Stripe price for free tier
    features: [
      "2 proposals/month",
      "Manual proposal creation",
      "Rich text editor",
      "DOCX export",
      "5 knowledge base documents",
      "10 evidence items",
      "1 team member",
    ],
    limits: {
      proposals_per_month: 2,
      ai_tokens_per_month: 0,
      max_users: 1,
      max_documents: 5,
    },
    featureFlags: {
      ai_generation: false,
      document_extraction: false,
      intelligence_suite: false,
      bid_evaluation: false,
      all_export_formats: false,
      semantic_search: false,
      bulk_import: false,
      quality_review: false,
      preflight_gate: false,
      client_research: false,
      win_probability: false,
      competitive_landscape: false,
      white_label_exports: false,
      advanced_analytics: false,
      audit_trail: false,
    },
  },
  starter: {
    name: "Starter",
    description: "AI-assisted proposals. 10x faster than manual.",
    monthlyPrice: 49,
    annualPrice: 470, // ~2 months free
    stripePriceIdEnvVar: "STRIPE_STARTER_PRICE_ID",
    features: [
      "10 proposals/month",
      "AI generation (5 sections/proposal)",
      "Document upload + AI extraction",
      "DOCX + PDF export",
      "25 knowledge base documents",
      "50 evidence items",
      "3 team members",
      "GSA rate benchmarks",
      "Semantic search",
    ],
    limits: {
      proposals_per_month: 10,
      ai_tokens_per_month: 500000,
      max_users: 3,
      max_documents: 25,
    },
    featureFlags: {
      ai_generation: true,
      document_extraction: true,
      intelligence_suite: false,
      bid_evaluation: false,
      all_export_formats: false,
      semantic_search: true,
      bulk_import: false,
      quality_review: false,
      preflight_gate: false,
      client_research: false,
      win_probability: false,
      competitive_landscape: false,
      white_label_exports: false,
      advanced_analytics: false,
      audit_trail: false,
    },
  },
  pro: {
    name: "Pro",
    description: "Full intelligence-driven proposal pipeline.",
    monthlyPrice: 199,
    annualPrice: 1910, // ~2 months free
    stripePriceIdEnvVar: "STRIPE_PRO_PRICE_ID",
    features: [
      "Unlimited proposals",
      "Full AI generation (10 sections)",
      "Full intelligence suite",
      "AI bid/no-bid scoring",
      "All 5 export formats",
      "100 knowledge base documents",
      "Unlimited evidence items",
      "10 team members",
      "Quality review council",
      "Compliance matrix",
      "Win/loss analytics",
    ],
    limits: {
      proposals_per_month: 999999,
      ai_tokens_per_month: 5000000,
      max_users: 10,
      max_documents: 100,
    },
    featureFlags: {
      ai_generation: true,
      document_extraction: true,
      intelligence_suite: true,
      bid_evaluation: true,
      all_export_formats: true,
      semantic_search: true,
      bulk_import: true,
      quality_review: true,
      preflight_gate: true,
      client_research: true,
      win_probability: false,
      competitive_landscape: false,
      white_label_exports: false,
      advanced_analytics: true,
      audit_trail: false,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "Unlimited everything. Win probability. White-label.",
    monthlyPrice: 999,
    annualPrice: 9590, // ~2 months free
    stripePriceIdEnvVar: "STRIPE_ENTERPRISE_PRICE_ID",
    features: [
      "Unlimited proposals",
      "Full AI generation + priority queue",
      "Full intelligence suite",
      "Win probability engine",
      "Competitive landscape analysis",
      "All 5 export formats + white-label",
      "Unlimited knowledge base documents",
      "Unlimited team members",
      "Audit trail",
      "Custom data source integration",
      "Priority support",
    ],
    limits: {
      proposals_per_month: 999999,
      ai_tokens_per_month: 999999999,
      max_users: 999999,
      max_documents: 999999,
    },
    featureFlags: {
      ai_generation: true,
      document_extraction: true,
      intelligence_suite: true,
      bid_evaluation: true,
      all_export_formats: true,
      semantic_search: true,
      bulk_import: true,
      quality_review: true,
      preflight_gate: true,
      client_research: true,
      win_probability: true,
      competitive_landscape: true,
      white_label_exports: true,
      advanced_analytics: true,
      audit_trail: true,
    },
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

/** Feature flag keys available for gating */
export type FeatureFlag = keyof (typeof PRICING_TIERS)["enterprise"]["featureFlags"];

/**
 * Look up the Stripe price ID for a tier from environment variables.
 * Returns null for free tier or if the env var is not set.
 */
export function getStripePriceId(
  tier: PricingTier,
  interval: "monthly" | "annual" = "monthly",
): string | null {
  const tierConfig = PRICING_TIERS[tier];
  if (!tierConfig.stripePriceIdEnvVar) return null;

  // Annual price IDs use _ANNUAL suffix convention
  const envVar = interval === "annual"
    ? `${tierConfig.stripePriceIdEnvVar}_ANNUAL`
    : tierConfig.stripePriceIdEnvVar;

  return process.env[envVar] || null;
}

/**
 * Get or create a Stripe customer for an organization
 */
export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<string> {
  // This would normally check your database first
  // For now, create a new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organization_id: organizationId,
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  organizationId,
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  organizationId: string;
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        organization_id: organizationId,
      },
    },
    metadata: {
      organization_id: organizationId,
    },
  });
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}
