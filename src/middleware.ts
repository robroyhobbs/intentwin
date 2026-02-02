import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Enable demo password protection (set to false to disable)
const DEMO_PROTECTION_ENABLED = process.env.DEMO_PROTECTION !== "false";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip demo auth for static files, API routes (except demo-auth), and demo-login page
  const skipDemoAuth =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/demo-auth") ||
    pathname === "/demo-login" ||
    pathname.includes(".");

  // Check demo authentication if enabled
  if (DEMO_PROTECTION_ENABLED && !skipDemoAuth) {
    const demoCookie = request.cookies.get("demo_auth");

    if (!demoCookie || demoCookie.value !== "authenticated") {
      return NextResponse.redirect(new URL("/demo-login", request.url));
    }
  }

  // Continue with normal Supabase session handling
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
