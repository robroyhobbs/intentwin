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

// Pricing configuration — $999/mo invite-only model.
// Single tier: everything included, no upsells.
// NOTE: Multi-tier structure retained for Stripe webhook/checkout compatibility.
// When/if tiered pricing is introduced, add tiers here.
export const PRICING_TIERS = {
  invite: {
    name: "IntentWin",
    description: "Everything included. Invite-only.",
    monthlyPrice: 999,
    annualPrice: 9990, // ~2 months free
    features: [
      "Unlimited proposals",
      "Unlimited AI tokens",
      "10 users",
      "Unlimited knowledge base documents",
      "Export to DOCX, PDF, PPTX, HTML",
      "6-layer persuasion framework",
      "3-judge quality council",
      "Priority support",
    ],
    limits: {
      proposals_per_month: 999999,
      ai_tokens_per_month: 999999999,
      max_users: 10,
      max_documents: 999999,
    },
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

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
