import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import {
  stripe,
  getOrCreateStripeCustomer,
  PRICING_TIERS,
  getStripePriceId,
  type PricingTier,
} from "@/lib/stripe/client";
import { unauthorized, forbidden, badRequest, notFound, ok, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Only admins can manage billing
    if (context.role !== "admin") {
      return forbidden("Only organization admins can manage billing");
    }

    const body = await request.json();
    const { tier, interval = "monthly" } = body as {
      tier: PricingTier;
      interval: "monthly" | "annual";
    };

    if (!tier || !PRICING_TIERS[tier]) {
      return badRequest("Invalid pricing tier");
    }

    // Free tier has no Stripe checkout
    if (PRICING_TIERS[tier].monthlyPrice === 0) {
      return badRequest("Free tier does not require checkout");
    }

    const adminClient = createAdminClient();

    // Get organization details
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", context.organizationId)
      .single();

    if (orgError || !org) {
      return notFound("Organization not found");
    }

    // Get or create Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(
        org.id,
        context.user.email || "",
        org.name,
      );

      // Save customer ID to organization
      await adminClient
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    // Resolve Stripe price ID from environment variables
    const priceId = getStripePriceId(tier, interval);
    if (!priceId) {
      return serverError(
        `Stripe price ID not configured for tier "${tier}" (${interval}). ` +
        `Set ${PRICING_TIERS[tier].stripePriceIdEnvVar} in environment variables.`,
      );
    }

    // Create checkout session using pre-created Stripe price
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.intentbid.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/settings?canceled=true`,
      subscription_data: {
        metadata: {
          organization_id: org.id,
          tier,
        },
      },
      metadata: {
        organization_id: org.id,
        tier,
      },
    });

    return ok({ url: session.url });
  } catch (error) {
    return serverError("Failed to create checkout session", error);
  }
}
