import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import {
  stripe,
  getOrCreateStripeCustomer,
  PRICING_TIERS,
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

    // Get the price from environment or create dynamically
    // In production, you'd have pre-created prices in Stripe
    const priceAmount =
      interval === "annual"
        ? PRICING_TIERS[tier].annualPrice
        : PRICING_TIERS[tier].monthlyPrice;

    if (!priceAmount) {
      return badRequest("Invalid price for selected tier");
    }

    // Create a price on the fly (in production, use pre-created prices)
    const price = await stripe.prices.create({
      unit_amount: priceAmount * 100, // Stripe uses cents
      currency: "usd",
      recurring: {
        interval: interval === "annual" ? "year" : "month",
      },
      product_data: {
        name: `IntentBid ${PRICING_TIERS[tier].name}`,
        metadata: {
          tier,
        },
      },
      metadata: {
        tier,
        interval,
      },
    });

    // Create checkout session
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://intentbid.com";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: price.id,
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
