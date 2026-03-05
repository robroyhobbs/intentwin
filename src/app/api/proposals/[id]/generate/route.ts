/**
 * POST /api/proposals/[id]/generate
 *
 * @deprecated — All callers now use the client-orchestrated routes:
 *   - POST /generate/setup
 *   - POST /generate/section
 *   - POST /generate/finalize
 *
 * This route is kept as a redirect to setup for any straggling callers.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const setupUrl = new URL(
    `/api/proposals/${id}/generate/setup`,
    request.url,
  );

  // Forward the request to setup route
  return NextResponse.rewrite(setupUrl);
}
