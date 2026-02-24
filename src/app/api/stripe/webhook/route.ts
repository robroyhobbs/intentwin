import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe, PRICING_TIERS, type PricingTier } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { badRequest, ok, serverError } from "@/lib/api/response";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return badRequest("Missing signature or webhook secret");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed:", err);
      return badRequest("Invalid signature");
    }

    const adminClient = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;
        const tier = session.metadata?.tier as PricingTier;

        if (!organizationId) {
          logger.error("No organization_id in checkout session metadata");
          break;
        }

        // Update organization with subscription info
        const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.invite;

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

        logger.event("subscription_activated", { organizationId, tier });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          logger.error("No organization_id in subscription metadata");
          break;
        }

        // Get tier from subscription metadata or price metadata
        const tier = (subscription.metadata?.tier ||
          subscription.items.data[0]?.price.metadata?.tier ||
          "invite") as PricingTier;

        const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.invite;

        // Get billing cycle from subscription items (API 2025+)
        const subscriptionItem = subscription.items.data[0];
        const periodStart = subscriptionItem?.current_period_start || Math.floor(Date.now() / 1000);
        const periodEnd = subscriptionItem?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        await adminClient
          .from("organizations")
          .update({
            plan_tier: tier,
            plan_limits: tierConfig.limits,
            billing_cycle_start: new Date(periodStart * 1000).toISOString(),
            billing_cycle_end: new Date(periodEnd * 1000).toISOString(),
          })
          .eq("id", organizationId);

        logger.event("subscription_updated", { organizationId, tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          logger.error("No organization_id in subscription metadata");
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

        logger.event("subscription_canceled", { organizationId });
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
          // TODO: Send email notification for payment failure
          logger.event("payment_failed", { organizationId: org.id });

          // Optionally add a "payment_failed" status or flag
          // await adminClient
          //   .from("organizations")
          //   .update({ payment_status: "failed" })
          //   .eq("id", org.id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } };
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

        if (!subscriptionId) {
          logger.debug("No subscription ID found in invoice (one-time payment)");
          break;
        }

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

          logger.event("usage_reset", { organizationId: org.id });
        }
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return ok({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    return serverError("Webhook handler failed", error);
  }
}
