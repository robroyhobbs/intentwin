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
    pathname === "/request-access" ||
    pathname === "/capabilities" ||
    pathname.includes(".");

  // Check demo authentication if enabled
  if (DEMO_PROTECTION_ENABLED && !skipDemoAuth) {
    const demoCookie = request.cookies.get("demo_auth");

    if (!demoCookie || demoCookie.value !== "authenticated") {
      const redirectUrl = new URL("/demo-login", request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("x-demo-redirect", "true");
      return response;
    }
  }

  // Continue with normal Supabase session handling
  const response = await updateSession(request);
  response.headers.set("x-middleware-ran", "true");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml (metadata files)
     * - public folder files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml).*)",
  ],
};
