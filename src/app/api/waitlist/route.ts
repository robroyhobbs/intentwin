import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaitlistConfirmation } from "@/lib/email/send-waitlist-email";
import { sendAdminWaitlistNotification } from "@/lib/email/send-admin-notification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, company_size } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 },
      );
    }

    // Validate company_size if provided
    const validSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
    if (company_size && !validSizes.includes(company_size)) {
      return NextResponse.json(
        { error: "Invalid company size" },
        { status: 400 },
      );
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
        return NextResponse.json(
          { error: "This email is already on our waitlist" },
          { status: 409 },
        );
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }

    // Log for Vercel log monitoring
    console.log("[WAITLIST]", {
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
