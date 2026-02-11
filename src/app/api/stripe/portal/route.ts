import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/supabase/auth-api";
import { createBillingPortalSession } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can access billing portal
    if (context.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization admins can manage billing" },
        { status: 403 },
      );
    }

    const adminClient = createAdminClient();

    // Get organization's Stripe customer ID
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", context.organizationId)
      .single();

    if (orgError || !org?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 404 },
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://intentwin.com";
    const session = await createBillingPortalSession(
      org.stripe_customer_id,
      `${origin}/settings`,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
