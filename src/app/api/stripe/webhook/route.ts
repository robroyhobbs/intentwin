import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PRICING_TIERS, type PricingTier } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;
        const tier = session.metadata?.tier as PricingTier;

        if (!organizationId) {
          console.error("No organization_id in checkout session metadata");
          break;
        }

        // Update organization with subscription info
        const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.starter;

        await adminClient
          .from("organizations")
          .update({
            stripe_subscription_id: session.subscription as string,
            plan_tier: tier,
            plan_limits: tierConfig.limits,
            billing_cycle_start: new Date().toISOString(),
            billing_cycle_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            trial_ends_at: null, // Clear trial when subscription starts
            usage_current_period: {
              proposals_created: 0,
              ai_tokens_used: 0,
              documents_uploaded: 0,
            },
          })
          .eq("id", organizationId);

        console.log(`Subscription activated for org ${organizationId}, tier: ${tier}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          console.error("No organization_id in subscription metadata");
          break;
        }

        // Get tier from subscription metadata or price metadata
        const tier = (subscription.metadata?.tier ||
          subscription.items.data[0]?.price.metadata?.tier ||
          "starter") as PricingTier;

        const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.starter;

        await adminClient
          .from("organizations")
          .update({
            plan_tier: tier,
            plan_limits: tierConfig.limits,
            billing_cycle_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            billing_cycle_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", organizationId);

        console.log(`Subscription updated for org ${organizationId}, tier: ${tier}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          console.error("No organization_id in subscription metadata");
          break;
        }

        // Downgrade to trial (or free tier)
        await adminClient
          .from("organizations")
          .update({
            stripe_subscription_id: null,
            plan_tier: "trial",
            plan_limits: {
              proposals_per_month: 3,
              ai_tokens_per_month: 50000,
              max_users: 1,
              max_documents: 10,
            },
            trial_ends_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 day grace period
          })
          .eq("id", organizationId);

        console.log(`Subscription canceled for org ${organizationId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find organization by Stripe customer ID
        const { data: org } = await adminClient
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          // You could send an email notification here
          console.log(`Payment failed for org ${org.id}`);

          // Optionally add a "payment_failed" status or flag
          // await adminClient
          //   .from("organizations")
          //   .update({ payment_status: "failed" })
          //   .eq("id", org.id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Reset usage counters on successful payment
        const { data: org } = await adminClient
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (org) {
          await adminClient
            .from("organizations")
            .update({
              usage_current_period: {
                proposals_created: 0,
                ai_tokens_used: 0,
                documents_uploaded: 0,
              },
              billing_cycle_start: new Date().toISOString(),
              billing_cycle_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .eq("id", org.id);

          console.log(`Usage reset for org ${org.id} after payment`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
