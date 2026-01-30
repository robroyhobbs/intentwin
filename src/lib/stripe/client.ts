import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

// Pricing configuration - matches the tiers in our database
export const PRICING_TIERS = {
  starter: {
    name: "Starter",
    description: "Perfect for freelancers and solopreneurs",
    monthlyPrice: 29,
    annualPrice: 290, // 2 months free
    features: [
      "5 proposals per month",
      "50K AI tokens",
      "1 user",
      "10 knowledge base documents",
      "Export to DOCX, PDF, PPTX",
      "Email support",
    ],
    limits: {
      proposals_per_month: 5,
      ai_tokens_per_month: 50000,
      max_users: 1,
      max_documents: 10,
    },
  },
  pro: {
    name: "Pro",
    description: "For growing sales teams",
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      "20 proposals per month",
      "250K AI tokens",
      "5 users",
      "50 knowledge base documents",
      "Export to all formats",
      "Priority support",
      "Version history",
      "Team collaboration",
    ],
    limits: {
      proposals_per_month: 20,
      ai_tokens_per_month: 250000,
      max_users: 5,
      max_documents: 50,
    },
  },
  business: {
    name: "Business",
    description: "For established companies",
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      "Unlimited proposals",
      "1M AI tokens",
      "15 users",
      "Unlimited documents",
      "Export to all formats",
      "Dedicated support",
      "Advanced analytics",
      "Custom templates",
      "API access",
    ],
    limits: {
      proposals_per_month: 999999, // Effectively unlimited
      ai_tokens_per_month: 1000000,
      max_users: 15,
      max_documents: 999999,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: null, // Custom pricing
    annualPrice: null,
    features: [
      "Unlimited everything",
      "Unlimited users",
      "SSO/SAML",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    limits: {
      proposals_per_month: 999999999,
      ai_tokens_per_month: 999999999,
      max_users: 999999,
      max_documents: 999999999,
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
