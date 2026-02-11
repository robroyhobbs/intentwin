import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import {
  stripe,
  getOrCreateStripeCustomer,
  PRICING_TIERS,
  type PricingTier,
} from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manage billing
    if (context.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization admins can manage billing" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { tier, interval = "monthly" } = body as {
      tier: PricingTier;
      interval: "monthly" | "annual";
    };

    if (!tier || !PRICING_TIERS[tier]) {
      return NextResponse.json(
        { error: "Invalid pricing tier" },
        { status: 400 },
      );
    }

    if (tier === "enterprise") {
      return NextResponse.json(
        { error: "Please contact sales for enterprise pricing" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    // Get organization details
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("id", context.organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
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
      return NextResponse.json(
        { error: "Invalid price for selected tier" },
        { status: 400 },
      );
    }

    // Create a price on the fly (in production, use pre-created prices)
    const price = await stripe.prices.create({
      unit_amount: priceAmount * 100, // Stripe uses cents
      currency: "usd",
      recurring: {
        interval: interval === "annual" ? "year" : "month",
      },
      product_data: {
        name: `IntentWin ${PRICING_TIERS[tier].name}`,
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
      "https://intentwin.com";
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
      cancel_url: `${origin}/pricing?canceled=true`,
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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
