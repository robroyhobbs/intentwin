import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createBillingPortalSession } from "@/lib/stripe/client";
import { unauthorized, forbidden, notFound, ok, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return unauthorized();
    }

    // Only admins can access billing portal
    if (context.role !== "admin") {
      return forbidden("Only organization admins can manage billing");
    }

    const adminClient = createAdminClient();

    // Get organization's Stripe customer ID
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", context.organizationId)
      .single();

    if (orgError || !org?.stripe_customer_id) {
      return notFound("No billing account found. Please subscribe first.");
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://intentbid.com";
    const session = await createBillingPortalSession(
      org.stripe_customer_id,
      `${origin}/settings`,
    );

    return ok({ url: session.url });
  } catch (error) {
    return serverError("Failed to create portal session", error);
  }
}
