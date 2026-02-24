import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, badRequest, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return badRequest("Email is required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("allowed_emails")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (error || !data) {
      return ok({ allowed: false });
    }

    return ok({ allowed: true });
  } catch {
    return serverError();
  }
}
