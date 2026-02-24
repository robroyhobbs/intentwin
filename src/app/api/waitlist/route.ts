import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaitlistConfirmation } from "@/lib/email/send-waitlist-email";
import { sendAdminWaitlistNotification } from "@/lib/email/send-admin-notification";
import { logger } from "@/lib/utils/logger";
import { ok, badRequest, conflict, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, company_size } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return badRequest("Name is required");
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return badRequest("Email is required");
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return badRequest("Please enter a valid email address");
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return badRequest("Company is required");
    }

    // Validate company_size if provided
    const validSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
    if (company_size && !validSizes.includes(company_size)) {
      return badRequest("Invalid company size");
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("waitlist").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company.trim(),
      company_size: company_size || null,
    });

    if (error) {
      // Unique constraint violation on email
      if (error.code === "23505") {
        return conflict("This email is already on our waitlist");
      }
      logger.error("Waitlist insert error", error);
      return serverError("Something went wrong. Please try again.");
    }

    // Log for Vercel log monitoring
    logger.info("[WAITLIST]", {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company.trim(),
      company_size: company_size || null,
      timestamp: new Date().toISOString(),
    });

    // Fire-and-forget: send confirmation email (never blocks the response)
    void sendWaitlistConfirmation({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company.trim(),
    });

    // Fire-and-forget: notify admin of new signup
    void sendAdminWaitlistNotification({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company.trim(),
      company_size: company_size || undefined,
    });

    return ok({ success: true });
  } catch {
    return serverError();
  }
}
